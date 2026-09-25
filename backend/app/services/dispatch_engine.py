"""
SmartComplaintHandler - Workload Dispatch Engine
Blueprint Reference: V1/M4/backend/01_dispatch_engine.md
Role: Least-loaded queue balancing algorithm dispatching tickets to squads with lowest load.
"""
from typing import Dict, List, Optional
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.team import MaintenanceTeam
from app.models.department import Department
from app.models.ticket import Ticket

# Emergency rapid-response squads designated for short-circuit allocation on CRITICAL priority
EMERGENCY_SQUAD_MAP: Dict[int, str] = {
    1: "Substation High-Voltage Team",  # Department 1: Electrical Services
    2: "Water Supply Emergency Team",     # Department 2: Plumbing Services
    3: "Structural Fixtures Crew",        # Department 3: Civil & Carpentry
    4: "Network & Wi-Fi Squad",           # Department 4: IT & Infrastructure
}

# Campus zone affinity keyword mappings for geographic proximity bias
ZONE_AFFINITY_MAP: Dict[str, List[str]] = {
    "Hostel": ["hostel", "mess", "dormitory", "room", "hall"],
    "Academic": ["academic", "class", "hall", "lab", "department", "seminar", "library"],
}

# Ticket lifecycle statuses considered active (unresolved) in squad work queues
ACTIVE_TICKET_STATUSES: List[str] = [
    "SUBMITTED",
    "ASSIGNED",
    "IN_PROGRESS",
    "ESCALATED",
    "ON_HOLD",
]


def select_optimal_team(
    db: Session,
    department_id: int,
    priority: str = "MEDIUM",
    location: str = "",
) -> Optional[MaintenanceTeam]:
    """
    Select the optimal maintenance squad using emergency short-circuiting,
    availability filtering, least-loaded queue balancing, and zone affinity.

    Args:
        db: Active SQLAlchemy database session.
        department_id: Foreign key of the responsible department.
        priority: Triage priority ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW').
        location: Complaint location string for zone matching.

    Returns:
        The selected MaintenanceTeam ORM entity, or None if no active squads exist.
    """
    normalized_priority = (priority or "MEDIUM").strip().upper()

    # 1. Emergency Short-Circuit Bypass for CRITICAL safety incidents
    if normalized_priority == "CRITICAL" and department_id in EMERGENCY_SQUAD_MAP:
        emergency_name = EMERGENCY_SQUAD_MAP[department_id]
        emergency_squad = (
            db.query(MaintenanceTeam)
            .filter(
                MaintenanceTeam.department_id == department_id,
                MaintenanceTeam.name == emergency_name,
                MaintenanceTeam.is_active == True,
            )
            .first()
        )
        if emergency_squad:
            return emergency_squad

    # 2. Query all active squads belonging to the designated department
    candidates: List[MaintenanceTeam] = (
        db.query(MaintenanceTeam)
        .filter(
            MaintenanceTeam.department_id == department_id,
            MaintenanceTeam.is_active == True,
        )
        .all()
    )

    if not candidates:
        return None

    # 3. Workload Inspection: Calculate active queue depth for each candidate
    # 4. Zone Affinity Bonus: Apply preference credit if squad specialization matches zone
    loc_lower = (location or "").lower()
    has_hostel_affinity = any(kw in loc_lower for kw in ZONE_AFFINITY_MAP["Hostel"])
    has_academic_affinity = any(kw in loc_lower for kw in ZONE_AFFINITY_MAP["Academic"])

    scored_candidates = []
    for squad in candidates:
        raw_queue_depth = (
            db.query(func.count(Ticket.id))
            .filter(
                Ticket.assigned_team_id == squad.id,
                Ticket.status.in_(ACTIVE_TICKET_STATUSES),
            )
            .scalar()
            or 0
        )

        effective_depth = raw_queue_depth
        squad_name_lower = squad.name.lower()

        # Apply 1-ticket zone preference credit
        if has_hostel_affinity and "hostel" in squad_name_lower:
            effective_depth -= 1
        elif has_academic_affinity and any(term in squad_name_lower for term in ["academic", "lab", "class"]):
            effective_depth -= 1

        scored_candidates.append({
            "squad": squad,
            "effective_depth": effective_depth,
            "raw_depth": raw_queue_depth,
            "id": squad.id,
        })

    # 5. Deterministic Selection: Sort by (effective_depth, id)
    scored_candidates.sort(key=lambda x: (x["effective_depth"], x["id"]))

    return scored_candidates[0]["squad"]


def generate_dispatch_reason(
    team_name: str,
    queue_depth: int,
    is_emergency: bool = False,
) -> str:
    """
    Generate an explainable diagnostic rationale string for work orders and logs.

    Args:
        team_name: Name of the assigned maintenance squad.
        queue_depth: Count of active open tickets in the squad's queue.
        is_emergency: Whether the squad was assigned via CRITICAL emergency bypass.

    Returns:
        Structured explanation string.
    """
    if is_emergency:
        return (
            f"Emergency Short-Circuit Dispatch: Allocated directly to specialized "
            f"emergency unit '{team_name}' for critical incident response."
        )
    return (
        f"Dispatched to '{team_name}': Least-loaded active squad "
        f"(Queue depth: {queue_depth} active tickets)."
    )
