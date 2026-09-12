# Module M4 - Backend File 03: Squad & Workload Query Service
## Target File: `backend/app/services/team_service.py`
### Execution Track: Phase 1 (Can be built in parallel with Files 01 and 02)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In Field Service Management (FSM) systems, enterprise workforce automation, and resource planning architectures, `team_service.py` defines the **Workforce Management & Telemetry Service Layer**. It encapsulates all database read and write operations related to operational workgroups: querying active technician squads, computing real-time queue depth aggregations, managing on-duty shift availability states, and preparing clean telemetry data for administrative dashboards.

### Standard Industry Role & Real-World Use Cases
In professional production systems (such as ServiceNow FSM, PagerDuty schedules, and Jira Service Management teams), team service files standardly fulfill four core architectural duties:

1. **Workforce Telemetry & Queue Aggregation:**
   * Aggregates active workload statistics across operational squads using optimized database queries.
   * Categorizes squads into standardized workload status bands (e.g. `LOW`, `NORMAL`, `HIGH`, `AT_CAPACITY`), allowing automated dispatch algorithms and human supervisors to assess resource saturation at a glance.
2. **Shift & Availability Lifecycle Governance:**
   * Manages technician availability states (`is_active`).
   * When squads conclude their shifts or go off-duty for safety training, the service toggles their availability atomically in persistent storage, preventing automated dispatch engines from routing tickets to inactive crews.
3. **Decoupling Resource Queries from HTTP Controllers:**
   * Isolates raw SQLAlchemy queries, relational joins, and group-by calculations away from API route controllers.
   * This separation ensures that squad querying logic can be reused across REST endpoints, background queue workers, and CLI diagnostics without code duplication.
4. **Enforcing Referential Integrity During Assignment:**
   * Acts as the authoritative lookup gate for squad existence: verifying that target squads exist in the database and belong to the correct department before permitting reassignments or dispatch updates.

### What WE Are Specifically Using It For in Smart Complaint Handler
In our campus complaint automation platform, our 5-student engineering team specifically uses `backend/app/services/team_service.py` for four concrete operational functions:

1. **Querying Active Squads by Department (`get_active_teams_for_department`):**
   * Supplies the candidate squad pool to the dispatch engine (`dispatch_engine.py`) during complaint intake.
   * Filters by `department_id` and strictly enforces `is_active == True`, guaranteeing that only on-duty campus squads receive work orders.
2. **Computing Real-Time Squad Workload Telemetry (`get_all_teams_with_workload`):**
   * Powers the frontend React squad workload panel (`TeamWorkloadView.jsx`).
   * Queries all 12 campus maintenance squads, counts open complaints (`ASSIGNED` and `IN_PROGRESS`) in SQLite for each squad, and attaches an active workload status band (`LOW`, `NORMAL`, `HIGH`, `AT_CAPACITY`).
3. **Managing Squad Shift Availability (`toggle_team_availability`):**
   * Allows facility managers or team leads to toggle a squad's on-duty status (`is_active = True/False`) with a single click in the admin dashboard.
   * Automatically commits the status change to `smart_complaints.db` and refreshes the entity.
4. **Verifying Squad Existence by ID (`get_team_by_id`):**
   * Queries SQLite by primary key `id`, ensuring that manual supervisor reassignment requests target real, existing maintenance squads.

### Future AI Integration & Workforce Telemetry Hook (V2 Roadmap)
While Version 1 uses this service for real-time ticket counting, its architecture prepares the data foundation for future AI dispatch:
* **AI Telemetry Feeder:** In V2, machine learning models will consume metrics from this service (such as active ticket queues, shift patterns, and historical team completion times) to predict team fatigue and estimate dynamic task completion times.
* **Preserving Human Supervisory Controls:** The `toggle_team_availability()` function remains the permanent operational lever: if an AI dispatch model attempts to assign tasks to a crew that cannot work, the human manager toggles the squad inactive, and the system automatically redistributes the workload.
* **Stable Interface:** Because `get_all_teams_with_workload()` returns structured telemetry, adding predictive AI analytics in V2 will not require altering the function signature or database schema.

### How Other Components Standardly Interact with This File
Across the backend architecture, this service is consumed cleanly:
* **The Dispatch Engine (`backend/app/services/dispatch_engine.py`):** Calls `get_active_teams_for_department(db, department_id)` to retrieve eligible candidate squads.
* **The Assignment Endpoints (`backend/app/api/v1/endpoints/assignment.py`):** Calls `get_all_teams_with_workload(db)` to serve HTTP `GET /api/v1/teams/workloads`, and calls `toggle_team_availability()` to serve HTTP `PATCH /api/v1/teams/{id}/availability`.
* **The Ticket Service (`backend/app/services/ticket_service.py`):** Calls `get_team_by_id()` to validate target squads during supervisor reassignments.

### The Core Problem It Solves & Why It Exists
* **The Inactive Squad Dispatch Trap:** Without an authoritative availability service, complaints get routed to squads whose technicians have gone home for the night, stranding emergency repairs until morning.
* **N+1 Database Query Performance Killers:** In unmanaged architectures, querying squad workloads often results in dozens of individual database roundtrips. This service centralizes aggregation queries to maintain sub-millisecond response times.
* **Controller Bloat:** Keeps API endpoints thin and declarative by encapsulating all database query logic inside clean, testable Python functions.

---

# 2. What Must Be in This File & Why Each Item Is Needed

To be complete, production-grade, and fully functional, `backend/app/services/team_service.py` must define, configure, and export the following four essential service functions:

---

### Item 1: Active Squad Query by Department (`get_active_teams_for_department`)
* **What it is:** A query function retrieving all active squads belonging to a specific department.
* **Signature:** `get_active_teams_for_department(db: Session, department_id: int) -> list[Team]`
* **Query Logic:** `db.query(Team).filter(Team.department_id == department_id, Team.is_active == True).order_by(Team.id.asc()).all()`
* **Why it is needed:**
  * Serves as the primary candidate generator for the automated dispatch engine.
  * Filters out inactive squads and orders results deterministically by primary key `id`.

---

### Item 2: Comprehensive Workload Telemetry Aggregator (`get_all_teams_with_workload`)
* **What it is:** A service function that queries teams, counts active tickets, and calculates workload status bands.
* **Signature:** `get_all_teams_with_workload(db: Session, department_id: Optional[int] = None) -> list[dict]`
* **Internal Execution Sequence:**
  1. Construct base query: `query = db.query(Team).join(Department)`
  2. If `department_id` is provided, filter: `query = query.filter(Team.department_id == department_id)`
  3. Fetch teams: `teams = query.order_by(Team.department_id.asc(), Team.id.asc()).all()`
  4. For each team:
     * Count unresolved tickets in SQLite:
       `active_count = db.query(func.count(Ticket.id)).filter(Ticket.assigned_team == team.name, Ticket.status.in_(["ASSIGNED", "IN_PROGRESS"])).scalar() or 0`
     * Determine workload status band:
       * If `active_count <= 2`: `"LOW"`
       * Else if `active_count <= 5`: `"NORMAL"`
       * Else if `active_count <= 8`: `"HIGH"`
       * Else: `"AT_CAPACITY"`
     * Assemble telemetry dictionary conforming to `TeamWorkloadResponse`.
  5. Return list of serialized telemetry dictionaries.
* **Why it is needed:**
  * Delivers complete workload telemetry to the frontend React dashboard with zero missing fields.

---

### Item 3: Squad Lookup by Primary Key (`get_team_by_id`)
* **What it is:** A simple query retrieving a squad entity by its unique ID.
* **Signature:** `get_team_by_id(db: Session, team_id: int) -> Optional[Team]`
* **Query Logic:** `db.query(Team).filter(Team.id == team_id).first()`
* **Why it is needed:**
  * Validates whether a target squad exists in SQLite before executing administrative reassignments.
  * Returns `None` if the squad ID does not exist, enabling the endpoint to return a clean HTTP 404.

---

### Item 4: Squad Shift Availability Toggle (`toggle_team_availability`)
* **What it is:** A service function updating a squad's on-duty status.
* **Signature:** `toggle_team_availability(db: Session, team_id: int, is_active: bool) -> Optional[Team]`
* **Internal Execution Sequence:**
  1. Fetch team: `team = get_team_by_id(db, team_id)`
  2. If `team is None`, return `None`.
  3. Update attribute: `team.is_active = is_active`
  4. Commit and refresh: `db.commit()`, `db.refresh(team)`
  5. Return updated `team` instance.
* **Why it is needed:**
  * Empowers supervisors to toggle crew shifts on or off dynamically without modifying database records manually.

---

# 3. Component Life-Cycle: Input, Process, Output (IPO Table)

The following table documents the complete data life-cycle for `backend/app/services/team_service.py`:

| Service Function | Input Received | Database Query & Business Processing | Output Produced | Error Handling & Safeguards |
| :--- | :--- | :--- | :--- | :--- |
| `get_active_teams_for_department` | `db: Session`, `department_id: int` | Queries `teams` where `department_id == ?` and `is_active == 1`. | List of active `Team` ORM entities. | Returns empty list `[]` if no teams are active or department has no squads. |
| `get_all_teams_with_workload` | `db: Session`, optional `department_id` | 1. Queries teams joined with departments.<br>2. Executes SQL `COUNT()` for active tickets per squad.<br>3. Computes workload band (`LOW` to `AT_CAPACITY`). | List of dictionaries ready for Pydantic `TeamWorkloadResponse` validation. | Traps `None` count scalars to `0`; handles zero-squad edge cases cleanly. |
| `get_team_by_id` | `db: Session`, `team_id: int` | Indexed primary key query: `SELECT * FROM teams WHERE id = ?`. | Single `Team` ORM entity or `None`. | Returns `None` if ID does not exist; logarithmic $O(\log N)$ lookup speed. |
| `toggle_team_availability` | `db: Session`, `team_id: int`, `is_active: bool` | 1. Finds squad by ID.<br>2. Sets `team.is_active`.<br>3. Commits transaction to SQLite. | Updated `Team` entity. | Returns `None` if squad missing; executes `db.rollback()` if disk commit fails. |

---

# 4. Flexibility & Modification Guide: What Can Be Changed vs. Strict Non-Negotiables

To preserve database consistency across teammates' components, follow these operational rules:

### 🟢 Safe to Modify (Configurable Parameters)
* **Workload Band Thresholds:** You can adjust the numeric boundaries for `LOW`, `NORMAL`, `HIGH`, and `AT_CAPACITY` in `get_all_teams_with_workload()` to match campus staffing policies.
* **Sorting Orders:** You can adjust the sorting criteria (e.g. sorting squads alphabetically by name rather than by ID).
* **Additional Query Filters:** You can add supplementary query filters (e.g. filtering squads by campus zone or building type if added in future versions).
* **Logging Statements:** You can add standard Python `logging.info()` statements to record shift toggles in server logs.

### 🔴 Strict Non-Negotiables (System Breaking Changes)
* **DO NOT Omit `is_active == True` in `get_active_teams_for_department`:** Returning inactive squads breaks the core contract expected by the dispatch engine.
* **DO NOT Skip `db.commit()` in `toggle_team_availability`:** Failing to commit leaves the status change in temporary memory, reverting as soon as the database session closes.
* **DO NOT Return Raw Tuples Without Dictionary Keys:** `get_all_teams_with_workload()` must return structured dictionaries with exact keys (`team_id`, `team_name`, `active_ticket_count`, etc.) to guarantee Pydantic validation succeeds.
* **DO NOT Import FastAPI or HTTP Request Objects Here:** The service layer must remain pure Python to support headless CLI testing and background queue workers.

---

# 5. Architectural & Theoretical References

This specification operates strictly as an **implementation and integration blueprint**. For the exhaustive computer science fundamentals, language runtime mechanics, and protocol specifications governing this component, consult the following authoritative manuals in the **Developer Guide Suite**:

* [**Guide 05: SQLAlchemy 2.0 ORM & Relational Architecture**](../../../developer_guide/05_SQLALCHEMY_ORM_AND_DATA_LAYER.md)  
  Unit of Work transaction management (`db.commit()`, `db.rollback()`), query execution, and entity hydration.

* [**Guide 02: FastAPI & Modern ASGI Web Architecture**](../../../developer_guide/02_FASTAPI_ASGI_WEB_ARCHITECTURE.md)  
  Service layer decoupling, dependency injection wiring, and custom exception hierarchies.

* [**Unit 03B: SQL Relational Language & Query Mechanics**](../../../developer_guide/03B_SQL_RELATIONAL_LANGUAGE_AND_QUERY_MECHANICS.md)  
  Atomic transaction isolation, ACID guarantees, and declarative relational queries.

---

# 6. Definition of Done: Observable Verification Checklist

Before considering `backend/app/services/team_service.py` complete, verify each of the following operational checkpoints:

### Implementation Checklist
- [ ] File exists at `backend/app/services/team_service.py`.
- [ ] Defines `get_active_teams_for_department(db, department_id)` filtering strictly for `is_active == True`.
- [ ] Defines `get_all_teams_with_workload(db, department_id=None)` returning structured dictionaries with active ticket counts and status bands.
- [ ] Defines `get_team_by_id(db, team_id)` executing indexed primary key lookup.
- [ ] Defines `toggle_team_availability(db, team_id, is_active)` executing atomic commit and refresh.
- [ ] Uses database-level SQL `func.count()` aggregation for counting tickets.
- [ ] Contains zero FastAPI HTTP-specific imports (`Request`, `HTTPException`).
- [ ] Contains zero triple-backtick code blocks.

### Terminal Verification Commands (Run in PowerShell from Project Root)

1. **Verify Active Teams Query for Electrical Department (Dept 1):**
   `python -c "from app.db.session import SessionLocal; from app.services.team_service import get_active_teams_for_department; db = SessionLocal(); teams = get_active_teams_for_department(db, department_id=1); assert len(teams) > 0; assert all(t.is_active for t in teams); print('Active teams for Dept 1:', [t.name for t in teams]); db.close()"`

2. **Verify Workload Telemetry Aggregation for All 12 Squads:**
   `python -c "from app.db.session import SessionLocal; from app.services.team_service import get_all_teams_with_workload; db = SessionLocal(); workloads = get_all_teams_with_workload(db); assert len(workloads) == 12; first = workloads[0]; assert 'team_name' in first; assert 'active_ticket_count' in first; assert 'workload_status' in first; print('Squad workloads verified! Sample squad:', first['team_name'], 'Active count:', first['active_ticket_count'], 'Status:', first['workload_status']); db.close()"`

3. **Verify Squad Lookup by Primary Key:**
   `python -c "from app.db.session import SessionLocal; from app.services.team_service import get_team_by_id; db = SessionLocal(); t = get_team_by_id(db, team_id=1); assert t is not None; assert t.id == 1; print('Team lookup verified:', t.name); db.close()"`

4. **Verify Shift Availability Toggle (Atomic Commit & Rollback Test):**
   `python -c "from app.db.session import SessionLocal; from app.services.team_service import toggle_team_availability, get_team_by_id; db = SessionLocal(); updated = toggle_team_availability(db, team_id=1, is_active=False); assert updated.is_active is False; restored = toggle_team_availability(db, team_id=1, is_active=True); assert restored.is_active is True; print('Shift availability toggle verified cleanly on team 1!'); db.close()"`
