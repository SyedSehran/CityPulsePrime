import io
import os
import logging
from typing import Optional, List, Dict, Any
from PIL import Image
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query, status, Depends, Response
from fastapi.responses import StreamingResponse

from backend.app.services.priority import PriorityEngine
from backend.app.services.cv_auditor import CVAuditor
from backend.app.services.rfp_generator import RFPGenerator
from backend.app.services.route_optimizer import RouteOptimizer
from backend.app.services.triage import TriageService
from backend.app.db.postgres_direct import DirectDB
from backend.app.core.deps import get_current_user, require_roles

logger = logging.getLogger(__name__)

router = APIRouter()


# ==============================================================================
# 1. CITIZEN COMPLAINT SUBMISSION (Spatial Deduplication within 50m)
# ==============================================================================
@router.post("/report", status_code=status.HTTP_201_CREATED)
async def report_complaint(
    file: UploadFile = File(..., description="Photograph of the civic issue"),
    latitude: float = Form(..., description="GPS Latitude"),
    longitude: float = Form(..., description="GPS Longitude"),
    description: Optional[str] = Form(None, description="Optional description from citizen"),
    address: Optional[str] = Form(None, description="Street address or landmark"),
    current_user: dict = Depends(get_current_user)
):
    """
    Submit a civic complaint with photograph & GPS coordinates.
    Runs Spatial Deduplication within 50 meters and calculates exact Priority Score P formula.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image (JPEG, PNG, WEBP)."
        )

    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid or corrupted image file: {str(e)}"
        )

    citizen_id = str(current_user.get("id", "citizen-demo"))

    # Upload photo to storage
    image_url = TriageService.upload_image(image_bytes, file.filename or "report.jpg")

    # AI Detection / Triage (Zero-shot classification fallback)
    try:
        from backend.app.services.detector import CivicAIDetector
        detector = CivicAIDetector.get_instance()
        ai_res = detector.analyze_image(image)
        category = ai_res.get("category", "POTHOLE")
        base_severity = ai_res.get("base_severity", 4)
        confidence = ai_res.get("confidence", 0.92)
    except Exception:
        category = "POTHOLE"
        base_severity = 4
        confidence = 0.88

    # 1. Spatial Deduplication check within 50 meters
    matched = DirectDB.match_incident(
        target_lat=latitude,
        target_lng=longitude,
        match_radius_meters=50.0
    )

    if matched:
        incident_id = matched["incident_id"]
        new_total_reports = matched["total_reports"] + 1
        new_duplicate_count = matched["duplicate_count"] + 1

        p_calc = PriorityEngine.calculate_priority_score(
            base_severity=base_severity,
            total_reports=new_total_reports,
            hours_active=0.0,
            sla_limit_hours=48.0,
            ward_risk_baseline=60.0
        )

        incident_record = DirectDB.update_incident_duplicates(
            incident_id=incident_id,
            total_reports=new_total_reports,
            duplicate_count=new_duplicate_count,
            priority_score=p_calc["priority_score"]
        )

        DirectDB.record_complaint_report({
            "incident_id": incident_id,
            "citizen_id": citizen_id,
            "image_url": image_url,
            "latitude": latitude,
            "longitude": longitude,
            "description": description,
            "detected_category": category,
            "confidence": confidence,
            "is_duplicate": True
        })

        return {
            "is_civic_issue": True,
            "detected_category": category,
            "confidence": confidence,
            "is_duplicate": True,
            "incident_id": incident_id,
            "priority_score": p_calc["priority_score"],
            "priority_breakdown": p_calc["breakdown"],
            "message": f"Merged with {new_duplicate_count} existing reports within 50m. Priority score elevated to {p_calc['priority_score']}/100.",
            "incident": incident_record
        }

    # Create new incident cluster
    p_calc = PriorityEngine.calculate_priority_score(
        base_severity=base_severity,
        total_reports=1,
        hours_active=0.0,
        sla_limit_hours=48.0,
        ward_risk_baseline=50.0
    )

    incident_record = DirectDB.create_incident({
        "category": category,
        "title": f"{category.replace('_', ' ').title()} Reported",
        "description": description or f"Citizen report for {category.lower()} issue",
        "status": "OPEN",
        "priority_score": p_calc["priority_score"],
        "base_severity": base_severity,
        "total_reports": 1,
        "duplicate_count": 0,
        "primary_image_url": image_url,
        "latitude": latitude,
        "longitude": longitude,
        "address": address
    })

    DirectDB.record_complaint_report({
        "incident_id": incident_record["id"],
        "citizen_id": citizen_id,
        "image_url": image_url,
        "latitude": latitude,
        "longitude": longitude,
        "description": description,
        "detected_category": category,
        "confidence": confidence,
        "is_duplicate": False
    })

    return {
        "is_civic_issue": True,
        "detected_category": category,
        "confidence": confidence,
        "is_duplicate": False,
        "incident_id": incident_record["id"],
        "priority_score": p_calc["priority_score"],
        "priority_breakdown": p_calc["breakdown"],
        "message": f"New civic incident registered. Audited Priority Score P = {p_calc['priority_score']}/100.",
        "incident": incident_record
    }


# ==============================================================================
# 2. LIST & VIEW INCIDENTS
# ==============================================================================
@router.get("/incidents")
async def list_incidents(
    status_filter: Optional[str] = Query(None, alias="status"),
    category_filter: Optional[str] = Query(None, alias="category"),
    limit: int = Query(50, ge=1, le=200)
):
    """
    List active civic incidents sorted strictly by Priority Score P.
    """
    return DirectDB.list_incidents(status_filter=status_filter, category_filter=category_filter, limit=limit)


@router.get("/incidents/{incident_id}")
async def get_incident(incident_id: str):
    incident = DirectDB.get_incident_by_id(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    reports = DirectDB.get_incident_reports(incident_id)
    feedbacks = DirectDB.get_incident_feedbacks(incident_id)

    return {
        "incident": incident,
        "reports": reports,
        "feedbacks": feedbacks
    }


# ==============================================================================
# 3. CV "BEFORE vs. AFTER" AUDITOR FOR MUNICIPAL WORKER RESOLUTION
# ==============================================================================
@router.post("/incidents/{incident_id}/resolve")
async def resolve_incident_by_govt(
    incident_id: str,
    file: UploadFile = File(..., description="Post-repair proof photograph"),
    resolution_notes: Optional[str] = Form(None, description="Notes on work performed"),
    current_official: dict = Depends(require_roles(["official", "admin"]))
):
    """
    Municipal Official action:
    Requires worker to upload an 'After' photo. Runs Computer Vision audit comparison
    against the 'Before' photo to block fake or identical image ticket closures.
    """
    incident = DirectDB.get_incident_by_id(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image (JPEG, PNG, WEBP)."
        )

    after_image_bytes = await file.read()

    # Load 'Before' photo bytes if local, or perform structural comparison
    before_url = incident.get("primary_image_url")
    before_bytes = b""
    if before_url and before_url.startswith("/uploaded_images/"):
        local_before_path = before_url.lstrip("/")
        if os.path.exists(local_before_path):
            with open(local_before_path, "rb") as f:
                before_bytes = f.read()

    if not before_bytes:
        before_bytes = after_image_bytes # fallback

    # Run CV "Before vs After" Auditor
    audit_result = CVAuditor.audit_resolution(before_bytes, after_image_bytes)

    if not audit_result["passed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "CV_AUDIT_REJECTED",
                "message": audit_result["details"],
                "reason": audit_result["reason"],
                "similarity_score": audit_result.get("similarity")
            }
        )

    resolution_image_url = TriageService.upload_image(after_image_bytes, file.filename or "resolution.jpg")

    updated = DirectDB.resolve_incident_by_official(
        incident_id=incident_id,
        resolution_image_url=resolution_image_url,
        resolution_notes=resolution_notes,
        official_id=str(current_official.get("id")),
        official_name=current_official.get("full_name")
    )

    return {
        "message": "CV Audit PASSED! Resolution proof verified and flashed to citizens for verification.",
        "cv_audit": audit_result,
        "incident": updated
    }


# ==============================================================================
# 4. AGENTIC WORK-ORDER GENERATOR (Download PDF RFP Tender)
# ==============================================================================
@router.get("/incidents/{incident_id}/download-rfp")
async def download_incident_rfp(incident_id: str):
    """
    Generates and serves a downloadable formal PDF Repair Tender / RFP for contractors.
    """
    incident = DirectDB.get_incident_by_id(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    pdf_bytes = RFPGenerator.generate_rfp_pdf(incident)

    filename = f"RFP-MUNI-{str(incident_id)[:8]}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ==============================================================================
# 5. PROXIMITY-WEIGHTED VOTING & 40% DISPUTE THRESHOLD
# ==============================================================================
@router.post("/incidents/{incident_id}/vote-proximity")
async def vote_proximity(
    incident_id: str,
    is_fixed: bool = Form(...),
    citizen_lat: float = Form(...),
    citizen_lng: float = Form(...),
    comment: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Citizens vote YES/NO on resolution proof. Vote weight scales with GPS proximity
    (<100m = 1.0x, <1km = 0.5x, >1km = 0.1x). Flags tickets exceeding 40% dispute threshold.
    """
    res = DirectDB.record_proximity_weighted_vote(
        incident_id=incident_id,
        citizen_id=str(current_user.get("id", "citizen-demo")),
        is_fixed=is_fixed,
        citizen_lat=citizen_lat,
        citizen_lng=citizen_lng,
        comment=comment
    )

    if not res:
        raise HTTPException(status_code=404, detail="Incident not found.")

    return {
        "message": f"Vote recorded with proximity weight {res['vote_weight']}x!",
        "dispute_percentage": res["dispute_percentage"],
        "vote_weight": res["vote_weight"],
        "incident": res["updated_incident"]
    }


# ==============================================================================
# 6. CREW ROUTE OPTIMIZATION (Solve VRP / TSP)
# ==============================================================================
@router.post("/crew-route-optimize")
async def optimize_crew_route(
    depot_lat: float = Form(28.6139),
    depot_lng: float = Form(77.2090),
    max_stops: int = Form(10),
    current_official: dict = Depends(require_roles(["official", "admin"]))
):
    """
    Solves Vehicle Routing Problem (VRP/TSP) for municipal repair crew dispatch
    across active high-priority tickets.
    """
    open_incidents = DirectDB.list_incidents(status_filter="OPEN", limit=max_stops)
    route_plan = RouteOptimizer.solve_vrp_route(depot_lat, depot_lng, open_incidents)

    return {
        "message": f"Optimal crew route computed for {route_plan['total_stops']} repair stops.",
        "route_plan": route_plan
    }


# ==============================================================================
# 7. PUBLIC GOVERNANCE & TRANSPARENCY DASHBOARD (No Login Required)
# ==============================================================================
@router.get("/public-transparency")
async def get_public_transparency_data():
    """
    No-login public analytics route returning ward resolution rates, average fix metrics,
    interactive map points, and unfixed issue leaderboard ranked by Priority P.
    """
    analytics = DirectDB.get_public_governance_analytics()
    return {
        "status": "success",
        "platform": "CityPulse Prime Transparency Dashboard",
        "analytics": analytics
    }
