"""
SmartComplaintHandler - Priority & Triage REST API Endpoints
Blueprint Reference: V1/M3/backend/05_priority_endpoints.md
Role: REST presentation controllers for stateless real-time triage preview and RBAC-protected priority overrides.
"""
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_roles
from app.core.config import settings
from app.schemas.priority import (
    PriorityEnum,
    PriorityOverrideRequest,
    TriagePreviewRequest,
    TriageResult,
)
from app.schemas.ticket import TicketResponse
from app.schemas.user import UserResponse
from app.services.ai_triage_service import classify_and_triage_with_ai
from app.services.classifier import classify_ticket
from app.services.priority_engine import calculate_priority
from app.services.ticket_service import override_ticket_priority

router = APIRouter()


@router.post(
    "/triage-preview",
    response_model=TriageResult,
    status_code=status.HTTP_200_OK,
    summary="Preview complaint triage classification and priority",
    description="Stateless calculation of priority and domain taxonomy using Generative AI with local fallback.",
)
def preview_triage(
    request_data: TriagePreviewRequest,
    x_ai_api_key: Optional[str] = Header(None, alias="X-AI-API-Key"),
    x_ai_provider: Optional[str] = Header(None, alias="X-AI-Provider"),
) -> TriageResult:
    """
    Stateless evaluation: analyzes draft complaint title and description,
    extracts hazard/domain keywords, predicts service department, and computes urgency tier.
    Uses AI (Gemini / Groq) when key is available, or enhanced deterministic semantic engine.
    """
    active_key = request_data.api_key or x_ai_api_key
    active_provider = request_data.provider or x_ai_provider or getattr(settings, "DEFAULT_AI_PROVIDER", "groq")

    triage_info = classify_and_triage_with_ai(
        title=request_data.title,
        description=request_data.description,
        client_api_key=active_key,
        client_provider=active_provider,
    )

    return TriageResult(
        priority=PriorityEnum(triage_info["priority"]),
        suggested_priority=triage_info.get("suggested_priority", triage_info["priority"]),
        category=triage_info["category"],
        department_id=triage_info.get("department_id"),
        department_name=triage_info.get("department_name"),
        sla_hours=triage_info.get("sla_hours"),
        hazard_detected=triage_info["hazard_detected"],
        confidence=triage_info["confidence"],
        reason=triage_info["reason"],
        matched_keywords=triage_info.get("matched_keywords", []),
        ai_powered=triage_info.get("ai_powered", False),
        provider=triage_info.get("provider", "local-heuristic"),
        model_used=triage_info.get("model_used"),
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
