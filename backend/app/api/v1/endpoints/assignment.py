"""
SmartComplaintHandler - Workload & Dispatch Endpoints
Blueprint Reference: V1/M4/backend/05_assignment_endpoints.md
Role: REST routes for viewing squad workloads (/teams/workloads) and reassigning tickets (/tickets/{ticket_id}/reassign).
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db
from app.models.team import MaintenanceTeam
from app.models.ticket import Ticket
from app.schemas.assignment import TeamWorkloadResponse, ReassignTeamRequest

router = APIRouter()


@router.get("/teams/workloads", response_model=List[TeamWorkloadResponse])
def get_workloads(db: Session = Depends(get_db)):
    """
    Returns active ticket counts across all squads for workload inspection.
    """
    teams = db.query(MaintenanceTeam).all()
    results = []
    active_statuses = ["SUBMITTED", "IN_PROGRESS", "ESCALATED", "ON_HOLD", "ASSIGNED"]

    for team in teams:
        count = (
            db.query(func.count(Ticket.id))
            .filter(Ticket.assigned_team_id == team.id)
            .filter(Ticket.status.in_(active_statuses))
            .scalar()
            or 0
        )
        dept_name = team.department.name if team.department else "General"
        results.append(
            TeamWorkloadResponse(
                team_id=team.id,
                team_name=team.name,
                department_name=dept_name,
                active_ticket_count=count,
            )
        )
    return results


@router.patch("/tickets/{ticket_id}/reassign")
def reassign_team(
    ticket_id: int,
    payload: ReassignTeamRequest,
    db: Session = Depends(get_db),
):
    """
    Reassigns a ticket to a new squad with documented justification.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket with ID {ticket_id} not found",
        )

    target_team = db.query(MaintenanceTeam).filter(MaintenanceTeam.id == payload.team_id).first()
    if not target_team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team with ID {payload.team_id} not found",
        )

    old_team_name = ticket.assigned_team.name if ticket.assigned_team else "Unassigned"
    ticket.assigned_team_id = target_team.id

    audit_entry = (
        f"[TEAM REASSIGNMENT] Reassigned from {old_team_name} to {target_team.name}. "
        f"Reason: {payload.reason.strip()}"
    )
    ticket.resolution_notes = (
        (ticket.resolution_notes + "\n" + audit_entry)
        if ticket.resolution_notes
        else audit_entry
    )

    db.commit()
    db.refresh(ticket)

    return {
        "status": "success",
        "ticket_id": ticket_id,
        "new_team_id": payload.team_id,
        "new_team_name": target_team.name,
        "reason": payload.reason,
    }
