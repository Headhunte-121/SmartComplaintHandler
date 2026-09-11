"""
SmartComplaintHandler - Complaint Endpoints
Blueprint Reference: V1/M2/backend/05_complaint_endpoints.md
Role: REST routes for student complaint submission (POST) and status tracking by code (GET).
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.schemas.complaint import ComplaintCreate, ComplaintResponse
from app.utils.code_generator import generate_ticket_code

router = APIRouter()

@router.post("/tickets", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def submit_complaint(complaint_in: ComplaintCreate, db: Session = Depends(get_db)):
    # Boilerplate response: returns realistic simulated ticket creation
    code = generate_ticket_code()
    return ComplaintResponse(
        id=1,
        tracking_code=code,
        title=complaint_in.title,
        description=complaint_in.description,
        location=complaint_in.location,
        priority="HIGH",
        status="SUBMITTED",
        department_name="Plumbing & Water Services",
        assigned_team_name="Plumbing Squad 1",
        sla_deadline=datetime.utcnow() + timedelta(hours=12),
        created_at=datetime.utcnow()
    )

@router.get("/tickets/{tracking_code}", response_model=ComplaintResponse)
def get_complaint_by_code(tracking_code: str, db: Session = Depends(get_db)):
    # Boilerplate response: returns realistic simulated ticket status
    return ComplaintResponse(
        id=1,
        tracking_code=tracking_code.upper(),
        title="Water pipe leaking in corridor",
        description="Flooding the second floor corridor near room 204",
        location="Hostel B, 2nd Floor",
        priority="HIGH",
        status="IN_PROGRESS",
        department_name="Plumbing & Water Services",
        assigned_team_name="Plumbing Squad 1",
        sla_deadline=datetime.utcnow() + timedelta(hours=10),
        created_at=datetime.utcnow()
    )
