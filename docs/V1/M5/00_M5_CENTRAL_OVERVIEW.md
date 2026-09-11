# Module M5: Central SLA Tracking & Lifecycle Execution Roadmap
## Service Level Agreements, Escalation Automata, Dynamic Timers & Resolution Gateways

> **Module Role & Architectural Boundary:**  
> Module M5 establishes the operational governance and time-commitment core of the **Smart Complaint Routing & Workflow Automation Platform** (`SmartComplaintHandler`).  
> On the **Backend**, it transforms raw database records into time-governed service commitments: calculating deterministic resolution deadlines (`sla_deadline`) from calculated priority levels (`CRITICAL` = 4h, `HIGH` = 12h, `MEDIUM` = 24h, `LOW` = 72h), enforcing a strict finite state machine (`SUBMITTED` ➔ `IN_PROGRESS` ➔ `RESOLVED`), monitoring active breach statuses, and enforcing mandatory closure documentation in `resolution_notes`.  
> On the **Frontend**, it provides the dedicated SLA network client, dynamic color-shifting countdown timer pills (`SLACountdownTimer.jsx`), a staff resolution modal requiring structured closure reports (`ResolutionNotesModal.jsx`), and a supervisor escalation workstation (`SLABreachTable.jsx`).

---

# 1. System Overview: Full-Stack SLA & Lifecycle State Pipeline

Module M5 binds all preceding modules (M1 Storage, M2 Ingestion, M3 Triage, M4 Dispatch) into a closed-loop operational workflow:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                              FRONTEND SUBSYSTEM (React 18 + Vite)                                      │
│                                                                                                                        │
│  [ LIVE COUNTDOWN & STATUS TRACKING ]                                                                                  │
│  File 02: SLA Countdown Timer (`SLACountdownTimer.jsx`)                                                                │
│  - Mounts in Ticket Tracker (`TrackTicket.jsx`) and Admin Dashboard (`AdminDashboard.jsx`)                            │
│  - Real-time 1000ms tick calculating remaining time until `sla_deadline`                                               │
│  - Dynamic color transitions: Emerald (>4h) ➔ Sky (1-4h) ➔ Pulsing Amber (<1h) ➔ Pulsing Red (BREACHED / Overdue)    │
│                                         │                                                                              │
│                                         ▼                                                                              │
│  [ SUPERVISORY BREACH OVERSIGHT ]                                                                                      │
│  File 04: SLA Breach Escalation Panel (`SLABreachTable.jsx`)                                                           │
│  - Filters active tickets approaching deadline (<20% time) or past deadline                                            │
│  - Displays squad responsible, elapsed breach duration, and Quick-Action Escalation button                             │
│                                         │                                                                              │
│                                         ▼                                                                              │
│  [ DUAL-SIDED RESOLUTION WORKFLOW ]                                                                                    │
│  File 03: Staff Resolution Modal (`ResolutionNotesModal.jsx`)                                                          │
│  - Triggered by maintenance staff upon completing physical repairs                                                     │
│  - Enforces mandatory 10-character closure notes (parts replaced, tests run)                                           │
│  - Transitions ticket to `RESOLVED`, permanently recording resolution timestamp & audit log                            │
│                                         │                                                                              │
│                                         ▼                                                                              │
│  [ NETWORK TRANSPORT CLIENT ]                                                                                          │
│  File 01: SLA API Client (`src/api/sla.js`)                                                                            │
│  - Dispatches `PATCH /tickets/{id}/status`, `POST /tickets/{id}/resolve`, `GET /tickets/breaches/active`               │
└─────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────┘
                                          │
                        HTTP REST Network │ Proxy Bridge (/api/v1)
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                BACKEND SUBSYSTEM (FastAPI + ASGI)                                      │
│                                                                                                                        │
│  [ STAGE 1: AUTOMATED DEADLINE STAMPING ]                                                                              │
│  File 01: SLA Engine (`services/sla_engine.py`)                                                                        │
│  - Computes `sla_deadline = created_at + SLA_POLICY[priority]` during ingestion                                        │
│  - Calculates real-time status: `ON_TRACK`, `APPROACHING_BREACH`, or `BREACHED`                                        │
│                                         │                                                                              │
│                                         ▼                                                                              │
│  [ STAGE 2: FINITE STATE AUTOMATA ENFORCEMENT ]                                                                        │
│  File 02: Lifecycle State Machine (`services/lifecycle.py`)                                                            │
│  - Validates legal transitions:                                                                                        │
│      [ SUBMITTED ] ──────────> [ IN_PROGRESS ] ──────────> [ RESOLVED ] ──────────> [ CLOSED ]                         │
│           │                          │                                                                                 │
│           ▼                          ▼                                                                                 │
│      [ CANCELLED ]              [ ESCALATED ] ───────────> [ RESOLVED ]                                                │
│  - Rejects illegal shortcuts (e.g. `SUBMITTED` directly to `RESOLVED` throws HTTP 400)                                │
│                                         │                                                                              │
│                                         ▼                                                                              │
│  [ STAGE 3: TRANSACTIONAL SERVICE INTEGRATION ]                                                                        │
│  File 04: Service Integration (`ticket_service.py` Upgrade) & File 03: Schemas (`schemas/sla.py`)                    │
│  - Updates status in SQLite, appends timestamped audit trace to `resolution_notes`                                     │
│  - `resolve_ticket()` stamps `resolved_at = datetime.utcnow()` and evaluates on-time vs breached                       │
│                                         │                                                                              │
│                                         ▼                                                                              │
│  [ STAGE 4: REST PRESENTATION CONTROLLERS ]                                                                            │
│  File 05: SLA Endpoints (`endpoints/sla.py`) & File 06: Router (`api/v1/router.py`)                                    │
│  - Exposes `PATCH /tickets/{id}/status`, `POST /tickets/{id}/resolve`, `GET /tickets/breaches/active`                  │
└─────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
                         ┌─────────────────────────────────┐
                         │       SQLite Disk Storage       │
                         │      (smart_complaints.db)      │
                         │   `sla_deadline`, `resolved_at` │
                         │       `resolution_notes`        │
                         └─────────────────────────────────┘
```

---

# 2. Formal SLA Policy & Severity Commitment Matrix

In enterprise facilities management, an SLA defines the guaranteed turnaround time between ticket ingestion and physical resolution. Our platform enforces strict tiered deadlines derived from the calculated priority (Module M3):

| Priority Level | Guaranteed SLA Target | Operational Justification & Response Expectations | Breach Risk Threshold (<20%) |
| :--- | :--- | :--- | :--- |
| **`CRITICAL`** | **4 Hours** | Immediate physical hazard to life safety or structural integrity (e.g. electrical sparking, active water main break, gas odor). Field squad dispatched within 15 minutes. | Warning at **48 minutes** remaining |
| **`HIGH`** | **12 Hours** | Major operational disruption impairing student living conditions (e.g. hostel block Wi-Fi outage, broken corridor security door lock, elevator failure). | Warning at **2.4 hours** remaining |
| **`MEDIUM`** | **24 Hours** | Routine maintenance and non-hazardous equipment failures (e.g. classroom ceiling fan stopped, broken desk chair, flickering light bulb). | Warning at **4.8 hours** remaining |
| **`LOW`** | **72 Hours** | Cosmetic or deferred maintenance issues that do not impact daily campus operations (e.g. peeling paint, scratched table surface, faded room signage). | Warning at **14.4 hours** remaining |

---

# 3. Finite State Machine (FSM) Lifecycle Transition Rules

A complaint must progress through a deterministic lifecycle state machine. The state machine guards against data corruption, prevents premature ticket closure, and guarantees an auditable chain of custody:

```
                   ┌───────────────────────────────────┐
                   │            SUBMITTED              │
                   │ (Ticket created, awaiting squad)  │
                   └───────┬───────────────────┬───────┘
                           │                   │
             Start Work    │                   │ Cancel (Duplicate/Invalid)
         (Squad Pick-Up)   │                   │ (Requires Reason)
                           ▼                   ▼
            ┌──────────────────────┐    ┌──────────────┐
            │     IN_PROGRESS      │    │  CANCELLED   │ (Terminal State)
            │ (Repairs underway)   │    └──────────────┘
            └───────┬──────┬───────┘
                    │      │
      Resolve Work  │      │ Escalate (Overdue/Hazard)
  (Notes Mandatory) │      │ (Supervisor Action)
                    │      ▼
                    │   ┌──────────────────────┐
                    │   │      ESCALATED       │
                    │   │ (Supervisory review) │
                    │   └──────┬───────────────┘
                    │          │ Reassign / Expedite
                    │          │
                    ▼          ▼
            ┌──────────────────────┐
            │       RESOLVED       │
            │ (Work complete,      │
            │  closure report saved)│
            └──────────┬───────────┘
                       │ Final Audit Verification
                       ▼
            ┌──────────────────────┐
            │        CLOSED        │ (Terminal State)
            └──────────────────────┘
```

### State Transition Validation Guards:
1. **No Premature Resolution:** A ticket *cannot* transition directly from `SUBMITTED` to `RESOLVED`. It must first enter `IN_PROGRESS` to prove that a field squad acknowledged the issue and commenced physical inspection.
2. **Mandatory Closure Notes:** Any transition to `RESOLVED` must provide `resolution_notes` containing at least 10 non-whitespace characters detailing what physical repair was performed.
3. **Terminal States:** Once a ticket is marked `CLOSED` or `CANCELLED`, no further state mutations are permitted.

---

# 4. Complete Module M5 File Matrix

Module M5 is structured into dedicated **`backend/`** and **`frontend/`** documentation suites:

### Backend Subsystem (`c:/College/IT Workshop/V1/M5/backend/`)

| Blueprint File | Target Source Component | Build Phase | Primary Role & Responsibility |
| :--- | :--- | :--- | :--- |
| [**`01_sla_engine.md`**](file:///c:/College/IT%20Workshop/V1/M5/backend/01_sla_engine.md) | `backend/app/services/sla_engine.py` | Phase 1 (Parallel) | Priority-to-hours mapping, exact deadline calculation math, time-remaining algorithms, and breach status evaluators. |
| [**`02_lifecycle_state_machine.md`**](file:///c:/College/IT%20Workshop/V1/M5/backend/02_lifecycle_state_machine.md) | `backend/app/services/lifecycle.py` | Phase 1 (Parallel) | Deterministic state automata enforcing allowed transition paths, closure notes validation, and structured audit stamps. |
| [**`03_sla_schemas.md`**](file:///c:/College/IT%20Workshop/V1/M5/backend/03_sla_schemas.md) | `backend/app/schemas/sla.py` | Phase 1 (Parallel) | Pydantic V2 DTOs (`TicketStatusEnum`, `StatusUpdateRequest`, `TicketResolveRequest`, `EscalationRequest`, `SLABreachResponse`). |
| [**`04_service_integration.md`**](file:///c:/College/IT%20Workshop/V1/M5/backend/04_service_integration.md) | `backend/app/services/ticket_service.py` (Upgrade) | Phase 2 (Sequential) | Service layer upgrade: automatic deadline stamping on creation, `update_ticket_status()`, and verified `resolve_ticket()`. |
| [**`05_sla_endpoints.md`**](file:///c:/College/IT%20Workshop/V1/M5/backend/05_sla_endpoints.md) | `backend/app/api/v1/endpoints/sla.py` | Phase 3 (Sequential) | REST controllers (`PATCH /tickets/{id}/status`, `POST /tickets/{id}/resolve`, `POST /tickets/{id}/escalate`, `GET /tickets/breaches/active`). |
| [**`06_api_router_update.md`**](file:///c:/College/IT%20Workshop/V1/M5/backend/06_api_router_update.md) | `backend/app/api/v1/router.py` (Update) | Phase 4 (Sequential) | Aggregator wiring, mounting SLA and lifecycle endpoints under `/tickets` and `/sla` with OpenAPI tags. |
| [**`07_verification_and_testing.md`**](file:///c:/College/IT%20Workshop/V1/M5/backend/07_verification_and_testing.md) | Backend Verification Protocol | Phase 5 (Sequential) | 5-checkpoint verification protocol testing SLA calculation, legal transitions, illegal rejections, closure notes, and breach filtering. |

### Frontend Subsystem (`c:/College/IT Workshop/V1/M5/frontend/`)

| Blueprint File | Target Source Component | Build Phase | Primary Role & Responsibility |
| :--- | :--- | :--- | :--- |
| [**`01_sla_api_client.md`**](file:///c:/College/IT%20Workshop/V1/M5/frontend/01_sla_api_client.md) | `frontend/src/api/sla.js` | Phase 1 (Parallel) | Encapsulated HTTP transport module for lifecycle mutations, ticket resolution, manual escalation, and active breach queries. |
| [**`02_sla_countdown_timer.md`**](file:///c:/College/IT%20Workshop/V1/M5/frontend/02_sla_countdown_timer.md) | `frontend/src/components/SLACountdownTimer.jsx` | Phase 2 (Parallel) | Dynamic, color-shifting countdown timer pill ticking every second, transitioning from green to amber to pulsing red for overdue tickets. |
| [**`03_resolution_notes_modal.md`**](file:///c:/College/IT%20Workshop/V1/M5/frontend/03_resolution_notes_modal.md) | `frontend/src/components/ResolutionNotesModal.jsx` | Phase 3 (Parallel) | Staff resolution dialog requiring structured repair documentation with a mandatory 10-character validation guard and loading state. |
| [**`04_sla_breach_table.md`**](file:///c:/College/IT%20Workshop/V1/M5/frontend/04_sla_breach_table.md) | `frontend/src/components/SLABreachTable.jsx` | Phase 4 (Sequential) | High-visibility administrative escalation panel displaying all overdue and high-risk tickets with one-click escalation triggers. |
| [**`05_frontend_verification.md`**](file:///c:/College/IT%20Workshop/V1/M5/frontend/05_frontend_verification.md) | Frontend Verification Protocol | Phase 5 (Sequential) | 5-checkpoint verification protocol testing countdown ticks, color shifts, modal validation guards, status updates, and breach table filters. |

---

# 5. Execution Matrix: Concurrency & Dependency Flowchart (DAG)

To allow our 5-student engineering team to develop Module M5 concurrently without blocking each other, tasks are separated into **5 Execution Phases** across parallel Backend and Frontend tracks:

```
PHASE 1 (Zero-Dependency Domain Engines & Schemas - Parallel)
┌──────────────────────────────────────────────┐       ┌──────────────────────────────────────────────┐
│ Track A (Dev B): SLA Formulas & FSM Engine   │       │ Track B (Dev C): SLA Network Client          │
│ File 01: `sla_engine.py` (Math & Policies)   │       │ File 01: `src/api/sla.js`                    │
│ File 02: `lifecycle.py` (Transition FSM)     │       │ (Encapsulates status, resolve, breaches)     │
│ File 03: `sla_schemas.py` (Pydantic V2)      │       │                                              │
└──────────────────────┬───────────────────────┘       └──────────────────────┬───────────────────────┘
                       │                                                      │
PHASE 2 (Service Layer Integration & Countdown Pill - Parallel)               │
┌──────────────────────▼───────────────────────┐       ┌──────────────────────▼───────────────────────┐
│ Track A (Dev B): Service Orchestration       │       │ Track B (Dev C): Dynamic Countdown Pill      │
│ File 04: `ticket_service.py` (Upgrade)       │       │ File 02: `SLACountdownTimer.jsx`             │
│ (Deadline stamping, status updates, closure) │       │ (Real-time interval, color-shifting states)  │
└──────────────────────┬───────────────────────┘       └──────────────────────┬───────────────────────┘
                       │                                                      │
PHASE 3 (REST Endpoints & Resolution Notes Modal - Parallel)                  │
┌──────────────────────▼───────────────────────┐       ┌──────────────────────▼───────────────────────┐
│ Track A (Dev B): Presentation Controllers    │       │ Track B (Dev C): Staff Resolution Dialog     │
│ File 05: `endpoints/sla.py`                  │       │ File 03: `ResolutionNotesModal.jsx`          │
│ (PATCH /status, POST /resolve, GET /breaches)│       │ (10-char closure guard, audit timestamping)  │
└──────────────────────┬───────────────────────┘       └──────────────────────┬───────────────────────┘
                       │                                                      │
PHASE 4 (Router Aggregator & Breach Escalation Table - Parallel)               │
┌──────────────────────▼───────────────────────┐       ┌──────────────────────▼───────────────────────┐
│ Track A (Dev B): Router Mounting             │       │ Track B (Dev D): Supervisor Breach Panel     │
│ File 06: `api/v1/router.py` (Mounting)       │       │ File 04: `SLABreachTable.jsx`                │
│ (Mounts SLA controllers under /tickets)      │       │ (High-risk ticket grid, quick escalation)    │
└──────────────────────┬───────────────────────┘       └──────────────────────┬───────────────────────┘
                       │                                                      │
PHASE 5 (Full-Stack Quality Gate & Integration Verification)                  │
┌──────────────────────▼──────────────────────────────────────────────────────▼───────────────────────┐
│ Entire Engineering Team:                                                                            │
│ File 07 (Backend): `07_verification_and_testing.md` (Deadline math, FSM guards, breach queries)      │
│ File 05 (Frontend): `05_frontend_verification.md` (Timer countdown ticks, modal validation, table)  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 6. Future AI Predictive SLA & Auto-Escalation Roadmap

While Version 1.0 enforces deterministic SLA durations based on static priority tiers, Module M5 is architected to seamlessly incorporate Version 2 (V2) AI capabilities (Gemini API predictive analytics) while maintaining **strict Human-in-the-Loop administrative supervisory authority**:

### 1. Dynamic Predictive SLA Estimation (Backend Hooks)
* Dynamic Turnaround Prediction: In V2, `sla_engine.py` will call an asynchronous Gemini 1.5 Flash agent that evaluates real-time maintenance factors: current squad queue depth, parts inventory availability (e.g. PVC pipe replacement in stock vs backordered), and campus operational calendar (e.g. exam week access restrictions), generating a dynamically adjusted, highly accurate estimated completion time.
* Zero-Latency Deterministic Safety Fallback: If external AI inference services time out (>300ms) or return errors, `ticket_service.py` automatically stamps the standard static SLA deadline (4h, 12h, 24h, 72h), guaranteeing 100% platform reliability.

### 2. Autonomous Anomaly Detection & Predictive Escalation (Backend Hooks)
* Pre-Breach Early Warning Worker: In V2, a background worker will periodically pass open ticket histories to Gemini AI to identify stagnation anomalies (e.g. a high-priority ticket stuck in `IN_PROGRESS` for 8 hours with zero staff notes), automatically elevating supervisory visibility before a formal breach occurs.
* Automated Spare Parts Suggestions: When a staff member initiates resolution, Gemini AI will analyze the complaint description to suggest common spare parts and standardized resolution checklist items, streamlining technician documentation.

### 3. Supervisory Governance & Human Oversight (Frontend Hooks)
* Permanent Human Authority: Even in V2, automated AI systems cannot unilaterally close tickets or alter contractual SLA parameters. Only human facility supervisors retain the authority to grant SLA extensions or override resolution decisions via auditable supervisory dialogs.

---

# 7. Standard 6-Section Blueprint Guide

To maintain engineering consistency across the team, every blueprint in Module M5 strictly implements the standardized 6-section structure:
* **Section 1: Standard Purpose & Industry Role**: Dual-perspective analysis covering standard enterprise use cases, our platform-specific implementation, future AI roadmap hooks, cross-component interactions, and the fundamental problem it solves.
* **Section 2: What Must Be in This File & Why Each Item Is Needed**: Exhaustive line-by-line specification of every class, function, parameter, validation rule, and design token required in the file.
* **Section 3: Component Life-Cycle: Input, Process, Output (IPO Table)**: Step-by-step lifecycle table detailing raw inputs, internal computational transformations, and resulting output artifacts.
* **Section 4: Flexibility & Modification Guide**: Strict demarcations between 🟢 *Safe to Modify & Customize* elements and 🔴 *Strict Non-Negotiables*.
* **Section 5: Advanced Concepts Explained**: Deep first-principles explanations of computer science, state automata theory, and web architecture (such as Finite State Automata, temporal math in UTC, and React interval hooks).
* **Section 6: Definition of Done & Verification Protocol**: Observable checklists, automated terminal commands, and complete troubleshooting matrices with root causes and exact resolution procedures.
