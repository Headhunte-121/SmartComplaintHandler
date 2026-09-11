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

### Backend Subsystem (`c:/College/IT Workshop/V1/M1/backend/`)

| Blueprint File | Target Source Component | Build Phase | Primary Role & Responsibility |
| :--- | :--- | :--- | :--- |
| [**`01_config_and_env.md`**](file:///c:/College/IT%20Workshop/V1/M1/backend/01_config_and_env.md) | `backend/app/core/config.py` | Phase 1 (Parallel) | Type-safe environment management via `pydantic-settings`, reading database paths and application metadata from `.env`. |
| [**`02_database.md`**](file:///c:/College/IT%20Workshop/V1/M1/backend/02_database.md) | `backend/app/db/session.py` | Phase 2 (Sequential) | SQLite engine instantiation, WAL-mode PRAGMA configuration, and thread-safe `sessionmaker` creation. |
| [**`03_base.md`**](file:///c:/College/IT%20Workshop/V1/M1/backend/03_base.md) | `backend/app/db/base.py` | Phase 1 (Parallel) | SQLAlchemy 2.0 `DeclarativeBase` establishment with automated table name resolution and shared metadata registry. |
| [**`04_department_model.md`**](file:///c:/College/IT%20Workshop/V1/M1/backend/04_department_model.md) | `backend/app/models/department.py` | Phase 2 (Parallel) | `Department` ORM model representing the 6 institutional campus domains (Electrical, Plumbing, IT, etc.). |
| [**`05_team_model.md`**](file:///c:/College/IT%20Workshop/V1/M1/backend/05_team_model.md) | `backend/app/models/team.py` | Phase 2 (Parallel) | `MaintenanceTeam` ORM model defining field squads, capacity limits, shift availability, and foreign key relations. |
| [**`06_ticket_model.md`**](file:///c:/College/IT%20Workshop/V1/M1/backend/06_ticket_model.md) | `backend/app/models/ticket.py` | Phase 2 (Parallel) | `Ticket` ORM model tracking unique tracking code (`TICK-XXXX`), status, priority, SLA deadlines, and audit trail notes. |
| [**`07_models_init.md`**](file:///c:/College/IT%20Workshop/V1/M1/backend/07_models_init.md) | `backend/app/models/__init__.py` | Phase 3 (Sequential) | Facade module exposing all models so SQLAlchemy metadata registers all foreign key relationships cleanly. |
| [**`08_seed_data.md`**](file:///c:/College/IT%20Workshop/V1/M1/backend/08_seed_data.md) | `backend/app/db/seed.py` | Phase 4 (Sequential) | Idempotent database seeder pre-populating the 6 campus departments and initial maintenance squads. |
| [**`09_api_deps.md`**](file:///c:/College/IT%20Workshop/V1/M1/backend/09_api_deps.md) | `backend/app/api/deps.py` | Phase 3 (Sequential) | FastAPI dependency injection generator (`get_db`) providing transaction-safe session context per HTTP request. |
| [**`10_verification_and_testing.md`**](file:///c:/College/IT%20Workshop/V1/M1/backend/10_verification_and_testing.md) | Backend Verification Protocol | Phase 5 (Sequential) | 5-checkpoint verification protocol testing schema creation, foreign key enforcement, seed data, and session teardown. |

### Frontend Subsystem (`c:/College/IT Workshop/V1/M1/frontend/`)

| Blueprint File | Target Source Component | Build Phase | Primary Role & Responsibility |
| :--- | :--- | :--- | :--- |
| [**`01_vite_tailwind_config.md`**](file:///c:/College/IT%20Workshop/V1/M1/frontend/01_vite_tailwind_config.md) | `vite.config.js`, `tailwind.config.js` | Phase 1 (Parallel) | Vite bundler setup, dev server proxy (`/api` -> `:8000`), Tailwind design tokens, and semantic priority color classes. |
| [**`02_base_api_client.md`**](file:///c:/College/IT%20Workshop/V1/M1/frontend/02_base_api_client.md) | `frontend/src/api/client.js` | Phase 2 (Parallel) | Singleton Axios client with environment base URL, 10s timeout, response data auto-unwrapping, and Pydantic 422 error normalization. |
| [**`03_layout_and_navigation.md`**](file:///c:/College/IT%20Workshop/V1/M1/frontend/03_layout_and_navigation.md) | `src/components/Layout.jsx`, `Navbar.jsx` | Phase 3 (Parallel) | Persistent application shell, `<Outlet />` viewport, responsive navbar with active link indicator, health heartbeat dot, and footer. |
| [**`04_app_router.md`**](file:///c:/College/IT%20Workshop/V1/M1/frontend/04_app_router.md) | `src/App.jsx`, `src/routes/AppRouter.jsx` | Phase 4 (Sequential) | Declarative React Router DOM v6 tree, lazy-loaded route chunks, Suspense loading spinners, and styled 404 Not Found fallback page. |
| [**`05_frontend_verification.md`**](file:///c:/College/IT%20Workshop/V1/M1/frontend/05_frontend_verification.md) | Frontend Verification Protocol | Phase 5 (Sequential) | 5-checkpoint verification protocol testing Vite build, Tailwind purging, API client interceptors, route navigation, and mobile layout. |

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
