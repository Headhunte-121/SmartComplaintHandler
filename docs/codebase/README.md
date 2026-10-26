# 📚 SmartComplaintHandler — Codebase Documentation Hub

> **Navigation**: [🏠 Project Root](../../README.md) &nbsp;│&nbsp; [👥 5-Student Responsibility Matrix](../TEAM_RESPONSIBILITY_MATRIX.md) &nbsp;│&nbsp; [🗺️ Master Roadmap](../DOCUMENTATION_ROADMAP.md) &nbsp;│&nbsp; [🏛 Full-Stack Architecture](../FULL_STACK_ARCHITECTURE.md) &nbsp;│&nbsp; [📄 Product Design Report](../PRODUCT_DESIGN_REPORT_PDR.md)  
> **Writing Standard**: **4-Iteration Progressive Refinement** (Every line grounded in basic C/Python, zero unexplained buzzwords, edge cases analyzed, and Viva Q&A included).  
> **Status**: **100% Complete — 97 Exhaustive Codebase Manuals**

Welcome to the **Master Codebase Documentation Hub** for the `SmartComplaintHandler` platform. Every single file in the repository has been documented function-by-function and line-by-line so that anyone with basic C or Python knowledge can understand, navigate, and defend every design decision in a college viva or technical interview.

---

## 🧭 Quick Navigation by Phase

| Phase | Subsystem / Layer | Files | Description & Key Topics |
| :---: | :--- | :---: | :--- |
| **[Phase 1](#phase-1-backend-foundation--core-configuration)** | Backend Foundation & Core Config | 7 | Server entrypoint, CORS, database engine, bcrypt/JWT security, seeder |
| **[Phase 2](#phase-2-backend-data-models-sqlalchemy-orm)** | Backend Data Models (SQLAlchemy ORM) | 7 | Relational tables (`User`, `Ticket`, `Department`, `Team`, `CampusBuilding`) |
| **[Phase 3](#phase-3-backend-schemas-pydantic-contracts)** | Backend Schemas (Pydantic Contracts) | 8 | Request/response DTOs, data validation, serialization, mass-assignment defense |
| **[Phase 4](#phase-4-backend-business-logic--autonomous-service-engines)** | Autonomous Business Logic Engines | 11 | NLP classification, priority scoring, dispatch balancing, SLA countdowns, FSM |
| **[Phase 5](#phase-5-backend-api-layer--rest-endpoints)** | Backend API Layer & Endpoints | 9 | REST route controllers, JWT dependency injection, RBAC guards |
| **[Phase 6](#phase-6-frontend-architecture-http-client--state)** | Frontend Architecture & State | 15 | React 18, Axios client, JWT interceptor, AuthContext, ThemeContext, date utils |
| **[Phase 7](#phase-7-frontend-reusable-components--digital-twin)** | Reusable UI & Campus Digital Twin | 22 | Modals, SLA countdown timer, live triage card, 2D SVG canvas, camera matrix |
| **[Phase 8](#phase-8-frontend-pages--interactive-workstations)** | Frontend Pages & Workstations | 13 | Student portal, technician workstation, admin desk, superadmin directorate |
| **[Phase 9](#phase-9-serverless-tooling--build-infrastructure)** | Serverless & Build Tooling | 5 | Vercel Python bridge, SPA HTML, Vite bundler proxy, Tailwind, PostCSS |

---

## Phase 1: Backend Foundation & Core Configuration

Foundation files that boot the FastAPI server, configure security, initialize database connection pools, and seed initial institutional data.

| Module | Source Code | Line-by-Line Documentation Guide | Core Responsibilities |
| :--- | :--- | :--- | :--- |
| `main.py` | [`backend/app/main.py`](../../backend/app/main.py) | [**`docs/codebase/backend/app/main.py.md`**](backend/app/main.py.md) | ASGI application entrypoint, CORS middleware, lifespan events, global error handlers |
| `config.py` | [`backend/app/core/config.py`](../../backend/app/core/config.py) | [**`docs/codebase/backend/app/core/config.py.md`**](backend/app/core/config.py.md) | Pydantic `BaseSettings` parsing environment variables, JWT secrets, and database paths |
| `constants.py` | [`backend/app/core/constants.py`](../../backend/app/core/constants.py) | [**`docs/codebase/backend/app/core/constants.py.md`**](backend/app/core/constants.py.md) | Immutable system enums: roles, status codes, SLA windows, priority thresholds |
| `database.py` | [`backend/app/core/database.py`](../../backend/app/core/database.py) | [**`docs/codebase/backend/app/core/database.py.md`**](backend/app/core/database.py.md) | SQLAlchemy engine, sessionmaker, SQLite WAL mode pragmas, thread-local session generator |
| `security.py` | [`backend/app/core/security.py`](../../backend/app/core/security.py) | [**`docs/codebase/backend/app/core/security.py.md`**](backend/app/core/security.py.md) | Passlib bcrypt password hashing, salting, and PyJWT token generation & validation |
| `base.py` | [`backend/app/db/base.py`](../../backend/app/db/base.py) | [**`docs/codebase/backend/app/db/base.py.md`**](backend/app/db/base.py.md) | Declarative ORM base class definition and metadata registry |
| `seed.py` | [`backend/app/db/seed.py`](../../backend/app/db/seed.py) | [**`docs/codebase/backend/app/db/seed.py.md`**](backend/app/db/seed.py.md) | Idempotent database seeder for default departments, squads, test accounts, and facilities |

[⬆ Back to Top](#-smartcomplainthandler--codebase-documentation-hub)

---

## Phase 2: Backend Data Models (SQLAlchemy ORM)

Relational database entities declaring physical database tables, column types, foreign keys, indexes, and cascades.

| Model | Source Code | Line-by-Line Documentation Guide | Core Responsibilities |
| :--- | :--- | :--- | :--- |
| `base.py` | [`backend/app/models/base.py`](../../backend/app/models/base.py) | [**`docs/codebase/backend/app/models/base.py.md`**](backend/app/models/base.py.md) | Common model ancestor providing primary key `id`, `created_at`, and `updated_at` |
| `__init__.py` | [`backend/app/models/__init__.py`](../../backend/app/models/__init__.py) | [**`docs/codebase/backend/app/models/__init__.py.md`**](backend/app/models/__init__.py.md) | Models package aggregator and domain facade populating `Base.metadata` |
| `department.py` | [`backend/app/models/department.py`](../../backend/app/models/department.py) | [**`docs/codebase/backend/app/models/department.py.md`**](backend/app/models/department.py.md) | Institutional trade entity (`Electrical`, `Plumbing`, `IT Support`, `Sanitation`, `Carpentry`) |
| `team.py` | [`backend/app/models/team.py`](../../backend/app/models/team.py) | [**`docs/codebase/backend/app/models/team.py.md`**](backend/app/models/team.py.md) | Field maintenance squads, technician team rosters, and active shift models |
| `user.py` | [`backend/app/models/user.py`](../../backend/app/models/user.py) | [**`docs/codebase/backend/app/models/user.py.md`**](backend/app/models/user.py.md) | User accounts with RBAC roles (`STUDENT`, `ADMIN`, `TECHNICIAN`, `SUPER_ADMIN`) |
| `ticket.py` | [`backend/app/models/ticket.py`](../../backend/app/models/ticket.py) | [**`docs/codebase/backend/app/models/ticket.py.md`**](backend/app/models/ticket.py.md) | Core complaint ticket entity tracking status, SLA deadlines, and resolution proofs |
| `campus.py` | [`backend/app/models/campus.py`](../../backend/app/models/campus.py) | [**`docs/codebase/backend/app/models/campus.py.md`**](backend/app/models/campus.py.md) | Campus buildings, spatial coordinates, room registries, and vector road networks |

[⬆ Back to Top](#-smartcomplainthandler--codebase-documentation-hub)

---

## Phase 3: Backend Schemas (Pydantic Contracts)

Pydantic v2 data transfer objects (DTOs) enforcing strict type-checking, payload validation, and secure serialization.

| Schema | Source Code | Line-by-Line Documentation Guide | Core Responsibilities |
| :--- | :--- | :--- | :--- |
| `user.py` | [`backend/app/schemas/user.py`](../../backend/app/schemas/user.py) | [**`docs/codebase/backend/app/schemas/user.py.md`**](backend/app/schemas/user.py.md) | Auth requests, user registration, profile updates, and JWT response schemas |
| `department.py` | [`backend/app/schemas/department.py`](../../backend/app/schemas/department.py) | [**`docs/codebase/backend/app/schemas/department.py.md`**](backend/app/schemas/department.py.md) | Department payload validation and response contracts |
| `ticket.py` | [`backend/app/schemas/ticket.py`](../../backend/app/schemas/ticket.py) | [**`docs/codebase/backend/app/schemas/ticket.py.md`**](backend/app/schemas/ticket.py.md) | Comprehensive ticket detail serialization, tracking codes, and status updates |
| `complaint.py` | [`backend/app/schemas/complaint.py`](../../backend/app/schemas/complaint.py) | [**`docs/codebase/backend/app/schemas/complaint.py.md`**](backend/app/schemas/complaint.py.md) | Student complaint intake schemas and legacy intake validation |
| `priority.py` | [`backend/app/schemas/priority.py`](../../backend/app/schemas/priority.py) | [**`docs/codebase/backend/app/schemas/priority.py.md`**](backend/app/schemas/priority.py.md) | Priority scoring DTOs, supervisor override requests, and AI triage inspection |
| `assignment.py` | [`backend/app/schemas/assignment.py`](../../backend/app/schemas/assignment.py) | [**`docs/codebase/backend/app/schemas/assignment.py.md`**](backend/app/schemas/assignment.py.md) | Squad workload telemetry and technician reassignment payloads |
| `sla.py` | [`backend/app/schemas/sla.py`](../../backend/app/schemas/sla.py) | [**`docs/codebase/backend/app/schemas/sla.py.md`**](backend/app/schemas/sla.py.md) | SLA deadline calculations, breach notification tables, and resolution schemas |
| `campus.py` | [`backend/app/schemas/campus.py`](../../backend/app/schemas/campus.py) | [**`docs/codebase/backend/app/schemas/campus.py.md`**](backend/app/schemas/campus.py.md) | Campus building directory schemas and digital twin cartography serialization |

[⬆ Back to Top](#-smartcomplainthandler--codebase-documentation-hub)

---

## Phase 4: Backend Business Logic & Autonomous Service Engines

The algorithmic brain of the platform. Handles natural language classification, priority heuristics, workload balancing, and SLA timers.

| Service Engine | Source Code | Line-by-Line Documentation Guide | Core Responsibilities |
| :--- | :--- | :--- | :--- |
| `code_generator.py` | [`backend/app/utils/code_generator.py`](../../backend/app/utils/code_generator.py) | [**`docs/codebase/backend/app/utils/code_generator.py.md`**](backend/app/utils/code_generator.py.md) | Collision-resistant tracking code generator (`TICK-YYYYMMDD-XXXX`) using CSPRNG entropy |
| `classifier.py` | [`backend/app/services/classifier.py`](../../backend/app/services/classifier.py) | [**`docs/codebase/backend/app/services/classifier.py.md`**](backend/app/services/classifier.py.md) | Multi-class NLP classification engine categorizing complaint text across departments |
| `keyword_router.py` | [`backend/app/services/keyword_router.py`](../../backend/app/services/keyword_router.py) | [**`docs/codebase/backend/app/services/keyword_router.py.md`**](backend/app/services/keyword_router.py.md) | Deterministic keyword routing dictionary matching text tokens to engineering trades |
| `priority_engine.py` | [`backend/app/services/priority_engine.py`](../../backend/app/services/priority_engine.py) | [**`docs/codebase/backend/app/services/priority_engine.py.md`**](backend/app/services/priority_engine.py.md) | Weighted multi-factor priority scoring algorithm (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) |
| `dispatch_engine.py` | [`backend/app/services/dispatch_engine.py`](../../backend/app/services/dispatch_engine.py) | [**`docs/codebase/backend/app/services/dispatch_engine.py.md`**](backend/app/services/dispatch_engine.py.md) | Autonomous workload balancer dispatching tickets to squads with lowest queue depth |
| `sla_engine.py` | [`backend/app/services/sla_engine.py`](../../backend/app/services/sla_engine.py) | [**`docs/codebase/backend/app/services/sla_engine.py.md`**](backend/app/services/sla_engine.py.md) | SLA deadline calculator and proactive breach prediction monitor |
| `lifecycle.py` | [`backend/app/services/lifecycle.py`](../../backend/app/services/lifecycle.py) | [**`docs/codebase/backend/app/services/lifecycle.py.md`**](backend/app/services/lifecycle.py.md) | Deterministic Finite State Machine (FSM) enforcing valid status transitions |
| `ticket_service.py` | [`backend/app/services/ticket_service.py`](../../backend/app/services/ticket_service.py) | [**`docs/codebase/backend/app/services/ticket_service.py.md`**](backend/app/services/ticket_service.py.md) | Master complaint CRUD orchestrator coordinating engines and database operations |
| `user_service.py` | [`backend/app/services/user_service.py`](../../backend/app/services/user_service.py) | [**`docs/codebase/backend/app/services/user_service.py.md`**](backend/app/services/user_service.py.md) | User authentication, password management, Google SSO sync, and profile queries |
| `team_service.py` | [`backend/app/services/team_service.py`](../../backend/app/services/team_service.py) | [**`docs/codebase/backend/app/services/team_service.py.md`**](backend/app/services/team_service.py.md) | Maintenance squad capacity management and technician assignment service |
| `ai_triage_service.py` | [`backend/app/services/ai_triage_service.py`](../../backend/app/services/ai_triage_service.py) | [**`docs/codebase/backend/app/services/ai_triage_service.py.md`**](backend/app/services/ai_triage_service.py.md) | Real-time debounced triage engine predicting department and urgency in $<15\text{ms}$ |

[⬆ Back to Top](#-smartcomplainthandler--codebase-documentation-hub)

---

## Phase 5: Backend API Layer & Endpoints

REST API route handlers accepting HTTP requests, delegating to services, and returning JSON.

| Route Controller | Source Code | Line-by-Line Documentation Guide | Core Responsibilities |
| :--- | :--- | :--- | :--- |
| `deps.py` | [`backend/app/api/deps.py`](../../backend/app/api/deps.py) | [**`docs/codebase/backend/app/api/deps.py.md`**](backend/app/api/deps.py.md) | FastAPI dependency injection: DB session injection, JWT verification, and RBAC guards |
| `router.py` | [`backend/app/api/v1/router.py`](../../backend/app/api/v1/router.py) | [**`docs/codebase/backend/app/api/v1/router.py.md`**](backend/app/api/v1/router.py.md) | Master API v1 namespace router mounting all endpoint sub-routers |
| `auth.py` | [`backend/app/api/v1/endpoints/auth.py`](../../backend/app/api/v1/endpoints/auth.py) | [**`docs/codebase/backend/app/api/v1/endpoints/auth.py.md`**](backend/app/api/v1/endpoints/auth.py.md) | Google SSO, credential login, user registration, and database purge endpoints |
| `complaints.py` | [`backend/app/api/v1/endpoints/complaints.py`](../../backend/app/api/v1/endpoints/complaints.py) | [**`docs/codebase/backend/app/api/v1/endpoints/complaints.py.md`**](backend/app/api/v1/endpoints/complaints.py.md) | Complaint intake, tracking lookup, and student dashboard listing endpoints |
| `priority.py` | [`backend/app/api/v1/endpoints/priority.py`](../../backend/app/api/v1/endpoints/priority.py) | [**`docs/codebase/backend/app/api/v1/endpoints/priority.py.md`**](backend/app/api/v1/endpoints/priority.py.md) | Priority override endpoints and live AI triage inspection routes |
| `assignment.py` | [`backend/app/api/v1/endpoints/assignment.py`](../../backend/app/api/v1/endpoints/assignment.py) | [**`docs/codebase/backend/app/api/v1/endpoints/assignment.py.md`**](backend/app/api/v1/endpoints/assignment.py.md) | Squad workload telemetry queries and supervisor ticket reassignment endpoints |
| `sla.py` | [`backend/app/api/v1/endpoints/sla.py`](../../backend/app/api/v1/endpoints/sla.py) | [**`docs/codebase/backend/app/api/v1/endpoints/sla.py.md`**](backend/app/api/v1/endpoints/sla.py.md) | SLA breach tracking, status transitions, and technician ticket resolution endpoints |
| `campus.py` | [`backend/app/api/v1/endpoints/campus.py`](../../backend/app/api/v1/endpoints/campus.py) | [**`docs/codebase/backend/app/api/v1/endpoints/campus.py.md`**](backend/app/api/v1/endpoints/campus.py.md) | Campus building directory and digital twin vector geometry query endpoints |
| `superadmin.py` | [`backend/app/api/v1/endpoints/superadmin.py`](../../backend/app/api/v1/endpoints/superadmin.py) | [**`docs/codebase/backend/app/api/v1/endpoints/superadmin.py.md`**](backend/app/api/v1/endpoints/superadmin.py.md) | Directorate institutional analytics, health scoring, and system telemetry routes |

[⬆ Back to Top](#-smartcomplainthandler--codebase-documentation-hub)

---

## Phase 6: Frontend Architecture, HTTP Client & Global State

The client-side core: React DOM mounting, centralized Axios HTTP client, persistent session context, and client-side routing.

| Module | Source Code | Line-by-Line Documentation Guide | Core Responsibilities |
| :--- | :--- | :--- | :--- |
| `main.jsx` | [`frontend/src/main.jsx`](../../frontend/src/main.jsx) | [**`docs/codebase/frontend/src/main.jsx.md`**](frontend/src/main.jsx.md) | React 18 DOM root initialization and strict mode rendering |
| `App.jsx` | [`frontend/src/App.jsx`](../../frontend/src/App.jsx) | [**`docs/codebase/frontend/src/App.jsx.md`**](frontend/src/App.jsx.md) | Master application container wrapping ThemeProvider, AuthProvider, and AppRouter |
| `globals.css` | [`frontend/src/styles/globals.css`](../../frontend/src/styles/globals.css) | [**`docs/codebase/frontend/src/styles/globals.css.md`**](frontend/src/styles/globals.css.md) | Global design system CSS, dark mode definitions, and custom scrollbar styling |
| `client.js` | [`frontend/src/api/client.js`](../../frontend/src/api/client.js) | [**`docs/codebase/frontend/src/api/client.js.md`**](frontend/src/api/client.js.md) | Axios HTTP client with automatic JWT bearer token injection and 401 redirection |
| `auth.js` | [`frontend/src/api/auth.js`](../../frontend/src/api/auth.js) | [**`docs/codebase/frontend/src/api/auth.js.md`**](frontend/src/api/auth.js.md) | Frontend authentication API client methods and institutional email profile parser |
| `complaints.js` | [`frontend/src/api/complaints.js`](../../frontend/src/api/complaints.js) | [**`docs/codebase/frontend/src/api/complaints.js.md`**](frontend/src/api/complaints.js.md) | Complaint lodging and ticket query API methods |
| `assignment.js` | [`frontend/src/api/assignment.js`](../../frontend/src/api/assignment.js) | [**`docs/codebase/frontend/src/api/assignment.js.md`**](frontend/src/api/assignment.js.md) | Squad dispatch and workload balancer API methods |
| `sla.js` | [`frontend/src/api/sla.js`](../../frontend/src/api/sla.js) | [**`docs/codebase/frontend/src/api/sla.js.md`**](frontend/src/api/sla.js.md) | SLA breach querying and technician ticket resolution client methods |
| `campus.js` | [`frontend/src/api/campus.js`](../../frontend/src/api/campus.js) | [**`docs/codebase/frontend/src/api/campus.js.md`**](frontend/src/api/campus.js.md) | Campus digital twin building and road geometry client methods |
| `superadmin.js` | [`frontend/src/api/superadmin.js`](../../frontend/src/api/superadmin.js) | [**`docs/codebase/frontend/src/api/superadmin.js.md`**](frontend/src/api/superadmin.js.md) | Directorate supervisory metrics and analytics API client methods |
| `triage.js` | [`frontend/src/api/triage.js`](../../frontend/src/api/triage.js) | [**`docs/codebase/frontend/src/api/triage.js.md`**](frontend/src/api/triage.js.md) | Real-time debounced AI triage preview and priority override client methods |
| `AuthContext.jsx` | [`frontend/src/context/AuthContext.jsx`](../../frontend/src/context/AuthContext.jsx) | [**`docs/codebase/frontend/src/context/AuthContext.jsx.md`**](frontend/src/context/AuthContext.jsx.md) | Global authentication state store managing persistent JWT tokens and user profiles |
| `ThemeContext.jsx` | [`frontend/src/context/ThemeContext.jsx`](../../frontend/src/context/ThemeContext.jsx) | [**`docs/codebase/frontend/src/context/ThemeContext.jsx.md`**](frontend/src/context/ThemeContext.jsx.md) | Global theme context managing dark/light visual modes and DOM class toggling |
| `AppRouter.jsx` | [`frontend/src/router/AppRouter.jsx`](../../frontend/src/router/AppRouter.jsx) | [**`docs/codebase/frontend/src/router/AppRouter.jsx.md`**](frontend/src/router/AppRouter.jsx.md) | Declarative React Router setup with role-guarded protected routes |
| `dateUtils.js` | [`frontend/src/utils/dateUtils.js`](../../frontend/src/utils/dateUtils.js) | [**`docs/codebase/frontend/src/utils/dateUtils.js.md`**](frontend/src/utils/dateUtils.js.md) | Date formatting, relative time calculation, and SLA countdown mathematics |

[⬆ Back to Top](#-smartcomplainthandler--codebase-documentation-hub)

---

## Phase 7: Frontend Reusable Components & Campus Digital Twin

Atomic UI components, action modals, live countdown pills, and the custom 2D SVG Digital Twin cartography subsystem.

| Component / Subsystem | Source Code | Line-by-Line Documentation Guide | Core Responsibilities |
| :--- | :--- | :--- | :--- |
| `Navbar.jsx` | [`frontend/src/components/Navbar.jsx`](../../frontend/src/components/Navbar.jsx) | [**`docs/codebase/frontend/src/components/Navbar.jsx.md`**](frontend/src/components/Navbar.jsx.md) | Institutional header bar with live session badges and navigation links |
| `Footer.jsx` | [`frontend/src/components/Footer.jsx`](../../frontend/src/components/Footer.jsx) | [**`docs/codebase/frontend/src/components/Footer.jsx.md`**](frontend/src/components/Footer.jsx.md) | Campus facilities footer with emergency contacts and copyright |
| `Layout.jsx` | [`frontend/src/components/Layout.jsx`](../../frontend/src/components/Layout.jsx) | [**`docs/codebase/frontend/src/components/Layout.jsx.md`**](frontend/src/components/Layout.jsx.md) | Master page layout wrapping headers, body, and footers |
| `PriorityBadge.jsx` | [`frontend/src/components/PriorityBadge.jsx`](../../frontend/src/components/PriorityBadge.jsx) | [**`docs/codebase/frontend/src/components/PriorityBadge.jsx.md`**](frontend/src/components/PriorityBadge.jsx.md) | Semantic color-coded badge for SLA priority levels (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) |
| `SLACountdownTimer.jsx` | [`frontend/src/components/SLACountdownTimer.jsx`](../../frontend/src/components/SLACountdownTimer.jsx) | [**`docs/codebase/frontend/src/components/SLACountdownTimer.jsx.md`**](frontend/src/components/SLACountdownTimer.jsx.md) | Live 1-second ticking countdown timer for resolution deadlines |
| `SLABreachTable.jsx` | [`frontend/src/components/SLABreachTable.jsx`](../../frontend/src/components/SLABreachTable.jsx) | [**`docs/codebase/frontend/src/components/SLABreachTable.jsx.md`**](frontend/src/components/SLABreachTable.jsx.md) | Tabular view for active SLA breaches and escalation monitoring |
| `LiveTriageCard.jsx` | [`frontend/src/components/LiveTriageCard.jsx`](../../frontend/src/components/LiveTriageCard.jsx) | [**`docs/codebase/frontend/src/components/LiveTriageCard.jsx.md`**](frontend/src/components/LiveTriageCard.jsx.md) | Real-time debounced AI triage card predicting department and urgency |
| `TeamWorkloadView.jsx` | [`frontend/src/components/TeamWorkloadView.jsx`](../../frontend/src/components/TeamWorkloadView.jsx) | [**`docs/codebase/frontend/src/components/TeamWorkloadView.jsx.md`**](frontend/src/components/TeamWorkloadView.jsx.md) | Visual squad workload progress bars and capacity indicators |
| `PriorityOverrideModal.jsx`| [`frontend/src/components/PriorityOverrideModal.jsx`](../../frontend/src/components/PriorityOverrideModal.jsx) | [**`docs/codebase/frontend/src/components/PriorityOverrideModal.jsx.md`**](frontend/src/components/PriorityOverrideModal.jsx.md) | Supervisory modal for manual priority re-calibration |
| `ReassignTeamModal.jsx` | [`frontend/src/components/ReassignTeamModal.jsx`](../../frontend/src/components/ReassignTeamModal.jsx) | [**`docs/codebase/frontend/src/components/ReassignTeamModal.jsx.md`**](frontend/src/components/ReassignTeamModal.jsx.md) | Supervisor modal for cross-squad ticket transfer |
| `ResolutionNotesModal.jsx` | [`frontend/src/components/ResolutionNotesModal.jsx`](../../frontend/src/components/ResolutionNotesModal.jsx) | [**`docs/codebase/frontend/src/components/ResolutionNotesModal.jsx.md`**](frontend/src/components/ResolutionNotesModal.jsx.md) | Technician modal enforcing resolution proof before closing tickets |
| `SetPasswordModal.jsx` | [`frontend/src/components/SetPasswordModal.jsx`](../../frontend/src/components/SetPasswordModal.jsx) | [**`docs/codebase/frontend/src/components/SetPasswordModal.jsx.md`**](frontend/src/components/SetPasswordModal.jsx.md) | Password setup dialog for Google SSO users desiring credential login |
| `SubmissionSuccessModal.jsx`| [`frontend/src/components/SubmissionSuccessModal.jsx`](../../frontend/src/components/SubmissionSuccessModal.jsx) | [**`docs/codebase/frontend/src/components/SubmissionSuccessModal.jsx.md`**](frontend/src/components/SubmissionSuccessModal.jsx.md) | Post-submission modal with copyable tracking code and QR access |
| `CampusMapSelector.jsx` | [`frontend/src/components/CampusMapSelector.jsx`](../../frontend/src/components/CampusMapSelector.jsx) | [**`docs/codebase/frontend/src/components/CampusMapSelector.jsx.md`**](frontend/src/components/CampusMapSelector.jsx.md) | Interactive campus selector with auto-snapping floor levels |
| `iiitnrCampusData.js` | [`frontend/src/data/iiitnrCampusData.js`](../../frontend/src/data/iiitnrCampusData.js) | [**`docs/codebase/frontend/src/data/iiitnrCampusData.js.md`**](frontend/src/data/iiitnrCampusData.js.md) | Master campus building registry and room lookup functions |
| `campusGeometry.js` | [`frontend/src/data/campusTwin/campusGeometry.js`](../../frontend/src/data/campusTwin/campusGeometry.js) | [**`docs/codebase/frontend/src/data/campusTwin/campusGeometry.js.md`**](frontend/src/data/campusTwin/campusGeometry.js.md) | Satellite-aligned 2D vector geometry and SVG coordinate definitions |
| `campusLabsAndRooms.js` | [`frontend/src/data/campusTwin/campusLabsAndRooms.js`](../../frontend/src/data/campusTwin/campusLabsAndRooms.js) | [**`docs/codebase/frontend/src/data/campusTwin/campusLabsAndRooms.js.md`**](frontend/src/data/campusTwin/campusLabsAndRooms.js.md) | Comprehensive database of lecture halls, research bays, and labs |
| `campusSearchEngine.js` | [`frontend/src/data/campusTwin/campusSearchEngine.js`](../../frontend/src/data/campusTwin/campusSearchEngine.js) | [**`docs/codebase/frontend/src/data/campusTwin/campusSearchEngine.js.md`**](frontend/src/data/campusTwin/campusSearchEngine.js.md) | In-memory search engine locating facilities across campus |
| `useMapCamera.js` | [`frontend/src/components/campusTwin/useMapCamera.js`](../../frontend/src/components/campusTwin/useMapCamera.js) | [**`docs/codebase/frontend/src/components/campusTwin/useMapCamera.js.md`**](frontend/src/components/campusTwin/useMapCamera.js.md) | Custom React hook for pan, zoom, smooth interpolation, and bounding constraints |
| `DigitalTwinCanvas.jsx` | [`frontend/src/components/campusTwin/DigitalTwinCanvas.jsx`](../../frontend/src/components/campusTwin/DigitalTwinCanvas.jsx) | [**`docs/codebase/frontend/src/components/campusTwin/DigitalTwinCanvas.jsx.md`**](frontend/src/components/campusTwin/DigitalTwinCanvas.jsx.md) | Interactive SVG digital twin canvas with non-passive wheel zoom interception |
| `DigitalTwinInspector.jsx`| [`frontend/src/components/campusTwin/DigitalTwinInspector.jsx`](../../frontend/src/components/campusTwin/DigitalTwinInspector.jsx) | [**`docs/codebase/frontend/src/components/campusTwin/DigitalTwinInspector.jsx.md`**](frontend/src/components/campusTwin/DigitalTwinInspector.jsx.md) | Sliding side panel revealing facility details and room directories |
| `DigitalTwinSearchBar.jsx`| [`frontend/src/components/campusTwin/DigitalTwinSearchBar.jsx`](../../frontend/src/components/campusTwin/DigitalTwinSearchBar.jsx) | [**`docs/codebase/frontend/src/components/campusTwin/DigitalTwinSearchBar.jsx.md`**](frontend/src/components/campusTwin/DigitalTwinSearchBar.jsx.md) | Floating search bar with keyboard navigation and camera auto-focus |

[⬆ Back to Top](#-smartcomplainthandler--codebase-documentation-hub)

---

## Phase 8: Frontend Pages & Interactive Workstations

Full-page view controllers and dashboards tailored to each institutional role.

| Page Component | Source Code | Line-by-Line Documentation Guide | Core Responsibilities |
| :--- | :--- | :--- | :--- |
| `Home.jsx` | [`frontend/src/pages/Home.jsx`](../../frontend/src/pages/Home.jsx) | [**`docs/codebase/frontend/src/pages/Home.jsx.md`**](frontend/src/pages/Home.jsx.md) | Public landing portal with quick track lookup, live SLA metrics, and emergency contacts |
| `Login.jsx` | [`frontend/src/pages/Login.jsx`](../../frontend/src/pages/Login.jsx) | [**`docs/codebase/frontend/src/pages/Login.jsx.md`**](frontend/src/pages/Login.jsx.md) | Google SSO and email/password dual-login portal with auto-profile detection |
| `Register.jsx` | [`frontend/src/pages/Register.jsx`](../../frontend/src/pages/Register.jsx) | [**`docs/codebase/frontend/src/pages/Register.jsx.md`**](frontend/src/pages/Register.jsx.md) | 2-Step student registration wizard with academic branch parsing |
| `SubmitComplaint.jsx` | [`frontend/src/pages/SubmitComplaint.jsx`](../../frontend/src/pages/SubmitComplaint.jsx) | [**`docs/codebase/frontend/src/pages/SubmitComplaint.jsx.md`**](frontend/src/pages/SubmitComplaint.jsx.md) | Complaint submission form with 3 location modes and real-time AI triage |
| `TrackTicket.jsx` | [`frontend/src/pages/TrackTicket.jsx`](../../frontend/src/pages/TrackTicket.jsx) | [**`docs/codebase/frontend/src/pages/TrackTicket.jsx.md`**](frontend/src/pages/TrackTicket.jsx.md) | Public ticket tracking page with lifecycle stepper and resolution remarks |
| `StudentDashboard.jsx` | [`frontend/src/pages/StudentDashboard.jsx`](../../frontend/src/pages/StudentDashboard.jsx) | [**`docs/codebase/frontend/src/pages/StudentDashboard.jsx.md`**](frontend/src/pages/StudentDashboard.jsx.md) | Student workstation for monitoring personal complaint history |
| `TechnicianWorkstation.jsx`| [`frontend/src/pages/TechnicianWorkstation.jsx`](../../frontend/src/pages/TechnicianWorkstation.jsx) | [**`docs/codebase/frontend/src/pages/TechnicianWorkstation.jsx.md`**](frontend/src/pages/TechnicianWorkstation.jsx.md) | Field technician workstation with squad work order management and resolution modals |
| `AdminDashboard.jsx` | [`frontend/src/pages/AdminDashboard.jsx`](../../frontend/src/pages/AdminDashboard.jsx) | [**`docs/codebase/frontend/src/pages/AdminDashboard.jsx.md`**](frontend/src/pages/AdminDashboard.jsx.md) | Facility supervisor console with client-side filtering and squad workload views |
| `SuperAdminDashboard.jsx` | [`frontend/src/pages/SuperAdminDashboard.jsx`](../../frontend/src/pages/SuperAdminDashboard.jsx) | [**`docs/codebase/frontend/src/pages/SuperAdminDashboard.jsx.md`**](frontend/src/pages/SuperAdminDashboard.jsx.md) | Directorate executive dashboard with health scores and building fault density |
| `SuperAdminDataEditor.jsx` | [`frontend/src/pages/SuperAdminDataEditor.jsx`](../../frontend/src/pages/SuperAdminDataEditor.jsx) | [**`docs/codebase/frontend/src/pages/SuperAdminDataEditor.jsx.md`**](frontend/src/pages/SuperAdminDataEditor.jsx.md) | Spatial infrastructure editor, hierarchical room manager, and JSON studio |
| `ResidenceInfo.jsx` | [`frontend/src/pages/ResidenceInfo.jsx`](../../frontend/src/pages/ResidenceInfo.jsx) | [**`docs/codebase/frontend/src/pages/ResidenceInfo.jsx.md`**](frontend/src/pages/ResidenceInfo.jsx.md) | First-time residential onboarding gateway for undergraduate scholars |
| `SquadsPage.jsx` | [`frontend/src/pages/SquadsPage.jsx`](../../frontend/src/pages/SquadsPage.jsx) | [**`docs/codebase/frontend/src/pages/SquadsPage.jsx.md`**](frontend/src/pages/SquadsPage.jsx.md) | Squad dispatch balancer ranked dynamically by Priority Demand Stress Index |
| `StaffDirectoryPage.jsx` | [`frontend/src/pages/StaffDirectoryPage.jsx`](../../frontend/src/pages/StaffDirectoryPage.jsx) | [**`docs/codebase/frontend/src/pages/StaffDirectoryPage.jsx.md`**](frontend/src/pages/StaffDirectoryPage.jsx.md) | Directorate portal for staff provisioning and Role-Based Access Control (RBAC) |

[⬆ Back to Top](#-smartcomplainthandler--codebase-documentation-hub)

---

## Phase 9: Serverless Cloud Bridge, Tooling & Build Infrastructure

Serverless runtime adapters, build tooling, bundlers, and CSS preprocessing pipelines.

| Configuration File | Source Code | Line-by-Line Documentation Guide | Core Responsibilities |
| :--- | :--- | :--- | :--- |
| `backend/index.py` | [`backend/index.py`](../../backend/index.py) | [**`docs/codebase/backend/index.py.md`**](backend/index.py.md) | Serverless Python adapter, dynamic `sys.path` injection, and ASGI handler resolution |
| `index.html` | [`frontend/index.html`](../../frontend/index.html) | [**`docs/codebase/frontend/index.html.md`**](frontend/index.html.md) | Single Page Application HTML container, inline anti-FOUC theme resolver, and font preconnects |
| `vite.config.js` | [`frontend/vite.config.js`](../../frontend/vite.config.js) | [**`docs/codebase/frontend/vite.config.js.md`**](frontend/vite.config.js.md) | Vite bundler configuration, development reverse proxy, and vendor chunking |
| `tailwind.config.js` | [`frontend/tailwind.config.js`](../../frontend/tailwind.config.js) | [**`docs/codebase/frontend/tailwind.config.js.md`**](frontend/tailwind.config.js.md) | Design system specification, JIT content purging, and semantic color palettes |
| `postcss.config.js` | [`frontend/postcss.config.js`](../../frontend/postcss.config.js) | [**`docs/codebase/frontend/postcss.config.js.md`**](frontend/postcss.config.js.md) | PostCSS compilation pipeline and Autoprefixer vendor prefixing rules |

---

## 🧭 Navigation Footer

> **Quick Jump**:  
> [🏠 Project Root](../../README.md) &nbsp;│&nbsp; [👥 5-Student Responsibility Matrix](../TEAM_RESPONSIBILITY_MATRIX.md) &nbsp;│&nbsp; [🗺️ Master Roadmap](../DOCUMENTATION_ROADMAP.md) &nbsp;│&nbsp; [🏛 Full-Stack Architecture Guide](../FULL_STACK_ARCHITECTURE.md) &nbsp;│&nbsp; [📄 Product Design Report](../PRODUCT_DESIGN_REPORT_PDR.md)
