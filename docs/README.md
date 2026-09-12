# Smart Complaint Handler — Master Documentation Portal

> **Navigation:** [🏠 Project Root](../README.md) &nbsp;│&nbsp; [📐 V1 Blueprints (M1–M5)](V1/README.md) &nbsp;│&nbsp; [🎓 34-Guide Developer Suite](developer_guide/README.md) &nbsp;│&nbsp; [👥 Team Workflow & Git Guide](V1/TEAM_WORKFLOW_AND_GIT_GUIDE.md)

Welcome to the central documentation portal for the **Automated Smart Complaint Routing & Workflow Automation Platform (`SmartComplaintHandler`)**. This repository contains the complete technical specifications, architectural blueprints, foundational engineering manuals, and developer implementation guides.

---

## 🧭 Start Here: Choose Your Goal

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                              WHAT DO YOU WANT TO DO?                                      │
├─────────────────────────┬─────────────────────────┬───────────────────────────────────────┤
│ 🚀 I Need to Build Code │ 🎓 I Need to Learn Tech │ 📐 I Need System Architecture         │
│ (Teammate / Contributor)│ (Beginner / Student)    │ (Evaluator / Reviewer)                │
├─────────────────────────┼─────────────────────────┼───────────────────────────────────────┤
│ 1. Read Team Workflow   │ 1. Open Developer Guide │ 1. System Topology & Flowchart        │
│    `V1/TEAM_WORKFLOW...`│    `developer_guide/`   │    `V1/V1_CENTRAL_BLUEPRINT.md`       │
│ 2. Find Your Module     │ 2. Follow Part I (CS)   │ 2. 72-File Architecture Anatomy       │
│    `V1/M1` through `M5` │ 3. Follow Part II (Py)  │    `FILE_ARCHITECTURE_GUIDE.md`       │
│ 3. Follow Sections 1–6  │ 4. Follow Part III (UI) │ 3. Tech Stack Decision Rationale      │
│    in file blueprints   │ 5. Follow Part IV (Sec) │    `TECH_STACK_DECISION.md`           │
└─────────────────────────┴─────────────────────────┴───────────────────────────────────────┘
```

---

## 1. Version 1.0 Implementation Blueprints (`V1/`)

The platform is designed around **5 core operational modules (M1–M5)**. Each module contains its own central overview, architectural flowchart, and file-by-file blueprints for backend and frontend:

| Module | Subsystem Name & Function | Central Overview | Implementation Blueprints |
| :--- | :--- | :--- | :--- |
| **System** | Master Full-Stack Architecture & Operational Trace | [**`V1_CENTRAL_BLUEPRINT.md`**](V1/V1_CENTRAL_BLUEPRINT.md) | [**`V1_BLUEPRINT.md`**](V1/V1_BLUEPRINT.md) &nbsp;│&nbsp; [**`V1/README.md`**](V1/README.md) |
| **M1** | Data Storage Engine, SQLite WAL & Application Shell | [**`00_M1_CENTRAL_OVERVIEW.md`**](V1/M1/00_M1_CENTRAL_OVERVIEW.md) | 10 Backend Blueprints &nbsp;│&nbsp; 5 Frontend Blueprints |
| **M2** | Ingestion Gateway, Tracking Code Generator & Keyword Router | [**`00_M2_CENTRAL_OVERVIEW.md`**](V1/M2/00_M2_CENTRAL_OVERVIEW.md) | 8 Backend Blueprints &nbsp;│&nbsp; 5 Frontend Blueprints |
| **M3** | Deterministic Priority Classification & Live Triage Card | [**`00_M3_CENTRAL_OVERVIEW.md`**](V1/M3/00_M3_CENTRAL_OVERVIEW.md) | 7 Backend Blueprints &nbsp;│&nbsp; 5 Frontend Blueprints |
| **M4** | Workload-Balanced Maintenance Squad Dispatch & Admin Desk | [**`00_M4_CENTRAL_OVERVIEW.md`**](V1/M4/00_M4_CENTRAL_OVERVIEW.md) | 7 Backend Blueprints &nbsp;│&nbsp; 5 Frontend Blueprints |
| **M5** | SLA Clocks, Breach Escalation & Resolution State Machine | [**`00_M5_CENTRAL_OVERVIEW.md`**](V1/M5/00_M5_CENTRAL_OVERVIEW.md) | 7 Backend Blueprints &nbsp;│&nbsp; 5 Frontend Blueprints |

> 👉 **For the full module directory, concurrency DAG, and 6-section blueprint doctrine, see [V1 Module Hub (`V1/README.md`)](V1/README.md).**

---

## 2. Master Developer Engineering & Architecture Suite (`developer_guide/`)

The authoritative 34-manual engineering curriculum teaching every language, runtime, protocol, and computer science primitive used in the project from the absolute basics with 100% code comments:

* 📖 [**`developer_guide/README.md`**](developer_guide/README.md) — **Master Developer Handbook & Full-Stack Mental Model**.

### Curriculum Breakdown (34 Exhaustive Technical Manuals):
* **Part I: Computational Foundations, OS & Networking**
  - [Unit 00A: Data Structures, Algorithms & Complexity](developer_guide/00A_DATA_STRUCTURES_ALGORITHMS_AND_COMPLEXITY.md)
  - [Unit 00B: Operating Systems, Processes & Concurrency Mechanics](developer_guide/00B_OPERATING_SYSTEMS_PROCESSES_AND_CONCURRENCY_MECHANICS.md)
  - [Unit 01A: Computer Networking, OSI, DNS & IP Routing](developer_guide/01A_COMPUTER_NETWORKING_OSI_DNS_AND_IP_ROUTING.md)
  - [Unit 01B: HTTP Network Protocols & Wire Framing](developer_guide/01B_HTTP_NETWORK_PROTOCOLS_AND_WIRE_FRAMING.md)
* **Part II: Backend Runtimes, Contracts, Databases & Parsing**
  - [Guide 01: Python Language & CPython Runtime Mechanics](developer_guide/01_PYTHON_LANGUAGE_AND_RUNTIME_MECHANICS.md)
  - [Guide 02: FastAPI & Modern ASGI Web Architecture](developer_guide/02_FASTAPI_ASGI_WEB_ARCHITECTURE.md)
  - [Guide 03: Pydantic v2 & Data Contract Engineering](developer_guide/03_PYDANTIC_V2_DATA_VALIDATION_AND_SCHEMAS.md)
  - [Unit 03B: SQL Relational Language & Query Mechanics](developer_guide/03B_SQL_RELATIONAL_LANGUAGE_AND_QUERY_MECHANICS.md)
  - [Unit 03C: Regular Expressions & Automata Theory](developer_guide/03C_REGULAR_EXPRESSIONS_AND_AUTOMATA_THEORY.md)
  - [Guide 04: SQLite 3 Engine Storage & WAL Mode](developer_guide/04_SQLITE_STORAGE_MECHANICS_AND_WAL_MODE.md)
  - [Guide 05: SQLAlchemy 2.0 ORM & Relational Architecture](developer_guide/05_SQLALCHEMY_ORM_AND_DATA_LAYER.md)
* **Part III: Frontend Languages, Type Systems, DOM & Reactive UI**
  - [Unit 05B: JavaScript Core Language & Syntax Primitives](developer_guide/05B_JAVASCRIPT_CORE_LANGUAGE_AND_SYNTAX_PRIMITIVES.md)
  - [Unit 05C: TypeScript Core Type System & Static Analysis](developer_guide/05C_TYPESCRIPT_CORE_TYPE_SYSTEM_AND_STATIC_ANALYSIS.md)
  - [Guide 06: Modern JavaScript (ES2022+) & V8 Mechanics](developer_guide/06_JAVASCRIPT_RUNTIME_AND_V8_MECHANICS.md)
  - [Unit 06B: HTML5 Semantics & CSS3 Foundations](developer_guide/06B_HTML5_SEMANTICS_AND_CSS3_FOUNDATIONS.md)
  - [Guide 07: React 18 & Virtual DOM Fiber Architecture](developer_guide/07_REACT_18_AND_VIRTUAL_DOM_ARCHITECTURE.md)
  - [Guide 08: Tailwind CSS & PostCSS Engineering](developer_guide/08_TAILWIND_CSS_AND_POSTCSS_ENGINEERING.md)
  - [Guide 09: Axios & REST Wire Protocols](developer_guide/09_AXIOS_FETCH_AND_REST_PROTOCOLS.md)
  - [Unit 09B: Package Management (NPM) & SemVer](developer_guide/09B_PACKAGE_MANAGEMENT_DEPENDENCY_GRAPHS_AND_SEMVER.md)
  - [Guide 10: Vite Build Engine & Module Bundling](developer_guide/10_VITE_AND_MODERN_BUILD_TOOLCHAINS.md)
* **Part IV: Concurrency, Testing, Release & Browser Security**
  - [Guide 11: APScheduler & In-Process Job Concurrency](developer_guide/11_APSCHEDULER_AND_IN_PROCESS_JOBS.md)
  - [Guide 12: Pytest & Automated Testing Systems](developer_guide/12_PYTEST_AND_AUTOMATED_TEST_SYSTEMS.md)
  - [Guide 13: Git Internals & Delivery Workflows](developer_guide/13_GIT_INTERNALS_AND_DELIVERY_WORKFLOWS.md)
  - [Guide 14: Python Multipart & Binary Streaming](developer_guide/14_PYTHON_MULTIPART_AND_STREAMING_UPLOADS.md)
  - [Unit 14B: Web Browser Security & Origin Policies](developer_guide/14B_WEB_BROWSER_SECURITY_AND_ORIGIN_POLICIES.md)
  - [Guide 15: Client-Side Storage & Session State](developer_guide/15_BROWSER_STORAGE_AND_SESSION_PERSISTENCE.md)
  - [Guide 16: Database Migrations with Alembic](developer_guide/16_DATABASE_MIGRATIONS_WITH_ALEMBIC.md)
  - [Guide 17: SVG Iconography & Lucide React](developer_guide/17_SVG_ICONOGRAPHY_AND_LUCIDE_REACT.md)
  - [Guide 18: Real-Time Protocols: WebSockets, SSE & Polling](developer_guide/18_REALTIME_COMMUNICATION_WEBSOCKETS_SSE.md)
  - [Guide 19: API Middleware & Security Headers](developer_guide/19_API_MIDDLEWARE_AND_SECURITY_HEADERS.md)
  - [Guide 20: Form State Machines & Optimistic UI](developer_guide/20_FORM_STATE_MACHINES_AND_OPTIMISTIC_UI.md)
  - [Guide 21: HTTP Caching & Reverse Proxies](developer_guide/21_HTTP_CACHING_AND_REVERSE_PROXIES.md)
  - [Unit 21B: Cryptographic Mathematics, Encoding & Hashing](developer_guide/21B_CRYPTOGRAPHIC_MATHEMATICS_ENCODING_AND_HASHING.md)
  - [Guide 22: Authentication, JWT Tokens & Password Hashing](developer_guide/22_AUTHENTICATION_AND_CRYPTOGRAPHIC_HASHING.md)

---

## 3. Team Operations & Collaboration Manuals

* 👥 [**`V1/TEAM_WORKFLOW_AND_GIT_GUIDE.md`**](V1/TEAM_WORKFLOW_AND_GIT_GUIDE.md)  
  The operational handbook for the 5-student team:
  - **Simultaneous File Matrix:** Group 1 (independent files), Group 2 (services), Group 3 (routers).
  - **Zero-Blocking Mock Contracts:** JavaScript contracts allowing frontend devs to build UI before backend APIs exist.
  - **5-Day Concurrency DAG:** Step-by-step parallel schedule.
  - **Beginner Git Command Guide:** 15 essential commands explained with internals and conflict resolution.

---

## 4. Architectural Foundations & Design Rationales

* 🗺️ [**`FILE_ARCHITECTURE_GUIDE.md`**](FILE_ARCHITECTURE_GUIDE.md)  
  Exhaustive inventory of all 72 source files across `backend/` and `frontend/` with layer-by-layer descriptions.
* 💡 [**`FUNDAMENTALS_OF_FULL_STACK.md`**](FUNDAMENTALS_OF_FULL_STACK.md)  
  Deep dive into core design concepts: FastAPI dependency injection, SQLite WAL mode, SQLAlchemy ORM identity maps, and client-side routing.
* ⚖️ [**`TECH_STACK_DECISION.md`**](TECH_STACK_DECISION.md)  
  Technical analysis and rationale behind choosing FastAPI, SQLite WAL, React 18 Vite, and Tailwind CSS over alternative stacks.
* 🚀 [**`VERSION_BLUEPRINT_ROADMAP.md`**](VERSION_BLUEPRINT_ROADMAP.md)  
  Evolution roadmap from V1.0 (Rule-Based Closed-Loop Automation) to V2.0 (AI/NLP Classification & Analytics) and V3.0 (Distributed IoT Integration).
* 📜 [**Original Design Specification**](Automated%20Smart%20Complaint%20Routing%20System)  
  System design prompt and initial functional requirements.
