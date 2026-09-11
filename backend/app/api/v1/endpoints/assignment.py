"""
SmartComplaintHandler - Workload & Dispatch Endpoints
Blueprint Reference: V1/M4/backend/05_assignment_endpoints.md
Role: REST routes for viewing squad workloads (/teams/workloads) and reassigning tickets (/reassign).
"""
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.schemas.assignment import TeamWorkloadResponse, ReassignTeamRequest

router = APIRouter()

@router.get("/teams/workloads", response_model=List[TeamWorkloadResponse])
def get_workloads(db: Session = Depends(get_db)):
    # Boilerplate response: returns realistic squad capacity metrics
    return [
        TeamWorkloadResponse(team_id=1, team_name="Plumbing Squad 1", department_name="Plumbing", active_ticket_count=4),
        TeamWorkloadResponse(team_id=2, team_name="Plumbing Squad 2", department_name="Plumbing", active_ticket_count=1),
        TeamWorkloadResponse(team_id=3, team_name="Electrical Team A", department_name="Electrical", active_ticket_count=3),
        TeamWorkloadResponse(team_id=4, team_name="Carpentry Unit", department_name="Carpentry", active_ticket_count=0)
    ]

@router.patch("/tickets/{ticket_id}/reassign")
def reassign_team(ticket_id: int, payload: ReassignTeamRequest, db: Session = Depends(get_db)):
    return {
        "status": "success",
        "ticket_id": ticket_id,
        "new_team_id": payload.team_id,
        "reason": payload.reason
    }
