"""
SmartComplaintHandler - Complaint & Ticket Endpoints
Blueprint Reference: V1/M2/backend/05_complaint_endpoints.md
Role: REST routes for student complaint submission (POST), status tracking by code (GET),
      and IDOR-protected listing & feedback endpoints.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_optional_current_user
from app.core.config import settings
from app.models.ticket import Ticket
from app.schemas.ticket import FeedbackSubmitRequest, TicketCreate, TicketResponse
from app.schemas.user import UserResponse
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
    current_user: Optional[UserResponse] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
) -> TicketResponse:
    """
    Ingest a new campus grievance, automatically triaging priority and department,
    stamping the SLA deadline, and generating a unique CSPRNG tracking code.
    Binds student identity to the authenticated JWT when present to prevent spoofing.
    """
    if current_user is None and getattr(settings, "ENFORCE_STRICT_RBAC", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to submit a campus grievance.",
        )

    student_name = complaint_in.student_name
    student_email = complaint_in.student_email
    if current_user is not None and current_user.role == "STUDENT":
        student_email = current_user.email
        student_name = current_user.name
        complaint_in.student_email = current_user.email
        complaint_in.student_name = current_user.name

    ticket = create_ticket(
        db=db,
        ticket_in=complaint_in,
        student_name=student_name,
        student_email=student_email,
    )

    response = TicketResponse.model_validate(ticket)
    if ticket.department:
        response.department_name = ticket.department.name
    if ticket.assigned_team:
        response.assigned_team_name = ticket.assigned_team.name
    return response


@router.get(
    "/",
    response_model=List[TicketResponse],
    summary="List complaint tickets with RBAC and IDOR isolation",
)
def get_complaints(
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(100, ge=1, le=200, description="Maximum records to return (capped at 200)"),
    priority: Optional[str] = None,
    department_id: Optional[int] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    student_email: Optional[str] = None,
    team_id: Optional[int] = None,
    current_user: Optional[UserResponse] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
) -> List[TicketResponse]:
    """
    List tickets with pagination and optional filtering.
    Enforces horizontal isolation (IDOR protection): authenticated STUDENT accounts can only query
    their own complaints (`student_email == current_user.email`), preventing campus-wide PII scraping.
    """
    if current_user is None and getattr(settings, "ENFORCE_STRICT_RBAC", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to list complaint records.",
        )

    effective_student_email = student_email
    if current_user is not None and current_user.role == "STUDENT":
        if student_email and student_email.strip().lower() != current_user.email.strip().lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Students may only view their own submitted grievances.",
            )
        effective_student_email = current_user.email

    tickets = list_tickets(
        db=db,
        skip=skip,
        limit=limit,
        priority=priority,
        department_id=department_id,
        status=status_filter,
        student_email=effective_student_email,
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
    current_user: Optional[UserResponse] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
) -> TicketResponse:
    """
    Module M5 Closed-Loop Feedback:
    Submit satisfaction score (1-5 stars) and review comments for a resolved campus ticket.
    Verifies ticket ownership when called by an authenticated student.
    """
    if current_user is None and getattr(settings, "ENFORCE_STRICT_RBAC", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to submit resolution feedback.",
        )

    if current_user is not None and current_user.role == "STUDENT":
        if ticket_identifier.isdigit():
            target = db.query(Ticket).filter(Ticket.id == int(ticket_identifier)).first()
        else:
            target = db.query(Ticket).filter(Ticket.tracking_code == ticket_identifier.strip().upper()).first()
        if target and target.student_email and target.student_email.lower() != current_user.email.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You can only submit feedback for your own complaints.",
            )

    ticket = submit_ticket_feedback(
        db=db,
        ticket_identifier=ticket_identifier,
        rating=feedback_in.rating,
        comments=feedback_in.comments,
        student_name=current_user.name if current_user else feedback_in.student_name,
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
    Tracking endpoint by high-entropy CSPRNG tracking code (`SCH-YYYYMMDD-XXXXXX`).
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
