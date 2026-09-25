"""
SmartComplaintHandler - Ticket Service Orchestrator
Blueprint Reference: V1/M2/backend/04_ticket_service.md & V1/M5/backend/04_service_integration.md
Role: Coordinates complaint creation, department routing, priority assignment, squad dispatch, and SLA deadline calculations.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.models.ticket import Ticket
from app.models.department import Department
from app.models.team import MaintenanceTeam
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


def create_ticket(
    db: Session,
    tracking_code: str,
    title: str,
    description: str,
    location: str,
    priority: str = "MEDIUM",
    department_id: Optional[int] = None,
    assigned_team_id: Optional[int] = None,
    created_at: Optional[datetime] = None,
) -> Ticket:
    """
    Ingest a new grievance ticket, automatically calculating and stamping the SLA deadline.
    """
    now = created_at or datetime.now(timezone.utc)
    calculated_deadline = calculate_sla_deadline(created_at=now, priority=priority)

    db_ticket = Ticket(
        tracking_code=tracking_code,
        title=title,
        description=description,
        location=location,
        priority=(priority or "MEDIUM").upper(),
        status=STATUS_SUBMITTED,
        department_id=department_id,
        assigned_team_id=assigned_team_id,
        created_at=now,
        sla_deadline=calculated_deadline,
        resolution_notes=None,
    )
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket


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

    db.commit()
    db.refresh(ticket)
    return ticket


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

    db.commit()
    db.refresh(ticket)
    return ticket


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

    db.commit()
    db.refresh(ticket)
    return ticket


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

    # Sort breached tickets first (descending by overdue seconds), then nearing breaches
    results.sort(
        key=lambda item: (
            0 if item["is_breached"] else 1,
            -item["overdue_seconds"] if item["is_breached"] else item["remaining_seconds"],
        )
    )

    return results
