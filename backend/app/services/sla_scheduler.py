import logging
import asyncio
from datetime import datetime, timezone
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

# Category SLA limit mapping in Hours
DEFAULT_SLA_HOURS = {
    "SEWERAGE_DRAINAGE": 24.0,
    "WATER_LEAKAGE": 24.0,
    "POTHOLE": 48.0,
    "GARBAGE": 36.0,
    "STREETLIGHT": 72.0,
    "OTHER": 48.0
}

class SLAScheduler:
    _instance = None
    _running = False

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = SLAScheduler()
        return cls._instance

    def run_sla_check_pass(self) -> List[Dict[str, Any]]:
        """
        Scans all open incidents, checks against category SLA limits,
        and applies +25% priority score boost if SLA overdue.
        """
        from backend.app.db.postgres_direct import DirectDB
        from backend.app.services.priority import PriorityEngine

        incidents = DirectDB.list_incidents(limit=200)
        escalated_alerts = []

        now = datetime.now(timezone.utc)

        for inc in incidents:
            if inc.get("status") in ["CLOSED_VERIFIED", "REJECTED"]:
                continue

            created_at_raw = inc.get("created_at")
            if not created_at_raw:
                continue

            if isinstance(created_at_raw, str):
                try:
                    created_dt = datetime.fromisoformat(created_at_raw.replace("Z", "+00:00"))
                except Exception:
                    continue
            elif isinstance(created_at_raw, datetime):
                created_dt = created_at_raw
            else:
                continue

            if created_dt.tzinfo is None:
                created_dt = created_dt.replace(tzinfo=timezone.utc)

            hours_active = (now - created_dt).total_seconds() / 3600.0
            category = inc.get("category", "OTHER")
            sla_limit = DEFAULT_SLA_HOURS.get(category, 48.0)

            is_overdue = hours_active > sla_limit

            # Re-calculate priority P with SLA risk and boost if overdue
            result = PriorityEngine.calculate_priority_score(
                base_severity=inc.get("base_severity", 3),
                total_reports=inc.get("total_reports", 1),
                hours_active=hours_active,
                sla_limit_hours=sla_limit,
                ward_risk_baseline=50.0,
                is_sla_overdue=is_overdue
            )

            new_priority = result["priority_score"]
            old_priority = inc.get("priority_score", 0)

            # Update DB record if score changed or overdue status changed
            if is_overdue or new_priority != old_priority:
                DirectDB.update_incident_sla_escalation(
                    incident_id=inc["id"],
                    priority_score=new_priority,
                    is_sla_overdue=is_overdue,
                    hours_active=hours_active,
                    priority_breakdown=result["breakdown"]
                )

                if is_overdue and not inc.get("is_sla_overdue"):
                    escalated_alerts.append({
                        "incident_id": inc["id"],
                        "title": inc.get("title", "Civic Incident"),
                        "category": category,
                        "hours_active": round(hours_active, 1),
                        "sla_limit_hours": sla_limit,
                        "boosted_priority": new_priority,
                        "alert_message": f"CRITICAL SLA ESCALATION: Ticket #{str(inc['id'])[:6]} in category {category} is {round(hours_active - sla_limit, 1)}h overdue. Priority score boosted +25% to {new_priority}/100."
                    })

        logger.info(f"SLA Check complete. Evaluated {len(incidents)} tickets. Triggered {len(escalated_alerts)} escalation alerts.")
        return escalated_alerts

    async def start_background_cron(self):
        """
        Runs SLA evaluation every 10 minutes in background.
        """
        if self._running:
            return
        self._running = True
        logger.info("SLA Automated Escalation Cron Service Started.")

        while self._running:
            try:
                self.run_sla_check_pass()
            except Exception as e:
                logger.error(f"Error in SLA cron loop: {e}")
            await asyncio.sleep(600) # Every 10 minutes
