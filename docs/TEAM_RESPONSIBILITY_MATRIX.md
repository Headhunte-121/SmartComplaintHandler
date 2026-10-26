# SmartComplaintHandler — 5-Student Complete File Ownership & Viva Defense Matrix

> **Navigation**: [🏠 Project Root](../README.md) &nbsp;│&nbsp; [📚 Codebase Documentation Hub](codebase/README.md) &nbsp;│&nbsp; [🏛 Full-Stack Architecture Guide](FULL_STACK_ARCHITECTURE.md) &nbsp;│&nbsp; [🗺️ Master Documentation Roadmap](DOCUMENTATION_ROADMAP.md) &nbsp;│&nbsp; [📄 Product Design Report](PRODUCT_DESIGN_REPORT_PDR.md)  
> **Course / Academic Context**: IT Workshop / Full-Stack Software Engineering Capstone Project  
> **Coverage**: **100% of All 97 Codebase Modules & Test Suites** mapped across the 5-Student Team  
> **Target Audience**: College Viva Examiners, Project Review Committees, Technical Interviewers, and the 5-Student Engineering Team  
> **Repository Branch**: `documentation`

---

## 1. Executive Summary & Work Breakdown Architecture

In software engineering capstones, an essential evaluation criterion is **individual accountability**: *Which team member wrote which file, why was it architected that way, and how does each member defend their code in a technical viva?*

While the original project specification began with a 5-module concept (M1–M5), the production application expanded into an enterprise-grade platform comprising **97 distinct modules** across 9 phases, including a pure SVG 2D Campus Digital Twin, a Directorate SuperAdmin Suite, Serverless deployment adapters, and automated testing suites.

To provide clear division of labor, the entire repository is partitioned across the 5 students by domain expertise:

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       5-STUDENT COMPLETE SYSTEM PARTITIONING                                      │
├────────────────────┬────────────────────┬────────────────────┬────────────────────┬───────────────────────────────┤
│     STUDENT 1      │     STUDENT 2      │     STUDENT 3      │     STUDENT 4      │           STUDENT 5           │
│   Infrastructure,  │ Grievance Intake,  │  AI Triage Engine  │ Workforce Dispatch │      Directorate Governance,  │
│  Security, Core &  │ Tracking & Student │  & Campus 2D SVG   │ & Squad Operations │       SLA State Machine &     │
│   Serverless Lead  │   Experience Lead  │ Digital Twin Lead  │  Workstations Lead │        Quality Assurance Lead │
├────────────────────┼────────────────────┼────────────────────┼────────────────────┼───────────────────────────────┤
│      30 Files      │      18 Files      │      22 Files      │      14 Files      │            18 Files           │
│  Phase 1, 2, 5, 6, │ Phase 2, 3, 4, 5,  │  Phase 2, 3, 4, 5, │  Phase 2, 3, 4, 5, │       Phase 3, 4, 5, 6, 7,    │
│      8, 9          │     6, 7, 8        │      6, 7          │      6, 7, 8       │         8 & Test Suites       │
└────────────────────┴────────────────────┴────────────────────┴────────────────────┴───────────────────────────────┘
```

---

## 2. Master 5-Student Overview

| Student / Role | Domain Focus | File Count | Core Technologies Used | Key Viva Defense Hook |
| :--- | :--- | :---: | :--- | :--- |
| **Student 1**<br>*(Infrastructure, Security & Serverless Lead)* | Database Engine, WAL Mode, Session Lifecycles, JWT/Bcrypt, Auth Gateway, Serverless Adapter, App Router, Global State | **30 Files** | FastAPI, SQLAlchemy 2.0, SQLite WAL, PyJWT, Passlib, React Router, Vite, Tailwind | *"I built the system foundation: SQLite WAL concurrency, cryptographic JWT session guards, and the serverless cloud runtime bridge."* |
| **Student 2**<br>*(Intake Gateway, Tracking & Student UX Lead)* | Collision-Resistant Code Generation, NLP Keyword Routing, Multi-Mode Intake, Progress Tracking, Student Portal, Resident Onboarding | **18 Files** | CSPRNG `secrets`, Regex Tokenization, Controlled React Forms, Dynamic QR, Stepper UI | *"I engineered the collision-resistant CSPRNG tracking generator and automated keyword router for student grievance intake."* |
| **Student 3**<br>*(AI Triage, Urgency & Digital Twin Lead)* | Urgency Scoring Heuristics, Life-Safety Short-Circuiting, 5-Domain Classifier, Keystroke Debouncing, SVG Digital Twin Cartography | **22 Files** | Heuristic Rules, SVG Geometry, 2D Camera Matrix Hook, Cartesian Grid Math, Lucide Icons | *"I built the life-safety hazard triage engine and the interactive 2D SVG Campus Digital Twin with zero external map dependencies."* |
| **Student 4**<br>*(Workforce Dispatch & Squad Operations Lead)* | Least-Loaded Queue Balancing Algorithm, SQL Aggregations, Reassignment Engine, Facility Admin Desk, Technician Workstation | **14 Files** | Greedy Queue Optimization, SQL `GROUP BY`, Relational Cascades, Workstation Filters | *"I developed the autonomous least-loaded squad dispatch algorithm to balance maintenance queues and avoid technician burnout."* |
| **Student 5**<br>*(Directorate Governance, SLA & QA Lead)* | Finite State Machine (FSM), SLA Countdown Clocks, Anti-Fraud Resolution Guards, SuperAdmin Desk, Automated Verification Suite | **18 Files** | Directed Graph FSM, Non-blocking `setInterval`, UTC Arithmetic, Pytest TestClient | *"I enforced the 7-state lifecycle finite state machine, anti-fraud repair documentation guards, and built the automated test suite."* |

---

## 3. Person-by-Person Exhaustive File Breakdown

---

### 👤 Student 1: Infrastructure, Security, Core & Serverless Lead
**Subsystem**: **Backend Foundation, Authentication, Core Schemas, Serverless Adapter & Frontend App Shell**  
**Total Assigned Files**: **30 Modules**

Student 1 built the foundational infrastructure of the platform. Without Student 1, the server cannot boot, no database tables exist, no passwords can be hashed, no JWT tokens can be issued, and no React application can mount.

#### Complete File Inventory (30 Files):

| # | File Path | Type | Documentation Manual Link | Direct Responsibility in Platform |
| :-: | :--- | :---: | :--- | :--- |
| 1 | `backend/app/main.py` | Backend | [`backend/app/main.py.md`](codebase/backend/app/main.py.md) | ASGI application entrypoint, CORS middleware, lifespan startup seeder, error handlers |
| 2 | `backend/app/core/config.py` | Backend | [`backend/app/core/config.py.md`](codebase/backend/app/core/config.py.md) | Pydantic `BaseSettings` parsing `.env`, database URLs, JWT secret keys, token lifespans |
| 3 | `backend/app/core/constants.py` | Backend | [`backend/app/core/constants.py.md`](codebase/backend/app/core/constants.py.md) | System enums: User roles (`STUDENT`, `TECHNICIAN`, `ADMIN`, `SUPERADMIN`), SLA hours |
| 4 | `backend/app/core/database.py` | Backend | [`backend/app/core/database.py.md`](codebase/backend/app/core/database.py.md) | SQLAlchemy engine, sessionmaker, SQLite WAL mode PRAGMA, thread-local session generator |
| 5 | `backend/app/core/security.py` | Backend | [`backend/app/core/security.py.md`](codebase/backend/app/core/security.py.md) | Passlib bcrypt password hashing, salting, HMAC-SHA256 JWT generation and validation |
| 6 | `backend/app/db/base.py` | Backend | [`backend/app/db/base.py.md`](codebase/backend/app/db/base.py.md) | Central database import hub unifying ORM models for Alembic/metadata discovery |
| 7 | `backend/app/db/seed.py` | Backend | [`backend/app/db/seed.py.md`](codebase/backend/app/db/seed.py.md) | Institutional seeder bootstrapping initial departments, maintenance teams, and default accounts |
| 8 | `backend/app/models/base.py` | Backend | [`backend/app/models/base.py.md`](codebase/backend/app/models/base.py.md) | Base ORM class providing `id`, `created_at`, and `updated_at` to all SQL tables |
| 9 | `backend/app/models/__init__.py` | Backend | [`backend/app/models/__init__.py.md`](codebase/backend/app/models/__init__.py.md) | Package initializer aggregating all ORM entities so `Base.metadata` detects all tables |
| 10 | `backend/app/models/user.py` | Backend | [`backend/app/models/user.py.md`](codebase/backend/app/models/user.py.md) | Relational table for campus users with roles, hashed passwords, and squad associations |
| 11 | `backend/app/schemas/user.py` | Backend | [`backend/app/schemas/user.py.md`](codebase/backend/app/schemas/user.py.md) | Pydantic DTOs for user registration, login payloads, and profile responses |
| 12 | `backend/app/api/deps.py` | Backend | [`backend/app/api/deps.py.md`](codebase/backend/app/api/deps.py.md) | FastAPI dependency injection gatekeeper: `get_db`, `get_current_user`, `require_role` |
| 13 | `backend/app/api/v1/router.py` | Backend | [`backend/app/api/v1/router.py.md`](codebase/backend/app/api/v1/router.py.md) | Master API router mounting all 8 endpoint sub-routers under `/api/v1` |
| 14 | `backend/app/api/v1/endpoints/auth.py` | Backend | [`backend/app/api/v1/endpoints/auth.py.md`](codebase/backend/app/api/v1/endpoints/auth.py.md) | Authentication routes: login, registration, token refresh, OTP verification |
| 15 | `backend/index.py` | Backend | [`backend/index.py.md`](codebase/backend/index.py.md) | Serverless cloud bridge adapter for Vercel, dynamic `sys.path` injection |
| 16 | `frontend/index.html` | Frontend | [`frontend/index.html.md`](codebase/frontend/index.html.md) | Single Page Application HTML root, inline anti-FOUC theme script, font preconnects |
| 17 | `frontend/vite.config.js` | Frontend | [`frontend/vite.config.js.md`](codebase/frontend/vite.config.js.md) | Bundler configuration, development reverse proxy (`/api` $\to$ `:8000`), chunk splitting |
| 18 | `frontend/tailwind.config.js` | Frontend | [`frontend/tailwind.config.js.md`](codebase/frontend/tailwind.config.js.md) | Theme configuration, color tokens, animations, JIT CSS content scanner |
| 19 | `frontend/postcss.config.js` | Frontend | [`frontend/postcss.config.js.md`](codebase/frontend/postcss.config.js.md) | PostCSS pipeline running Tailwind CSS compiler and Autoprefixer vendor prefixing |
| 20 | `frontend/src/main.jsx` | Frontend | [`frontend/src/main.jsx.md`](codebase/frontend/src/main.jsx.md) | Client entrypoint mounting React 18 `createRoot` into `#root` DOM node |
| 21 | `frontend/src/App.jsx` | Frontend | [`frontend/src/App.jsx.md`](codebase/frontend/src/App.jsx.md) | Master application shell nesting `ThemeProvider`, `AuthProvider`, and `AppRouter` |
| 22 | `frontend/src/styles/globals.css` | Frontend | [`frontend/src/styles/globals.css.md`](codebase/frontend/src/styles/globals.css.md) | CSS stylesheet declaring `@tailwind` directives, custom scrollbars, animations |
| 23 | `frontend/src/api/client.js` | Frontend | [`frontend/src/api/client.js.md`](codebase/frontend/src/api/client.js.md) | Axios instance with JWT interceptor and automatic `401 Unauthorized` handling |
| 24 | `frontend/src/api/auth.js` | Frontend | [`frontend/src/api/auth.js.md`](codebase/frontend/src/api/auth.js.md) | Client API functions for login, register, profile fetching, and password updates |
| 25 | `frontend/src/context/AuthContext.jsx` | Frontend | [`frontend/src/context/AuthContext.jsx.md`](codebase/frontend/src/context/AuthContext.jsx.md) | Global state provider storing JWT tokens, current user role, and login/logout handlers |
| 26 | `frontend/src/context/ThemeContext.jsx` | Frontend | [`frontend/src/context/ThemeContext.jsx.md`](codebase/frontend/src/context/ThemeContext.jsx.md) | Global theme provider managing dark mode toggle and `localStorage` persistence |
| 27 | `frontend/src/router/AppRouter.jsx` | Frontend | [`frontend/src/router/AppRouter.jsx.md`](codebase/frontend/src/router/AppRouter.jsx.md) | Declarative React Router routing tree with role-based Route Guards |
| 28 | `frontend/src/components/SetPasswordModal.jsx` | Frontend | [`frontend/src/components/SetPasswordModal.jsx.md`](codebase/frontend/src/components/SetPasswordModal.jsx.md) | Security modal prompting first-time Google OAuth or seeded users to set a local password |
| 29 | `frontend/src/pages/Login.jsx` | Frontend | [`frontend/src/pages/Login.jsx.md`](codebase/frontend/src/pages/Login.jsx.md) | Authentication page with role selection, email/password form, and demo login buttons |
| 30 | `frontend/src/pages/Register.jsx` | Frontend | [`frontend/src/pages/Register.jsx.md`](codebase/frontend/src/pages/Register.jsx.md) | Institutional scholar registration portal with campus email domain validation |

#### Student 1's Key Viva Defense Answers:
* **Q1: Why SQLite WAL Mode?** Standard SQLite locks the entire database file on write, crashing concurrent requests. Write-Ahead Logging (`PRAGMA journal_mode=WAL`) allows concurrent readers to read committed snapshots while writes append to a separate `.wal` file.
* **Q2: Why use `yield` in `get_db`?** The Python generator pattern wrapped by FastAPI's `Depends()` guarantees that `db.close()` runs in the `finally` block even if the client disconnects or an unhandled HTTP exception is thrown, preventing connection leaks.
* **Q3: How does JWT Authentication work statelessly?** The server does not store active session IDs in a database. Instead, user claims (`sub`, `role`, `exp`) are encoded into a base64 payload and signed using HMAC-SHA256 (`HS256`). On each request, the server verifies the cryptographic signature with `SECRET_KEY`.

---

### 👤 Student 2: Ingestion Gateway, Tracking & Student UX Lead
**Subsystem**: **Intake Gateway, Tracking Code Generation, Keyword Router, Resident Scholars & Student Portal**  
**Total Assigned Files**: **18 Modules**

Student 2 owns the entire student-facing journey: receiving complaints through multiple input modes (manual, dropdown, map click), generating collision-resistant tracking codes, routing grievances to the right department using dictionary scanning, and rendering tracking dashboards.

#### Complete File Inventory (18 Files):

| # | File Path | Type | Documentation Manual Link | Direct Responsibility in Platform |
| :-: | :--- | :---: | :--- | :--- |
| 1 | `backend/app/models/ticket.py` | Backend | [`backend/app/models/ticket.py.md`](codebase/backend/app/models/ticket.py.md) | SQLAlchemy table for tickets with tracking codes, foreign keys, location, and SLA timestamps |
| 2 | `backend/app/schemas/complaint.py` | Backend | [`backend/app/schemas/complaint.py.md`](codebase/backend/app/schemas/complaint.py.md) | Pydantic validation schemas for raw intake: `title`, `description`, `location`, `priority` |
| 3 | `backend/app/schemas/ticket.py` | Backend | [`backend/app/schemas/ticket.py.md`](codebase/backend/app/schemas/ticket.py.md) | Public ticket response contracts, status updates, and tracking DTOs |
| 4 | `backend/app/utils/code_generator.py` | Backend | [`backend/app/utils/code_generator.py.md`](codebase/backend/app/utils/code_generator.py.md) | CSPRNG collision-resistant tracking code generator (`TICK-YYYYMMDD-XXXX`) excluding `0, 1, O, I` |
| 5 | `backend/app/services/keyword_router.py` | Backend | [`backend/app/services/keyword_router.py.md`](codebase/backend/app/services/keyword_router.py.md) | Natural language keyword router matching grievance narratives to campus departments |
| 6 | `backend/app/services/ticket_service.py` | Backend | [`backend/app/services/ticket_service.py.md`](codebase/backend/app/services/ticket_service.py.md) | Complaint orchestrator: creates ticket records, binds codes, coordinates triage and dispatch |
| 7 | `backend/app/api/v1/endpoints/complaints.py` | Backend | [`backend/app/api/v1/endpoints/complaints.py.md`](codebase/backend/app/api/v1/endpoints/complaints.py.md) | REST routes `POST /api/v1/complaints` (intake) and `GET /api/v1/complaints/{code}` (public lookup) |
| 8 | `frontend/src/api/complaints.js` | Frontend | [`frontend/src/api/complaints.js.md`](codebase/frontend/src/api/complaints.js.md) | Frontend HTTP client for complaint submission, code lookup, and student ticket history |
| 9 | `frontend/src/utils/dateUtils.js` | Frontend | [`frontend/src/utils/dateUtils.js.md`](codebase/frontend/src/utils/dateUtils.js.md) | Date formatting utilities: relative time ("2 hours ago"), countdown strings, UTC conversions |
| 10 | `frontend/src/components/Navbar.jsx` | Frontend | [`frontend/src/components/Navbar.jsx.md`](codebase/frontend/src/components/Navbar.jsx.md) | Top navigation header with active page indicators, role badges, theme toggle, and user profile |
| 11 | `frontend/src/components/Footer.jsx` | Frontend | [`frontend/src/components/Footer.jsx.md`](codebase/frontend/src/components/Footer.jsx.md) | Persistent institutional footer with campus copyright, emergency numbers, and links |
| 12 | `frontend/src/components/Layout.jsx` | Frontend | [`frontend/src/components/Layout.jsx.md`](codebase/frontend/src/components/Layout.jsx.md) | Universal layout shell wrapping all pages with sticky header, main content, and footer |
| 13 | `frontend/src/components/SubmissionSuccessModal.jsx` | Frontend | [`frontend/src/components/SubmissionSuccessModal.jsx.md`](codebase/frontend/src/components/SubmissionSuccessModal.jsx.md) | Submission confirmation modal displaying generated code, 1-click copy, and QR code |
| 14 | `frontend/src/pages/Home.jsx` | Frontend | [`frontend/src/pages/Home.jsx.md`](codebase/frontend/src/pages/Home.jsx.md) | Public landing page featuring platform statistics, hero banner, feature highlights, and CTA |
| 15 | `frontend/src/pages/SubmitComplaint.jsx` | Frontend | [`frontend/src/pages/SubmitComplaint.jsx.md`](codebase/frontend/src/pages/SubmitComplaint.jsx.md) | Multi-mode intake form: free text, structured dropdowns, interactive SVG map pin, live triage |
| 16 | `frontend/src/pages/TrackTicket.jsx` | Frontend | [`frontend/src/pages/TrackTicket.jsx.md`](codebase/frontend/src/pages/TrackTicket.jsx.md) | Public tracking portal with real-time 3-step visual progress bar (`SUBMITTED` $\to$ `IN_PROGRESS` $\to$ `RESOLVED`) |
| 17 | `frontend/src/pages/StudentDashboard.jsx` | Frontend | [`frontend/src/pages/StudentDashboard.jsx.md`](codebase/frontend/src/pages/StudentDashboard.jsx.md) | Logged-in student portal displaying active grievances, SLA countdown pills, and resolution remarks |
| 18 | `frontend/src/pages/ResidenceInfo.jsx` | Frontend | [`frontend/src/pages/ResidenceInfo.jsx.md`](codebase/frontend/src/pages/ResidenceInfo.jsx.md) | Onboarding guide for residential scholars displaying hostel room rules and facility directory |

#### Student 2's Key Viva Defense Answers:
* **Q1: Why use Python's `secrets` module instead of `random.randint`?** Python's `random` module uses the Mersenne Twister PRNG, which is completely deterministic and predictable if past outputs are observed. The `secrets` module accesses OS kernel CSPRNG entropy (`/dev/urandom` / CryptGenRandom), making tracking codes cryptographically unguessable.
* **Q2: Why eliminate visually ambiguous characters (`0, 1, O, I`)?** On mobile screens and handwritten receipts, `0` looks like `O` and `1` looks like `I`. Stripping them completely prevents human transcription errors when students type tracking codes.
* **Q3: How does the keyword router handle multi-word matches?** The router converts text to lowercase, strips punctuation, tokenizes words using regex boundary matchers, and checks against prioritized departmental domain dictionaries in $O(K \times W)$ time.

---

### 👤 Student 3: AI Triage, Urgency Scoring & Campus 2D Digital Twin Cartography Lead
**Subsystem**: **Heuristic Urgency Scoring, Life-Safety Hazard Rules, Live Triage Card & 2D SVG Digital Twin Cartography**  
**Total Assigned Files**: **22 Modules**

Student 3 is responsible for operational intelligence and spatial visualization: automatically detecting critical emergencies before cosmetic complaints, debouncing live triage cards in the UI, and architecting the interactive 2D SVG Digital Twin campus map with custom camera matrix controls.

#### Complete File Inventory (22 Files):

| # | File Path | Type | Documentation Manual Link | Direct Responsibility in Platform |
| :-: | :--- | :---: | :--- | :--- |
| 1 | `backend/app/models/campus.py` | Backend | [`backend/app/models/campus.py.md`](codebase/backend/app/models/campus.py.md) | SQLAlchemy table for campus buildings, SVG coordinates, room counts, and active fault density |
| 2 | `backend/app/schemas/priority.py` | Backend | [`backend/app/schemas/priority.py.md`](codebase/backend/app/schemas/priority.py.md) | Pydantic DTOs for priority predictions, triage previews, and supervisor priority overrides |
| 3 | `backend/app/schemas/campus.py` | Backend | [`backend/app/schemas/campus.py.md`](codebase/backend/app/schemas/campus.py.md) | Pydantic contracts for campus buildings, labs, rooms, and SVG coordinate geometry |
| 4 | `backend/app/services/priority_engine.py` | Backend | [`backend/app/services/priority_engine.py.md`](codebase/backend/app/services/priority_engine.py.md) | Multi-tier heuristic urgency engine scoring severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) |
| 5 | `backend/app/services/classifier.py` | Backend | [`backend/app/services/classifier.py.md`](codebase/backend/app/services/classifier.py.md) | 5-domain taxonomy classifier assigning confidence probabilities across departments |
| 6 | `backend/app/services/ai_triage_service.py` | Backend | [`backend/app/services/ai_triage_service.py.md`](codebase/backend/app/services/ai_triage_service.py.md) | Instantaneous $(<15\text{ms})$ typing preview service predicting department & priority on the fly |
| 7 | `backend/app/api/v1/endpoints/priority.py` | Backend | [`backend/app/api/v1/endpoints/priority.py.md`](codebase/backend/app/api/v1/endpoints/priority.py.md) | REST routes `POST /api/v1/priority/triage` and `PATCH /api/v1/priority/{id}/override` |
| 8 | `backend/app/api/v1/endpoints/campus.py` | Backend | [`backend/app/api/v1/endpoints/campus.py.md`](codebase/backend/app/api/v1/endpoints/campus.py.md) | REST routes for spatial querying: `GET /api/v1/campus/buildings`, room listings, fault heatmaps |
| 9 | `frontend/src/api/triage.js` | Frontend | [`frontend/src/api/triage.js.md`](codebase/frontend/src/api/triage.js.md) | Axios API client for live triage card preview and administrative priority override requests |
| 10 | `frontend/src/api/campus.js` | Frontend | [`frontend/src/api/campus.js.md`](codebase/frontend/src/api/campus.js.md) | Axios API client for fetching spatial geometries, building lists, and room inventories |
| 11 | `frontend/src/components/PriorityBadge.jsx` | Frontend | [`frontend/src/components/PriorityBadge.jsx.md`](codebase/frontend/src/components/PriorityBadge.jsx.md) | Semantic visual pill: pulsing red for `CRITICAL`, amber for `HIGH`, blue for `MEDIUM`, gray for `LOW` |
| 12 | `frontend/src/components/LiveTriageCard.jsx` | Frontend | [`frontend/src/components/LiveTriageCard.jsx.md`](codebase/frontend/src/components/LiveTriageCard.jsx.md) | Real-time preview card debounced at 500ms showing predicted department and priority pill |
| 13 | `frontend/src/components/PriorityOverrideModal.jsx` | Frontend | [`frontend/src/components/PriorityOverrideModal.jsx.md`](codebase/frontend/src/components/PriorityOverrideModal.jsx.md) | Supervisor dialog allowing priority re-classification with mandatory justification audit notes |
| 14 | `frontend/src/components/CampusMapSelector.jsx` | Frontend | [`frontend/src/components/CampusMapSelector.jsx.md`](codebase/frontend/src/components/CampusMapSelector.jsx.md) | Interactive mini-map modal allowing students to click a building to auto-populate complaint location |
| 15 | `frontend/src/data/iiitnrCampusData.js` | Frontend | [`frontend/src/data/iiitnrCampusData.js.md`](codebase/frontend/src/data/iiitnrCampusData.js.md) | Master campus dataset: building codes, floor plans, room directories, and GPS coordinates |
| 16 | `frontend/src/data/campusTwin/campusGeometry.js` | Frontend | [`frontend/src/data/campusTwin/campusGeometry.js.md`](codebase/frontend/src/data/campusTwin/campusGeometry.js.md) | Declarative SVG vector paths, polygon coordinates, road centerlines, and campus boundary outlines |
| 17 | `frontend/src/data/campusTwin/campusLabsAndRooms.js` | Frontend | [`frontend/src/data/campusTwin/campusLabsAndRooms.js.md`](codebase/frontend/src/data/campusTwin/campusLabsAndRooms.js.md) | Relational catalog mapping room numbers to specific wings, floor levels, and facility functions |
| 18 | `frontend/src/data/campusTwin/campusSearchEngine.js` | Frontend | [`frontend/src/data/campusTwin/campusSearchEngine.js.md`](codebase/frontend/src/data/campusTwin/campusSearchEngine.js.md) | In-memory spatial search engine performing fuzzy room code, lab name, and building lookups |
| 19 | `frontend/src/components/campusTwin/useMapCamera.js` | Frontend | [`frontend/src/components/campusTwin/useMapCamera.js.md`](codebase/frontend/src/components/campusTwin/useMapCamera.js.md) | Custom React hook managing camera pan/zoom matrix, `viewBox` clamping, and wheel listeners |
| 20 | `frontend/src/components/campusTwin/DigitalTwinCanvas.jsx` | Frontend | [`frontend/src/components/campusTwin/DigitalTwinCanvas.jsx.md`](codebase/frontend/src/components/campusTwin/DigitalTwinCanvas.jsx.md) | Pure declarative SVG viewport rendering buildings, road networks, hover states, and pin markers |
| 21 | `frontend/src/components/campusTwin/DigitalTwinInspector.jsx` | Frontend | [`frontend/src/components/campusTwin/DigitalTwinInspector.jsx.md`](codebase/frontend/src/components/campusTwin/DigitalTwinInspector.jsx.md) | Spatial sidebar panel displaying building metadata, room occupancy, and live unresolved fault list |
| 22 | `frontend/src/components/campusTwin/DigitalTwinSearchBar.jsx` | Frontend | [`frontend/src/components/campusTwin/DigitalTwinSearchBar.jsx.md`](codebase/frontend/src/components/campusTwin/DigitalTwinSearchBar.jsx.md) | Interactive autocomplete search bar that zooms the camera matrix directly to the selected room |

#### Student 3's Key Viva Defense Answers:
* **Q1: How does Life-Safety Hazard Short-Circuiting work?** The priority engine performs a short-circuit pass checking for immediate danger keywords (`"spark"`, `"smoke"`, `"shock"`, `"fire"`, `"gas leak"`). If detected, it bypasses standard numeric scoring and escalates immediately to `CRITICAL`, ensuring life safety overrules cosmetic complaints.
* **Q2: Why debounce the live triage card by 500ms?** If an API call was triggered on every keystroke, a student typing a 60-character description would generate 60 HTTP requests. Using a 500ms debounce timer via `setTimeout` and `clearTimeout`, the request is only dispatched when the user stops typing, reducing network traffic by over 90%.
* **Q3: How does the Digital Twin work without Google Maps or Leaflet?** It uses pure declarative **Scalable Vector Graphics (SVG)**. Real satellite building coordinates were normalized into a localized Cartesian grid (`viewBox="0 0 1000 800"`). A custom React hook (`useMapCamera.js`) recalculates `viewBox` coordinates on mouse drag (pan) and wheel roll (zoom) with zero external library overhead.

---

### 👤 Student 4: Workforce Dispatch, Squad Balancer & Operations Lead
**Subsystem**: **Workforce Load Balancing Engine, Squad Management, Facility Admin Desk & Technician Workstation**  
**Total Assigned Files**: **14 Modules**

Student 4 is responsible for fair labor distribution and field maintenance execution: ensuring work orders are automatically routed to the least-loaded qualified squad, giving supervisors visibility into team backlogs, and giving field technicians a dedicated workstation to complete tasks.

#### Complete File Inventory (14 Files):

| # | File Path | Type | Documentation Manual Link | Direct Responsibility in Platform |
| :-: | :--- | :---: | :--- | :--- |
| 1 | `backend/app/models/department.py` | Backend | [`backend/app/models/department.py.md`](codebase/backend/app/models/department.py.md) | SQLAlchemy table for campus departments (`Electrical`, `Plumbing`, `IT`, `Civil`, `Sanitation`) |
| 2 | `backend/app/models/team.py` | Backend | [`backend/app/models/team.py.md`](codebase/backend/app/models/team.py.md) | SQLAlchemy table for maintenance squads, tracking department foreign key and active status |
| 3 | `backend/app/schemas/department.py` | Backend | [`backend/app/schemas/department.py.md`](codebase/backend/app/schemas/department.py.md) | Pydantic DTOs for department listing, squad counts, and contact information |
| 4 | `backend/app/schemas/assignment.py` | Backend | [`backend/app/schemas/assignment.py.md`](codebase/backend/app/schemas/assignment.py.md) | Pydantic validation schemas for squad workload summaries and team reassignment payloads |
| 5 | `backend/app/services/dispatch_engine.py` | Backend | [`backend/app/services/dispatch_engine.py.md`](codebase/backend/app/services/dispatch_engine.py.md) | Autonomous workforce balancer dispatching tickets to the squad with `min(active_tickets)` |
| 6 | `backend/app/services/team_service.py` | Backend | [`backend/app/services/team_service.py.md`](codebase/backend/app/services/team_service.py.md) | Squad query service calculating real-time queue depth, team rosters, and availability |
| 7 | `backend/app/api/v1/endpoints/assignment.py` | Backend | [`backend/app/api/v1/endpoints/assignment.py.md`](codebase/backend/app/api/v1/endpoints/assignment.py.md) | REST routes `GET /api/v1/assignment/workloads` and `PATCH /api/v1/assignment/{id}/reassign` |
| 8 | `frontend/src/api/assignment.js` | Frontend | [`frontend/src/api/assignment.js.md`](codebase/frontend/src/api/assignment.js.md) | Frontend HTTP client fetching squad workload statistics and executing reassignment requests |
| 9 | `frontend/src/components/TeamWorkloadView.jsx` | Frontend | [`frontend/src/components/TeamWorkloadView.jsx.md`](codebase/frontend/src/components/TeamWorkloadView.jsx.md) | Responsive squad visualizer showing queue capacity meters, active counts, and duty badges |
| 10 | `frontend/src/components/ReassignTeamModal.jsx` | Frontend | [`frontend/src/components/ReassignTeamModal.jsx.md`](codebase/frontend/src/components/ReassignTeamModal.jsx.md) | Administrative modal allowing facility supervisors to transfer tickets between squads |
| 11 | `frontend/src/components/ResolutionNotesModal.jsx` | Frontend | [`frontend/src/components/ResolutionNotesModal.jsx.md`](codebase/frontend/src/components/ResolutionNotesModal.jsx.md) | Technician dialog enforcing mandatory repair notes ($\ge 10$ chars) before resolving tickets |
| 12 | `frontend/src/pages/AdminDashboard.jsx` | Frontend | [`frontend/src/pages/AdminDashboard.jsx.md`](codebase/frontend/src/pages/AdminDashboard.jsx.md) | Facility supervisor console with tabbed filtering (`ALL`, `CRITICAL`, `OVERDUE`), search, actions |
| 13 | `frontend/src/pages/TechnicianWorkstation.jsx` | Frontend | [`frontend/src/pages/TechnicianWorkstation.jsx.md`](codebase/frontend/src/pages/TechnicianWorkstation.jsx.md) | Field technician workstation showing only work orders assigned to the logged-in technician's squad |
| 14 | `frontend/src/pages/SquadsPage.jsx` | Frontend | [`frontend/src/pages/SquadsPage.jsx.md`](codebase/frontend/src/pages/SquadsPage.jsx.md) | Facility overview page showing all maintenance squads ranked by Priority Demand Stress Index |

#### Student 4's Key Viva Defense Answers:
* **Q1: How does the Least-Loaded Dispatch Algorithm prevent technician burnout?** Rather than using simple round-robin (which can assign tickets to a squad already drowning in complex, slow repairs), the algorithm queries active tickets (`status != 'RESOLVED'`), groups them by `assigned_team_id`, and selects the active squad with the minimum queue count in $O(N)$ time.
* **Q2: Why use SQL `func.count()` instead of counting tickets in Python?** Loading thousands of raw ticket rows over the network into Python memory to count them wastes bandwidth and CPU. SQLAlchemy translates `func.count(Ticket.id)` into an optimized SQL `GROUP BY` query executed natively inside the database engine in single-digit milliseconds.
* **Q3: How does reassignment maintain accountability?** When a supervisor transfers a ticket to another squad via `ReassignTeamModal`, the system appends an audit message to `resolution_notes` recording who reassigned it, from which squad to which squad, and the reason.

---

### 👤 Student 5: Directorate Governance, SLA & Quality Assurance Lead
**Subsystem**: **Finite State Machine Lifecycle, SLA Clocks, SuperAdmin Governance & Automated Test Suite**  
**Total Assigned Files**: **18 Modules**

Student 5 owns accountability, formal verification, and executive directorate controls: guaranteeing tickets follow a mathematically valid state transition graph, calculating SLA deadlines, flagging breach violations, and authoring the automated testing suite proving 100% system reliability.

#### Complete File Inventory (18 Files):

| # | File Path | Type | Documentation Manual Link | Direct Responsibility in Platform |
| :-: | :--- | :---: | :--- | :--- |
| 1 | `backend/app/schemas/sla.py` | Backend | [`backend/app/schemas/sla.py.md`](codebase/backend/app/schemas/sla.py.md) | Pydantic contracts for SLA deadline calculations, breach notifications, and closure notes |
| 2 | `backend/app/services/sla_engine.py` | Backend | [`backend/app/services/sla_engine.py.md`](codebase/backend/app/services/sla_engine.py.md) | Mathematical deadline calculator: `CRITICAL`=4h, `HIGH`=12h, `MEDIUM`=24h, `LOW`=72h |
| 3 | `backend/app/services/lifecycle.py` | Backend | [`backend/app/services/lifecycle.py.md`](codebase/backend/app/services/lifecycle.py.md) | Finite State Machine (FSM) enforcing valid status transitions (`SUBMITTED` $\to$ `IN_PROGRESS` $\to$ `RESOLVED`) |
| 4 | `backend/app/services/user_service.py` | Backend | [`backend/app/services/user_service.py.md`](codebase/backend/app/services/user_service.py.md) | User management service handling role provisioning, staff status toggling, and queries |
| 5 | `backend/app/api/v1/endpoints/sla.py` | Backend | [`backend/app/api/v1/endpoints/sla.py.md`](codebase/backend/app/api/v1/endpoints/sla.py.md) | REST routes `GET /api/v1/sla/breaches` (overdue tickets) and `POST /api/v1/sla/{id}/resolve` |
| 6 | `backend/app/api/v1/endpoints/superadmin.py` | Backend | [`backend/app/api/v1/endpoints/superadmin.py.md`](codebase/backend/app/api/v1/endpoints/superadmin.py.md) | Directorate REST endpoints: institutional KPIs, building fault density, user management |
| 7 | `frontend/src/api/sla.js` | Frontend | [`frontend/src/api/sla.js.md`](codebase/frontend/src/api/sla.js.md) | Frontend HTTP client for SLA status transitions, resolution submissions, and breach queries |
| 8 | `frontend/src/api/superadmin.js` | Frontend | [`frontend/src/api/superadmin.js.md`](codebase/frontend/src/api/superadmin.js.md) | Frontend client for executive directorate analytics, staff provisioning, and spatial data editing |
| 9 | `frontend/src/components/SLACountdownTimer.jsx` | Frontend | [`frontend/src/components/SLACountdownTimer.jsx.md`](codebase/frontend/src/components/SLACountdownTimer.jsx.md) | Dynamic ticking countdown badge updating every second; pulses red when SLA is breached |
| 10 | `frontend/src/components/SLABreachTable.jsx` | Frontend | [`frontend/src/components/SLABreachTable.jsx.md`](codebase/frontend/src/components/SLABreachTable.jsx.md) | Administrative breach table highlighting overdue complaints with escalation warning flags |
| 11 | `frontend/src/pages/SuperAdminDashboard.jsx` | Frontend | [`frontend/src/pages/SuperAdminDashboard.jsx.md`](codebase/frontend/src/pages/SuperAdminDashboard.jsx.md) | Executive command deck: campus health scores, department resolution rates, building heatmaps |
| 12 | `frontend/src/pages/SuperAdminDataEditor.jsx` | Frontend | [`frontend/src/pages/SuperAdminDataEditor.jsx.md`](codebase/frontend/src/pages/SuperAdminDataEditor.jsx.md) | Spatial infrastructure editor allowing directorate staff to edit buildings and rooms via JSON |
| 13 | `frontend/src/pages/StaffDirectoryPage.jsx` | Frontend | [`frontend/src/pages/StaffDirectoryPage.jsx.md`](codebase/frontend/src/pages/StaffDirectoryPage.jsx.md) | Staff provisioning directory allowing administrators to promote users and assign squads |
| 14 | `backend/tests/test_closed_loop.py` | Quality Gate | [`backend/tests/test_closed_loop.py`](../backend/tests/test_closed_loop.py) | Full-stack closed-loop integration test: Intake $\to$ Routing $\to$ Dispatch $\to$ SLA $\to$ Resolution |
| 15 | `backend/tests/test_m5_api.py` | Quality Gate | [`backend/tests/test_m5_api.py`](../backend/tests/test_m5_api.py) | Unit tests verifying legal vs illegal state transitions and mandatory resolution note rejection |
| 16 | `backend/tests/test_superadmin_campus.py` | Quality Gate | [`backend/tests/test_superadmin_campus.py`](../backend/tests/test_superadmin_campus.py) | Integration tests verifying SuperAdmin endpoints, building stats, and RBAC security |
| 17 | `backend/tests/test_auth.py` | Quality Gate | [`backend/tests/test_auth.py`](../backend/tests/test_auth.py) | Authentication tests: bcrypt verification, JWT claims encoding, token expiration enforcement |
| 18 | `backend/tests/test_m3_triage.py` | Quality Gate | [`backend/tests/test_m3_triage.py`](../backend/tests/test_m3_triage.py) | Unit tests verifying hazard short-circuit rules and taxonomy classifier probabilities |

#### Student 5's Key Viva Defense Answers:
* **Q1: What is the formal definition of the Finite State Machine (FSM)?** The ticket lifecycle is modeled as a directed finite state graph $G = (V, E)$ where $V = \{\text{SUBMITTED}, \text{IN\_PROGRESS}, \text{RESOLVED}\}$. Valid transitions $E = \{(\text{SUBMITTED} \to \text{IN\_PROGRESS}), (\text{IN\_PROGRESS} \to \text{RESOLVED})\}$. Any illegal transition (like jumping directly from `SUBMITTED` to `RESOLVED`) is halted with `InvalidStateTransitionError` (HTTP 400).
* **Q2: How do you prevent memory leaks with `setInterval` in React?** When rendering `SLACountdownTimer.jsx`, the ticking countdown calls `setInterval(tick, 1000)`. If a user navigates away, the interval continues running in background memory. Student 5 returned a cleanup callback `() => clearInterval(timer)` in React's `useEffect`, destroying the interval when the component unmounts.
* **Q3: Why enforce a 10-character minimum for resolution notes?** In physical facility operations, a common fraud pattern is "phantom ticket closure"—technicians clicking "Done" without visiting the room. Student 5's endpoint enforces a validation guard: attempts to resolve a ticket with $< 10$ characters are rejected with `HTTP 422 Unprocessable Entity`, creating an auditable paper trail.
* **Q4: How do the automated tests work without polluting production data?** The test suite creates an in-memory SQLite database (`sqlite:///:memory:`) using `StaticPool`. Every test executes against a pristine database instance in memory, running 66 test assertions in under 80 seconds without touching disk storage.

---

## 4. Master 97-File Cross-Reference Index (File $\to$ Student $\to$ Phase)

Use this complete alphabetical directory to look up any file in the codebase and immediately see who built it and which phase it belongs to:

| # | File Name & Path | Owner | Phase | Subsystem Description |
| :-: | :--- | :---: | :---: | :--- |
| 1 | `backend/app/api/deps.py` | **Student 1** | Phase 5 | JWT guard & database session injector |
| 2 | `backend/app/api/v1/endpoints/assignment.py` | **Student 4** | Phase 5 | Squad workload & reassignment REST routes |
| 3 | `backend/app/api/v1/endpoints/auth.py` | **Student 1** | Phase 5 | Login, registration, token refresh, OTP verification |
| 4 | `backend/app/api/v1/endpoints/campus.py` | **Student 3** | Phase 5 | Campus building geometry & room spatial endpoints |
| 5 | `backend/app/api/v1/endpoints/complaints.py` | **Student 2** | Phase 5 | Complaint intake form submission & public tracking routes |
| 6 | `backend/app/api/v1/endpoints/priority.py` | **Student 3** | Phase 5 | Live triage typing preview & supervisor priority override |
| 7 | `backend/app/api/v1/endpoints/sla.py` | **Student 5** | Phase 5 | SLA breach detection & ticket closure resolution |
| 8 | `backend/app/api/v1/endpoints/superadmin.py` | **Student 5** | Phase 5 | Directorate institutional analytics & spatial data editing |
| 9 | `backend/app/api/v1/router.py` | **Student 1** | Phase 5 | Master API gateway mounting all sub-routers under `/api/v1` |
| 10 | `backend/app/core/config.py` | **Student 1** | Phase 1 | Pydantic `BaseSettings` parsing `.env` secrets & database paths |
| 11 | `backend/app/core/constants.py` | **Student 1** | Phase 1 | System enums: User roles, ticket status, SLA windows |
| 12 | `backend/app/core/database.py` | **Student 1** | Phase 1 | SQLAlchemy engine, sessionmaker, SQLite WAL mode PRAGMA |
| 13 | `backend/app/core/security.py` | **Student 1** | Phase 1 | Passlib bcrypt hashing & PyJWT token generation/validation |
| 14 | `backend/app/db/base.py` | **Student 1** | Phase 1 | Central model aggregator for SQLAlchemy metadata discovery |
| 15 | `backend/app/db/seed.py` | **Student 1** | Phase 1 | Institutional seeder bootstrapping departments & default accounts |
| 16 | `backend/app/main.py` | **Student 1** | Phase 1 | ASGI entrypoint, CORS middleware, lifespan seeder, exception handlers |
| 17 | `backend/app/models/base.py` | **Student 1** | Phase 2 | Common model ancestor providing `id`, `created_at`, `updated_at` |
| 18 | `backend/app/models/campus.py` | **Student 3** | Phase 2 | SQLAlchemy table for campus buildings, SVG coords & fault counts |
| 19 | `backend/app/models/department.py` | **Student 4** | Phase 2 | SQLAlchemy table for campus maintenance departments |
| 20 | `backend/app/models/team.py` | **Student 4** | Phase 2 | SQLAlchemy table for maintenance squads & active queue counts |
| 21 | `backend/app/models/ticket.py` | **Student 2** | Phase 2 | SQLAlchemy table for tickets with tracking codes & foreign keys |
| 22 | `backend/app/models/user.py` | **Student 1** | Phase 2 | SQLAlchemy table for users, roles, password hashes & team bindings |
| 23 | `backend/app/models/__init__.py` | **Student 1** | Phase 2 | Model package aggregator exposing all entities to `Base.metadata` |
| 24 | `backend/app/schemas/assignment.py` | **Student 4** | Phase 3 | Pydantic DTOs for squad workload & team reassignment payloads |
| 25 | `backend/app/schemas/campus.py` | **Student 3** | Phase 3 | Pydantic contracts for campus buildings, labs, rooms & geometry |
| 26 | `backend/app/schemas/complaint.py` | **Student 2** | Phase 3 | Validation schemas for complaint intake (`title`, `description`, `location`) |
| 27 | `backend/app/schemas/department.py` | **Student 4** | Phase 3 | Pydantic DTOs for department listings & team counts |
| 28 | `backend/app/schemas/priority.py` | **Student 3** | Phase 3 | Pydantic DTOs for priority prediction & override requests |
| 29 | `backend/app/schemas/sla.py` | **Student 5** | Phase 3 | Pydantic contracts for SLA deadline math & resolution notes |
| 30 | `backend/app/schemas/ticket.py` | **Student 2** | Phase 3 | Public ticket response contracts & progress stepper DTOs |
| 31 | `backend/app/schemas/user.py` | **Student 1** | Phase 3 | Pydantic DTOs for user registration, login & profile responses |
| 32 | `backend/app/services/ai_triage_service.py` | **Student 3** | Phase 4 | Sub-15ms live typing preview service predicting priority & category |
| 33 | `backend/app/services/classifier.py` | **Student 3** | Phase 4 | 5-domain taxonomy classifier assigning confidence probabilities |
| 34 | `backend/app/services/dispatch_engine.py` | **Student 4** | Phase 4 | Least-loaded workforce load balancer assigning `min(active_tickets)` |
| 35 | `backend/app/services/keyword_router.py` | **Student 2** | Phase 4 | Natural language keyword router matching complaints to departments |
| 36 | `backend/app/services/lifecycle.py` | **Student 5** | Phase 4 | Finite State Machine (FSM) enforcing legal transitions & note checks |
| 37 | `backend/app/services/priority_engine.py` | **Student 3** | Phase 4 | Urgency scoring heuristics & life-safety hazard short-circuiting |
| 38 | `backend/app/services/sla_engine.py` | **Student 5** | Phase 4 | Contractual resolution deadline calculator (4h, 12h, 24h, 72h) |
| 39 | `backend/app/services/team_service.py` | **Student 4** | Phase 4 | Squad utilization & active ticket queue depth query service |
| 40 | `backend/app/services/ticket_service.py` | **Student 2** | Phase 4 | Complaint orchestrator: ticket creation, code binding & lookups |
| 41 | `backend/app/services/user_service.py` | **Student 5** | Phase 4 | User management service for role provisioning & staff status |
| 42 | `backend/app/utils/code_generator.py` | **Student 2** | Phase 4 | CSPRNG collision-resistant ticket code generator (`TICK-XXXX`) |
| 43 | `backend/index.py` | **Student 1** | Phase 9 | Serverless cloud bridge adapter for Vercel ASGI execution |
| 44 | `backend/tests/test_auth.py` | **Student 5** | Test Suite | Unit tests for bcrypt hashing, JWT issuance & token expiration |
| 45 | `backend/tests/test_closed_loop.py` | **Student 5** | Test Suite | Closed-loop integration test: Intake $\to$ Routing $\to$ Dispatch $\to$ SLA $\to$ Resolve |
| 46 | `backend/tests/test_m3_triage.py` | **Student 5** | Test Suite | Unit tests for hazard short-circuit rules & classification engine |
| 47 | `backend/tests/test_m5_api.py` | **Student 5** | Test Suite | Unit tests for state machine transitions & mandatory resolution notes |
| 48 | `backend/tests/test_superadmin_campus.py` | **Student 5** | Test Suite | Integration tests for SuperAdmin endpoints & RBAC security |
| 49 | `frontend/index.html` | **Student 1** | Phase 9 | SPA HTML container, anti-FOUC theme script & font preconnects |
| 50 | `frontend/postcss.config.js` | **Student 1** | Phase 9 | PostCSS compilation pipeline & Autoprefixer vendor prefixing |
| 51 | `frontend/src/App.jsx` | **Student 1** | Phase 6 | Master application shell nesting providers and `AppRouter` |
| 52 | `frontend/src/api/assignment.js` | **Student 4** | Phase 6 | Axios client fetching squad workloads & executing reassignments |
| 53 | `frontend/src/api/auth.js` | **Student 1** | Phase 6 | Axios client for login, register, profile fetching & password resets |
| 54 | `frontend/src/api/campus.js` | **Student 3** | Phase 6 | Axios client fetching spatial building geometries & room lists |
| 55 | `frontend/src/api/client.js` | **Student 1** | Phase 6 | Central Axios instance with JWT bearer interceptors & 401 handling |
| 56 | `frontend/src/api/complaints.js` | **Student 2** | Phase 6 | Axios client for complaint intake, tracking & student history |
| 57 | `frontend/src/api/sla.js` | **Student 5** | Phase 6 | Axios client for status transitions, notes & breach listings |
| 58 | `frontend/src/api/superadmin.js` | **Student 5** | Phase 6 | Axios client for directorate analytics, staff provisioning & editor |
| 59 | `frontend/src/api/triage.js` | **Student 3** | Phase 6 | Axios client for real-time live triage preview & priority overrides |
| 60 | `frontend/src/components/campusTwin/DigitalTwinCanvas.jsx` | **Student 3** | Phase 7 | Pure declarative SVG canvas rendering buildings, roads & markers |
| 61 | `frontend/src/components/campusTwin/DigitalTwinInspector.jsx` | **Student 3** | Phase 7 | Spatial sidebar displaying building info, rooms & active faults |
| 62 | `frontend/src/components/campusTwin/DigitalTwinSearchBar.jsx` | **Student 3** | Phase 7 | Autocomplete search bar zooming camera matrix directly to rooms |
| 63 | `frontend/src/components/campusTwin/useMapCamera.js` | **Student 3** | Phase 7 | React hook managing camera pan/zoom matrix & `viewBox` clamping |
| 64 | `frontend/src/components/CampusMapSelector.jsx` | **Student 3** | Phase 7 | Interactive mini-map modal allowing students to click building pin |
| 65 | `frontend/src/components/Footer.jsx` | **Student 2** | Phase 7 | Institutional footer with copyright, emergency numbers & links |
| 66 | `frontend/src/components/Layout.jsx` | **Student 2** | Phase 7 | Universal layout shell wrapping every page with header & footer |
| 67 | `frontend/src/components/LiveTriageCard.jsx` | **Student 3** | Phase 7 | Real-time typing card updating category & priority preview |
| 68 | `frontend/src/components/Navbar.jsx` | **Student 2** | Phase 7 | Command header with navigation pills, role badge & theme toggle |
| 69 | `frontend/src/components/PriorityBadge.jsx` | **Student 3** | Phase 7 | Color-coded badge pills (pulsing red for `CRITICAL`, etc.) |
| 70 | `frontend/src/components/PriorityOverrideModal.jsx` | **Student 3** | Phase 7 | Supervisor dialog for priority adjustments with reason audit logging |
| 71 | `frontend/src/components/ReassignTeamModal.jsx` | **Student 4** | Phase 7 | Supervisor dialog transferring tickets between squads with logs |
| 72 | `frontend/src/components/ResolutionNotesModal.jsx` | **Student 4** | Phase 7 | Technician modal enforcing $\ge 10$-character repair notes on closure |
| 73 | `frontend/src/components/SetPasswordModal.jsx` | **Student 1** | Phase 7 | Security modal prompting OAuth/seeded users to set local passwords |
| 74 | `frontend/src/components/SLABreachTable.jsx` | **Student 5** | Phase 7 | Administrative table aggregating overdue complaints with breach tags |
| 75 | `frontend/src/components/SLACountdownTimer.jsx` | **Student 5** | Phase 7 | Real-time ticking badge updating every second; pulses red on breach |
| 76 | `frontend/src/components/SubmissionSuccessModal.jsx` | **Student 2** | Phase 7 | Confirmation modal rendering generated code, 1-click copy & QR |
| 77 | `frontend/src/components/TeamWorkloadView.jsx` | **Student 4** | Phase 7 | Responsive squad visualizer showing queue meters & active counts |
| 78 | `frontend/src/context/AuthContext.jsx` | **Student 1** | Phase 6 | Global state provider storing JWT tokens, user role & login/logout |
| 79 | `frontend/src/context/ThemeContext.jsx` | **Student 1** | Phase 6 | Global theme provider managing dark mode toggle & persistence |
| 80 | `frontend/src/data/campusTwin/campusGeometry.js` | **Student 3** | Phase 7 | SVG vector coordinates, polygon paths & road network geometry |
| 81 | `frontend/src/data/campusTwin/campusLabsAndRooms.js` | **Student 3** | Phase 7 | Room directory mapping numbers to wings, floors & facility uses |
| 82 | `frontend/src/data/campusTwin/campusSearchEngine.js` | **Student 3** | Phase 7 | In-memory spatial search engine performing fuzzy room code lookups |
| 83 | `frontend/src/data/iiitnrCampusData.js` | **Student 3** | Phase 7 | Master campus dataset: building codes, floor counts, room lists |
| 84 | `frontend/src/main.jsx` | **Student 1** | Phase 6 | React 18 entrypoint instantiating `ReactDOM.createRoot` |
| 85 | `frontend/src/pages/AdminDashboard.jsx` | **Student 4** | Phase 8 | Facility supervisor console with tabbed filtering & batch actions |
| 86 | `frontend/src/pages/Home.jsx` | **Student 2** | Phase 8 | Public landing page featuring platform statistics & quick actions |
| 87 | `frontend/src/pages/Login.jsx` | **Student 1** | Phase 8 | Authentication page with role selection, credentials & demo buttons |
| 88 | `frontend/src/pages/Register.jsx` | **Student 1** | Phase 8 | Institutional scholar registration portal with email validation |
| 89 | `frontend/src/pages/ResidenceInfo.jsx` | **Student 2** | Phase 8 | Onboarding guide for residential scholars displaying hostel rules |
| 90 | `frontend/src/pages/SquadsPage.jsx` | **Student 4** | Phase 8 | Squad dispatch balancer ranked dynamically by Priority Stress Index |
| 91 | `frontend/src/pages/StaffDirectoryPage.jsx` | **Student 5** | Phase 8 | Staff provisioning portal for role promotion & squad assignment |
| 92 | `frontend/src/pages/StudentDashboard.jsx` | **Student 2** | Phase 8 | Personal student portal displaying complaint history & resolution notes |
| 93 | `frontend/src/pages/SubmitComplaint.jsx` | **Student 2** | Phase 8 | Complaint intake form supporting 3 location modes & live triage |
| 94 | `frontend/src/pages/SuperAdminDashboard.jsx` | **Student 5** | Phase 8 | Executive command deck: campus health scores & building heatmaps |
| 95 | `frontend/src/pages/SuperAdminDataEditor.jsx` | **Student 5** | Phase 8 | Spatial infrastructure editor for buildings & rooms via JSON studio |
| 96 | `frontend/src/pages/TechnicianWorkstation.jsx` | **Student 4** | Phase 8 | Field technician workstation for squad work orders & repair modals |
| 97 | `frontend/src/pages/TrackTicket.jsx` | **Student 2** | Phase 8 | Public ticket tracking portal with 3-step visual progress stepper |
| 98 | `frontend/src/router/AppRouter.jsx` | **Student 1** | Phase 6 | Declarative React Router routing tree with role-guarded routes |
| 99 | `frontend/src/styles/globals.css` | **Student 1** | Phase 6 | Master CSS stylesheet with `@tailwind` directives & custom styling |
| 100 | `frontend/src/utils/dateUtils.js` | **Student 2** | Phase 6 | Date formatting utilities: relative time, countdown strings, UTC |
| 101 | `frontend/tailwind.config.js` | **Student 1** | Phase 9 | Design tokens, color palettes, animations & JIT content scanner |
| 102 | `frontend/vite.config.js` | **Student 1** | Phase 9 | Vite bundler configuration, reverse proxy & vendor chunk splitting |

---

## 🧭 Navigation Footer

> **Quick Jump**:  
> [🏠 Project Root](../README.md) &nbsp;│&nbsp; [📚 Codebase Documentation Hub](codebase/README.md) &nbsp;│&nbsp; [🏛 Full-Stack Architecture Guide](FULL_STACK_ARCHITECTURE.md) &nbsp;│&nbsp; [🗺️ Master Documentation Roadmap](DOCUMENTATION_ROADMAP.md) &nbsp;│&nbsp; [📄 Product Design Report](PRODUCT_DESIGN_REPORT_PDR.md)
