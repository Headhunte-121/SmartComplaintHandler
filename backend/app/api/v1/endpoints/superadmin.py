"""
SmartComplaintHandler - Directorate SuperAdmin Telemetry & Supervisory Endpoints
Role: Executive telemetry aggregation, cross-department operational radar,
      squad utilization metrics, and supervisory governance for Directorate.
"""
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db, require_roles
from app.models.department import Department
from app.models.team import MaintenanceTeam
from app.models.ticket import Ticket
from app.models.user import User
from app.schemas.user import UserResponse
from app.services.ticket_service import get_active_sla_breaches

router = APIRouter()

CAMPUS_DEPARTMENTS = [
    "Electrical",
    "Plumbing",
    "Sanitation",
    "Carpentry",
    "IT Support",
    "General Administration",
]

DEPT_ICONS = {
    "Electrical": "⚡",
    "Plumbing": "🚰",
    "Sanitation": "🧹",
    "Carpentry": "🪚",
    "IT Support": "💻",
    "General Administration": "🏛️",
}


@router.get("/telemetry", summary="Directorate Executive Operational Telemetry")
def get_directorate_telemetry(
    current_user: Optional[UserResponse] = Depends(require_roles(["SUPER_ADMIN", "ADMIN"])),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Returns server-aggregated operational KPIs, departmental health radar,
    campus building fault metrics, squad capacity depths, and SLA breach exceptions.
    """
    all_tickets = db.query(Ticket).options(joinedload(Ticket.department), joinedload(Ticket.assigned_team)).all()
    total_tickets = len(all_tickets)

    active_statuses = {"SUBMITTED", "PENDING", "ASSIGNED", "IN_PROGRESS", "ESCALATED", "ON_HOLD"}
    terminal_statuses = {"RESOLVED", "CLOSED"}

    pending_tickets = sum(1 for t in all_tickets if t.status in ("SUBMITTED", "PENDING", "ASSIGNED"))
    in_progress_tickets = sum(1 for t in all_tickets if t.status in ("IN_PROGRESS", "ESCALATED"))
    resolved_tickets = sum(1 for t in all_tickets if t.status in terminal_statuses)
    active_load = pending_tickets + in_progress_tickets

    resolution_rate = round((resolved_tickets / total_tickets) * 100) if total_tickets > 0 else 100

    critical_tickets = sum(
        1 for t in all_tickets
        if t.priority == "CRITICAL" and t.status not in terminal_statuses
    )

    breaches = get_active_sla_breaches(db=db, threshold_ratio=0.20)
    overdue_count = sum(1 for b in breaches if b.get("is_breached", False))
    approaching_count = sum(1 for b in breaches if not b.get("is_breached", False))

    sla_compliance = (
        max(0, round(((total_tickets - overdue_count) / total_tickets) * 100))
        if total_tickets > 0
        else 100
    )

    # Department Health Radar
    department_stats = []
    for dept_name in CAMPUS_DEPARTMENTS:
        dept_tickets = [t for t in all_tickets if (t.department and t.department.name == dept_name)]
        dept_total = len(dept_tickets)
        dept_active = sum(1 for t in dept_tickets if t.status in active_statuses)
        dept_resolved = sum(1 for t in dept_tickets if t.status in terminal_statuses)
        dept_rate = round((dept_resolved / dept_total) * 100) if dept_total > 0 else 100
        dept_health = max(65, 100 - (dept_active * 5))

        department_stats.append({
            "name": dept_name,
            "icon": DEPT_ICONS.get(dept_name, "🏢"),
            "total": dept_total,
            "active": dept_active,
            "resolved": dept_resolved,
            "rate": dept_rate,
            "health": dept_health,
        })

    # Squad Capacities
    teams = db.query(MaintenanceTeam).options(joinedload(MaintenanceTeam.department)).all()
    team_counts = dict(
        db.query(Ticket.assigned_team_id, func.count(Ticket.id))
        .filter(Ticket.assigned_team_id.isnot(None), Ticket.status.in_(active_statuses))
        .group_by(Ticket.assigned_team_id)
        .all()
    )
    squad_workloads = [
        {
            "team_id": tm.id,
            "team_name": tm.name,
            "department_name": tm.department.name if tm.department else "General",
            "active_ticket_count": team_counts.get(tm.id, 0),
        }
        for tm in teams
    ]

    # Staff counts
    staff_count = db.query(User).filter(User.role.in_(["ADMIN", "SUPER_ADMIN", "TECHNICIAN"])).count()

    return {
        "kpis": {
            "total_tickets": total_tickets,
            "pending_tickets": pending_tickets,
            "in_progress_tickets": in_progress_tickets,
            "resolved_tickets": resolved_tickets,
            "active_load": active_load,
            "resolution_rate": resolution_rate,
            "critical_tickets": critical_tickets,
            "overdue_breaches": overdue_count,
            "approaching_breaches": approaching_count,
            "sla_compliance": sla_compliance,
            "staff_count": staff_count,
            "field_squads_count": len(teams),
        },
        "department_stats": department_stats,
        "squad_workloads": squad_workloads,
    }
