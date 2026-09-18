import os
import math
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from backend.app.core.config import settings
from backend.app.services.priority import PriorityEngine

logger = logging.getLogger(__name__)

def haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000.0 # Earth radius in meters
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


# ==============================================================================
# IN-MEMORY STORE FALLBACK (For zero-dependency instant local execution)
# ==============================================================================
_IN_MEMORY_PROFILES: Dict[str, Dict[str, Any]] = {
    "citizen@citypulse.gov": {
        "id": "c1111111-1111-1111-1111-111111111111",
        "full_name": "Citizen User",
        "email": "citizen@citypulse.gov",
        "password_hash": "$2b$12$eImiTXuWVxfM37uY4JANjO.g4N/Y.xS.2jO/cKj1Q1Jb.4W2K/K1e", # password: password123
        "role": "citizen",
        "phone": "+1-555-0199"
    },
    "official@citypulse.gov": {
        "id": "o2222222-2222-2222-2222-222222222222",
        "full_name": "Chief Inspector Sharma",
        "email": "official@citypulse.gov",
        "password_hash": "$2b$12$eImiTXuWVxfM37uY4JANjO.g4N/Y.xS.2jO/cKj1Q1Jb.4W2K/K1e",
        "role": "official",
        "department": "Public Works & Infrastructure",
        "official_badge_id": "MUNI-BADGE-884"
    }
}

# Seed sample incidents for immediate demonstration
_IN_MEMORY_INCIDENTS: Dict[str, Dict[str, Any]] = {}
_IN_MEMORY_REPORTS: List[Dict[str, Any]] = []
_IN_MEMORY_FEEDBACKS: List[Dict[str, Any]] = []


def _seed_initial_incidents():
    if _IN_MEMORY_INCIDENTS:
        return

    now = datetime.now(timezone.utc)
    sample_data = [
        {
            "id": "inc-101",
            "category": "POTHOLE",
            "title": "Severe Pothole Cluster on Main Boulevard",
            "description": "Deep 15cm pothole causing traffic obstruction and vehicle damage near Central Junction.",
            "status": "OPEN",
            "base_severity": 5,
            "total_reports": 4,
            "duplicate_count": 3,
            "latitude": 28.6139,
            "longitude": 77.2090,
            "address": "Ward 12, Connaught Circus, New Delhi",
            "primary_image_url": "/static/test_images/pothole_test.jpg",
            "assigned_department": "Public Works Dept",
            "created_at": (now - timedelta(hours=52)).isoformat(),
            "ward_name": "Ward 12 - Central",
            "ward_risk_baseline": 75.0,
            "is_disputed": False,
            "dispute_ratio": 0.0,
            "is_sla_overdue": True,
            "resolution_notes": None,
            "resolution_image_url": None
        },
        {
            "id": "inc-102",
            "category": "SEWERAGE_DRAINAGE",
            "title": "Overflowing Storm Drain & Waterlogging",
            "description": "Blockage in drainage pipe causing contaminated water backup on public sidewalk.",
            "status": "OPEN",
            "base_severity": 4,
            "total_reports": 2,
            "duplicate_count": 1,
            "latitude": 28.6185,
            "longitude": 77.2140,
            "address": "Ward 4, Barakhamba Road",
            "primary_image_url": "/static/test_images/water_leak_test.jpg",
            "assigned_department": "Water & Sanitation",
            "created_at": (now - timedelta(hours=14)).isoformat(),
            "ward_name": "Ward 4 - North",
            "ward_risk_baseline": 60.0,
            "is_disputed": False,
            "dispute_ratio": 0.0,
            "is_sla_overdue": False,
            "resolution_notes": None,
            "resolution_image_url": None
        },
        {
            "id": "inc-103",
            "category": "STREETLIGHT",
            "title": "Damaged Pole & Broken Streetlights",
            "description": "Dark stretch of street with 3 unlit lights creating safety concerns for pedestrians.",
            "status": "RESOLVED_PENDING_VERIFICATION",
            "base_severity": 3,
            "total_reports": 1,
            "duplicate_count": 0,
            "latitude": 28.6210,
            "longitude": 77.2050,
            "address": "Ward 8, Janpath Lane",
            "primary_image_url": "/static/test_images/pothole_test.jpg",
            "assigned_department": "Electrical & Energy",
            "created_at": (now - timedelta(hours=30)).isoformat(),
            "ward_name": "Ward 8 - East",
            "ward_risk_baseline": 50.0,
            "is_disputed": False,
            "dispute_ratio": 0.1,
            "is_sla_overdue": False,
            "resolution_notes": "Replaced wiring harness and installed high-lumen LED lamp head.",
            "resolution_image_url": "/static/test_images/water_leak_test.jpg"
        }
    ]

    for item in sample_data:
        hours_active = (now - datetime.fromisoformat(item["created_at"])).total_seconds() / 3600.0
        p_res = PriorityEngine.calculate_priority_score(
            base_severity=item["base_severity"],
            total_reports=item["total_reports"],
            hours_active=hours_active,
            sla_limit_hours=48.0 if item["category"] != "SEWERAGE_DRAINAGE" else 24.0,
            ward_risk_baseline=item["ward_risk_baseline"],
            is_sla_overdue=item["is_sla_overdue"]
        )
        item["priority_score"] = p_res["priority_score"]
        item["priority_breakdown"] = p_res["breakdown"]
        _IN_MEMORY_INCIDENTS[item["id"]] = item

_seed_initial_incidents()


class DirectDB:
    @staticmethod
    def get_profile_by_id(profile_id: str) -> Optional[Dict[str, Any]]:
        for user in _IN_MEMORY_PROFILES.values():
            if user["id"] == profile_id:
                return user
        return None

    @staticmethod
    def get_profile_by_email(email: str) -> Optional[Dict[str, Any]]:
        email_clean = email.lower().strip()
        return _IN_MEMORY_PROFILES.get(email_clean)

    @staticmethod
    def create_user_account(
        full_name: str,
        email: str,
        password_hash: str,
        role: str = "citizen",
        phone: Optional[str] = None,
        department: Optional[str] = None,
        official_badge_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        email_clean = email.lower().strip()
        user_id = str(uuid.uuid4())
        account = {
            "id": user_id,
            "full_name": full_name,
            "email": email_clean,
            "password_hash": password_hash,
            "role": role,
            "phone": phone,
            "department": department,
            "official_badge_id": official_badge_id
        }
        _IN_MEMORY_PROFILES[email_clean] = account
        return account

    # =========================================================================
    # SPATIAL DEDUPLICATION & INCIDENT MANAGEMENT
    # =========================================================================
    @staticmethod
    def match_incident(
        target_lat: float,
        target_lng: float,
        query_embedding: Optional[List[float]] = None,
        match_radius_meters: float = 50.0,
        similarity_threshold: float = 0.85
    ) -> Optional[Dict[str, Any]]:
        """
        Spatial Deduplication: Returns existing incident if within 50 meters.
        """
        _seed_initial_incidents()
        best_match = None
        min_dist = float('inf')

        for inc in _IN_MEMORY_INCIDENTS.values():
            if inc["status"] in ["CLOSED_VERIFIED", "REJECTED"]:
                continue

            dist = haversine_meters(target_lat, target_lng, inc["latitude"], inc["longitude"])
            if dist <= match_radius_meters and dist < min_dist:
                min_dist = dist
                best_match = inc

        if best_match:
            return {
                "incident_id": best_match["id"],
                "category": best_match["category"],
                "status": best_match["status"],
                "priority_score": best_match["priority_score"],
                "total_reports": best_match["total_reports"],
                "duplicate_count": best_match["duplicate_count"],
                "primary_image_url": best_match["primary_image_url"],
                "distance_meters": round(min_dist, 1)
            }

        return None

    @staticmethod
    def create_incident(data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        _seed_initial_incidents()
        inc_id = f"inc-{uuid.uuid4().hex[:6]}"
        now_str = datetime.now(timezone.utc).isoformat()

        p_res = PriorityEngine.calculate_priority_score(
            base_severity=data.get("base_severity", 3),
            total_reports=data.get("total_reports", 1),
            hours_active=0.0,
            sla_limit_hours=48.0,
            ward_risk_baseline=50.0
        )

        incident = {
            "id": inc_id,
            "category": data["category"],
            "title": data.get("title") or f"{data['category'].replace('_', ' ').title()} Issue",
            "description": data.get("description"),
            "status": data.get("status", "OPEN"),
            "priority_score": p_res["priority_score"],
            "priority_breakdown": p_res["breakdown"],
            "base_severity": data.get("base_severity", 3),
            "total_reports": data.get("total_reports", 1),
            "duplicate_count": data.get("duplicate_count", 0),
            "primary_image_url": data["primary_image_url"],
            "latitude": data["latitude"],
            "longitude": data["longitude"],
            "address": data.get("address") or f"Location ({data['latitude']:.4f}, {data['longitude']:.4f})",
            "assigned_department": data.get("assigned_department", "Municipal Response"),
            "created_at": now_str,
            "ward_name": "Ward 12 - Central",
            "ward_risk_baseline": 50.0,
            "is_disputed": False,
            "dispute_ratio": 0.0,
            "is_sla_overdue": False,
            "resolution_notes": None,
            "resolution_image_url": None
        }

        _IN_MEMORY_INCIDENTS[inc_id] = incident
        return incident

    @staticmethod
    def update_incident_duplicates(incident_id: str, total_reports: int, duplicate_count: int, priority_score: int) -> Optional[Dict[str, Any]]:
        inc = _IN_MEMORY_INCIDENTS.get(incident_id)
        if not inc:
            return None

        inc["total_reports"] = total_reports
        inc["duplicate_count"] = duplicate_count

        now = datetime.now(timezone.utc)
        created_dt = datetime.fromisoformat(inc["created_at"].replace("Z", "+00:00"))
        hours_active = (now - created_dt).total_seconds() / 3600.0

        p_res = PriorityEngine.calculate_priority_score(
            base_severity=inc["base_severity"],
            total_reports=total_reports,
            hours_active=hours_active,
            sla_limit_hours=48.0,
            ward_risk_baseline=inc.get("ward_risk_baseline", 50.0),
            is_sla_overdue=inc.get("is_sla_overdue", False)
        )

        inc["priority_score"] = p_res["priority_score"]
        inc["priority_breakdown"] = p_res["breakdown"]

        return inc

    @staticmethod
    def update_incident_sla_escalation(
        incident_id: str,
        priority_score: int,
        is_sla_overdue: bool,
        hours_active: float,
        priority_breakdown: dict
    ) -> Optional[Dict[str, Any]]:
        inc = _IN_MEMORY_INCIDENTS.get(incident_id)
        if not inc:
            return None

        inc["priority_score"] = priority_score
        inc["is_sla_overdue"] = is_sla_overdue
        inc["priority_breakdown"] = priority_breakdown
        return inc

    @staticmethod
    def record_complaint_report(data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        report = dict(data)
        report["id"] = f"rep-{uuid.uuid4().hex[:6]}"
        report["created_at"] = datetime.now(timezone.utc).isoformat()
        _IN_MEMORY_REPORTS.append(report)
        return report

    @staticmethod
    def list_incidents(status_filter: Optional[str] = None, category_filter: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        _seed_initial_incidents()
        result = list(_IN_MEMORY_INCIDENTS.values())

        if status_filter:
            result = [i for i in result if i["status"].upper() == status_filter.upper()]

        if category_filter:
            result = [i for i in result if i["category"].upper() == category_filter.upper()]

        # Sort by Priority Score P (highest first)
        result.sort(key=lambda x: x.get("priority_score", 0), reverse=True)
        return result[:limit]

    @staticmethod
    def get_incident_by_id(incident_id: str) -> Optional[Dict[str, Any]]:
        _seed_initial_incidents()
        return _IN_MEMORY_INCIDENTS.get(incident_id)

    @staticmethod
    def get_incident_reports(incident_id: str) -> List[Dict[str, Any]]:
        return [r for r in _IN_MEMORY_REPORTS if r.get("incident_id") == incident_id]

    # =========================================================================
    # GOVT OFFICIAL RESOLUTION WITH CV PROOF
    # =========================================================================
    @staticmethod
    def resolve_incident_by_official(
        incident_id: str,
        resolution_image_url: str,
        resolution_notes: Optional[str] = None,
        official_id: Optional[str] = None,
        official_name: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        inc = _IN_MEMORY_INCIDENTS.get(incident_id)
        if not inc:
            return None

        inc["status"] = "RESOLVED_PENDING_VERIFICATION"
        inc["resolution_image_url"] = resolution_image_url
        inc["resolution_notes"] = resolution_notes
        inc["resolved_by_official_id"] = official_id
        inc["assigned_officer_name"] = official_name or "Chief Inspector"
        inc["resolved_at"] = datetime.now(timezone.utc).isoformat()
        return inc

    # =========================================================================
    # PROXIMITY-WEIGHTED VOTING & DISPUTE THRESHOLD FLAG (40%)
    # =========================================================================
    @staticmethod
    def record_proximity_weighted_vote(
        incident_id: str,
        citizen_id: str,
        is_fixed: bool,
        citizen_lat: float,
        citizen_lng: float,
        comment: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        inc = _IN_MEMORY_INCIDENTS.get(incident_id)
        if not inc:
            return None

        # Compute distance to ticket location
        dist_m = haversine_meters(citizen_lat, citizen_lng, inc["latitude"], inc["longitude"])

        # Scale proximity weight (<100m = 1.0x, <1km = 0.5x, >1km = 0.1x)
        if dist_m < 100.0:
            weight = 1.0
        elif dist_m < 1000.0:
            weight = 0.5
        else:
            weight = 0.1

        fb_entry = {
            "incident_id": incident_id,
            "citizen_id": citizen_id,
            "is_fixed": is_fixed,
            "weight": weight,
            "dist_m": round(dist_m, 1),
            "comment": comment,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        # Update or insert
        _IN_MEMORY_FEEDBACKS.append(fb_entry)

        # Recalculate dispute ratio for this incident
        incident_fbs = [f for f in _IN_MEMORY_FEEDBACKS if f["incident_id"] == incident_id]
        total_weighted_votes = sum(f["weight"] for f in incident_fbs)
        no_weighted_votes = sum(f["weight"] for f in incident_fbs if not f["is_fixed"])

        dispute_ratio = (no_weighted_votes / total_weighted_votes) if total_weighted_votes > 0 else 0.0
        inc["dispute_ratio"] = round(dispute_ratio, 3)

        # Flag if 40% dispute threshold exceeded
        if dispute_ratio >= 0.40 and len(incident_fbs) >= 2:
            inc["is_disputed"] = True
            inc["status"] = "DISPUTED_REOPENED"
            inc["dispute_warning"] = f"FLAGGED: Ticket exceeds 40% dispute threshold ({int(dispute_ratio*100)}% negative weighted votes)."
        elif is_fixed and dispute_ratio < 0.20:
            inc["status"] = "CLOSED_VERIFIED"
            inc["is_disputed"] = False

        return {
            "feedback": fb_entry,
            "updated_incident": inc,
            "vote_weight": weight,
            "dispute_percentage": round(dispute_ratio * 100, 1)
        }

    @staticmethod
    def get_incident_feedbacks(incident_id: str) -> List[Dict[str, Any]]:
        return [f for f in _IN_MEMORY_FEEDBACKS if f.get("incident_id") == incident_id]

    # =========================================================================
    # PUBLIC GOVERNANCE & TRANSPARENCY ANALYTICS
    # =========================================================================
    @staticmethod
    def get_public_governance_analytics() -> Dict[str, Any]:
        _seed_initial_incidents()
        all_inc = list(_IN_MEMORY_INCIDENTS.values())

        total_tickets = len(all_inc)
        closed_tickets = len([i for i in all_inc if i["status"] in ["CLOSED_VERIFIED"]])
        open_tickets = len([i for i in all_inc if i["status"] in ["OPEN", "RESOLVED_PENDING_VERIFICATION", "DISPUTED_REOPENED"]])
        disputed_tickets = len([i for i in all_inc if i.get("is_disputed", False)])
        overdue_tickets = len([i for i in all_inc if i.get("is_sla_overdue", False)])

        resolution_rate = round((closed_tickets / total_tickets * 100.0), 1) if total_tickets > 0 else 100.0

        # Category breakdowns & avg fix time
        category_metrics = {
            "POTHOLE": {"total": 0, "avg_fix_hours": 26.5},
            "SEWERAGE_DRAINAGE": {"total": 0, "avg_fix_hours": 18.2},
            "STREETLIGHT": {"total": 0, "avg_fix_hours": 14.0},
            "GARBAGE": {"total": 0, "avg_fix_hours": 12.0}
        }
        for inc in all_inc:
            cat = inc.get("category", "OTHER")
            if cat in category_metrics:
                category_metrics[cat]["total"] += 1

        leaderboard = sorted([i for i in all_inc if i["status"] != "CLOSED_VERIFIED"],
                             key=lambda x: x.get("priority_score", 0), reverse=True)

        return {
            "total_tickets": total_tickets,
            "open_tickets": open_tickets,
            "closed_tickets": closed_tickets,
            "disputed_tickets": disputed_tickets,
            "overdue_tickets": overdue_tickets,
            "resolution_rate_pct": resolution_rate,
            "average_time_to_fix_hours": 21.4,
            "category_metrics": category_metrics,
            "leaderboard": leaderboard
        }
