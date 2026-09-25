"""
SmartComplaintHandler - SLA Deadline Engine
Blueprint Reference: V1/M5/backend/01_sla_engine.md
Role: Calculates resolution deadlines from priority commitments (4h, 12h, 24h, 72h).
"""
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

# Authoritative SLA duration commitments in hours by priority tier
SLA_POLICIES: Dict[str, int] = {
    "CRITICAL": 4,   # 4 Hours: Life safety, severe structural or complete electrical/water failure
    "HIGH": 12,       # 12 Hours: Major utility outage or room-level impediment
    "MEDIUM": 24,     # 24 Hours: Routine physical repairs, single socket, leaking tap
    "LOW": 72,        # 72 Hours: Cosmetic imperfections, minor furniture adjustments
}

DEFAULT_SLA_HOURS: int = 24
DEFAULT_WARNING_THRESHOLD_RATIO: float = 0.20  # Warning trigger when <= 20% of SLA time remains


def _ensure_utc(dt: datetime) -> datetime:
    """Normalize datetime to timezone-aware UTC."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def calculate_sla_deadline(created_at: datetime, priority: str) -> datetime:
    """
    Calculate the contractual resolution deadline timestamp from intake time and priority.
    
    Args:
        created_at: The initial grievance intake timestamp.
        priority: Priority string ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW').
        
    Returns:
        Timezone-aware UTC datetime of the calculated SLA deadline.
    """
    normalized_created_at = _ensure_utc(created_at)
    normalized_priority = (priority or "MEDIUM").strip().upper()
    duration_hours = SLA_POLICIES.get(normalized_priority, DEFAULT_SLA_HOURS)
    return normalized_created_at + timedelta(hours=duration_hours)


def calculate_sla_remaining_seconds(
    sla_deadline: datetime,
    current_time: Optional[datetime] = None
) -> int:
    """
    Calculate signed seconds remaining until the SLA deadline.
    Returns a positive integer if remaining, or negative if overdue.
    
    Args:
        sla_deadline: The contractual deadline timestamp.
        current_time: Reference timestamp (defaults to current UTC time).
        
    Returns:
        Integer signed seconds (positive = remaining, negative = overdue).
    """
    normalized_deadline = _ensure_utc(sla_deadline)
    ref_time = _ensure_utc(current_time) if current_time else datetime.now(timezone.utc)
    return int((normalized_deadline - ref_time).total_seconds())


def is_sla_breached(
    sla_deadline: datetime,
    current_time: Optional[datetime] = None
) -> bool:
    """
    Determine if the current time has passed the contractual SLA deadline.
    
    Args:
        sla_deadline: The contractual deadline timestamp.
        current_time: Reference timestamp (defaults to current UTC time).
        
    Returns:
        True if current time exceeds deadline, False otherwise.
    """
    return calculate_sla_remaining_seconds(sla_deadline, current_time) < 0


def get_sla_status(
    sla_deadline: datetime,
    priority: str,
    current_time: Optional[datetime] = None,
    warning_threshold_ratio: float = DEFAULT_WARNING_THRESHOLD_RATIO
) -> Dict[str, Any]:
    """
    Calculate comprehensive SLA operational telemetry for dashboards and alerts.
    
    Args:
        sla_deadline: The contractual deadline timestamp.
        priority: Priority tier of the ticket.
        current_time: Reference timestamp (defaults to current UTC time).
        warning_threshold_ratio: Ratio of total duration triggering warning tier.
        
    Returns:
        Dictionary containing status ('HEALTHY', 'WARNING', 'BREACHED'),
        remaining_seconds, overdue_seconds, is_breached, deadline, and priority.
    """
    normalized_deadline = _ensure_utc(sla_deadline)
    ref_time = _ensure_utc(current_time) if current_time else datetime.now(timezone.utc)
    normalized_priority = (priority or "MEDIUM").strip().upper()
    
    total_allocated_hours = SLA_POLICIES.get(normalized_priority, DEFAULT_SLA_HOURS)
    total_allocated_seconds = total_allocated_hours * 3600
    
    raw_remaining_seconds = calculate_sla_remaining_seconds(normalized_deadline, ref_time)
    is_breached = raw_remaining_seconds < 0
    
    if is_breached:
        status = "BREACHED"
        overdue_seconds = abs(raw_remaining_seconds)
        remaining_seconds = 0
    elif raw_remaining_seconds <= total_allocated_seconds * warning_threshold_ratio:
        status = "WARNING"
        overdue_seconds = 0
        remaining_seconds = raw_remaining_seconds
    else:
        status = "HEALTHY"
        overdue_seconds = 0
        remaining_seconds = raw_remaining_seconds
        
    return {
        "status": status,
        "remaining_seconds": remaining_seconds,
        "overdue_seconds": overdue_seconds,
        "is_breached": is_breached,
        "deadline": normalized_deadline,
        "priority": normalized_priority,
    }
