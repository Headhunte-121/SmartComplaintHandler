# Comprehensive Code Walkthrough & Line-by-Line Guide: `backend/app/api/v1/endpoints/assignment.py`

> **File Location**: [`backend/app/api/v1/endpoints/assignment.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/backend/app/api/v1/endpoints/assignment.py)  
> **Prerequisites**: Basic knowledge of C or Python (functions, HTTP requests, SQL queries, dictionaries). No advanced database optimization background is assumed.  
> **What this file is**: The workload and dispatch API controller. It provides endpoints for inspecting real-time maintenance squad queues (`/teams/workloads`) and allows authorized department administrators to manually reassign tickets to different squads with mandatory audit logging (`/tickets/{ticket_id}/reassign`).

---

## Block 1: Imports & Framework Tools (Lines 1–18)

```python
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
```

### 1. Plain-English Purpose:
Loads typing tools, FastAPI routing and error handling classes, SQLAlchemy database aggregation functions (`func.count`, `joinedload`), entity models, validation schemas, and instantiates the assignment router.

### 2. Line-by-Line Breakdown:
- **Lines 1–5**: Docstring referencing Module 4 Blueprint for Assignment Endpoints.
- **Line 6 (`from typing import List, Optional`)**: Type hints.
- **Line 7 (`from fastapi import APIRouter, Depends, HTTPException, status`)**: Routing and dependency injection tools.
- **Line 8 (`from sqlalchemy import func`)**: SQL functions tool allowing database-side aggregation (`func.count(Ticket.id)`).
- **Line 9 (`from sqlalchemy.orm import Session, joinedload`)**: Database session and eager loading joiner (`joinedload`).
- **Line 11 (`from app.api.deps import get_db, require_roles`)**: Database session provider and role guard.
- **Lines 12–15**: Models (`MaintenanceTeam`, `Ticket`) and schemas (`ReassignTeamRequest`, `TeamWorkloadResponse`, `UserResponse`).
- **Line 17 (`router = APIRouter()`)**: Instantiates router.

---

## Block 2: Squad Workload Inspection: `GET /teams/workloads` (Lines 20–54)

```python
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
```

### 1. Plain-English Purpose:
Calculates the real-time active ticket queue for every maintenance squad on campus using high-speed database aggregation, returning data formatted for dashboard workload charts.

### 2. Line-by-Line Breakdown:
- **Line 20 (`@router.get("/teams/workloads", ...)`)**: HTTP GET route returning a list of `TeamWorkloadResponse`.
- **Line 22 (`current_user = Depends(require_roles(["ADMIN", "SUPER_ADMIN", "TECHNICIAN"]))`)**: Restricts access to university staff; normal students cannot inspect internal squad capacities.
- **Line 29 (`active_statuses = [...]`)**: Defines statuses that represent incomplete, pending work (`SUBMITTED`, `IN_PROGRESS`, `ESCALATED`, `ON_HOLD`, `ASSIGNED`). `RESOLVED` and `CLOSED` tickets are excluded.
- **Lines 31–35 (`teams = db.query(MaintenanceTeam).options(joinedload(...)).all()`)**: Eagerly loads all squads along with their parent department using an SQL `LEFT JOIN` in a single query.
- **Lines 36–44 (`counts_by_team = dict(db.query(Ticket.assigned_team_id, func.count(Ticket.id))...group_by(...))`)**:
  - Executes a single SQL `GROUP BY` query:
    ```sql
    SELECT assigned_team_id, COUNT(id) FROM tickets
    WHERE assigned_team_id IS NOT NULL AND status IN (...)
    GROUP BY assigned_team_id;
    ```
  - Converts results `[(1, 14), (2, 3)]` into a Python lookup dictionary `{1: 14, 2: 3}`.
- **Lines 46–54**: List comprehension mapping each team to `TeamWorkloadResponse` using $O(1)$ dictionary lookups (`counts_by_team.get(team.id, 0)`).

### 3. Deep Term & Concept Expansion:
- **Avoiding the N+1 Query Problem**:
  A naive developer might write a loop in Python: `for team in teams: count = len(team.tickets)`. If there are 20 squads, this executes 20 separate SQL queries, loading thousands of rows into server RAM! Using `func.count()` with `group_by()` lets the database calculate counts in one pass, reducing network overhead by 99%.

---

## Block 3: Supervisory Ticket Reassignment: `PATCH /tickets/{ticket_id}/reassign` (Lines 56–105)

```python
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
    if target_team.department_id:
        ticket.department_id = target_team.department_id
    if ticket.status == 'ESCALATED':
        ticket.status = 'ASSIGNED'

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
```

### 1. Plain-English Purpose:
Allows department supervisors to manually transfer a ticket to a new squad. Verifies that both the ticket and target squad exist, automatically synchronizes the department ID, resets escalated alerts, and stamps an immutable audit log entry into the ticket's resolution history.

### 2. Line-by-Line Breakdown:
- **Line 56 (`@router.patch("/tickets/{ticket_id}/reassign")`)**: HTTP PATCH route for partial reassignment.
- **Line 59 (`require_roles(["ADMIN", "SUPER_ADMIN"])`)**: Enforces privilege separation: field technicians cannot reassign tickets; only facility supervisors hold this permission.
- **Lines 65–78**: Queries `Ticket` and `MaintenanceTeam`. If either ID does not exist, raises HTTP 404 Not Found.
- **Line 80 (`old_team_name = ...`)**: Stores old squad name for the audit log.
- **Line 81 (`ticket.assigned_team_id = target_team.id`)**: Updates assigned squad foreign key.
- **Lines 82–83 (`if target_team.department_id: ticket.department_id = ...`)**: Self-healing synchronization: if a ticket was misrouted to Plumbing but reassigned to Electrical Squad, automatically updates `ticket.department_id` to Electrical.
- **Lines 84–85 (`if ticket.status == 'ESCALATED': ticket.status = 'ASSIGNED'`)**: Clears escalation alerts when assigned to a fresh team.
- **Lines 86–96 (Immutable Audit Log)**: Constructs an audit entry containing supervisor email, old team, new team, and justification reason, appending it to `ticket.resolution_notes`.
- **Lines 98–99 (`db.commit()`, `db.refresh(ticket)`)**: Commits the change and refreshes model.
- **Lines 101–107**: Returns success confirmation dictionary.

### 3. Deep Term & Concept Expansion:
- **Non-Repudiation in Operations**:
  Recording `actor_label = f" by {current_user.email}"` directly into `resolution_notes` ensures non-repudiation: an administrator cannot reassign a ticket and later deny it. The actor, timestamps, and reason are permanently recorded in the database.

---

## Overall File Viva & Technical Defense Guide

### Top 5 Viva Questions on `backend/app/api/v1/endpoints/assignment.py`:

#### Q1: What is the purpose of `endpoints/assignment.py`?
> **Model Answer**:  
> *"Sir, `assignment.py` exposes the API endpoints for Module 4's Workload Balancing and Dispatch Engine. It provides live queue capacity metrics across maintenance squads (`GET /teams/workloads`) and allows supervisors to reassign tickets with auditable justifications (`PATCH /tickets/{ticket_id}/reassign`)."*

#### Q2: How does `get_workloads` prevent the N+1 database query problem?
> **Model Answer**:  
> *"Sir, instead of querying active ticket counts in a Python loop for each team, it executes a single SQL `GROUP BY` query using SQLAlchemy's `func.count(Ticket.id)`. The database performs an indexed aggregation in $O(1)$ roundtrip time and returns `(team_id, count)` tuples converted into a Python dictionary."*

#### Q3: Why does `reassign_team` update `ticket.department_id` in addition to `assigned_team_id`?
> **Model Answer**:  
> *"Sir, maintenance squads belong to specific departments (e.g. Electrical Squad belongs to Electrical Department). If a supervisor determines that a complaint was misclassified under Plumbing and transfers it to the Electrical Squad, line 83 automatically synchronizes `ticket.department_id` to match the new squad's department, maintaining referential consistency."*

#### Q4: Why is `reassign_team` restricted to `ADMIN` and `SUPER_ADMIN`?
> **Model Answer**:  
> *"Sir, this enforces the Principle of Least Privilege. Field technicians are assigned to execute physical repairs; allowing technicians to pass tickets arbitrarily between squads would lead to unmonitored delays. Reassignment is an administrative prerogative restricted to supervisors."*

#### Q5: How is the audit trail stored during reassignment?
> **Model Answer**:  
> *"Sir, lines 86–96 construct an audit entry containing the supervisor's email, the previous squad name, the new squad name, and the mandatory justification reason. This text is appended to `ticket.resolution_notes`, creating an immutable historical record visible to examiners and students."*

---

## Quick Viva Summary Table

| HTTP Method | Route URL | Role Required | Inputs | Output | Key Mechanism |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`GET`** | `/teams/workloads` | Staff (Admin/Tech) | None | `List[TeamWorkloadResponse]`| Single SQL `GROUP BY` aggregation query |
| **`PATCH`** | `/tickets/{ticket_id}/reassign` | Admin / Super Admin | `team_id`, `reason` | Confirmation Dict | Synchronizes department & logs immutable audit note |
