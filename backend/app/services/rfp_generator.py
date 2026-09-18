import io
from datetime import datetime

class RFPGenerator:
    @staticmethod
    def generate_rfp_pdf(incident: dict) -> bytes:
        """
        Generates a formal Municipal Work-Order & RFP Repair Tender PDF document.
        """
        incident_id = incident.get("id", "INC-001")
        category = incident.get("category", "POTHOLE").replace("_", " ").title()
        title = incident.get("title", f"Urgent Repair Tender: {category}")
        priority = incident.get("priority_score", 75)
        severity = incident.get("base_severity", 4)
        total_reports = incident.get("total_reports", 1)
        lat = incident.get("latitude", 28.6139)
        lng = incident.get("longitude", 77.2090)
        address = incident.get("address") or f"Coordinates ({lat:.4f}, {lng:.4f})"
        created_at = incident.get("created_at") or datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        breakdown = incident.get("priority_breakdown") or {}
        sev_pts = breakdown.get("severity_weighted_pts", severity * 8.0)
        cluster_pts = breakdown.get("cluster_size_weighted_pts", total_reports * 7.5)
        sla_pts = breakdown.get("sla_risk_weighted_pts", 15.0)
        ward_pts = breakdown.get("ward_risk_weighted_pts", 5.0)

        estimated_cost = priority * 1250 # Estimated budget in currency
        completion_hours = max(12, int(96 - (priority * 0.7)))

        raw_text = f"""
================================================================================
           CITYPULSE PRIME MUNICIPAL GOVERNANCE ENGINE
              WORK-ORDER & CONTRACTOR REPAIR TENDER (RFP)
================================================================================

TENDER REF NO    : RFP-MUNI-{str(incident_id)[:8].upper()}
DATE ISSUED      : {created_at}
URGENCY LEVEL    : {"CRITICAL / HIGH PRIORITY" if priority >= 70 else "STANDARD REPAIR"}
PRIORITY SCORE P : {priority} / 100
ESTIMATED BUDGET : ${estimated_cost:,.2f}
COMPLETION SLA   : {completion_hours} Hours from Award

--------------------------------------------------------------------------------
1. INCIDENT & LOCATION SPECIFICATIONS
--------------------------------------------------------------------------------
Classification   : {category}
Incident Title   : {title}
Site Location    : {address}
GPS Coordinates  : Lat {lat:.6f}, Lng {lng:.6f}
Citizen Reports  : {total_reports} Verified Report(s)

--------------------------------------------------------------------------------
2. ALGORITHMIC URGENCY WEIGHT BREAKDOWN
--------------------------------------------------------------------------------
Formula: P = (Severity x 0.4) + (Cluster Size x 0.3) + (SLA Risk x 0.2) + (Ward Risk x 0.1)

- Hazard Severity Contribution  (Weight 40%) : {sev_pts} pts
- Citizen Report Cluster Size   (Weight 30%) : {cluster_pts} pts
- SLA Overdue Risk Score        (Weight 20%) : {sla_pts} pts
- Ward Vulnerability Baseline   (Weight 10%) : {ward_pts} pts
  -------------------------------------------------------------
  TOTAL AUDITED PRIORITY SCORE  (Max 100)    : {priority} PTS

--------------------------------------------------------------------------------
3. SCOPE OF WORK & CONTRACTOR COMPLIANCE
--------------------------------------------------------------------------------
A. Immediate site inspection & safety barricading within 2 hours of award.
B. Excavation / material restoration meeting Municipal Standard Specs 2026.
C. MANDATORY COMPUTER VISION VERIFICATION: Contractor / Crew must upload 
   a high-resolution "After" repair photo upon job completion.
D. Closure will undergo automated CV Before vs After AI structural validation.

--------------------------------------------------------------------------------
ISSUED BY: Department of Public Works & CityPulse Municipal Oversight
STAMP: APPROVED FOR FAST-TRACK CONTRACTOR DISPATCH
================================================================================
"""
        return RFPGenerator._create_simple_pdf(raw_text)

    @staticmethod
    def _create_simple_pdf(text_content: str) -> bytes:
        """
        Creates a clean PDF binary stream from plain text using minimal PDF syntax.
        """
        buffer = io.BytesIO()
        lines = text_content.strip().split("\n")

        pdf_stream = []
        pdf_stream.append("%PDF-1.4\n")
        pdf_stream.append("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")
        pdf_stream.append("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n")
        pdf_stream.append("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n")
        pdf_stream.append("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n")

        content_stream = "BT /F1 9 Tf 36 750 Td 11 TL\n"
        for line in lines:
            escaped = line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
            content_stream += f"({escaped}) T*\n"
        content_stream += "ET\n"

        pdf_stream.append(f"4 0 obj\n<< /Length {len(content_stream)} >>\nstream\n{content_stream}endstream\nendobj\n")

        # Xref table
        offsets = [0]
        curr_offset = len(pdf_stream[0])
        for obj in pdf_stream[1:]:
            offsets.append(curr_offset)
            curr_offset += len(obj)

        pdf_stream.append(f"xref\n0 {len(offsets)}\n0000000000 65535 f \n")
        for off in offsets[1:]:
            pdf_stream.append(f"{off:010d} 00000 n \n")

        pdf_stream.append(f"trailer\n<< /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{curr_offset}\n%%EOF\n")

        pdf_data = "".join(pdf_stream).encode("latin-1")
        buffer.write(pdf_data)
        buffer.seek(0)
        return buffer.getvalue()
