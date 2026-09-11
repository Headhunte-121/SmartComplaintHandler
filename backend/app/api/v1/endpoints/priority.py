"""
SmartComplaintHandler - Priority & Triage Endpoints
Blueprint Reference: V1/M3/backend/05_priority_endpoints.md
Role: REST routes for live preview (/triage-preview) and administrative priority overrides.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.schemas.priority import TriagePreviewRequest, TriagePreviewResponse, PriorityOverrideRequest

router = APIRouter()

@router.post("/triage-preview", response_model=TriagePreviewResponse)
def preview_triage(payload: TriagePreviewRequest):
    # Boilerplate triage preview: analyzes text keywords
    text = (payload.title + " " + payload.description).lower()
    priority = "HIGH" if any(w in text for w in ["fire", "spark", "leak", "flood", "shock", "burst"]) else "LOW"
    dept = "Plumbing & Water Services" if any(w in text for w in ["water", "leak", "pipe", "tap"]) else "General Maintenance"
    return TriagePreviewResponse(
        suggested_priority=priority,
        detected_department=dept,
        confidence_score=0.92
    )

@router.patch("/tickets/{ticket_id}/priority")
def override_priority(ticket_id: int, payload: PriorityOverrideRequest, db: Session = Depends(get_db)):
    return {
        "status": "success",
        "ticket_id": ticket_id,
        "new_priority": payload.priority,
        "reason": payload.reason
    }
