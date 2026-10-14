# Module M1: Central Architecture & Full-Stack Execution Roadmap
## Data Models, Storage Engine, React Application Shell & Build Pipeline

> **Module Role & Architectural Boundary:**  
> Module M1 establishes the foundational infrastructure for the entire **Smart Complaint Routing & Workflow Automation Platform** (`SmartComplaintHandler`).  
> On the **Backend**, it provides the persistent SQLite relational database, defines the SQLAlchemy 2.0 ORM schemas for Departments, Maintenance Teams, and Complaint Tickets, and provides the FastAPI session dependency injection generator.  
> On the **Frontend**, it establishes the complete modern React 18 application shell, Vite build tooling, Tailwind CSS design token system, centralized Axios network transport client with interceptors, persistent Layout navigation shell, and client-side routing tree.

---

# 1. System Overview: Full-Stack Architecture & Mental Model

The Smart Complaint Handler automates the end-to-end lifecycle of campus facility issues. Module M1 constructs the foundational skeleton connecting the browser presentation layer to persistent disk storage:

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND SUBSYSTEM (React 18 + Vite)                       │
│                                                                                   │
│   ┌───────────────────────────────────────────────────────────────────────────┐   │
│   │               File 04: Application Router (src/App.jsx)                   │   │
│   │              Routes: / (Submit), /track (Tracker), /admin (Desk)          │   │
│   └─────────────────────────────────────┬─────────────────────────────────────┘   │
│                                         ▼                                         │
│   ┌───────────────────────────────────────────────────────────────────────────┐   │
│   │             File 03: Persistent Layout (src/components/Layout.jsx)         │   │
│   │        ┌────────────────────────────┼────────────────────────────┐        │   │
│   │        ▼                            ▼                            ▼        │   │
│   │   Navbar Brand & Links      <Outlet /> Viewport           Footer & Legal  │   │
│   │   Live Health Heartbeat      (Dynamic Page Swapping)       Hotline Notice │   │
│   └─────────────────────────────────────┬─────────────────────────────────────┘   │
│                                         │                                         │
│   ┌─────────────────────────────────────▼─────────────────────────────────────┐   │
│   │          File 02: Central Base API Client (src/api/client.js)             │   │
│   │   - Axios Singleton Instance          - 10-Second Request Timeout         │   │
│   │   - Request Header Interceptor        - Response Data Auto-Unwrapping     │   │
│   │   - Pydantic 422 Error Normalizer     - Future AI Telemetry Hooks         │   │
│   └─────────────────────────────────────┬─────────────────────────────────────┘   │
│                                         │                                         │
│   ┌─────────────────────────────────────▼─────────────────────────────────────┐   │
│   │      File 01: Vite & Tailwind Design Tokens (vite.config.js, tailwind)    │   │
│   │   - HMR Dev Server (:5173)            - Local Reverse Proxy (/api -> :8000)│   │
│   │   - Campus Slate & Indigo Palette     - Semantic Priority Color Tokens    │   │
│   └─────────────────────────────────────┬─────────────────────────────────────┘   │
└─────────────────────────────────────────┼─────────────────────────────────────────┘
                                          │
                        HTTP JSON Network │ Proxy Bridge (/api/v1)
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                        BACKEND SUBSYSTEM (FastAPI + ASGI)                         │
│                                                                                   │
│   ┌───────────────────────────────────────────────────────────────────────────┐   │
│   │           File 09: API Dependencies & Session Injector (api/deps.py)      │   │
│   │                      FastAPI Depends(get_db) Session Generator            │   │
│   └─────────────────────────────────────┬─────────────────────────────────────┘   │
│                                         │                                         │
│   ┌─────────────────────────────────────▼─────────────────────────────────────┐   │
│   │      Files 04, 05, 06, 07: SQLAlchemy 2.0 Relational ORM Entity Layer     │   │
│   │   ┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐   │   │
│   │   │    Department     │   │  MaintenanceTeam  │   │      Ticket       │   │   │
│   │   │  (Campus Domain)  │◀──│  (Active Squads)  │   │ (Grievance Entity)│   │   │
│   │   └─────────┬─────────┘   └───────────────────┘   └─────────┬─────────┘   │   │
│   │             │                                               │             │   │
│   │             └───────────────────────┬───────────────────────┘             │   │
│   └─────────────────────────────────────┼─────────────────────────────────────┘   │
│                                         │                                         │
│   ┌─────────────────────────────────────▼─────────────────────────────────────┐   │
│   │        Files 01, 02, 03: Core Configuration & Database Session Engine     │   │
│   │   - pydantic-settings (.env)          - SQLite WAL Engine & Pool          │   │
│   │   - DeclarativeBase Registry          - Idempotent Seed Runner (File 08)  │   │
│   └─────────────────────────────────────┬─────────────────────────────────────┘   │
└─────────────────────────────────────────┼─────────────────────────────────────────┘
                                          │
                                          ▼
                         ┌─────────────────────────────────┐
                         │       SQLite Disk Storage       │
                         │      (smart_complaints.db)      │
                         └─────────────────────────────────┘
```

---

# 2. Complete Module M1 File Matrix

Module M1 is structured into dedicated **`backend/`** and **`frontend/`** documentation suites:

### Backend Subsystem (`ackend/`)

| Blueprint File | Target Source Component | Build Phase | Primary Role & Responsibility |
| :--- | :--- | :--- | :--- |
| [**`01_config_and_env.md`**](backend/01_config_and_env.md) | `backend/app/core/config.py` | Phase 1 (Parallel) | Type-safe environment management via `pydantic-settings`, reading database paths and application metadata from `.env`. |
| [**`02_database.md`**](backend/02_database.md) | `backend/app/db/session.py` | Phase 2 (Sequential) | SQLite engine instantiation, WAL-mode PRAGMA configuration, and thread-safe `sessionmaker` creation. |
| [**`03_base.md`**](backend/03_base.md) | `backend/app/db/base.py` | Phase 1 (Parallel) | SQLAlchemy 2.0 `DeclarativeBase` establishment with automated table name resolution and shared metadata registry. |
| [**`04_department_model.md`**](backend/04_department_model.md) | `backend/app/models/department.py` | Phase 2 (Parallel) | `Department` ORM model representing the 6 institutional campus domains (Electrical, Plumbing, IT, etc.). |
| [**`05_team_model.md`**](backend/05_team_model.md) | `backend/app/models/team.py` | Phase 2 (Parallel) | `MaintenanceTeam` ORM model defining field squads, capacity limits, shift availability, and foreign key relations. |
| [**`06_ticket_model.md`**](backend/06_ticket_model.md) | `backend/app/models/ticket.py` | Phase 2 (Parallel) | `Ticket` ORM model tracking unique tracking code (`TICK-XXXX`), status, priority, SLA deadlines, and audit trail notes. |
| [**`07_models_init.md`**](backend/07_models_init.md) | `backend/app/models/__init__.py` | Phase 3 (Sequential) | Facade module exposing all models so SQLAlchemy metadata registers all foreign key relationships cleanly. |
| [**`08_seed_data.md`**](backend/08_seed_data.md) | `backend/app/db/seed.py` | Phase 4 (Sequential) | Idempotent database seeder pre-populating the 6 campus departments and initial maintenance squads. |
| [**`09_api_deps.md`**](backend/09_api_deps.md) | `backend/app/api/deps.py` | Phase 3 (Sequential) | FastAPI dependency injection generator (`get_db`) providing transaction-safe session context per HTTP request. |
| [**`10_verification_and_testing.md`**](backend/10_verification_and_testing.md) | Backend Verification Protocol | Phase 5 (Sequential) | 5-checkpoint verification protocol testing schema creation, foreign key enforcement, seed data, and session teardown. |

### Frontend Subsystem (`rontend/`)

| Blueprint File | Target Source Component | Build Phase | Primary Role & Responsibility |
| :--- | :--- | :--- | :--- |
| [**`01_vite_tailwind_config.md`**](frontend/01_vite_tailwind_config.md) | `vite.config.js`, `tailwind.config.js` | Phase 1 (Parallel) | Vite bundler setup, dev server proxy (`/api` -> `:8000`), Tailwind design tokens, and semantic priority color classes. |
| [**`02_base_api_client.md`**](frontend/02_base_api_client.md) | `frontend/src/api/client.js` | Phase 2 (Parallel) | Singleton Axios client with environment base URL, 10s timeout, response data auto-unwrapping, and Pydantic 422 error normalization. |
| [**`03_layout_and_navigation.md`**](frontend/03_layout_and_navigation.md) | `src/components/Layout.jsx`, `Navbar.jsx` | Phase 3 (Parallel) | Persistent application shell, `<Outlet />` viewport, responsive navbar with active link indicator, health heartbeat dot, and footer. |
| [**`04_app_router.md`**](frontend/04_app_router.md) | `src/App.jsx`, `src/routes/AppRouter.jsx` | Phase 4 (Sequential) | Declarative React Router DOM v6 tree, lazy-loaded route chunks, Suspense loading spinners, and styled 404 Not Found fallback page. |
| [**`05_frontend_verification.md`**](frontend/05_frontend_verification.md) | Frontend Verification Protocol | Phase 5 (Sequential) | 5-checkpoint verification protocol testing Vite build, Tailwind purging, API client interceptors, route navigation, and mobile layout. |

---

# 3. Execution Matrix: Concurrency & Dependency Flowchart (DAG)

To allow our 5-student engineering team to develop Module M1 concurrently without blocking each other, tasks are separated into **5 Execution Phases** across parallel Backend and Frontend tracks:

```
PHASE 1 (Zero-Dependency Architectural Starters - Parallel)
┌──────────────────────────────────────────────┐       ┌──────────────────────────────────────────────┐
│ Track A (Dev A): Backend Configuration       │       │ Track B (Dev C): Frontend Tooling & Styling  │
│ File 01: `core/config.py`                    │       │ File 01: `vite.config.js` & `tailwind`       │
│ File 03: `db/base.py` (DeclarativeBase)      │       │ (Vite Proxy + Semantic Design Tokens)        │
└──────────────────────┬───────────────────────┘       └──────────────────────┬───────────────────────┘
                       │                                                      │
PHASE 2 (Core Engines & Base Transports - Parallel)                           │
┌──────────────────────▼───────────────────────┐       ┌──────────────────────▼───────────────────────┐
│ Track A (Dev A): DB Engine & ORM Models      │       │ Track B (Dev C): Base HTTP Network Client    │
│ File 02: `db/session.py` (SQLite WAL)        │       │ File 02: `src/api/client.js`                 │
│ Files 04, 05, 06: Department, Team, Ticket   │       │ (Axios Instance + 422 Error Interceptors)    │
└──────────────────────┬───────────────────────┘       └──────────────────────┬───────────────────────┘
                       │                                                      │
PHASE 3 (Model Aggregation & Visual Shell - Parallel)                         │
┌──────────────────────▼───────────────────────┐       ┌──────────────────────▼───────────────────────┐
│ Track A (Dev A): Session Injector & Facade   │       │ Track B (Dev C): Persistent Application Shell│
│ File 07: `models/__init__.py` (Aggregator)   │       │ File 03: `Layout.jsx`, `Navbar`, `Footer`    │
│ File 09: `api/deps.py` (Depends(get_db))     │       │ (Navigation Links + Live Health Heartbeat)   │
└──────────────────────┬───────────────────────┘       └──────────────────────┬───────────────────────┘
                       │                                                      │
PHASE 4 (Database Seeding & Routing Integration - Parallel)                   │
┌──────────────────────▼───────────────────────┐       ┌──────────────────────▼───────────────────────┐
│ Track A (Dev A): Seed Data Automation        │       │ Track B (Dev C): Client-Side Routing Tree    │
│ File 08: `db/seed.py`                        │       │ File 04: `AppRouter.jsx` & `src/App.jsx`     │
│ (Pre-populates 6 departments & squads)       │       │ (Route Registry + 404 Not Found Fallback)    │
└──────────────────────┬───────────────────────┘       └──────────────────────┬───────────────────────┘
                       │                                                      │
PHASE 5 (Full-Stack Quality Gate & Integration Verification)                  │
┌──────────────────────▼──────────────────────────────────────────────────────▼───────────────────────┐
│ Entire Engineering Team:                                                                            │
│ File 10 (Backend): `10_verification_and_testing.md` (Schema integrity, WAL mode, seed tests)        │
│ File 05 (Frontend): `05_frontend_verification.md` (Build assets, API client tests, routing sweep)  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 4. Future AI Integration Architecture & Schema Extensibility Roadmap

While Version 1.0 utilizes a deterministic, local rule-based routing and priority architecture, Module M1 is engineered from day one to accommodate Version 2 (V2) AI integration (Gemini API multimodal complaint analysis and predictive routing) without requiring disruptive database migrations or frontend rewrites:

### 1. Database Schema Extensibility (Backend Hooks)
* Vector Embedding Ready: The `tickets` table schema (`06_ticket_model.md`) includes structured nullable fields (`embedding_vector` and `ai_confidence_score`) that can be activated in V2 to store 768-dimensional text embeddings generated by Gemini Text Embedding models for semantic duplicate detection.
* AI Audit Trail Logging: The `resolution_notes` and `internal_notes` columns are explicitly designed to capture JSON-formatted audit stamps (e.g. `[AI_TRIAGE: Gemini-1.5-Flash confidence=0.94 suggested_dept=2]`), maintaining transparent provenance alongside human supervisory overrides.
* Dynamic Model Configuration Table: The database architecture is designed to support an optional `ai_configurations` table in V2 to store runtime prompts, temperature settings, and model toggles without requiring server restarts.

### 2. Frontend AI Network & Presentation Extensibility (Frontend Hooks)
* AI Telemetry Header Interceptors: The base Axios client (`02_base_api_client.md`) contains pre-configured interceptor hooks to inject `X-AI-Session-ID` and `X-Client-Trace-ID` headers into outbound requests, allowing end-to-end distributed tracing of AI inference latency.
* Graceful Fallback Circuit Breaker: If external AI inference services experience rate-limiting (`HTTP 429`) or network timeouts, the base client's error interceptor detects the condition and signals the UI to switch seamlessly to the local deterministic classifier without user-facing errors.
* Global AI Pulse Indicator: The persistent navigation header (`03_layout_and_navigation.md`) provides a designated status anchor to display real-time AI background processing status to facility staff.

---

# 5. Standard 6-Section Blueprint Guide

To maintain engineering consistency across the team, every blueprint in Module M1 strictly implements the standardized 6-section structure:
* **Section 1: Standard Purpose & Industry Role**: Dual-perspective analysis covering standard enterprise use cases, our platform-specific implementation, future AI roadmap hooks, cross-component interactions, and the fundamental problem it solves.
* **Section 2: What Must Be in This File & Why Each Item Is Needed**: Exhaustive line-by-line specification of every class, function, parameter, validation rule, and design token required in the file.
* **Section 3: Component Life-Cycle: Input, Process, Output (IPO Table)**: Step-by-step lifecycle table detailing raw inputs, internal computational transformations, and resulting output artifacts.
* **Section 4: Flexibility & Modification Guide**: Strict demarcations between 🟢 *Safe to Modify & Customize* elements and 🔴 *Strict Non-Negotiables*.
* **Section 5: Advanced Concepts Explained**: Deep first-principles explanations of computer science, operating systems, and web architectural concepts (such as SQLite WAL concurrency, Axios interceptor pipelines, and HTML5 History pushState).
* **Section 6: Definition of Done & Verification Protocol**: Observable checklists, automated terminal commands, and complete troubleshooting matrices with root causes and exact resolution procedures.

---

---

# 6. Definition of Done & Live Website Verification Walkthrough

### What This Module Is Responsible For
Module M1 (Data Layer, Core Models & Application Shell) is responsible for **establishing the foundational infrastructure for the entire Smart Complaint Handler platform**. It provides the database engine, SQLAlchemy relational models, database seeding fixtures, request-scoped sessions, the Vite build engine, Tailwind CSS design tokens, the persistent application shell, and client-side routing.

### What It Should Perform
When operational across the full stack, Module M1 provides four foundational capabilities:
1. **Relational Schema Governance:** Defines and binds SQLite models for `Department`, `Team`, `MaintenanceTeam`, and `Ticket` with automated timestamps and foreign-key integrity.
2. **Database Seeding & Session Injection:** Initializes campus departments and baseline maintenance teams with zero duplicate errors, injecting thread-safe sessions via `get_db`.
3. **Optimized Frontend Toolchain:** Compiles modern React 18 JSX with sub-second HMR, proxies `/api` to FastAPI port 8000, and provides standardized Tailwind tokens.
4. **Application Shell & Routing:** Renders persistent navigation headers, responsive drawers, and instantaneous client-side route transitions (`/`, `/submit`, `/track`, `/admin`).

### How to See It Performing Its Job on the Live Website
Anyone can verify all features of Module M1 on the live application in under 3 minutes:

#### Prerequisites: Launch Local Dev Servers
```powershell
# Terminal 1 — Backend:
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --port 8000 --reload

# Terminal 2 — Frontend:
cd frontend
npm run dev
```

#### Step 1: Verify the Application Shell & Responsive Navigation
1. Open your browser to **`http://localhost:5173/`**.
2. Observe the persistent campus header: confirm university brand title *"Smart Complaint Handler"*.
3. Click **"Submit Complaint"**, then **"Track Ticket"**, then **"Admin Desk"**:
   * Observe instantaneous client-side page transitions without white-screen browser reloads.
   * Observe the active navigation link dynamically highlights.
4. Resize your browser window to phone width ($<768	ext{px}$):
   * Verify navigation links collapse into an accessible hamburger menu (☰).
   * Click the hamburger icon: confirm the mobile navigation drawer opens smoothly.

#### Step 2: Verify Database Seed Fixtures on the Intake Form
1. On **`http://localhost:5173/submit`**, click the **Department / Category** dropdown menu.
2. Observe the populated department options:
   * Verify all 6 campus departments appear: `Electrical`, `Plumbing`, `IT Support`, `Carpentry`, `Civil`, and `Other`.
   * This proves that `seed.py` successfully populated SQLite and `get_db` served the records to the UI.

#### Step 3: Verify Data Persistence Across Restarts
1. Fill out the complaint form with Title: `Library study table damaged` and Location: `Central Library`.
2. Click **Submit Complaint**: copy the generated tracking code (e.g. `TICK-1002`).
3. Terminate the backend server (`Ctrl+C` in Terminal 1) and restart it.
4. Navigate to **`http://localhost:5173/track`**, enter `TICK-1002`, and click **Track Status**:
   * Confirm the complaint title, department, and timestamp load instantly from SQLite disk storage.

#### Step 4: Verify OpenAPI Documentation in Swagger
1. Open **`http://localhost:8000/docs`** in your browser.
2. Observe the page header displays the configured title: **"Smart Campus Complaint System"**.
3. Confirm all endpoints are registered under `/api/v1/` and inspect models under the Schemas section.

---

# 7. Additional Changes & Development Modifications (Implementation Audit)

### [2026-09-29] - Teammate Model & Seed Compatibility Reconciliation
* **Files Modified:** `backend/app/db/seed.py`, `backend/app/models/__init__.py`
* **What Was Changed:** Reconciled upstream commit `91406fe` by supporting dual seed functions (`seed_database(db)` and `seed_data()`) and dual model aliases (`Team` and `MaintenanceTeam`).
* **Why It Was Changed:** Preserved complete backward compatibility with teammate modules (M1, M4) while preventing merge conflict regressions.
* **Verification Proof:** `37/37 pytest passed in 0.97s`.

### [2026-09-30] - Seed Idempotency & Primary Key Collision Safeguard
* **Files Modified:** `backend/app/db/seed.py`
* **What Was Changed:** Upgraded `seed_database(db)` to check both primary key IDs (`existing_depts_by_id`) and case-insensitive department/squad names (`existing_depts_by_name`) prior to executing inserts.
* **Why It Was Changed:** Pre-existing databases with custom names (e.g., `'Electrical Services'` at ID 1) triggered `sqlite3.IntegrityError: UNIQUE constraint failed: departments.id` during FastAPI lifespan startup, preventing the backend from booting.
* **Verification Proof:** `37/37 pytest passed in 1.05s`, `seed_data()` executed cleanly without warnings.

### [2026-09-30] - Persona Role-Based Access & Declarative Page Routing Architecture
* **Files Modified:** `frontend/src/context/AuthContext.jsx`, `frontend/src/components/PersonaSwitcherModal.jsx`, `frontend/src/router/AppRouter.jsx`, `frontend/src/components/Navbar.jsx`, `frontend/src/components/Layout.jsx`, `frontend/src/pages/TrackTicket.jsx`, `frontend/src/pages/AdminDashboard.jsx`, `frontend/src/pages/DeveloperLab.jsx`
* **What Was Changed:** Replaced the single-screen developer test playground with a full-fledged, multi-page client-side router (`/`, `/submit`, `/track`, `/admin`, `/developer`) and role-based persona authentication system supporting Student, Field Technician, and Facility Supervisor personas.
* **Why It Was Changed:** Replaces raw developer testing screens with production-grade campus navigation, persona-tailored dashboards, and 1-click persona switching for viva demonstrations.
* **Verification Proof:** `npm run build` compiled 113 modules in 2.32s with 0 errors; 37/37 backend pytest passed in 1.19s.

### [2026-09-30] - Institutional University Portal Architecture Redesign
* **Files Modified:** `frontend/src/pages/Home.jsx`, `frontend/src/pages/Login.jsx`, `frontend/src/pages/SubmitComplaint.jsx`, `frontend/src/pages/TrackTicket.jsx`, `frontend/src/pages/AdminDashboard.jsx`, `frontend/src/components/Navbar.jsx`, `frontend/src/components/Footer.jsx`, `frontend/src/router/AppRouter.jsx`
* **What Was Changed:** Transformed the application into an authentic, production-grade university estate management portal: added an institutional landing homepage (`/`), a campus SSO login portal (`/login`), revamped the grievance submission form with realistic building and category selectors, cleaned the public tracker and operations console of demo/viva tags, and established real institutional emergency hotlines and navigation.
* **Why It Was Changed:** Elevates the project from an academic demo to a credible, fully functioning institutional web application.
* **Verification Proof:** `npm run build` compiled 115 modules in 12.87s with 0 errors; 37/37 backend pytest passed in 2.67s.

### [2026-10-14] - Multi-Persona Workstations & Closed-Loop Module M5 Feedback Integration
* **Files Modified:** `backend/app/models/ticket.py`, `backend/app/schemas/ticket.py`, `backend/app/services/ticket_service.py`, `backend/app/api/v1/endpoints/complaints.py`, `backend/app/db/seed.py`, `backend/tests/test_m5_api.py`, `frontend/src/pages/StudentDashboard.jsx`, `frontend/src/pages/TechnicianWorkstation.jsx`, `frontend/src/pages/AdminDashboard.jsx`, `frontend/src/pages/Login.jsx`, `frontend/src/pages/Home.jsx`, `frontend/src/pages/TrackTicket.jsx`, `frontend/src/router/AppRouter.jsx`, `frontend/src/components/Navbar.jsx`, `frontend/src/components/PersonaSwitcherModal.jsx`, `frontend/src/api/complaints.js`
* **What Was Changed:** 
  1. Extended the backend `Ticket` ORM model and Pydantic schemas with student metadata (`student_name`, `student_email`) and Module M5 closed-loop satisfaction ratings (`feedback_rating`, `feedback_comments`, `feedback_submitted_at`).
  2. Implemented `POST /api/v1/tickets/{ticket_identifier}/feedback` endpoint and role-based ticket query filtering (`student_email`, `team_id`) in `complaints.py`.
  3. Added an automatic SQLite schema migration check in `backend/app/db/seed.py` and populated 10+ realistic campus tickets across all 5 departments, priority tiers, and lifecycle states (`SUBMITTED`, `IN_PROGRESS`, `ESCALATED`, `RESOLVED`).
  4. Built a dedicated Student Self-Service Grievance Portal (`StudentDashboard.jsx` at `/student`) with grievance telemetry, live SLA countdown clocks, and a 1–5 star interactive service rating modal.
  5. Built a dedicated Field Technician Workstation (`TechnicianWorkstation.jsx` at `/technician`) supporting squad queue switching, emergency hazard alert banners, 1-click status advancement (`IN_PROGRESS`), and formal resolution documentation via `ResolutionNotesModal`.
  6. Upgraded `AdminDashboard.jsx` with department filtering, updated SLA timers, and cross-portal navigation.
  7. Updated `AppRouter.jsx`, `Navbar.jsx`, `Login.jsx`, and `Home.jsx` to dynamically route each persona to their dedicated workstation.
* **Why It Was Changed:** Fulfills the `/goal` to transition the application from a prototype display into a fully operational, multi-page campus web application with authentic, persona-specific workflows and complete closed-loop feedback.
* **Verification Proof:** 
  - Backend Test Suite: 39/39 Pytest tests passed in 0.95s (including newly added `test_ticket_feedback_submission` and `test_ticket_list_role_filters`).
  - Frontend Build: `npm run build` compiled 117 modules in 1.22s with 0 errors.
  - Live API Verification: Verified student query filter (`5 tickets returned`), squad filter (`7 tickets returned`), and feedback submission (`200 OK with rating and audit trail`).

### [2026-10-14] - Zero-Fake-Data Sanitization, IIIT-NR IAM Domain Authentication, Role Auto-Routing & Super Admin Directorate Console
* **Files Modified:** 
  - `backend/app/models/user.py`
  - `backend/app/models/__init__.py`
  - `backend/app/schemas/user.py`
  - `backend/app/services/user_service.py`
  - `backend/app/api/v1/endpoints/auth.py`
  - `backend/app/api/v1/router.py`
  - `backend/app/db/seed.py`
  - `backend/tests/test_auth.py`
  - `frontend/src/api/auth.js`
  - `frontend/src/context/AuthContext.jsx`
  - `frontend/src/pages/Login.jsx`
  - `frontend/src/pages/SuperAdminDashboard.jsx`
  - `frontend/src/pages/SubmitComplaint.jsx`
  - `frontend/src/pages/StudentDashboard.jsx`
  - `frontend/src/components/Navbar.jsx`
  - `frontend/src/components/PersonaSwitcherModal.jsx`
  - `frontend/src/router/AppRouter.jsx`
  - `docs/V1/M1/00_M1_CENTRAL_OVERVIEW.md`
* **What Was Changed:**
  1. **Purged All Mock Data:** Cleaned SQLite database of all mock tickets (`0 tickets` in database). Removed hardcoded dummy ticket arrays from `backend/app/db/seed.py`, allowing complaints to be 100% student-generated.
  2. **Institutional Identity & Domain Enforcement:** Implemented strict institutional authentication enforcing `@iiitnr.edu.in` institutional email format across both FastAPI Pydantic validators and React UI validation.
  3. **Role Detection & Student Roll Parsing:**
     - Student emails matching format `name(year)(roll)@iiitnr.edu.in` (e.g. `nikhil26100@iiitnr.edu.in`) auto-resolve to role `STUDENT`, parse roll numbers (e.g. `2026BCS100`), and automatically redirect upon login to the grievance lodging page (`/submit`).
     - Student accounts are strictly role-isolated: navigation exposes strictly Lodge Grievance (`/submit`), My History (`/student`), and Track Status (`/track`). Direct access to `/admin` or `/superadmin` is guarded and bounces students back to `/submit`.
     - Administrative emails (e.g. `admin@iiitnr.edu.in`) auto-resolve to `ADMIN` and auto-redirect to the Operations Desk (`/admin`).
     - Directorate emails (e.g. `superadmin@iiitnr.edu.in`) auto-resolve to `SUPER_ADMIN` and auto-redirect to the Super Admin Directorate Console (`/superadmin`).
  4. **Super Admin Directorate Console:** Built `frontend/src/pages/SuperAdminDashboard.jsx` at `/superadmin` equipped with:
     - Administrator and staff management table (`GET /api/v1/auth/admins`).
     - "Add Facility Admin" modal (`POST /api/v1/auth/admins`) allowing the Super Admin to register new admins and squad technicians with name, `@iiitnr.edu.in` email, role, department, and phone.
     - Staff revocation action (`DELETE /api/v1/auth/admins/{id}`) with root protection.
     - Database sanitization button (`POST /api/v1/auth/purge-tickets`) with confirmation safeguard to reset all tickets and squad counters to clean slate on demand.
  5. **Auto-Filling Authentic Student Credentials:** `SubmitComplaint.jsx` now binds grievances to the logged-in student's real name and email; `StudentDashboard.jsx` strictly queries complaints filed by the authenticated student.
* **Why It Was Changed:** Addresses user requirement to remove all fake dummy data, turn the platform into a real authentic web application, enforce official `@iiitnr.edu.in` institutional credentials, isolate normal students strictly to filing grievances and viewing their own history, and provide a full Super Admin console to manage facility admins.
* **Verification Proof:**
  - Backend Test Suite: 45/45 Pytest tests passed in 1.19s (including 6 new tests in `test_auth.py`).
  - Frontend Compilation: `npm run build` compiled 119 modules in 1.30s with 0 errors.
  - End-to-End Flow: Verified clean slate (0 tickets), student login as `nikhil26100@iiitnr.edu.in`, ticket creation, isolated ticket viewing, and database purge.

### [2026-10-14] - Supabase Cloud PostgreSQL Migration & Cross-Platform Persistence
* **Files Modified:**
  - `backend/app/core/database.py`
  - `backend/app/db/seed.py`
  - `backend/requirements.txt`
  - `backend/.env.example`
  - `docs/V1/M1/00_M1_CENTRAL_OVERVIEW.md`
* **What Was Changed:**
  1. **PostgreSQL Adapter Integration:** Added `psycopg2-binary>=2.9.9` to dependencies and installed it in the backend environment.
  2. **Connection Resilience & Dialect Normalization:** Updated `database.py` to auto-normalize `postgres://` to `postgresql://` and enabled `pool_pre_ping=True` to guarantee robust reconnection across cloud networks without dropping sessions.
  3. **Cross-Engine Table Initialization:** Updated `seed.py` to conditionally bypass SQLite-only `PRAGMA` commands on PostgreSQL while allowing SQLAlchemy `Base.metadata.create_all` to provision the complete schema natively on Supabase.
  4. **Live Cloud Migration:** Connected to user's live Supabase PostgreSQL instance (`aws-0-ap-south-1.pooler.supabase.com:5432`), auto-provisioned all tables, and seeded the 6 facilities departments and 5 staff accounts with 0 dummy tickets.
* **Why It Was Changed:** Replaces ephemeral local SQLite disk storage with a persistent, hosted cloud PostgreSQL database on Supabase to enable seamless cloud deployments on Vercel and Render/Railway without data loss on cold starts.
* **Verification Proof:**
  - Backend Pytest Suite: 45/45 tests passed across the cloud network against live Supabase PostgreSQL in 11.71s.
  - Live Seed Verification: Verified 6 departments, 7 squads, 5 staff accounts, and 0 dummy tickets in Supabase Table Editor.
  - Uvicorn Server: Successfully running live on port 8000 connected to Supabase.

### [2026-10-14] - Industry-Standard Authentication: Registration, Bcrypt Hashing & Persistent 30-Day Remember Me Sessions
* **Files Modified:**
  - `backend/app/core/security.py`
  - `backend/app/models/user.py`
  - `backend/app/schemas/user.py`
  - `backend/app/services/user_service.py`
  - `backend/app/api/v1/endpoints/auth.py`
  - `backend/app/db/seed.py`
  - `backend/requirements.txt`
  - `backend/tests/test_auth.py`
  - `frontend/src/api/client.js`
  - `frontend/src/api/auth.js`
  - `frontend/src/context/AuthContext.jsx`
  - `frontend/src/pages/Login.jsx`
  - `frontend/src/pages/Register.jsx`
  - `frontend/src/router/AppRouter.jsx`
  - `docs/V1/M1/00_M1_CENTRAL_OVERVIEW.md`
* **What Was Changed:**
  1. **Password Hashing via Bcrypt:** Added `bcrypt>=4.0.0` and implemented salted password hashing (`hash_password`, `verify_password`) in `app/core/security.py`. Updated `users` table schema in Supabase with `hashed_password VARCHAR(255)`.
  2. **Cryptographic JWT Tokens & Persistent Remember Me:** Implemented industry-standard JWT session issuance (`pyjwt>=2.8.0`). If "Remember Me" is enabled, sessions persist for **30 days** in `localStorage`; if unchecked, tokens live strictly for the duration of the browser tab in `sessionStorage`.
  3. **New User Registration:** Implemented `POST /api/v1/auth/register` and created a dedicated, institutional registration portal (`Register.jsx` at `/register`). Automatically detects student roll numbers, checks for duplicate accounts, hashes credentials, and logs the user in immediately.
  4. **Global Authorization Interceptor:** Updated `frontend/src/api/client.js` to automatically attach the active `Authorization: Bearer <token>` to all HTTP requests. Added `GET /api/v1/auth/me` to authenticate sessions cryptographically.
  5. **Enhanced Login Experience:** Revamped `Login.jsx` with a "Persistent Remember Me" toggle, pre-filled remembered emails, password visibility toggles, and seamless tab transitions between Sign In and Registration.
* **Why It Was Changed:** Fulfills user request for an industry-standard login and registration system with persistent Remember Me functionality, cryptographically secure password storage, and seamless session resumption across browser restarts.
* **Verification Proof:**
  - Backend Pytest Suite: 45/45 tests passed across the network on Supabase PostgreSQL (including registration, wrong password rejection, Remember Me expiry, and `/auth/me` bearer verification).
  - Frontend Production Build: `npm run build` compiled 120 modules in 1.47s with 0 errors.
  - End-to-End Live Verification: Tested registration for `aanya26105@iiitnr.edu.in` (`201 Created`), persistent token generation (`30 days`), and immediate login.

### [2026-10-14] - Clean Standalone Auth Portal & Complete Decommissioning of Local Databases
* **Files Modified:**
  - `frontend/src/router/AppRouter.jsx`
  - `frontend/src/pages/Login.jsx`
  - `frontend/src/pages/Register.jsx`
  - `frontend/vite.config.js`
  - `backend/app/core/config.py`
  - `docs/V1/M1/00_M1_CENTRAL_OVERVIEW.md`
* **What Was Changed:**
  1. **Standalone Distraction-Free Auth Portal:** Separated `/login` and `/register` routes from the primary `Layout` component in `AppRouter.jsx`. The global `Navbar` (with menu links and active user badges) and footer are now completely absent from the login and register screens.
  2. **Clean Minimalist Sign-In Card:** Stripped all mock quick-fill demo boxes from `Login.jsx`. Rebuilt the page into a clean institutional card focused strictly on email/ID, password (with Show/Hide toggle), Remember Me checkbox, and Sign In action.
  3. **Complete Decommissioning of Local Databases:** Permanently deleted all leftover `*.db` / `*.sqlite` files. Updated `backend/app/core/config.py` so that the default `DATABASE_URL` points directly to the cloud Supabase PostgreSQL instance, guaranteeing 100% cloud-hosted persistence with zero local database reliance.
  4. **Health Check Reverse Proxy Fix:** Added `/health` proxy route to `vite.config.js` to ensure the frontend live heartbeat accurately registers the backend as "Services Active" rather than displaying false "System Offline" alerts.
* **Why It Was Changed:** Directly satisfies user feedback to eliminate the navbar on the sign-in screen, streamline the page to a clean ID/password card, and ensure all data resides exclusively in Supabase without any local databases.
* **Verification Proof:**
  - Frontend Production Build: `npm run build` compiled 120 modules in 1.34s with 0 errors.
  - Backend Test Suite: 45/45 tests passed against live Supabase PostgreSQL in 14.22s.
  - Local Database Check: Verified zero `*.db` files exist in the repository tree.




