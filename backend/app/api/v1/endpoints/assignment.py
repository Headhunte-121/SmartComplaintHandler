"""
SmartComplaintHandler - Workload & Dispatch Endpoints
Blueprint Reference: V1/M4/backend/05_assignment_endpoints.md
Role: REST routes for viewing squad workloads (/teams/workloads) and RBAC-protected ticket reassignment (/tickets/{ticket_id}/reassign).
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db, require_roles
from app.models.team import MaintenanceTeam
from app.models.ticket import Ticket
from app.schemas.assignment import ReassignTeamRequest, TeamWorkloadResponse
from app.schemas.user import UserResponse

router = APIRouter()


@router.get("/teams/workloads", response_model=List[TeamWorkloadResponse])
def get_workloads(
    current_user: Optional[UserResponse] = Depends(require_roles(["ADMIN", "SUPER_ADMIN", "TECHNICIAN"])),
    db: Session = Depends(get_db),
):
    """
    Returns active ticket counts across all squads for workload inspection.
    """
    active_statuses = ["SUBMITTED", "IN_PROGRESS", "ESCALATED", "ON_HOLD", "ASSIGNED"]

    teams = (
        db.query(MaintenanceTeam)
        .options(joinedload(MaintenanceTeam.department))
        .all()
    )
    counts_by_team = dict(
        db.query(Ticket.assigned_team_id, func.count(Ticket.id))
        .filter(
            Ticket.assigned_team_id.isnot(None),
            Ticket.status.in_(active_statuses),
        )
        .group_by(Ticket.assigned_team_id)
        .all()
    )

    return [
        TeamWorkloadResponse(
            team_id=team.id,
            team_name=team.name,
            department_name=team.department.name if team.department else "General",
            active_ticket_count=counts_by_team.get(team.id, 0),
        )
        for team in teams
    ]


@router.patch("/tickets/{ticket_id}/reassign")
def reassign_team(
    ticket_id: int,
    payload: ReassignTeamRequest,
    current_user: Optional[UserResponse] = Depends(require_roles(["ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db),
):
    """
    Reassigns a ticket to a new squad with documented justification (Admin / Super Admin only).
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

    actor_label = f" by {current_user.email}" if current_user else ""
    audit_entry = (
        f"[TEAM REASSIGNMENT] Reassigned from {old_team_name} to {target_team.name}{actor_label}. "
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
