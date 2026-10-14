"""
SmartComplaintHandler - SLA & Lifecycle Endpoints
Blueprint Reference: V1/M5/backend/05_sla_endpoints.md
Role: RBAC-protected REST routes for status updates (/status), ticket resolution (/resolve),
      escalation (/escalate), and active breach queries.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_roles
from app.schemas.sla import (
    EscalationRequest,
    SLABreachResponse,
    StatusUpdateRequest,
    TicketLifecycleResponse,
    TicketResolveRequest,
)
from app.schemas.user import UserResponse
from app.services.lifecycle import (
    InvalidStateTransitionError,
    MissingResolutionNotesError,
    TerminalStateModificationError,
)
from app.services.ticket_service import (
    escalate_ticket,
    get_active_sla_breaches,
    resolve_ticket,
    update_ticket_status,
)

router = APIRouter()


@router.patch("/tickets/{ticket_id}/status", response_model=TicketLifecycleResponse)
def update_status(
    ticket_id: int,
    payload: StatusUpdateRequest,
    current_user: Optional[UserResponse] = Depends(require_roles(["TECHNICIAN", "ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db),
):
    """
    Advance or update ticket lifecycle status through formal transition validation.
    Restricted to Technicians, Facility Admins, and Super Admins.
    """
    actor = current_user.email if current_user else payload.actor
    try:
        ticket = update_ticket_status(
            db=db,
            ticket_id=ticket_id,
            new_status=payload.status.value,
            staff_notes=payload.notes,
            actor=actor,
        )
    except (InvalidStateTransitionError, TerminalStateModificationError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket with ID {ticket_id} not found.",
        )

    return ticket


@router.post("/tickets/{ticket_id}/resolve", response_model=TicketLifecycleResponse)
def resolve(
    ticket_id: int,
    payload: TicketResolveRequest,
    current_user: Optional[UserResponse] = Depends(require_roles(["TECHNICIAN", "ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db),
):
    """
    Formally close and resolve an incident, capturing mandatory repair notes.
    Restricted to Technicians, Facility Admins, and Super Admins.
    """
    tech_name = payload.technician_name or (current_user.name if current_user else None)
    try:
        ticket = resolve_ticket(
            db=db,
            ticket_id=ticket_id,
            resolution_notes=payload.resolution_notes,
            parts_replaced=payload.parts_replaced,
            technician=tech_name,
        )
    except (InvalidStateTransitionError, MissingResolutionNotesError, TerminalStateModificationError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket with ID {ticket_id} not found.",
        )

    return ticket


@router.post("/tickets/{ticket_id}/escalate", response_model=TicketLifecycleResponse)
def escalate(
    ticket_id: int,
    payload: EscalationRequest,
    current_user: Optional[UserResponse] = Depends(require_roles(["ADMIN", "SUPER_ADMIN", "TECHNICIAN"])),
    db: Session = Depends(get_db),
):
    """
    Escalate a stagnant or high-risk ticket for supervisory oversight.
    """
    sup_id = payload.supervisor_id or (current_user.email if current_user else None)
    try:
        ticket = escalate_ticket(
            db=db,
            ticket_id=ticket_id,
            reason=payload.escalation_reason,
            supervisor_id=sup_id,
        )
    except InvalidStateTransitionError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket with ID {ticket_id} not found.",
        )

    return ticket


@router.get("/sla/breaches", response_model=List[SLABreachResponse])
@router.get("/sla/breaches/active", response_model=List[SLABreachResponse])
def get_breaches(
    threshold_ratio: float = Query(0.20, ge=0.0, le=1.0, description="Approaching breach warning threshold ratio"),
    current_user: Optional[UserResponse] = Depends(require_roles(["ADMIN", "SUPER_ADMIN", "TECHNICIAN"])),
    db: Session = Depends(get_db),
):
    """
    Query active tickets that have breached or are approaching breach of contractual SLA.
    """
    breaches = get_active_sla_breaches(db=db, threshold_ratio=threshold_ratio)
    return breaches
