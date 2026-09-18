"""
SmartComplaintHandler - SLA & Lifecycle Endpoints
Blueprint Reference: V1/M5/backend/05_sla_endpoints.md
Role: REST routes for status updates (/status), ticket resolution (/resolve), and active breach queries.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.sla import (
    StatusUpdateRequest,
    TicketResolveRequest,
    EscalationRequest,
    SLABreachResponse,
    TicketLifecycleResponse,
)
from app.services.ticket_service import (
    update_ticket_status,
    resolve_ticket,
    escalate_ticket,
    get_active_sla_breaches,
)
from app.services.lifecycle import (
    InvalidStateTransitionError,
    MissingResolutionNotesError,
    TerminalStateModificationError,
)

router = APIRouter()


@router.patch("/tickets/{ticket_id}/status", response_model=TicketLifecycleResponse)
def update_status(
    ticket_id: int,
    payload: StatusUpdateRequest,
    db: Session = Depends(get_db),
):
    """
    Advance or update ticket lifecycle status through formal transition validation.
    """
    try:
        ticket = update_ticket_status(
            db=db,
            ticket_id=ticket_id,
            new_status=payload.status.value,
            staff_notes=payload.notes,
            actor=payload.actor,
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
    db: Session = Depends(get_db),
):
    """
    Formally close and resolve an incident, capturing mandatory repair notes.
    """
    try:
        ticket = resolve_ticket(
            db=db,
            ticket_id=ticket_id,
            resolution_notes=payload.resolution_notes,
            parts_replaced=payload.parts_replaced,
            technician=payload.technician_name,
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
    db: Session = Depends(get_db),
):
    """
    Escalate a stagnant or high-risk ticket for supervisory oversight.
    """
    try:
        ticket = escalate_ticket(
            db=db,
            ticket_id=ticket_id,
            reason=payload.escalation_reason,
            supervisor_id=payload.supervisor_id,
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


@router.get("/sla/breaches/active", response_model=List[SLABreachResponse])
def get_breaches(
    threshold_ratio: float = Query(0.20, ge=0.0, le=1.0, description="Approaching breach warning threshold ratio"),
    db: Session = Depends(get_db),
):
    """
    Query active tickets that have breached or are approaching breach of contractual SLA.
    """
    breaches = get_active_sla_breaches(db=db, threshold_ratio=threshold_ratio)
    return breaches
