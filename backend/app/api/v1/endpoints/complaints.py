"""
SmartComplaintHandler - Complaint & Ticket Endpoints
Blueprint Reference: V1/M2/backend/05_complaint_endpoints.md
Role: REST routes for student complaint submission (POST), status tracking by code (GET), and listing complaints.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.ticket import Ticket
from app.schemas.ticket import TicketCreate, TicketResponse, FeedbackSubmitRequest
from app.services.ticket_service import create_ticket, list_tickets, submit_ticket_feedback

router = APIRouter()


@router.post(
    "/",
    response_model=TicketResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a new complaint ticket",
)
def submit_complaint(
    complaint_in: TicketCreate,
    db: Session = Depends(get_db),
) -> TicketResponse:
    """
    Ingest a new campus grievance, automatically triaging priority and department,
    stamping the SLA deadline, and generating a unique CSPRNG tracking code.
    """
    ticket = create_ticket(db=db, ticket_in=complaint_in)
    
    response = TicketResponse.model_validate(ticket)
    if ticket.department:
        response.department_name = ticket.department.name
    if ticket.assigned_team:
        response.assigned_team_name = ticket.assigned_team.name
    return response


@router.get(
    "/",
    response_model=List[TicketResponse],
    summary="List all complaint tickets with optional filters",
)
def get_complaints(
    skip: int = 0,
    limit: int = 100,
    priority: Optional[str] = None,
    department_id: Optional[int] = None,
    status: Optional[str] = None,
    student_email: Optional[str] = None,
    team_id: Optional[int] = None,
    db: Session = Depends(get_db),
) -> List[TicketResponse]:
    """
    List tickets with pagination and optional filtering by priority, department, status, student, or squad.
    """
    tickets = list_tickets(
        db=db,
        skip=skip,
        limit=limit,
        priority=priority,
        department_id=department_id,
        status=status,
        student_email=student_email,
        assigned_team_id=team_id,
    )
    results = []
    for t in tickets:
        item = TicketResponse.model_validate(t)
        if t.department:
            item.department_name = t.department.name
        if t.assigned_team:
            item.assigned_team_name = t.assigned_team.name
        results.append(item)
    return results


@router.post(
    "/{ticket_identifier}/feedback",
    response_model=TicketResponse,
    summary="Submit student resolution satisfaction feedback",
)
def submit_feedback(
    ticket_identifier: str,
    feedback_in: FeedbackSubmitRequest,
    db: Session = Depends(get_db),
) -> TicketResponse:
    """
    Module M5 Closed-Loop Feedback:
    Submit satisfaction score (1-5 stars) and review comments for a resolved campus ticket.
    """
    ticket = submit_ticket_feedback(
        db=db,
        ticket_identifier=ticket_identifier,
        rating=feedback_in.rating,
        comments=feedback_in.comments,
        student_name=feedback_in.student_name,
    )
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket '{ticket_identifier}' not found.",
        )

    response = TicketResponse.model_validate(ticket)
    if ticket.department:
        response.department_name = ticket.department.name
    if ticket.assigned_team:
        response.assigned_team_name = ticket.assigned_team.name
    return response


@router.get(
    "/{tracking_code}",
    response_model=TicketResponse,
    summary="Track a complaint ticket by tracking code",
)
def track_complaint(
    tracking_code: str,
    db: Session = Depends(get_db),
) -> TicketResponse:
    """
    Public tracking endpoint: returns complaint status, priority, and department details.
    """
    ticket = (
        db.query(Ticket)
        .filter(Ticket.tracking_code == tracking_code.strip().upper())
        .first()
    )
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket with tracking code '{tracking_code}' not found",
        )

    response = TicketResponse.model_validate(ticket)
    if ticket.department:
        response.department_name = ticket.department.name
    if ticket.assigned_team:
        response.assigned_team_name = ticket.assigned_team.name
    return response

