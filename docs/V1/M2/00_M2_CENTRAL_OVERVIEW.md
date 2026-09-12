# Module M2: Central Ingestion Architecture & Full-Stack Execution Roadmap
## Ingestion Gateway, Keyword Router, Student Intake Form & Live Resolution Stepper

> **Module Role & Architectural Boundary:**  
> Module M2 establishes the complete end-to-end complaint intake and student tracking workflow for the **Smart Complaint Routing & Workflow Automation Platform** (`SmartComplaintHandler`).  
> On the **Backend**, it validates student submissions via Pydantic V2, generates collision-resistant cryptographic tracking codes (`TICK-XXXX`), classifies issues to campus departments via rule-based keyword scanning, executes atomic database transactions, and exposes REST endpoints (`POST /api/v1/tickets`, `GET /api/v1/tickets/{code}`).  
> On the **Frontend**, it provides the dedicated complaints API network transport client, an accessible controlled intake form with live validation and character counters (`SubmitComplaint.jsx`), a high-contrast confirmation modal with 1-click clipboard copy (`SubmissionSuccessModal.jsx`), and a self-service tracking workstation featuring a 3-step visual progress stepper (`TrackTicket.jsx`).

---

# 1. System Overview: Full-Stack Ingestion & Tracking Pipeline

Module M2 constructs a complete closed-loop lifecycle from initial student keystroke to live resolution tracking:

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND SUBSYSTEM (React 18 + Vite)                       │
│                                                                                   │
│  [ STAGE 1: INTAKE FORM ]                                                         │
│  File 02: Submit Complaint Page (`SubmitComplaint.jsx`)                           │
│  - Controlled form state: Title (min 5), Description (min 10), Location (min 3)  │
│  - Real-time character counter (X / 1000) & red border validation feedback        │
│  - Form state machine: `idle` -> `submitting` (locks UI + spinner)               │
│                                         │                                         │
│                                         ▼                                         │
│  [ STAGE 2: NETWORK DISPATCH ]                                                    │
│  File 01: Complaints API Client (`src/api/complaints.js`)                         │
│  - Sanitizes whitespace; dispatches `POST /api/v1/tickets` via `apiClient`        │
│  - Centralized 10s timeout & Pydantic 422 error normalization                     │
│                                         │                                         │
│                                         ▼                                         │
│  [ STAGE 3: SUCCESS CONFIRMATION ]                                                │
│  File 03: Submission Success Modal (`SubmissionSuccessModal.jsx`)                 │
│  - Launches over blurred backdrop upon receiving HTTP 201 Created                 │
│  - Displays prominent monospace tracking code: `TICK-8F2D`                        │
│  - 1-Click Clipboard Copy with transient "Copied to Clipboard!" toast (2.5s)      │
│  - Direct action button: "Track Your Complaint Now" -> `/track?code=TICK-8F2D`    │
│                                         │                                         │
│                                         ▼                                         │
│  [ STAGE 4: SELF-SERVICE TRACKING WORKSTATION ]                                   │
│  File 04: Student Ticket Tracker (`TrackTicket.jsx`)                              │
│  - Search bar with auto-uppercase formatting & URL query synchronization         │
│  - 3-Step Visual Progress Stepper:                                                │
│      Node 1: [ SUBMITTED ]   -> Lodged in database & queued for triage            │
│      Node 2: [ IN_PROGRESS ] -> Assigned to field squad; repair underway          │
│      Node 3: [ RESOLVED ]    -> Work completed; staff closure report displayed    │
│  - Department badge, priority pill, timestamps, and staff resolution notes card   │
└─────────────────────────────────────────┼─────────────────────────────────────────┘
                                          │
                        HTTP JSON Network │ Proxy Bridge (/api/v1)
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                        BACKEND SUBSYSTEM (FastAPI + ASGI)                         │
│                                                                                   │
│  [ STAGE 5: TRANSPORT & INGESTION GATEWAY ]                                       │
│  File 07: Main App (`main.py`) & File 06: Router (`router.py`)                    │
│  - CORS middleware allowing frontend origin (`http://localhost:5173`)             │
│  - File 05: REST Endpoints (`POST /tickets`, `GET /tickets/{code}`)               │
│                                         │                                         │
│                                         ▼                                         │
│  [ STAGE 6: BOUNDARY VALIDATION & CODE GENERATION ]                               │
│  File 03: Schemas (`schemas/ticket.py`) & File 01: Generator (`code_generator.py`)│
│  - Pydantic V2 `TicketCreate` enforces non-empty constraints & lengths            │
│  - CSPRNG generates collision-resistant code: `TICK-` + 4 base-32 chars          │
│                                         │                                         │
│                                         ▼                                         │
│  [ STAGE 7: ROUTING & ATOMIC PERSISTENCE ]                                        │
│  File 02: Keyword Router (`keyword_router.py`) & File 04: Service (`ticket_service`)│
│  - Scans complaint tokens; matches department keywords (Electrical, Plumbing...)  │
│  - Instantiates `Ticket` ORM entity with initial status = `SUBMITTED`             │
│  - Injects session from Module M1 (`Depends(get_db)`); atomic commit to SQLite    │
│  - Serializes response to `TicketResponse` and returns `201 Created`              │
└─────────────────────────────────────────┼─────────────────────────────────────────┘
                                          │
                                          ▼
                         ┌─────────────────────────────────┐
                         │       SQLite Disk Storage       │
                         │      (smart_complaints.db)      │
                         └─────────────────────────────────┘
```

---

# 2. Complete Module M2 File Matrix

Module M2 is structured into dedicated **`backend/`** and **`frontend/`** documentation suites:

### Backend Subsystem (`ackend/`)

| Blueprint File | Target Source Component | Build Phase | Primary Role & Responsibility |
| :--- | :--- | :--- | :--- |
| [**`01_code_generator.md`**](backend/01_code_generator.md) | `backend/app/utils/code_generator.py` | Phase 1 (Parallel) | Generates collision-resistant tracking codes (`TICK-XXXX`) using OS entropy, excluding visually ambiguous characters (`0`, `1`, `O`, `I`). |
| [**`02_keyword_router.md`**](backend/02_keyword_router.md) | `backend/app/services/keyword_router.py` | Phase 1 (Parallel) | Rule-based keyword scanner mapping complaint vocabulary across the 6 campus departments with safe General Admin fallback. |
| [**`03_ticket_schemas.md`**](backend/03_ticket_schemas.md) | `backend/app/schemas/ticket.py` | Phase 1 (Parallel) | Pydantic V2 data contracts (`TicketCreate`, `TicketResponse`, `TicketFilter`) with whitespace stripping and length validators. |
| [**`04_ticket_service.md`**](backend/04_ticket_service.md) | `backend/app/services/ticket_service.py` | Phase 2 (Sequential) | Core business orchestrator coordinating code generation, keyword routing, ORM entity staging, and atomic commit transactions. |
| [**`05_endpoints_tickets.md`**](backend/05_endpoints_tickets.md) | `backend/app/api/v1/endpoints/tickets.py` | Phase 3 (Sequential) | REST API controllers exposing `POST /tickets`, `GET /tickets/{tracking_code}`, and `GET /tickets` with query filtering. |
| [**`06_api_router.md`**](backend/06_api_router.md) | `backend/app/api/v1/router.py` | Phase 4 (Sequential) | Aggregates endpoint routers into the centralized `/api/v1` router namespace. |
| [**`07_main_app.md`**](backend/07_main_app.md) | `backend/app/main.py` | Phase 4 (Sequential) | ASGI FastAPI application instance, CORS middleware configuration, lifespan startup events, and global exception handlers. |
| [**`08_verification_and_testing.md`**](backend/08_verification_and_testing.md) | Backend Verification Protocol | Phase 5 (Sequential) | 5-checkpoint verification protocol testing code collision resistance, keyword accuracy, Pydantic validation, and REST persistence. |

### Frontend Subsystem (`rontend/`)

| Blueprint File | Target Source Component | Build Phase | Primary Role & Responsibility |
| :--- | :--- | :--- | :--- |
| [**`01_complaints_api_client.md`**](frontend/01_complaints_api_client.md) | `frontend/src/api/complaints.js` | Phase 1 (Parallel) | Encapsulated HTTP transport module exposing `submitComplaint`, `fetchTicketByCode`, and `fetchRecentTickets` with uppercase code normalization. |
| [**`02_submit_complaint_page.md`**](frontend/02_submit_complaint_page.md) | `frontend/src/pages/SubmitComplaint.jsx` | Phase 2 (Parallel) | Controlled student grievance intake form with character counters, real-time validation error borders, and double-submit protection. |
| [**`03_submission_success_modal.md`**](frontend/03_submission_success_modal.md) | `frontend/src/components/SubmissionSuccessModal.jsx` | Phase 3 (Parallel) | Post-submission confirmation dialog with large monospace `TICK-XXXX` display, 1-click clipboard copy, and direct tracking link. |
| [**`04_track_ticket_page.md`**](frontend/04_track_ticket_page.md) | `frontend/src/pages/TrackTicket.jsx` | Phase 4 (Sequential) | Self-service tracking portal featuring 3-step visual progress stepper (`SUBMITTED` -> `IN_PROGRESS` -> `RESOLVED`), deep-link auto-fill, and staff notes. |
| [**`05_frontend_verification.md`**](frontend/05_frontend_verification.md) | Frontend Verification Protocol | Phase 5 (Sequential) | 5-checkpoint verification protocol testing form validation, live ticket creation, clipboard copy mechanics, stepper milestones, and 404 recovery. |

---

# 3. Execution Matrix: Concurrency & Dependency Flowchart (DAG)

To allow our 5-student engineering team to develop Module M2 concurrently without blocking each other, tasks are separated into **5 Execution Phases** across parallel Backend and Frontend tracks:

```
PHASE 1 (Zero-Dependency Services & Transports - Parallel)
┌──────────────────────────────────────────────┐       ┌──────────────────────────────────────────────┐
│ Track A (Dev B): Core Engines & Schemas      │       │ Track B (Dev C): Domain Network Client       │
│ File 01: `code_generator.py` (CSPRNG)        │       │ File 01: `src/api/complaints.js`             │
│ File 02: `keyword_router.py` (Taxonomy)      │       │ (Encapsulates submitComplaint, fetchByCode)  │
│ File 03: `ticket_schemas.py` (Pydantic V2)   │       │                                              │
└──────────────────────┬───────────────────────┘       └──────────────────────┬───────────────────────┘
                       │                                                      │
PHASE 2 (Business Logic Controller & Intake Form - Parallel)                  │
┌──────────────────────▼───────────────────────┐       ┌──────────────────────▼───────────────────────┐
│ Track A (Dev B): Service Orchestration       │       │ Track B (Dev C): Complaint Intake Page       │
│ File 04: `ticket_service.py`                 │       │ File 02: `SubmitComplaint.jsx`               │
│ (Integrates code gen, router, ORM commits)   │       │ (Controlled inputs, validation state machine)│
└──────────────────────┬───────────────────────┘       └──────────────────────┬───────────────────────┘
                       │                                                      │
PHASE 3 (REST Endpoints & Confirmation Modal - Parallel)                      │
┌──────────────────────▼───────────────────────┐       ┌──────────────────────▼───────────────────────┐
│ Track A (Dev B): Presentation Controllers    │       │ Track B (Dev C): Confirmation Modal Dialog   │
│ File 05: `endpoints/tickets.py`              │       │ File 03: `SubmissionSuccessModal.jsx`        │
│ (POST /tickets, GET /tickets/{code})         │       │ (Monospace TICK-XXXX, 1-click clipboard copy)│
└──────────────────────┬───────────────────────┘       └──────────────────────┬───────────────────────┘
                       │                                                      │
PHASE 4 (Application Wiring & Ticket Tracking Portal - Parallel)              │
┌──────────────────────▼───────────────────────┐       ┌──────────────────────▼───────────────────────┐
│ Track A (Dev B): Router & ASGI Assembly      │       │ Track B (Dev C): Student Tracking Portal     │
│ File 06: `api/v1/router.py` (Mounting)       │       │ File 04: `TrackTicket.jsx`                   │
│ File 07: `main.py` (CORS + Lifespan)         │       │ (3-step progress stepper, deep-link parsing) │
└──────────────────────┬───────────────────────┘       └──────────────────────┬───────────────────────┘
                       │                                                      │
PHASE 5 (Full-Stack Quality Gate & Integration Verification)                  │
┌──────────────────────▼──────────────────────────────────────────────────────▼───────────────────────┐
│ Entire Engineering Team:                                                                            │
│ File 08 (Backend): `08_verification_and_testing.md` (Code collision, keyword tests, REST persistence)│
│ File 05 (Frontend): `05_frontend_verification.md` (Form validation, modal copy, stepper milestones) │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 4. Future AI Integration Architecture & V2 Drop-In Roadmap

While Version 1.0 utilizes a deterministic keyword matching engine and local state machines, Module M2 is architected to support Version 2 (V2) AI integration (Gemini API contextual understanding and multimodal intake) as a seamless drop-in upgrade:

### 1. Ingestion & Contextual Keyword Extraction (Backend Hooks)
* AI Contextual Extractor Drop-In: The `keyword_router.py` engine (`02_keyword_router.md`) defines a standardized interface (`route_ticket(title, description)`). In V2, an asynchronous Gemini 1.5 Flash client can be injected into this service without changing the signature. The model will analyze nuanced complaint descriptions (e.g. "The wooden desk near the electrical switch is smoking") to extract contextual intent, distinguishing electrical fire hazards from carpentry damage.
* Zero-Latency Deterministic Fallback: If external AI API rate limits are exceeded (`HTTP 429`) or network timeouts occur, `ticket_service.py` automatically falls back to our V1 keyword router, guaranteeing 100% operational uptime.
* Semantic Duplicate Detection: In V2, `create_ticket()` will invoke a semantic similarity check against open tickets in the same physical building, preventing duplicate dispatches for the same incident.

### 2. Intelligent Student Portals & Real-Time Triage (Frontend Hooks)
* Live AI Triage Card Integration: `SubmitComplaint.jsx` includes a designated layout anchor to embed `LiveTriageCard.jsx` (Module M3), providing students with real-time feedback on predicted department routing and calculated urgency as they type.
* AI-Assisted Complaint Drafting: A "Refine with AI" prompt button in the complaint form will allow students to summarize rambling descriptions into concise, actionable maintenance reports.
* Multimodal Photo Verification: The complaints API client and form include architecture hooks to accept camera photo uploads, transmitting images to Gemini Vision for automated physical defect classification.

---

# 5. Standard 6-Section Blueprint Guide

To maintain engineering consistency across the team, every blueprint in Module M2 strictly implements the standardized 6-section structure:
* **Section 1: Standard Purpose & Industry Role**: Dual-perspective analysis covering standard enterprise use cases, our platform-specific implementation, future AI roadmap hooks, cross-component interactions, and the fundamental problem it solves.
* **Section 2: What Must Be in This File & Why Each Item Is Needed**: Exhaustive line-by-line specification of every class, function, parameter, validation rule, and design token required in the file.
* **Section 3: Component Life-Cycle: Input, Process, Output (IPO Table)**: Step-by-step lifecycle table detailing raw inputs, internal computational transformations, and resulting output artifacts.
* **Section 4: Flexibility & Modification Guide**: Strict demarcations between 🟢 *Safe to Modify & Customize* elements and 🔴 *Strict Non-Negotiables*.
* **Section 5: Advanced Concepts Explained**: Deep first-principles explanations of computer science, operating systems, and web architectural concepts (such as CSPRNG entropy, Pydantic V2 Rust core validation, Controlled Form State Machines, and URL Search Parameter synchronization).
* **Section 6: Definition of Done & Verification Protocol**: Observable checklists, automated terminal commands, and complete troubleshooting matrices with root causes and exact resolution procedures.
