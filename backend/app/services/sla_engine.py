"""
SmartComplaintHandler - SLA Deadline Engine
Blueprint Reference: V1/M5/backend/01_sla_engine.md
Role: Calculates resolution deadlines from priority commitments (4h, 12h, 24h, 72h).
"""
from datetime import datetime, timedelta

SLA_HOURS_MAP = {
    "CRITICAL": 4,
    "HIGH": 12,
    "MEDIUM": 24,
    "LOW": 72
}

def calculate_sla_deadline(priority: str, start_time: datetime = None) -> datetime:
    start = start_time or datetime.utcnow()
    hours = SLA_HOURS_MAP.get(priority.upper(), 24)
    return start + timedelta(hours=hours)
