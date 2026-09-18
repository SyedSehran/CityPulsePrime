import math
from typing import Dict, Any

class PriorityEngine:
    @staticmethod
    def calculate_priority_score(
        base_severity: int,
        total_reports: int = 1,
        hours_active: float = 0.0,
        sla_limit_hours: float = 48.0,
        ward_risk_baseline: float = 50.0,
        is_sla_overdue: bool = False
    ) -> Dict[str, Any]:
        """
        Calculates dynamic priority score P (0-100) using exact formula:
        P = (Severity * 0.4) + (Cluster Size * 0.3) + (SLA Risk * 0.2) + (Ward Risk * 0.1)

        Normalizations (0 - 100 scale):
        - Severity (1-5): 1->20, 2->40, 3->60, 4->80, 5->100
        - Cluster Size: min(100, total_reports * 25)
        - SLA Risk: min(100, (hours_active / sla_limit_hours) * 100)
        - Ward Risk: min(100, max(0, ward_risk_baseline))
        """
        # 1. Component calculations
        sev_norm = min(100.0, max(0.0, float(base_severity) * 20.0))
        cluster_norm = min(100.0, float(total_reports) * 25.0)
        sla_norm = min(100.0, (hours_active / max(1.0, sla_limit_hours)) * 100.0)
        ward_norm = min(100.0, max(0.0, float(ward_risk_baseline)))

        # 2. Weighted score components
        sev_pts = round(sev_norm * 0.4, 2)
        cluster_pts = round(cluster_norm * 0.3, 2)
        sla_pts = round(sla_norm * 0.2, 2)
        ward_pts = round(ward_norm * 0.1, 2)

        raw_p = sev_pts + cluster_pts + sla_pts + ward_pts

        # If SLA overdue, add +25% boost as required by spec
        if is_sla_overdue:
            raw_p *= 1.25

        final_p = min(100, int(round(raw_p)))

        return {
            "priority_score": final_p,
            "raw_score": round(raw_p, 2),
            "is_overdue_boosted": is_sla_overdue,
            "breakdown": {
                "severity_weighted_pts": sev_pts,
                "severity_norm": round(sev_norm, 1),
                "severity_weight": 0.4,

                "cluster_size_weighted_pts": cluster_pts,
                "cluster_size_norm": round(cluster_norm, 1),
                "cluster_size_weight": 0.3,
                "total_reports": total_reports,

                "sla_risk_weighted_pts": sla_pts,
                "sla_risk_norm": round(sla_norm, 1),
                "sla_risk_weight": 0.2,
                "hours_active": round(hours_active, 1),

                "ward_risk_weighted_pts": ward_pts,
                "ward_risk_norm": round(ward_norm, 1),
                "ward_risk_weight": 0.1,
                "ward_risk_baseline": ward_risk_baseline
            },
            "formula_string": "P = (Severity * 0.4) + (Cluster Size * 0.3) + (SLA Risk * 0.2) + (Ward Risk * 0.1)"
        }
