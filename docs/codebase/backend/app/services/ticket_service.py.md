# Comprehensive Code Walkthrough & Line-by-Line Guide: `backend/app/services/ticket_service.py`

> **File Location**: [`backend/app/services/ticket_service.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/backend/app/services/ticket_service.py)  
> **Prerequisites**: Basic knowledge of C or Python (functions, structs/ORM models, database transactions, if/else branching, sorting). No specialized enterprise architecture background is assumed.  
> **What this file is**: The central service orchestrator of the entire backend. It coordinates the full complaint lifecycle: ingesting new complaints, generating collision-free tracking codes (`TICK-XXXX`), orchestrating AI triage and keyword classification, invoking the dispatch engine to assign maintenance squads, calculating SLA deadlines, validating finite state transitions, capturing technician repair notes and replacement parts, processing student satisfaction feedback ratings, and calculating real-time SLA breach lists.

---

## Block 1: Imports & Service Integrations (Lines 1–48)

```python
"""
SmartComplaintHandler - Ticket Service Orchestrator
Blueprint Reference: V1/M2/backend/04_ticket_service.md, V1/M3/backend/04_service_integration.md, & V1/M5/backend/04_service_integration.md
Role: Coordinates complaint creation, dynamic taxonomy classification, priority calculation, squad dispatch, SLA management, and administrative overrides.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union
from sqlalchemy.orm import Session, joinedload

from app.models.ticket import Ticket
from app.models.department import Department
from app.models.team import MaintenanceTeam
from app.schemas.ticket import TicketCreate
from app.schemas.priority import PriorityOverrideRequest
from app.utils.code_generator import generate_unique_tracking_code
from app.services.priority_engine import (
    calculate_priority,
    PRIORITY_CRITICAL,
    PRIORITY_HIGH,
    PRIORITY_MEDIUM,
    PRIORITY_LOW,
)
from app.services.classifier import classify_ticket
from app.services.ai_triage_service import classify_and_triage_with_ai
from app.services.sla_engine import (
    calculate_sla_deadline,
    calculate_sla_remaining_seconds,
    is_sla_breached,
    get_sla_status,
)
from app.services.lifecycle import (
    STATUS_SUBMITTED,
    STATUS_ASSIGNED,
    STATUS_IN_PROGRESS,
    STATUS_ESCALATED,
    STATUS_ON_HOLD,
    STATUS_RESOLVED,
    validate_transition,
    format_audit_log_entry,
)

# Optional dispatch engine integration for automated team assignment
try:
    from app.services.dispatch_engine import select_optimal_team
except ImportError:
    select_optimal_team = None
```

### 1. Plain-English Purpose
Imports all subsystem engines and stitches them into a unified orchestrator: the database session, entity models, validation schemas, tracking code generator, priority engine, taxonomy classifier, AI triage pipeline, SLA calculator, and lifecycle state machine. It also gracefully imports the dispatch engine with an `ImportError` fallback.

### 2. Line-by-Line Breakdown
- **Lines 1–5 (`""" ... """`)**: Module docstring citing blueprints for ticket management, triage, and SLA integration.
- **Line 6 (`from datetime import datetime, timezone`)**: UTC temporal tools for stamping creation, resolution, and deadline times.
- **Line 7 (`from typing import Any, Dict, List, Optional, Union`)**: Python type hints. `Union[A, B]` allows a parameter to accept either type `A` or type `B`.
- **Line 8 (`from sqlalchemy.orm import Session, joinedload`)**: Database transaction session and eager join optimizer (`joinedload`).
- **Lines 10–12 (`from app.models...`)**: Database entity models (`Ticket`, `Department`, `MaintenanceTeam`).
- **Lines 13–14 (`from app.schemas...`)**: Pydantic input schemas (`TicketCreate`, `PriorityOverrideRequest`).
- **Line 15 (`from app.utils.code_generator import generate_unique_tracking_code`)**: CSPRNG tracking code generator.
- **Lines 16–22 (`from app.services.priority_engine import ...`)**: Priority calculation and priority tier string constants.
- **Line 23 (`from app.services.classifier import classify_ticket`)**: Deterministic keyword taxonomy classifier.
- **Line 24 (`from app.services.ai_triage_service import classify_and_triage_with_ai`)**: Dual-engine Generative AI and local triage engine.
- **Lines 25–30 (`from app.services.sla_engine import ...`)**: SLA deadline calculation and breach evaluation helpers.
- **Lines 31–40 (`from app.services.lifecycle import ...`)**: State constants, transition validator (`validate_transition`), and audit entry generator (`format_audit_log_entry`).
- **Lines 43–47 (`try: from app.services.dispatch_engine import select_optimal_team except ImportError: select_optimal_team = None`)**:
  - Defensive import: If the dispatch engine is being refactored or missing in lightweight test environments, the system sets `select_optimal_team = None` instead of crashing on startup.

### 3. Deep Term & Concept Expansion
- **The Orchestrator Pattern**: Rather than scattering business rules across 10 API route files, an orchestrator function acts as the "general contractor". It receives raw data, calls individual specialist services in sequence (Code Generator $\to$ AI Classifier $\to$ Priority Engine $\to$ Dispatch Engine $\to$ SLA Calculator), and persists the unified result into the database.

---

## Block 2: Master Ticket Creation Pipeline: `create_ticket` (Lines 49–153)

```python
def create_ticket(
    db: Session,
    ticket_in: Optional[Union[TicketCreate, str]] = None,
    tracking_code: Optional[str] = None,
    title: Optional[str] = None,
    description: Optional[str] = None,
    location: Optional[str] = None,
    priority: Optional[str] = None,
    department_id: Optional[int] = None,
    assigned_team_id: Optional[int] = None,
    created_at: Optional[datetime] = None,
    student_name: Optional[str] = None,
    student_email: Optional[str] = None,
) -> Ticket:
    """
    Ingest a new grievance ticket. Dynamically calculates classification and urgency priority
    if not explicitly passed, stamps SLA deadline, and persists to SQLite.
    
    Supports both:
    1. create_ticket(db, ticket_in=TicketCreate(...))
    2. create_ticket(db, tracking_code="...", title="...", description="...", location="...", ...)
    """
    # Handle polymorphic arguments
    if isinstance(ticket_in, TicketCreate):
        title = ticket_in.title
        description = ticket_in.description
        location = ticket_in.location
        if ticket_in.student_name:
            student_name = ticket_in.student_name
        if ticket_in.student_email:
            student_email = ticket_in.student_email
    elif isinstance(ticket_in, str) and tracking_code is None:
        # Legacy signature: create_ticket(db, tracking_code, title, ...)
        tracking_code = ticket_in

    now = created_at or datetime.now(timezone.utc)

    # 1. Collision-free tracking code
    final_code = tracking_code or generate_unique_tracking_code(db)

    # 2. Automated domain taxonomy classification & priority via AI (with cache & local fallback)
    final_priority = str(priority).upper() if priority else None
    ai_sla_hours = None

    if (department_id is None or not final_priority) and title and description:
        ai_triage = classify_and_triage_with_ai(title, description)
        if department_id is None:
            department_id = ai_triage.get("department_id")
        if not final_priority:
            final_priority = str(ai_triage.get("priority") or PRIORITY_MEDIUM).upper()
        ai_sla_hours = ai_triage.get("sla_hours")

    if not final_priority:
        final_priority = PRIORITY_MEDIUM

    if department_id is None and title and description:
        classification = classify_ticket(title, description)
        department_id = classification.get("department_id")

    # 4. Workload-balanced dispatch if available and unassigned
    if assigned_team_id is None and department_id is not None and select_optimal_team:
        try:
            team = select_optimal_team(
                db=db,
                department_id=department_id,
                priority=final_priority,
                location=location or ""
            )
            if team:
                assigned_team_id = team.id
        except Exception:
            assigned_team_id = None

    # 5. SLA Deadline calculation based on assigned priority (with dynamic AI custom_hours)
    calculated_deadline = calculate_sla_deadline(
        created_at=now,
        priority=final_priority,
        custom_hours=ai_sla_hours
    )

    db_ticket = Ticket(
        tracking_code=final_code,
        title=title or "Untitled Incident",
        description=description or "",
        location=location or "Campus",
        priority=final_priority,
        status=STATUS_SUBMITTED,
        department_id=department_id,
        assigned_team_id=assigned_team_id,
        created_at=now,
        sla_deadline=calculated_deadline,
        resolution_notes=None,
        student_name=student_name,
        student_email=student_email,
    )

    try:
        db.add(db_ticket)
        db.commit()
        db.refresh(db_ticket)
        return db_ticket
    except Exception:
        db.rollback()
        raise
```

### 1. Plain-English Purpose
The master entrypoint for receiving complaints. It accepts either modern Pydantic schemas or legacy arguments, generates an unguessable tracking code (`TICK-XXXX`), invokes the AI triage pipeline to identify the department and urgency level, dispatches the ticket to the least-loaded maintenance squad, computes the legal SLA deadline timestamp, and commits the newly formed ticket to SQL storage.

### 2. Line-by-Line Breakdown
- **Lines 49–62 (`def create_ticket(...) -> Ticket:`)**:
  - Accepts active database session `db` and flexible parameters.
- **Lines 72–83 (Polymorphic Argument Handling)**:
  - If `ticket_in` is a `TicketCreate` object, unpacks `title`, `description`, `location`, `student_name`, and `student_email`.
  - If `ticket_in` is a string, treats it as a legacy tracking code.
- **Line 84 (`now = created_at or datetime.now(timezone.utc)`)**:
  - Uses the passed timestamp or stamps the current UTC time.
- **Line 87 (`final_code = tracking_code or generate_unique_tracking_code(db)`)**:
  - Generates a guaranteed unique tracking code (e.g. `"TICK-7R4K"`).
- **Lines 90–100 (AI Triage Invocation)**:
  - If `department_id` or `final_priority` was not manually provided by an admin:
    - Calls `classify_and_triage_with_ai(title, description)`.
    - Populates `department_id`, `final_priority`, and custom `ai_sla_hours`.
- **Lines 101–107 (Heuristic Fallback)**:
  - If priority is still missing, defaults safely to `PRIORITY_MEDIUM`.
  - If department is still missing, runs local deterministic classifier `classify_ticket`.
- **Lines 109–121 (Autonomous Dispatch Engine Execution)**:
  - If `assigned_team_id` is empty, calls `select_optimal_team(...)`.
  - The dispatch engine balances squad queue depths, applies zone credits (Hostel vs Academic), and returns the optimal squad.
  - Wrapped in `try...except` so dispatch issues never abort complaint submission.
- **Lines 123–127 (SLA Deadline Calculation)**:
  - Calls `calculate_sla_deadline` using `now`, `final_priority`, and optional `ai_sla_hours`.
- **Lines 129–143 (ORM Entity Instantiation)**:
  - Builds the `Ticket` model with `status=STATUS_SUBMITTED`.
- **Lines 145–153 (Transactional Persistence)**:
  - `db.add(db_ticket); db.commit(); db.refresh(db_ticket)`: Commits row to database and refreshes auto-generated IDs. If an error occurs, `db.rollback()` executes safely.

### 3. Deep Term & Concept Expansion
- **Polymorphic Function Arguments (`isinstance(...)`)**: Similar to function overloading in C++, Python functions can inspect the types of incoming arguments at runtime. Supporting both Pydantic models (`TicketCreate`) and individual string arguments allows new API endpoints and legacy automated test suites to share the same service function without code duplication.

---

## Block 3: Supervisory Priority Override: `override_ticket_priority` (Lines 155–204)

```python
def override_ticket_priority(
    db: Session,
    ticket_id: int,
    override_data: PriorityOverrideRequest,
    actor: str = "Supervisor",
) -> Optional[Ticket]:
    """
    Administrative priority override by authorized facility supervisor.
    Validates ticket existence, updates priority, recalculates SLA deadline,
    and appends an immutable, tamper-evident audit note with timestamp.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        return None

    new_p = (
        override_data.new_priority.value
        if hasattr(override_data.new_priority, "value")
        else str(override_data.new_priority)
    ).upper()

    old_priority = ticket.priority
    ticket.priority = new_p

    # Recalculate SLA deadline using ticket creation time and new priority
    base_time = ticket.created_at
    if base_time and base_time.tzinfo is None:
        base_time = base_time.replace(tzinfo=timezone.utc)
    ticket.sla_deadline = calculate_sla_deadline(created_at=base_time, priority=new_p)

    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    audit_entry = (
        f"[{timestamp}] [PRIORITY OVERRIDE] Priority changed from {old_priority} to {new_p} "
        f"by {actor}. Reason: {override_data.override_reason.strip()}"
    )

    ticket.resolution_notes = (
        (ticket.resolution_notes + "\n" + audit_entry)
        if ticket.resolution_notes
        else audit_entry
    )

    try:
        db.commit()
        db.refresh(ticket)
        return ticket
    except Exception:
        db.rollback()
        raise
```

### 1. Plain-English Purpose
Allows a supervisor to adjust a ticket's priority. When changed, the system recalculates the SLA deadline starting from the ticket's original creation date, formats an indelible audit message recording the actor and explanation, and commits the transaction.

### 2. Line-by-Line Breakdown
- **Lines 166–168**: Looks up ticket by ID; returns `None` if not found.
- **Lines 170–177**: Extracts and cleans the new priority string (e.g. `"CRITICAL"`). Stores `old_priority`.
- **Lines 180–183 (SLA Recalculation)**:
  - Normalizes `ticket.created_at` to UTC.
  - Re-invokes `calculate_sla_deadline` with the new priority tier.
- **Lines 185–195 (Audit Inscription)**:
  - Constructs `audit_entry` formatted with timestamp, old/new priority, supervisor label, and reason.
  - Appends to `ticket.resolution_notes`.
- **Lines 197–203**: Commits transaction and returns the refreshed ticket.

---

## Block 4: Multi-Filter Ticket Listing: `list_tickets` (Lines 206–234)

```python
def list_tickets(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    priority: Optional[str] = None,
    department_id: Optional[int] = None,
    status: Optional[str] = None,
    student_email: Optional[str] = None,
    assigned_team_id: Optional[int] = None,
) -> List[Ticket]:
    """
    Query tickets with optional priority, department, status, student, and team filters.
    """
    query = db.query(Ticket).options(
        joinedload(Ticket.department),
        joinedload(Ticket.assigned_team),
    )
    if priority:
        query = query.filter(Ticket.priority == priority.strip().upper())
    if department_id is not None:
        query = query.filter(Ticket.department_id == department_id)
    if status:
        query = query.filter(Ticket.status == status.strip().upper())
    if student_email:
        query = query.filter(Ticket.student_email == student_email.strip().lower())
    if assigned_team_id is not None:
        query = query.filter(Ticket.assigned_team_id == assigned_team_id)
    return query.order_by(Ticket.created_at.desc()).offset(skip).limit(limit).all()
```

### 1. Plain-English Purpose
High-performance database query builder supporting multi-parameter filtering, pagination (`skip`, `limit`), reverse-chronological ordering (newest tickets first), and eager loading of departments and squads.

### 2. Line-by-Line Breakdown
- **Lines 219–222**: Prepares base query with `joinedload` on `Ticket.department` and `Ticket.assigned_team`, avoiding $N+1$ query overhead.
- **Lines 223–232 (Dynamic Filtering)**:
  - Dynamically chains SQL `WHERE` clauses for any supplied filter parameter.
- **Line 233**: Applies `.order_by(Ticket.created_at.desc())`, `.offset(skip)`, and `.limit(limit)` to fetch the page slice.

---

## Block 5: Student Feedback Submission: `submit_ticket_feedback` (Lines 236–280)

```python
def submit_ticket_feedback(
    db: Session,
    ticket_identifier: Union[int, str],
    rating: int,
    comments: Optional[str] = None,
    student_name: Optional[str] = None,
) -> Optional[Ticket]:
    """
    Records student satisfaction rating (1-5) and feedback review upon resolution.
    Appends audit trail entry into ticket notes.
    """
    if isinstance(ticket_identifier, int) or (isinstance(ticket_identifier, str) and ticket_identifier.isdigit()):
        ticket = db.query(Ticket).filter(Ticket.id == int(ticket_identifier)).first()
    else:
        ticket = db.query(Ticket).filter(Ticket.tracking_code == str(ticket_identifier).strip().upper()).first()

    if not ticket:
        return None

    ticket.feedback_rating = rating
    ticket.feedback_comments = comments
    ticket.feedback_submitted_at = datetime.now(timezone.utc)
    if student_name and (not ticket.student_name or ticket.student_name == "Anonymous"):
        ticket.student_name = student_name

    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    feedback_audit = (
        f"[{timestamp}] [STUDENT FEEDBACK] Rating: {rating}/5 Stars | "
        f"Review: {comments or 'No written comments'} (Submitted by: {student_name or ticket.student_name or 'Student'})"
    )
    ticket.resolution_notes = (
        (ticket.resolution_notes + "\n" + feedback_audit)
        if ticket.resolution_notes
        else feedback_audit
    )

    try:
        db.commit()
        db.refresh(ticket)
        return ticket
    except Exception:
        db.rollback()
        raise
```

### 1. Plain-English Purpose
Allows students to submit 1-to-5 star satisfaction ratings and review comments after an incident is fixed. Identifies tickets polymorphically by integer ID or alphanumeric tracking code, saves rating columns, and appends a student feedback note to `resolution_notes`.

### 2. Line-by-Line Breakdown
- **Lines 247–250 (Polymorphic Identifier Lookup)**:
  - If the identifier is an integer or digit string (e.g. `"42"`), queries by primary key `Ticket.id`.
  - Otherwise, queries by tracking code `Ticket.tracking_code == "TICK-..."`.
- **Lines 255–260**: Sets `feedback_rating`, `feedback_comments`, and `feedback_submitted_at`.
- **Lines 261–270**: Appends formatted feedback audit entry to `resolution_notes`.
- **Lines 272–278**: Commits and refreshes the database entity.

---

## Block 6: Lifecycle State Progression: `update_ticket_status` (Lines 282–320)

```python
def update_ticket_status(
    db: Session,
    ticket_id: int,
    new_status: str,
    staff_notes: Optional[str] = None,
    actor: str = "Staff",
) -> Optional[Ticket]:
    """
    Advance ticket lifecycle status with state machine transition validation and audit trail.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        return None

    target = new_status.strip().upper()
    validate_transition(current_status=ticket.status, target_status=target, notes=staff_notes)

    audit_entry = format_audit_log_entry(
        previous_status=ticket.status,
        new_status=target,
        actor=actor,
        notes=staff_notes,
    )

    ticket.status = target
    ticket.resolution_notes = (
        (ticket.resolution_notes + "\n" + audit_entry)
        if ticket.resolution_notes
        else audit_entry
    )

    try:
        db.commit()
        db.refresh(ticket)
        return ticket
    except Exception:
        db.rollback()
        raise
```

### 1. Plain-English Purpose
Advances a ticket's status through the finite state machine. Runs `validate_transition` to ensure the transition is legally allowed, creates a formatted audit entry with `format_audit_log_entry`, appends it to `resolution_notes`, and saves the update.

### 2. Line-by-Line Breakdown
- **Line 297 (`validate_transition(...)`)**: Rejects illegal transitions (e.g. `CLOSED` $\to$ `IN_PROGRESS`) with domain exceptions.
- **Lines 299–304 (`format_audit_log_entry(...)`)**: Creates standardized transition log string.
- **Line 306 (`ticket.status = target`)**: Updates ticket status.
- **Lines 313–319**: Commits transaction.

---

## Block 7: Incident Resolution & SLA Compliance: `resolve_ticket` (Lines 322–374)

```python
def resolve_ticket(
    db: Session,
    ticket_id: int,
    resolution_notes: str,
    parts_replaced: Optional[str] = None,
    technician: Optional[str] = None,
) -> Optional[Ticket]:
    """
    Formally resolve a ticket, validating substantive closure notes and recording SLA compliance.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        return None

    validate_transition(
        current_status=ticket.status,
        target_status=STATUS_RESOLVED,
        notes=resolution_notes,
    )

    now = datetime.now(timezone.utc)
    ticket.resolved_at = now
    ticket.status = STATUS_RESOLVED

    # Evaluate if SLA was met or breached upon resolution
    is_met = True
    if ticket.sla_deadline:
        deadline = ticket.sla_deadline
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        is_met = now <= deadline

    closure_report = (
        f"[CLOSURE REPORT: {now.isoformat()} | Technician: {technician or 'Unassigned'} | SLA Met: {is_met}]\n"
        f"Work Summary: {resolution_notes.strip()}\n"
        f"Parts Replaced: {parts_replaced.strip() if parts_replaced else 'None'}"
    )

    ticket.resolution_notes = (
        (ticket.resolution_notes + "\n" + closure_report)
        if ticket.resolution_notes
        else closure_report
    )

    try:
        db.commit()
        db.refresh(ticket)
        return ticket
    except Exception:
        db.rollback()
        raise
```

### 1. Plain-English Purpose
Formally resolves an issue. Enforces $\ge 10$ character repair notes, records `resolved_at = now`, evaluates whether the fix beat the SLA deadline (`is_met = now <= deadline`), logs replaced parts, and transitions status to `RESOLVED`.

### 2. Line-by-Line Breakdown
- **Lines 336–340**: Runs `validate_transition`, enforcing mandatory documentation.
- **Lines 342–344**: Sets `ticket.resolved_at` and `ticket.status = "RESOLVED"`.
- **Lines 347–353 (SLA Compliance Check)**:
  - Compares resolution time `now` against `deadline`. Sets `is_met = (now <= deadline)`.
- **Lines 355–359 (Closure Report Compilation)**:
  - Compiles structured closure report containing technician name, SLA outcome, work summary, and parts replaced.
- **Lines 366–373**: Commits to SQL database.

---

## Block 8: Supervisory Ticket Escalation: `escalate_ticket` (Lines 375–415)

```python
def escalate_ticket(
    db: Session,
    ticket_id: int,
    reason: str,
    supervisor_id: Optional[str] = None,
) -> Optional[Ticket]:
    """
    Elevate a high-risk or stagnant complaint to ESCALATED with documented justification.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        return None

    validate_transition(
        current_status=ticket.status,
        target_status=STATUS_ESCALATED,
        notes=reason,
    )

    now = datetime.now(timezone.utc)
    ticket.status = STATUS_ESCALATED

    audit_entry = (
        f"[ESCALATION: {now.isoformat()} | Supervisor: {supervisor_id or 'Staff'} | "
        f"Reason: {reason.strip()}]"
    )

    ticket.resolution_notes = (
        (ticket.resolution_notes + "\n" + audit_entry)
        if ticket.resolution_notes
        else audit_entry
    )

    try:
        db.commit()
        db.refresh(ticket)
        return ticket
    except Exception:
        db.rollback()
        raise
```

### 1. Plain-English Purpose
Escalates a stalled or high-risk ticket for supervisory oversight. Verifies the transition, updates status to `ESCALATED`, and inscribes the supervisor's identity and justification.

### 2. Line-by-Line Breakdown
- **Lines 388–392**: Validates transition into `STATUS_ESCALATED`.
- **Line 395**: Changes status to `ESCALATED`.
- **Lines 397–406**: Inscribes timestamped escalation audit entry into `resolution_notes` and commits.

---

## Block 9: Active SLA Breach Radar: `get_active_sla_breaches` (Lines 417–472)

```python
def get_active_sla_breaches(
    db: Session,
    threshold_ratio: float = 0.20,
) -> List[Dict[str, Any]]:
    """
    Query all open, active tickets and return those breached or nearing deadline breach.
    """
    active_statuses = [STATUS_SUBMITTED, STATUS_ASSIGNED, STATUS_IN_PROGRESS, STATUS_ESCALATED, STATUS_ON_HOLD]
    tickets = (
        db.query(Ticket)
        .options(
            joinedload(Ticket.department),
            joinedload(Ticket.assigned_team),
        )
        .filter(Ticket.status.in_(active_statuses))
        .filter(Ticket.sla_deadline != None)
        .all()
    )

    now = datetime.now(timezone.utc)
    results: List[Dict[str, Any]] = []

    for ticket in tickets:
        sla_info = get_sla_status(
            sla_deadline=ticket.sla_deadline,
            priority=ticket.priority,
            current_time=now,
            warning_threshold_ratio=threshold_ratio,
        )

        if sla_info["status"] in ("BREACHED", "WARNING"):
            dept_name = ticket.department.name if ticket.department else None
            team_name = ticket.assigned_team.name if ticket.assigned_team else None
            results.append({
                "ticket_id": ticket.id,
                "tracking_code": ticket.tracking_code,
                "title": ticket.title,
                "location": ticket.location,
                "department_name": dept_name,
                "assigned_team_name": team_name,
                "priority": ticket.priority,
                "sla_deadline": ticket.sla_deadline,
                "remaining_seconds": sla_info["remaining_seconds"],
                "overdue_seconds": sla_info["overdue_seconds"],
                "is_breached": sla_info["is_breached"],
                "status": ticket.status,
            })

    results.sort(
        key=lambda item: (
            0 if item["is_breached"] else 1,
            -item["overdue_seconds"] if item["is_breached"] else item["remaining_seconds"],
        )
    )

    return results
```

### 1. Plain-English Purpose
The data engine for campus-wide breach warnings. It fetches all active, unresolved complaints with SLA deadlines, computes each ticket's current temporal health (`get_sla_status`), and filters for tickets that are either already breached or nearing breach ($\le 20\%$ time left). It sorts the results so that overdue breaches appear at the very top, ordered by most overdue.

### 2. Line-by-Line Breakdown
- **Lines 424–434**: Queries open tickets (`status IN ('SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'ESCALATED', 'ON_HOLD')`) where `sla_deadline IS NOT NULL`. Uses `joinedload` on departments and teams.
- **Lines 439–464 (Telemetry Loop)**:
  - Evaluates each ticket using `get_sla_status(...)`.
  - If `status in ("BREACHED", "WARNING")`, packages essential ticket metadata into `results`.
- **Lines 465–470 (Two-Tier Priority Sort)**:
  - Sorts using a composite lambda key:
    1. `0 if is_breached else 1`: Guarantees active breaches (`is_breached=True`) appear before approaching warnings (`is_breached=False`).
    2. `-item["overdue_seconds"] if is_breached else item["remaining_seconds"]`: Among breached tickets, sorts descending by overdue duration (most overdue first). Among warnings, sorts ascending by remaining time (most imminent deadline first).
- **Line 472 (`return results`)**: Returns the sorted breach radar list.

---

## 10. Viva & Technical Defense Guide

> [!TIP]
> **Q1: What architectural design pattern does `ticket_service.py` represent in this project?**  
> **Answer**: It represents the **Domain Orchestration Service Pattern**. Instead of allowing HTTP controllers or database models to manage business workflows directly, `ticket_service.py` acts as a centralized orchestrator. It coordinates independent subsystems (Code Generation, AI Classification, Queue Dispatch, SLA Deadline Calculation, and Finite State Machine verification) into clean transactional workflows.

> [!TIP]
> **Q2: In `create_ticket`, what happens if the automated dispatch engine fails or is unavailable?**  
> **Answer**: The dispatch invocation is wrapped in a defensive `try...except` block:
> ```python
> try:
>     team = select_optimal_team(...)
>     if team: assigned_team_id = team.id
> except Exception:
>     assigned_team_id = None
> ```
> If the dispatch engine encounters an error or finds no active squads, `assigned_team_id` gracefully defaults to `None`. The complaint is still created and committed with `status="SUBMITTED"`, allowing facility supervisors to manually assign it on the dashboard without interrupting student submissions.

> [!TIP]
> **Q3: What happens to the SLA timer when a ticket is marked `RESOLVED`?**  
> **Answer**: The system captures `now = datetime.now(timezone.utc)` and permanently stamps it into `ticket.resolved_at`. It compares `now <= ticket.sla_deadline` to evaluate SLA compliance (`is_met`). Once stamped, future SLA queries evaluate whether the resolution occurred before the deadline, freezing the SLA calculation so passing days never turn a resolved ticket into an overdue breach.

> [!TIP]
> **Q4: How does `get_active_sla_breaches` sort tickets on the operations dashboard?**  
> **Answer**: It uses a two-tier composite sorting lambda:
> `(0 if item["is_breached"] else 1, -item["overdue_seconds"] if item["is_breached"] else item["remaining_seconds"])`  
> Breached tickets are assigned tier 0 and sorted by `-overdue_seconds`, putting the most severely overdue incident at the very top of the list. Warning tickets are assigned tier 1 and sorted by `remaining_seconds`, putting tickets with the least remaining time right below the breaches.

---

## 11. Quick-Reference Viva Summary Table

| Concept / Keyword | Meaning in Basic C / Python | Role in `ticket_service.py` |
| :--- | :--- | :--- |
| `create_ticket` | Master intake function | Orchestrates tracking code, AI triage, dispatch, and SLA deadline. |
| `override_ticket_priority` | Admin adjustment function | Modifies priority, recalculates SLA deadline, and logs audit justification. |
| `list_tickets` | Paged query builder | Filters complaints by status, priority, department, or student email. |
| `submit_ticket_feedback` | Rating recorder | Stores 1-5 star ratings and reviews by ID or tracking code. |
| `update_ticket_status` | FSM state advancer | Enforces legal transitions and logs transition audit entries. |
| `resolve_ticket` | Incident closing function | Stamps `resolved_at`, checks SLA compliance, and captures repair notes. |
| `escalate_ticket` | Management alert action | Moves ticket to `ESCALATED` with documented justification. |
| `get_active_sla_breaches` | Breach radar query | Fetches open tickets exceeding or nearing SLA deadlines with two-tier sorting. |
| `joinedload(...)` | Single SQL `LEFT JOIN` | Pre-fetches related departments and squads to eliminate $N+1$ query delays. |
| `is_met = now <= deadline` | SLA compliance check | Freezes on-time performance evaluation upon ticket resolution. |
