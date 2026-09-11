# Module M4: Central Full-Stack Architecture & Execution Roadmap
## Automated Workload Dispatch & Staff Assignment Subsystem

> **Module Role:**  
> Module M4 is the operational workforce dispatch and staff administration brain of the Smart Complaint Handler platform.  
> It bridges the backend and frontend into a complete, unified operational workflow:
> 1. **Backend Subsystem (`backend/`):** Inspects active maintenance squads across campus departments, calculates real-time queue depths, executes least-loaded workload dispatch algorithms, handles emergency priority escalations, and exposes auditable REST API endpoints.
> 2. **Frontend Subsystem (`frontend/`):** Delivers the Staff Admin Desk dashboard in React 18, rendering live complaint management queues, visual squad workload cards with active queue progress bars, squad availability toggle switches, and an interactive modal for manual ticket reassignment.

---

# 1. Full-Stack Architecture: End-to-End Dispatch & Admin Flow

The following diagram illustrates how student complaints, automated dispatch algorithms, staff dashboards, and manual supervisor reassignments interact across the full stack:

```
                      FULL-STACK WORKLOAD DISPATCH & STAFF DESK PIPELINE

  [ STUDENT COMPLAINTS ]                       [ FACILITY STAFF & SUPERVISORS ]
  (Ingested & Triaged)                         (React 18 + Tailwind Admin Desk)
           │                                                  │
           │                                                  ▼
           │                                   ┌──────────────────────────────┐
           │                                   │ Module M4 Frontend:          │
           │                                   │ • `AdminDashboard.jsx`       │
           │                                   │ • `TeamWorkloadView.jsx`     │
           │                                   │ • `ReassignTeamModal.jsx`    │
           │                                   └──────────────┬───────────────┘
           │                                                  │
           │                                     GET /workload│ PATCH /reassign
           ▼                                                  ▼
 ┌────────────────────────────────────────────────────────────────────────────┐
 │ MODULE M4 BACKEND TRANSPORT & REST API (`endpoints/assignment.py`)         │
 │ • `POST /api/v1/tickets/{id}/dispatch`  ➔ Trigger automated squad dispatch │
 │ • `PATCH /api/v1/tickets/{id}/reassign` ➔ Supervisor manual reassignment   │
 │ • `GET /api/v1/teams/workloads`         ➔ Live squad queue statistics      │
 │ • `PATCH /api/v1/teams/{id}/availability`➔ Toggle active/inactive shifts   │
 └─────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
 ┌────────────────────────────────────────────────────────────────────────────┐
 │ MODULE M4 CORE DISPATCH ENGINE (`services/dispatch_engine.py`)             │
 │ 1. Filters eligible squads: `department_id == X` AND `is_active == True`   │
 │ 2. Emergency Short-Circuit: `priority == "CRITICAL"` ➔ Rapid Response Team │
 │ 3. Queue Depth Math: `COUNT(tickets)` with `status IN ('ASSIGNED', 'IN_...│
 │ 4. Zone Affinity: Matches building keywords ("Hostel" vs "Academic")       │
 │ 5. Least-Loaded Selection: Assigns to crew with minimum active backlog     │
 └─────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
 ┌────────────────────────────────────────────────────────────────────────────┐
 │ PERSISTENCE & AUDIT LAYER (`services/ticket_service.py` & SQLite)          │
 │ • `ticket.assigned_team = selected_team.name`                             │
 │ • `ticket.status = "ASSIGNED"`                                             │
 │ • If supervisor reassigns: appends audit log to `ticket.resolution_notes`  │
 │ • Commits transaction to `smart_complaints.db`                             │
 └────────────────────────────────────────────────────────────────────────────┘
```

---

# 2. Squad Organization & Campus Maintenance Hierarchy

Module M4 coordinates the 12 specialized field maintenance squads created during Module M1 database seeding across the 6 campus departments:

| Department ID & Name | Squad ID | Squad Name | Campus Specialization Zone | Default Emergency Role |
| :--- | :--- | :--- | :--- | :--- |
| **1: Electrical** | 1 | Hostel Wiring Squad | Student Hostels & Residential Quarters | Secondary responder |
| **1: Electrical** | 2 | Academic Electrical Crew | Classrooms, Lecture Halls & Libraries | Routine maintenance |
| **1: Electrical** | 3 | Substation High-Voltage Team | Campus Power Substations & Transformers | **Primary Electrical Emergency** |
| **2: Plumbing** | 4 | Hostel Pipe Repair Crew | Student Hostel Bathrooms & Kitchens | Routine pipe leaks |
| **2: Plumbing** | 5 | Academic Sanitation Unit | Administrative Blocks & Academic Washrooms | Routine sanitation |
| **2: Plumbing** | 6 | Water Supply Emergency Team | Main Overhead Tanks, Pumps & Borewells | **Primary Plumbing Emergency** |
| **3: Carpentry** | 7 | Furniture Maintenance Squad | Desks, Chairs, Benches & Lecture Halls | Routine carpentry |
| **3: Carpentry** | 8 | Structural Fixtures Crew | Main Doors, Windows, Roof Trusses | Emergency door breach |
| **4: IT Support** | 9 | Network & Wi-Fi Squad | Wi-Fi Access Points, Routers, LAN Drops | Campus network outages |
| **4: IT Support** | 10 | Lab Hardware Squad | Computer Labs, Projectors & Audio-Visual | Classroom hardware |
| **5: Sanitation** | 11 | Waste & Hygiene Crew | Campus Grounds, Trash Dumps & Cleanliness | Routine hygiene |
| **6: General Admin** | 12 | Campus Infrastructure Desk | Miscellaneous Inquiries & Civil Repairs | General fallback |

---

# 3. Execution Matrix: Full-Stack Parallel vs. Sequential Build Order

To enable our 5-student engineering team to develop Module M4 concurrently, work is strictly divided into **Backend (`backend/`)** and **Frontend (`frontend/`)** tracks across **5 execution phases**:

```
PHASE 1 (Backend Core & Schemas / Frontend API Client - Parallel)
┌─────────────────────────────────┐ ┌─────────────────────────────────┐ ┌─────────────────────────────────┐
│ backend/01_dispatch_engine.md   │ │ backend/02_assignment_schemas.md│ │ frontend/01_assignment_api.md   │
│ (Least-Loaded & Emergency Rules)│ │ (Pydantic V2 DTO Schemas)       │ │ (Axios/Fetch HTTP Bridge)       │
└────────────────┬────────────────┘ └────────────────┬────────────────┘ └────────────────┬────────────────┘
                 │                                   │                                   │
PHASE 2 (Backend Services & Frontend Visual Cards - Parallel)                            │
┌────────────────▼────────────────┐ ┌────────────────▼────────────────┐                  │
│ backend/03_team_service.md      │ │ frontend/03_workload_panel.md   │                  │
│ (Squad Queries & Queue Depths)  │ │ (Live Squad Workload Cards & UI)│                  │
└────────────────┬────────────────┘ └────────────────┬────────────────┘                  │
                 │                                   │                                   │
PHASE 3 (Service Integration & Reassign Modal - Parallel)                                │
┌────────────────▼────────────────┐ ┌────────────────▼────────────────┐                  │
│ backend/04_service_integration  │ │ frontend/04_reassign_modal.md   │                  │
│ (Ticket Service Auto-Dispatch)  │ │ (Supervisor Transfer Dialog)    │                  │
└────────────────┬────────────────┘ └────────────────┬────────────────┘                  │
                 │                                   │                                   │
PHASE 4 (Endpoints, Router Aggregator & Master Admin Page - Sequential)                  │
┌────────────────▼────────────────┐ ┌────────────────▼────────────────┐                  │
│ backend/05_endpoints & 06_router│ │ frontend/02_admin_dashboard.md  │                  │
│ (REST APIs & Router Aggregation)│ │ (Full Staff Tabular Dashboard)  │                  │
└────────────────┬────────────────┘ └────────────────┬────────────────┘                  │
                 │                                   │                                   │
PHASE 5 (Full-Stack End-to-End Verification Quality Gate)                                │
┌────────────────▼───────────────────────────────────▼───────────────────────────────────┐
│ backend/07_verification_and_testing.md & frontend/05_verification_and_testing.md       │
│ (5-Checkpoint Backend Gate + Complete Frontend UI Interaction Test Protocol)           │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 4. Phase-by-Phase File Map: Backend & Frontend Division

### Division A: Backend Subsystem (`V1/M4/backend/`)

| Phase | File # | Blueprint File Name | Target Source File | Build Mode | Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Phase 1** | **01** | `01_dispatch_engine.md` | `backend/app/services/dispatch_engine.py` | **Parallel** | Least-loaded algorithm, emergency critical routing, zone affinity |
| **Phase 1** | **02** | `02_assignment_schemas.md` | `backend/app/schemas/assignment.py` | **Parallel** | Pydantic V2 DTOs (`TeamWorkloadResponse`, `TeamReassignRequest`, `DispatchResult`) |
| **Phase 2** | **03** | `03_team_service.md` | `backend/app/services/team_service.py` | **Parallel** | Squad queries, active queue depth counts, availability toggle |
| **Phase 3** | **04** | `04_service_integration.md` | `backend/app/services/ticket_service.py` (Upgrade) | Sequential | Connects auto-dispatch into `create_ticket()`; implements `reassign_ticket_team()` |
| **Phase 4** | **05** | `05_assignment_endpoints.md` | `backend/app/api/v1/endpoints/assignment.py` | Sequential | REST routes (`POST /dispatch`, `PATCH /reassign`, `GET /workloads`) |
| **Phase 4** | **06** | `06_api_router_update.md` | `backend/app/api/v1/router.py` (Update) | Sequential | Aggregator wiring, mounting assignment endpoints under `/tickets` and `/teams` |
| **Phase 5** | **07** | `07_verification_and_testing.md` | Backend 5-Checkpoint Verification Protocol | Sequential | Terminal tests for least-loaded math, emergency short-circuits, and HTTP errors |

### Division B: Frontend Subsystem (`V1/M4/frontend/`)

| Phase | File # | Blueprint File Name | Target Source File | Build Mode | Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Phase 1** | **01** | `01_assignment_api_client.md` | `frontend/src/api/assignment.js` | **Parallel** | API network client (Axios/Fetch functions for dispatch, reassign, workloads) |
| **Phase 4** | **02** | `02_admin_dashboard_page.md` | `frontend/src/pages/AdminDashboard.jsx` | Sequential | Full staff management page with multi-tier filters (dept, priority, squad, status) |
| **Phase 2** | **03** | `03_team_workload_panel.md` | `frontend/src/components/TeamWorkloadView.jsx` | **Parallel** | Grid of visual squad cards with active queue bars, capacity, and shift toggle |
| **Phase 3** | **04** | `04_reassign_modal.md` | `frontend/src/components/ReassignTeamModal.jsx` | **Parallel** | Modal dialog to transfer tickets with active squad selector and mandatory audit reason |
| **Phase 5** | **05** | `05_frontend_verification.md` | Frontend Verification Protocol | Sequential | Browser & component testing protocol, UI state inspection, error toast verification |

---

# 5. Standard Blueprint Structure for Each File

Every file blueprint in both `backend/` and `frontend/` is structured into the identical 6 standard sections:
1. **Standard Purpose & Industry Role:** Dual perspective explaining both industry standard practices and what WE are specifically using it for in Smart Complaint Handler, including future AI roadmap hooks.
2. **What Must Be in This File & Why Each Item Is Needed:** Explicit technical specification of required functions, props, hooks, endpoints, state variables, or parameters with in-line definitions of all technical terms.
3. **Component Life-Cycle (IPO Table):** Input, Process, and Output stages.
4. **Flexibility & Modification Guide:** Clear breakdown of 🟢 *Safe to Modify* vs. 🔴 *Strict Non-Negotiables*.
5. **Advanced Concepts Explained (OOP, State & Architecture):** Deep first-principles explanations of backend algorithms or frontend React mechanics (React component lifecycle, optimistic UI updates, debouncing, state lifting, REST error boundary handling, Greedy balancing) for engineering students.
6. **Definition of Done:** Observable checklist and inline terminal/browser verification procedures.

---

# 6. Future AI Workforce Optimization & Predictive Dispatch Roadmap

### The Architectural Vision: Transitioning to Intelligent Predictive Dispatch
While Version 1 (V1) implements an instantaneous, deterministic, least-loaded workload dispatch engine with zero external network dependencies, our system architecture is specifically built to accommodate **AI-Driven Workforce Optimization and Predictive Dispatch** in Version 2 (V2).

In V2, rather than relying exclusively on a simple active ticket count, an AI engine (or machine learning dispatch model) will inspect:
1. **Historical Resolution Speeds:** Analyzing how quickly specific technicians resolve specific types of failures (e.g. Technician A fixes water pumps 40% faster than average).
2. **Geographical Proximity & Campus Routing:** Estimating technician travel times across campus zones using location coordinates.
3. **Real-Time Job Difficulty Inference:** Analyzing complaint text to estimate how many labor hours an incident will require before assigning it to a squad's queue.

### How the Current V1 Architecture Prepares for Future AI Dispatch
The engineering patterns established in this V1 specification ensure that plugging in an AI dispatch model in V2 requires **zero breaking changes to the database, zero breaking changes to REST endpoints, and zero disruption to technician interfaces**:

1. **The Strategy Pattern in Dispatch Orchestration:**
   * In `backend/app/services/ticket_service.py`, complaint assignment calls `select_optimal_team(db, ticket)`.
   * In V2, an `AIPredictiveDispatcher` can be swapped in without modifying `ticket_service.py`. The service layer simply consumes the dispatch contract, completely agnostic to whether the squad was selected by a SQL `COUNT()` query or a predictive AI model.
2. **Permanent Human-in-the-Loop (HITL) Supervisory Governance:**
   * In institutional facilities management, an automated algorithm (whether heuristic or AI) must never hold unchecked power over human labor schedules.
   * The administrative reassignment endpoint (`PATCH /api/v1/tickets/{ticket_id}/reassign`) and frontend reassignment modal (`ReassignTeamModal.jsx`) created in Module M4 serve as the permanent **Human-in-the-Loop (HITL)** supervisory gate.
   * If the algorithm assigns a task to a squad whose vehicle broke down or whose members are on an unscheduled break, the facility manager can immediately transfer the ticket to another squad with an auditable explanation.
3. **Zero-Latency Fallback Architecture:**
   * If an advanced AI optimization engine encounters latency or network errors, the system automatically falls back to our V1 deterministic least-loaded algorithm in under 1 millisecond, guaranteeing that complaints never remain stuck in an unassigned state.

```
              V1 TO V2 DISPATCH ARCHITECTURAL EVOLUTION

                     [ TRIAGED COMPLAINT REPORT ]
                     Priority: HIGH | Category: Plumbing
                                  │
                                  ▼
                   ┌──────────────────────────────┐
                   │   DISPATCH ORCHESTRATOR      │
                   │ (`services/dispatch_engine`) │
                   └──────────────┬───────────────┘
                                  │
          ┌───────────────────────┴───────────────────────┐
          ▼ (V1: Active Default)                          ▼ (V2: Future Drop-In)
┌─────────────────────────────────┐             ┌─────────────────────────────────┐
│ LEAST-LOADED GREEDY DISPATCHER  │             │ PREDICTIVE AI WORKFORCE MODEL   │
│ • SQL `COUNT(tickets)` in queue │             │ • Estimated job duration math   │
│ • Active squad status check     │             │ • Historical squad skill scores │
│ • Instant in-memory execution   │             │ • Campus geolocation proximity  │
└────────────────┬────────────────┘             └────────────────┬────────────────┘
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         ▼
                        ┌─────────────────────────────────┐
                        │ UNIFIED DISPATCH ASSIGNMENT     │
                        │ • `ticket.assigned_team = name` │
                        │ • `ticket.status = "ASSIGNED"`  │
                        └────────────────┬────────────────┘
                                         │
                                         ▼
                        ┌─────────────────────────────────┐
                        │ HUMAN-IN-THE-LOOP (HITL) GATE   │
                        │ • Supervisor Admin Dashboard    │
                        │ • `PATCH /{id}/reassign`        │
                        │ • Mandatory Audit Reason Log    │
                        └─────────────────────────────────┘
```
