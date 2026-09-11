# Version 1.0 Master Engineering Blueprint: Full-Stack Architecture
## Central System Topology, Full-Stack Module Matrices & Team Concurrency Map

> **Course Context & Master Architectural Charter:**  
> This is the authoritative master engineering blueprint for **Version 1.0 (The Closed-Loop Automation Platform)** of `SmartComplaintHandler`.  
> It unifies the entire full-stack system across all five core operational modules (**M1, M2, M3, M4, M5**). Every module is explicitly divided into dedicated **`backend/`** (FastAPI + SQLAlchemy 2.0 + SQLite) and **`frontend/`** (React 18 + Vite + Tailwind CSS) subsystems.  
> It details **what each module builds**, **how components communicate over HTTP REST contracts**, **how student teams execute in parallel across backend and frontend tracks**, **defines every technical term right where it appears**, and establishes the **Future AI Integration & Human-in-the-Loop (HITL) Governance Roadmap**.

---

# Front Summary: Full-Stack Master Module Roadmap (M1–M5)

Every module in Version 1.0 is engineered with complete full-stack parity:

| Module ID | Module Title | Backend Subsystem (`backend/`) | Frontend Subsystem (`frontend/`) | Primary Input | Hand-off Output | Assigned Tracks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **M1** | **Foundation, Storage Engine & App Shell** | SQLite WAL storage, SQLAlchemy 2.0 ORM models (`Department`, `Team`, `Ticket`), seed data, `get_db` injector | React 18 shell, Vite bundler proxy, Tailwind design tokens, base Axios client with interceptors, persistent Layout, App Router | System boot trigger / Browser navigation | SQLite DB file (`smart_complaints.db`), session injector, mounted app shell with live health indicator | Dev A (Backend)<br>Dev C (Frontend) |
| **M2** | **Ingestion Gateway, Keyword Router & Student Portals** | Pydantic V2 validation schemas, CSPRNG code generator (`TICK-XXXX`), rule-based keyword router, ticket service, REST endpoints | Complaints API transport, controlled intake form with live validation (`SubmitComplaint.jsx`), confirmation modal with 1-click copy, 3-step progress tracker | Student complaint text (title, description, location) | Persisted ticket record (`201 Created`), unique tracking code, and visual progress tracking display | Dev B (Backend)<br>Dev C (Frontend) |
| **M3** | **Deterministic Classification & Priority Engine** | Deterministic priority engine (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), 5-domain taxonomy classifier, Pydantic DTOs, priority override service, REST controllers | Triage API client, atomic `PriorityBadge` (pulsing red hazard), debounced `LiveTriageCard` preview, administrative `PriorityOverrideModal` | Raw grievance text & supervisor override requests | Computed priority level, detected hazard flags, normalized confidence score, and auditable override log | Dev B (Backend)<br>Dev C (Frontend) |
| **M4** | **Automated Workload Dispatch & Staff Assignment** | Least-loaded queue balancing engine, emergency short-circuiting, team workload aggregation service, squad reassignment REST controllers | Assignment API client, central `AdminDashboard` workstation with multi-tier filters, responsive `TeamWorkloadView` grid, `ReassignTeamModal` | Department ID & supervisor reassignment requests | Assigned maintenance squad name, balanced team queues, and auditable transfer log in `resolution_notes` | Dev B (Backend)<br>Dev C (Frontend) |
| **M5** | **SLA Tracking, Escalation Engine & Lifecycle State Machine** | SLA deadline calculator (4h, 12h, 24h, 72h), lifecycle state machine (`SUBMITTED` -> `IN_PROGRESS` -> `RESOLVED`), breach escalation worker, resolution controllers | SLA API client, live countdown timer badge, visual SLA breach alert table, supervisor manual escalation modal, resolution notes dialog | Priority level, staff status update clicks, and resolution notes | `sla_deadline` timestamp, lifecycle status updates, breach alert flags, and complete closed-loop closure notes | Dev B (Backend)<br>Dev C (Frontend) |

---

# System Architecture: The Full-Stack Inter-Module Connection Map

This diagram illustrates how data flows between the React Frontend Subsystem, the Network Bridge, the FastAPI Backend Services, and SQLite Disk Storage across the complete complaint lifecycle:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                              FRONTEND (React 18 + Vite)                                                │
│                                                                                                                        │
│   Module M1 Frontend: Persistent Application Shell (`Layout.jsx`, `Navbar.jsx`, `Footer.jsx`, `AppRouter.jsx`)        │
│   ┌───────────────────────────────────────────────────┼───────────────────────────────────────────────────┐            │
│   ▼                                                   ▼                                                   ▼            │
│  Module M2: Student Portals                          Module M3: Live Triage Card                         Module M4 & M5: Staff Desk    │
│  - `SubmitComplaint.jsx` (Intake Form)               - `LiveTriageCard.jsx` (500ms Preview)              - `AdminDashboard.jsx` (Table)│
│  - `SubmissionSuccessModal.jsx` (TICK-XXXX)          - `PriorityBadge.jsx` (Pills)                       - `TeamWorkloadView.jsx`(Grid)│
│  - `TrackTicket.jsx` (3-Step Progress Stepper)       - `PriorityOverrideModal.jsx`                       - `ReassignTeamModal.jsx`     │
│   │                                                   │                                                   │            │
│   └───────────────────────────────────────────────────┼───────────────────────────────────────────────────┘            │
│                                                       │                                                                │
│                     Module M1 Frontend: Base API Client (`src/api/client.js` with Axios Interceptors)                  │
└───────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────┘
                                                        │
                      HTTP REST Network Bridge (/api/v1)│ Reverse Proxy Port :5173 ➔ :8000
                                                        ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                BACKEND (FastAPI + ASGI)                                                │
│                                                                                                                        │
│   Module M2 Backend: Transport Router & Middleware (`main.py`, `router.py`, CORS, Lifespan Event Handlers)             │
│   ┌───────────────────────┬───────────────────────────┼───────────────────────────┬────────────────────────────────┐   │
│   ▼                       ▼                           ▼                           ▼                                ▼   │
│  Module M2 Endpoints:    Module M3 Endpoints:        Module M4 Endpoints:        Module M5 Endpoints:             OpenAPI Specs:
│  POST /tickets           POST /triage-preview        GET /teams/workloads        GET /sla/breaches                GET /docs    │
│  GET  /tickets/{code}    PATCH /{id}/priority        PATCH /tickets/{id}/reassign PATCH /tickets/{id}/status       GET /openapi.json
│   │                       │                           │                           │                                    │
│   ▼                       ▼                           ▼                           ▼                                    │
│  Module M2 Services:     Module M3 Services:         Module M4 Services:         Module M5 Services:                   │
│  - `code_generator.py`   - `priority_engine.py`      - `dispatch_engine.py`      - `sla_engine.py`                     │
│  - `keyword_router.py`   - `classifier.py`           - `team_service.py`         - `escalation_service.py`             │
│   │                       │                           │                           │                                    │
│   └───────────────────────┴─────────────┬─────────────┴───────────────────────────┘                                    │
│                                         ▼                                                                              │
│             Module M2/M3/M4/M5 Service Integrator: Ticket Orchestrator (`ticket_service.py`)                           │
│             - Dynamic Category Classification   - Least-Loaded Squad Assignment   - SLA Deadline Calculation           │
│             - Calculated Priority Severity      - Administrative Overrides        - Audit Logging to Resolution Notes  │
│                                         │                                                                              │
│                                         ▼                                                                              │
│             Module M1 Backend: Session Injector (`api/deps.py` - FastAPI Depends(get_db))                              │
│                                         │                                                                              │
│                                         ▼                                                                              │
│             Module M1 Backend: SQLAlchemy 2.0 Entity Models (`Department`, `MaintenanceTeam`, `Ticket`)                │
└─────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
                         ┌─────────────────────────────────┐
                         │       SQLite Disk Storage       │
                         │      (smart_complaints.db)      │
                         │    WAL Mode + Foreign Keys ON   │
                         └─────────────────────────────────┘
```

---

# Team Concurrency & Workflow DAG (Parallel vs. Sequential)

> **Team Operations Manual & Git Guide Reference:**  
> For the exhaustive 5-student operational manual, 5-day step-by-step concurrency DAG, zero-blocking mock data contracts, and first-principles beginner Git guide (including step-by-step conflict resolution), see [**`TEAM_WORKFLOW_AND_GIT_GUIDE.md`**](file:///c:/College/IT%20Workshop/V1/TEAM_WORKFLOW_AND_GIT_GUIDE.md).

To enable a 5-student engineering team to build the entire platform within 5 to 7 days without stepping on each other's code or suffering Git merge conflicts, work is divided across three parallel execution tracks:

```
Track A (Dev A & B - Backend Storage & Services):
┌───────────────────────────┐      ┌───────────────────────────┐      ┌───────────────────────────┐
│ Module M1 Backend:        │ ───> │ Module M2 Backend:        │ ───> │ Module M3 & M4 Backend:   │ ───┐
│ - SQLite Engine & WAL     │      │ - Ingestion & Code Gen    │      │ - Priority Engine         │    │
│ - ORM Models & Seed Data  │      │ - Keyword Router          │      │ - Workload Dispatcher     │    │
└───────────────────────────┘      └───────────────────────────┘      └───────────────────────────┘    │
                                                                                                       │
Track B (Dev C & D - Frontend Architecture & UI):                                                      ▼
┌───────────────────────────┐      ┌───────────────────────────┐      ┌───────────────────────────┐    ┌──────────────────────────┐
│ Module M1 Frontend:       │ ───> │ Module M2 Frontend:       │ ───> │ Module M3 & M4 Frontend:  │ ──>│ Full-Stack Integration,  │
│ - Vite & Tailwind Tokens  │      │ - Submit Complaint Form   │      │ - Priority Badges & Card  │    │ SLA Engine (M5),         │
│ - Base Axios Client       │      │ - Success Modal (Copy)    │      │ - Admin Dashboard Desk    │    │ & E2E Verification Demo  │
│ - Persistent Layout Shell │      │ - 3-Step Progress Stepper │      │ - Team Workload Panel     │    └──────────────────────────┘
└───────────────────────────┘      └───────────────────────────┘      └───────────────────────────┘    ▲
                                                                                                       │
Track C (Dev E - Verification, Quality & Documentation):                                               │
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┴───────────────────────┐
│ Continuous Verification Gateways: M1 Testing ➔ M2 Testing ➔ M3 Testing ➔ M4 Testing ➔ M5 System Testing                      │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Concurrency Rules for the Team:
1. **Phase 1: Parallel Foundation Kickoff (Day 1):**
   * **Dev A** builds `V1/M1/backend/` (`config.py`, `database.py`, `base.py`, `department.py`, `team.py`, `ticket.py`, `seed.py`, `deps.py`).
   * **Dev C** simultaneously builds `V1/M1/frontend/` (`vite.config.js`, `tailwind.config.js`, `client.js`, `Layout.jsx`, `Navbar.jsx`, `AppRouter.jsx`).
   * *Prerequisites:* Zero cross-blocking. Dev C uses Vite dev proxy pointing to `localhost:8000`.
2. **Phase 2: Ingestion & Student Experience (Days 2–3):**
   * **Dev B** builds `V1/M2/backend/` (Pydantic schemas, code generator, keyword router, ticket service, endpoints).
   * **Dev C** builds `V1/M2/frontend/` (`complaints.js`, `SubmitComplaint.jsx`, `SubmissionSuccessModal.jsx`, `TrackTicket.jsx`).
   * *Handoff:* Once Dev A finishes M1 seed data, Dev B connects M2 to the live database; Dev C connects the frontend form to `POST /api/v1/tickets`.
3. **Phase 3: Intelligence & Dispatch Automation (Days 4–5):**
   * **Dev B** builds `V1/M3/backend/` (Priority scoring, classification engine) and `V1/M4/backend/` (Least-loaded squad dispatcher).
   * **Dev C & D** build `V1/M3/frontend/` (`PriorityBadge.jsx`, `LiveTriageCard.jsx`, `PriorityOverrideModal.jsx`) and `V1/M4/frontend/` (`AdminDashboard.jsx`, `TeamWorkloadView.jsx`, `ReassignTeamModal.jsx`).
4. **Phase 4: SLA Tracking & Final Integration (Days 6–7):**
   * The team implements **Module M5** (SLA deadline tracking, status transition state machine, and escalation alerting).
   * The entire team executes the full-stack closed-loop verification protocol, demonstrating complaint intake, automatic classification, squad load balancing, SLA monitoring, and resolution.

---

# Future AI Integration Architecture & V2 Drop-In Roadmap

The Smart Complaint Handler is architected from day one so that Version 1.0 (local deterministic engines) serves as the zero-latency safety fallback for Version 2.0 (Gemini API multimodal intelligence), with **permanent Human-in-the-Loop administrative supervisory authority**:

### 1. Dual-Tier Intelligence Architecture (V1 Deterministic Fallback + V2 AI)
* V2 AI Classification & Keyword Extraction: In V2, the system passes complaint text to Gemini 1.5 Flash. The AI performs contextual keyword extraction (e.g. recognizing that "water dripping onto electrical server rack" involves both plumbing and electrical hazards, prioritizing life safety over cosmetic issues).
* V1 Deterministic Zero-Latency Safety Fallback: If external AI API requests experience network latency, rate limiting (`HTTP 429`), or service outages (`HTTP 503`), the backend service layer catches the exception within 250ms and falls back to our local rule-based keyword router and priority engine. The system never drops a ticket.

### 2. Human-in-the-Loop (HITL) Supervisory Governance
* Supervisory Override Authority: While AI proposes department routing, priority levels, and assigned squads, campus facility administrators retain exclusive authority to override any AI decision.
* Mandatory Audit Logging: Overrides can only be performed through dedicated supervisory dialogs (`PriorityOverrideModal.jsx` and `ReassignTeamModal.jsx`) that enforce a mandatory 5-character reason validation guard. Every override is permanently committed to the ticket's `resolution_notes` with an immutable timestamp and supervisor identifier.

### 3. Multimodal Grievance Ingestion
* Photographic Evidence Verification: In V2, students will attach photos of broken equipment directly in `SubmitComplaint.jsx`. Gemini Vision will inspect the image to detect physical hazards (exposed copper wiring, standing water, shattered glass), verify the student's textual claim, and automatically tag priority before a technician is dispatched.

---

# Master Architectural Standards Across All Blueprints

Every blueprint file across Modules M1 through M5 adheres to six non-negotiable standards:
1. **Strict Zero Code Blocks in Functional Blueprints:** Code blocks (` ``` `) exist exclusively in central overview files for ASCII diagrams. Functional blueprints (01 to 05/10) use precise signatures, formulas, parameters, and tables. All terminal commands are formatted as single inline backtick strings (` `command` `).
2. **Zero Childish Analogies:** All concepts are explained from first-principles computer science, data structures, relational database theory, and modern web architecture.
3. **In-Line Technical Definitions:** Every technical term is defined immediately upon first appearance in the text.
4. **Section 1 Dual Perspective:** Every blueprint defines both standard industry role/use cases and our platform-specific implementation.
5. **Section 4 Flexibility Guide:** Strict boundaries separating 🟢 *Safe to Modify & Customize* aspects from 🔴 *Strict Non-Negotiables*.
6. **Section 6 Definition of Done & Troubleshooting Matrix:** Observable verification criteria, executable validation commands, and comprehensive diagnostic troubleshooting tables.
