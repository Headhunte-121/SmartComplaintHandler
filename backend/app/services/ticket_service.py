"""
SmartComplaintHandler - Ticket Service Orchestrator
Blueprint Reference: V1/M2/backend/04_ticket_service.md, V1/M3/backend/04_service_integration.md, & V1/M5/backend/04_service_integration.md
Role: Coordinates complaint creation, dynamic taxonomy classification, priority calculation, squad dispatch, SLA management, and administrative overrides.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union
from sqlalchemy.orm import Session

from app.models.ticket import Ticket
from app.models.department import Department
from app.models.team import MaintenanceTeam
from app.schemas.ticket import TicketCreate
from app.schemas.priority import PriorityOverrideRequest
from app.utils.code_generator import generate_unique_tracking_code
from app.services.priority_engine import (
    calculate_priority,
    PRIORITY_CRITICAL,
    PRIORITY_HIGH,
    PRIORITY_MEDIUM,
    PRIORITY_LOW,
)
from app.services.classifier import classify_ticket
from app.services.sla_engine import (
    calculate_sla_deadline,
    calculate_sla_remaining_seconds,
    is_sla_breached,
    get_sla_status,
)
from app.services.lifecycle import (
    STATUS_SUBMITTED,
    STATUS_IN_PROGRESS,
    STATUS_ESCALATED,
    STATUS_RESOLVED,
    validate_transition,
    format_audit_log_entry,
)

# Optional dispatch engine integration for automated team assignment
try:
    from app.services.dispatch_engine import select_optimal_team
except ImportError:
    select_optimal_team = None


def create_ticket(
    db: Session,
    ticket_in: Optional[Union[TicketCreate, str]] = None,
    tracking_code: Optional[str] = None,
    title: Optional[str] = None,
    description: Optional[str] = None,
    location: Optional[str] = None,
    priority: Optional[str] = None,
    department_id: Optional[int] = None,
    assigned_team_id: Optional[int] = None,
    created_at: Optional[datetime] = None,
) -> Ticket:
    """
    Ingest a new grievance ticket. Dynamically calculates classification and urgency priority
    if not explicitly passed, stamps SLA deadline, and persists to SQLite.
    
    Supports both:
    1. create_ticket(db, ticket_in=TicketCreate(...))
    2. create_ticket(db, tracking_code="...", title="...", description="...", location="...", ...)
    """
    # Handle polymorphic arguments
    if isinstance(ticket_in, TicketCreate):
        title = ticket_in.title
        description = ticket_in.description
        location = ticket_in.location
    elif isinstance(ticket_in, str) and tracking_code is None:
        # Legacy signature: create_ticket(db, tracking_code, title, ...)
        tracking_code = ticket_in

    now = created_at or datetime.now(timezone.utc)

    # 1. Collision-free tracking code
    final_code = tracking_code or generate_unique_tracking_code(db)

    # 2. Automated domain taxonomy classification
    if department_id is None and title and description:
        classification = classify_ticket(title, description)
        department_id = classification.get("department_id")

    # 3. Dynamic deterministic priority scoring
    if priority is None and title and description:
        p_info = calculate_priority(title, description)
        final_priority = p_info["priority"]
    else:
        final_priority = (priority or PRIORITY_MEDIUM).upper()

    # 4. Workload-balanced dispatch if available and unassigned
    if assigned_team_id is None and department_id is not None and select_optimal_team:
        try:
            team = select_optimal_team(
                db=db,
                department_id=department_id,
                priority=final_priority,
                location=location or ""
            )
            if team:
                assigned_team_id = team.id
        except Exception:
            assigned_team_id = None

    # 5. SLA Deadline calculation based on assigned priority
    calculated_deadline = calculate_sla_deadline(created_at=now, priority=final_priority)

    db_ticket = Ticket(
        tracking_code=final_code,
        title=title or "Untitled Incident",
        description=description or "",
        location=location or "Campus",
        priority=final_priority,
        status=STATUS_SUBMITTED,
        department_id=department_id,
        assigned_team_id=assigned_team_id,
        created_at=now,
        sla_deadline=calculated_deadline,
        resolution_notes=None,
    )

    try:
        db.add(db_ticket)
        db.commit()
        db.refresh(db_ticket)
        return db_ticket
    except Exception:
        db.rollback()
        raise


def override_ticket_priority(
    db: Session,
    ticket_id: int,
    override_data: PriorityOverrideRequest,
    actor: str = "Supervisor",
) -> Optional[Ticket]:
    """
    Administrative priority override by authorized facility supervisor.
    Validates ticket existence, updates priority, recalculates SLA deadline,
    and appends an immutable, tamper-evident audit note with timestamp.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        return None

    new_p = (
        override_data.new_priority.value
        if hasattr(override_data.new_priority, "value")
        else str(override_data.new_priority)
    ).upper()

    old_priority = ticket.priority
    ticket.priority = new_p

    # Recalculate SLA deadline using ticket creation time and new priority
    base_time = ticket.created_at
    if base_time and base_time.tzinfo is None:
        base_time = base_time.replace(tzinfo=timezone.utc)
    ticket.sla_deadline = calculate_sla_deadline(created_at=base_time, priority=new_p)

    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    audit_entry = (
        f"[{timestamp}] [PRIORITY OVERRIDE] Priority changed from {old_priority} to {new_p} "
        f"by {actor}. Reason: {override_data.override_reason.strip()}"
    )

    ticket.resolution_notes = (
        (ticket.resolution_notes + "\n" + audit_entry)
        if ticket.resolution_notes
        else audit_entry
    )

    try:
        db.commit()
        db.refresh(ticket)
        return ticket
    except Exception:
        db.rollback()
        raise


def list_tickets(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    priority: Optional[str] = None,
    department_id: Optional[int] = None,
    status: Optional[str] = None,
) -> List[Ticket]:
    """
    Query tickets with optional priority, department, and status filters.
    """
    query = db.query(Ticket)
    if priority:
        query = query.filter(Ticket.priority == priority.strip().upper())
    if department_id is not None:
        query = query.filter(Ticket.department_id == department_id)
    if status:
        query = query.filter(Ticket.status == status.strip().upper())
    return query.order_by(Ticket.created_at.desc()).offset(skip).limit(limit).all()


def update_ticket_status(
    db: Session,
    ticket_id: int,
    new_status: str,
    staff_notes: Optional[str] = None,
    actor: str = "Staff",
) -> Optional[Ticket]:
    """
    Advance ticket lifecycle status with state machine transition validation and audit trail.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        return None

    target = new_status.strip().upper()
    validate_transition(current_status=ticket.status, target_status=target, notes=staff_notes)

    audit_entry = format_audit_log_entry(
        previous_status=ticket.status,
        new_status=target,
        actor=actor,
        notes=staff_notes,
    )

    ticket.status = target
    ticket.resolution_notes = (
        (ticket.resolution_notes + "\n" + audit_entry)
        if ticket.resolution_notes
        else audit_entry
    )

    try:
        db.commit()
        db.refresh(ticket)
        return ticket
    except Exception:
        db.rollback()
        raise


def resolve_ticket(
    db: Session,
    ticket_id: int,
    resolution_notes: str,
    parts_replaced: Optional[str] = None,
    technician: Optional[str] = None,
) -> Optional[Ticket]:
    """
    Formally resolve a ticket, validating substantive closure notes and recording SLA compliance.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        return None

    validate_transition(
        current_status=ticket.status,
        target_status=STATUS_RESOLVED,
        notes=resolution_notes,
    )

    now = datetime.now(timezone.utc)
    ticket.resolved_at = now
    ticket.status = STATUS_RESOLVED

    # Evaluate if SLA was met or breached upon resolution
    is_met = True
    if ticket.sla_deadline:
        deadline = ticket.sla_deadline
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        is_met = now <= deadline

    closure_report = (
        f"[CLOSURE REPORT: {now.isoformat()} | Technician: {technician or 'Unassigned'} | SLA Met: {is_met}]\n"
        f"Work Summary: {resolution_notes.strip()}\n"
        f"Parts Replaced: {parts_replaced.strip() if parts_replaced else 'None'}"
    )

    ticket.resolution_notes = (
        (ticket.resolution_notes + "\n" + closure_report)
        if ticket.resolution_notes
        else closure_report
    )

    try:
        db.commit()
        db.refresh(ticket)
        return ticket
    except Exception:
        db.rollback()
        raise


def escalate_ticket(
    db: Session,
    ticket_id: int,
    reason: str,
    supervisor_id: Optional[str] = None,
) -> Optional[Ticket]:
    """
    Elevate a high-risk or stagnant complaint to ESCALATED with documented justification.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        return None

    validate_transition(
        current_status=ticket.status,
        target_status=STATUS_ESCALATED,
        notes=reason,
    )

    now = datetime.now(timezone.utc)
    ticket.status = STATUS_ESCALATED

    audit_entry = (
        f"[ESCALATION: {now.isoformat()} | Supervisor: {supervisor_id or 'Staff'} | "
        f"Reason: {reason.strip()}]"
    )

    ticket.resolution_notes = (
        (ticket.resolution_notes + "\n" + audit_entry)
        if ticket.resolution_notes
        else audit_entry
    )

    try:
        db.commit()
        db.refresh(ticket)
        return ticket
    except Exception:
        db.rollback()
        raise


def get_active_sla_breaches(
    db: Session,
    threshold_ratio: float = 0.20,
) -> List[Dict[str, Any]]:
    """
    Query all open, active tickets and return those breached or nearing deadline breach.
    """
    active_statuses = [STATUS_SUBMITTED, STATUS_IN_PROGRESS, STATUS_ESCALATED]
    tickets = (
        db.query(Ticket)
        .filter(Ticket.status.in_(active_statuses))
        .filter(Ticket.sla_deadline != None)
        .all()
    )

    now = datetime.now(timezone.utc)
    results: List[Dict[str, Any]] = []

    for ticket in tickets:
        sla_info = get_sla_status(
            sla_deadline=ticket.sla_deadline,
            priority=ticket.priority,
            current_time=now,
            warning_threshold_ratio=threshold_ratio,
        )

        if sla_info["status"] in ("BREACHED", "WARNING"):
            dept_name = ticket.department.name if ticket.department else None
            team_name = ticket.assigned_team.name if ticket.assigned_team else None
            results.append({
                "ticket_id": ticket.id,
                "tracking_code": ticket.tracking_code,
                "title": ticket.title,
                "location": ticket.location,
                "department_name": dept_name,
                "assigned_team_name": team_name,
                "priority": ticket.priority,
                "sla_deadline": ticket.sla_deadline,
                "remaining_seconds": sla_info["remaining_seconds"],
                "overdue_seconds": sla_info["overdue_seconds"],
                "is_breached": sla_info["is_breached"],
                "status": ticket.status,
            })

    results.sort(
        key=lambda item: (
            0 if item["is_breached"] else 1,
            -item["overdue_seconds"] if item["is_breached"] else item["remaining_seconds"],
        )
    )

    return results
