"""
SmartComplaintHandler - Complaint & Ticket Endpoints
Blueprint Reference: V1/M2/backend/05_complaint_endpoints.md
Role: REST routes for student complaint submission (POST), status tracking by code (GET),
      and IDOR-protected listing & feedback endpoints.
"""
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db, get_optional_current_user, require_roles
from app.core.config import settings
from app.models.department import Department
from app.models.ticket import Ticket
from app.schemas.ticket import (
    FeedbackSubmitRequest,
    TicketCreate,
    TicketDirectUpdateRequest,
    TicketResponse,
)
from app.schemas.user import UserResponse
from app.services.ticket_service import create_ticket, list_tickets, submit_ticket_feedback


def _mask_display_name(name: Optional[str]) -> Optional[str]:
    """Masks personal names (e.g. 'Aarav Sharma' -> 'A***v S****a') to protect student privacy."""
    if not name:
        return name
    parts = name.strip().split()
    masked = []
    for part in parts:
        if len(part) <= 2:
            masked.append(part[0] + "*")
        else:
            masked.append(part[0] + ("*" * (len(part) - 2)) + part[-1])
    return " ".join(masked)


def _mask_display_email(email: Optional[str]) -> Optional[str]:
    """Masks email addresses (e.g. 'student@iiitnr.edu.in' -> 's*****t@iiitnr.edu.in') to protect student PII."""
    if not email:
        return email
    email = email.strip()
    if "@" not in email:
        return _mask_display_name(email)
    user_part, domain_part = email.split("@", 1)
    if len(user_part) <= 2:
        masked_user = user_part[0] + "*"
    else:
        masked_user = user_part[0] + ("*" * (len(user_part) - 2)) + user_part[-1]
    return f"{masked_user}@{domain_part}"


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
    limit: int = Query(100, ge=1, le=1000, description="Maximum records to return (capped at 1000)"),
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
        # Mask student PII if unauthenticated or student viewing another student's record
        if current_user is None or (
            current_user.role == "STUDENT"
            and item.student_email
            and item.student_email.strip().lower() != current_user.email.strip().lower()
        ):
            item.student_name = _mask_display_name(item.student_name)
            item.student_email = _mask_display_email(item.student_email)
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
    current_user: Optional[UserResponse] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
) -> TicketResponse:
    """
    Tracking endpoint by high-entropy CSPRNG tracking code (`SCH-YYYYMMDD-XXXXXX`).
    Enforces student privacy: personal submitter PII (full name, email) is masked for unauthenticated
    visitors or third-party students, preventing public identity scraping while preserving transparency.
    """
    ticket = (
        db.query(Ticket)
        .options(joinedload(Ticket.department), joinedload(Ticket.assigned_team))
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

    # PII Protection: Only ticket creator or staff (Admin, SuperAdmin, Technician) can view unmasked PII
    is_authorized_viewer = False
    if current_user is not None:
        if current_user.role in ("ADMIN", "SUPER_ADMIN", "TECHNICIAN"):
            is_authorized_viewer = True
        elif (
            ticket.student_email
            and current_user.email
            and current_user.email.strip().lower() == ticket.student_email.strip().lower()
        ):
            is_authorized_viewer = True

    if not is_authorized_viewer:
        response.student_name = _mask_display_name(response.student_name)
        response.student_email = _mask_display_email(response.student_email)

    return response


@router.patch(
    "/{ticket_id}",
    response_model=TicketResponse,
    summary="Supervisory direct update of ticket attributes (Admin / Super Admin / Tech)",
)
def update_ticket_direct(
    ticket_id: int,
    payload: TicketDirectUpdateRequest,
    current_user: Optional[UserResponse] = Depends(require_roles(["ADMIN", "SUPER_ADMIN", "TECHNICIAN"])),
    db: Session = Depends(get_db),
) -> TicketResponse:
    """
    Directly update a ticket's attributes (title, description, location, priority, status, department, notes).
    Restricted to Campus Staff and Administrators.
    """
    ticket = (
        db.query(Ticket)
        .options(joinedload(Ticket.department), joinedload(Ticket.assigned_team))
        .filter(Ticket.id == ticket_id)
        .first()
    )
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket #{ticket_id} not found.",
        )

    if payload.title is not None and payload.title.strip():
        ticket.title = payload.title.strip()

    if payload.description is not None and payload.description.strip():
        ticket.description = payload.description.strip()

    if payload.location is not None and payload.location.strip():
        ticket.location = payload.location.strip()

    if payload.priority is not None and payload.priority.strip():
        ticket.priority = payload.priority.strip().upper()

    if payload.status is not None and payload.status.strip():
        new_status = payload.status.strip().upper()
        ticket.status = new_status
        if new_status in ("RESOLVED", "CLOSED") and not ticket.resolved_at:
            ticket.resolved_at = datetime.now(timezone.utc)

    if payload.department_id is not None:
        ticket.department_id = payload.department_id
    elif payload.department_name is not None and payload.department_name.strip():
        dept = db.query(Department).filter(Department.name.ilike(payload.department_name.strip())).first()
        if dept:
            ticket.department_id = dept.id

    if payload.assigned_team_id is not None:
        ticket.assigned_team_id = payload.assigned_team_id

    if payload.resolution_notes is not None:
        ticket.resolution_notes = payload.resolution_notes.strip()

    db.commit()
    db.refresh(ticket)

    response = TicketResponse.model_validate(ticket)
    if ticket.department:
        response.department_name = ticket.department.name
    if ticket.assigned_team:
        response.assigned_team_name = ticket.assigned_team.name
    return response
