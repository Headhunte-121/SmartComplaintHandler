"""
SmartComplaintHandler - Priority & Triage REST API Endpoints
Blueprint Reference: V1/M3/backend/05_priority_endpoints.md
Role: REST presentation controllers for stateless real-time triage preview and RBAC-protected priority overrides.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_roles
from app.schemas.priority import (
    PriorityEnum,
    PriorityOverrideRequest,
    TriagePreviewRequest,
    TriageResult,
)
from app.schemas.ticket import TicketResponse
from app.schemas.user import UserResponse
from app.services.classifier import classify_ticket
from app.services.priority_engine import calculate_priority
from app.services.ticket_service import override_ticket_priority

router = APIRouter()


@router.post(
    "/triage-preview",
    response_model=TriageResult,
    status_code=status.HTTP_200_OK,
    summary="Preview complaint triage classification and priority",
    description="Stateless in-memory calculation of priority and domain taxonomy for real-time form feedback.",
)
def preview_triage(request_data: TriagePreviewRequest) -> TriageResult:
    """
    Stateless evaluation: analyzes draft complaint title and description,
    extracts hazard/domain keywords, predicts service department, and computes urgency tier.
    """
    priority_info = calculate_priority(request_data.title, request_data.description)
    classification_info = classify_ticket(request_data.title, request_data.description)

    all_keywords = sorted(
        list(set(priority_info.get("matched_keywords", []) + classification_info.get("matched_keywords", [])))
    )

    reason = (
        f"Category '{classification_info['category']}' assigned based on domain keywords. "
        f"Priority '{priority_info['priority']}' assigned: {priority_info['reason']}"
    )

    return TriageResult(
        priority=PriorityEnum(priority_info["priority"]),
        suggested_priority=priority_info["priority"],
        category=classification_info["category"],
        hazard_detected=priority_info["hazard_detected"],
        confidence=classification_info["confidence"],
        reason=reason,
        matched_keywords=all_keywords,
    )


@router.patch(
    "/{ticket_id}/priority",
    response_model=TicketResponse,
    status_code=status.HTTP_200_OK,
    summary="Manually override ticket priority tier (Admin / Super Admin)",
    description="Authorized facility supervisor manual priority adjustment with mandatory audit explanation.",
)
def override_priority(
    ticket_id: int,
    override_data: PriorityOverrideRequest,
    current_user: Optional[UserResponse] = Depends(require_roles(["ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db),
) -> TicketResponse:
    """
    Administrative mutation: modifies ticket priority, recalculates SLA deadline,
    and appends timestamped explanation note to resolution_notes.
    """
    actor_label = f"{current_user.name} ({current_user.email})" if current_user else "Supervisor"
    updated_ticket = override_ticket_priority(
        db=db,
        ticket_id=ticket_id,
        override_data=override_data,
        actor=actor_label,
    )

    if updated_ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket with ID {ticket_id} not found",
        )

    response = TicketResponse.model_validate(updated_ticket)
    if updated_ticket.department:
        response.department_name = updated_ticket.department.name
    if updated_ticket.assigned_team:
        response.assigned_team_name = updated_ticket.assigned_team.name

    return response
