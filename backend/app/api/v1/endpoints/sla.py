"""
SmartComplaintHandler - SLA & Lifecycle Endpoints
Blueprint Reference: V1/M5/backend/05_sla_endpoints.md
Role: REST routes for status updates (/status), ticket resolution (/resolve), and active breach queries.
"""
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.schemas.sla import StatusUpdateRequest, TicketResolveRequest, SLABreachResponse

router = APIRouter()

@router.patch("/tickets/{ticket_id}/status")
def update_status(ticket_id: int, payload: StatusUpdateRequest, db: Session = Depends(get_db)):
    return {
        "status": "success",
        "ticket_id": ticket_id,
        "new_status": payload.status
    }

@router.post("/tickets/{ticket_id}/resolve")
def resolve_ticket(ticket_id: int, payload: TicketResolveRequest, db: Session = Depends(get_db)):
    return {
        "status": "success",
        "ticket_id": ticket_id,
        "resolved": True,
        "resolution_notes": payload.resolution_notes
    }

@router.get("/sla/breaches", response_model=List[SLABreachResponse])
def get_breached_tickets(db: Session = Depends(get_db)):
    # Boilerplate response: returns sample active breach for dashboard testing
    return [
        SLABreachResponse(
            ticket_id=99,
            tracking_code="TICK-8F2D",
            title="Main server room AC failure",
            priority="CRITICAL",
            sla_deadline=datetime.utcnow() - timedelta(hours=2),
            hours_overdue=2.0
        )
    ]
