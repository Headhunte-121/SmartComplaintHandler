# Automated Smart Complaint Routing & Workflow Automation Platform
### `SmartComplaintHandler` — Production Full-Stack Engineering Platform

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![SQLite WAL](https://img.shields.io/badge/SQLite-WAL%20Mode-003B57.svg)](https://www.sqlite.org/)
[![React 18](https://img.shields.io/badge/React-18.2-61DAFB.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.1-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Developer Manuals](https://img.shields.io/badge/Engineering%20Guides-34%20Manuals-success.svg)](docs/developer_guide/README.md)
[![Verification Suite](https://img.shields.io/badge/Quality%20Gate-100%25%20Passing-brightgreen.svg)](backend/tests/test_closed_loop.py)

---

## ⚡ Quick Navigation Index

| Section | Description | Quick Link |
| :--- | :--- | :--- |
| **1. System Overview** | What this project does & the closed-loop automation flow | [Go to Section ↓](#1-system-overview--closed-loop-architecture) |
| **2. 30-Second Quick Start** | How to run the entire full-stack app on Windows/Mac/Linux | [Go to Section ↓](#2-30-second-quick-start-how-to-run-everything) |
| **3. Teammate Onboarding Guide** | **Step-by-step instructions: What do I do first as a developer?** | [Go to Section ↓](#3-teammate-onboarding-guide-what-do-i-do-first) |
| **4. 5-Student Ownership Matrix** | Exact team breakdown: who writes which files & blueprints | [Go to Section ↓](#4-5-student-team-ownership--module-matrix) |
| **5. Module Blueprints (M1–M5)** | Detailed directory of all 5 operational modules | [Go to Section ↓](#5-version-10-module-architecture-m1m5) |
| **6. 34-Guide Curriculum** | Complete zero-prerequisite developer engineering handbook | [Go to Section ↓](#6-master-developer-guide-curriculum-34-manuals) |
| **7. Testing & Quality Gates** | How to run tests and verify your code before pushing | [Go to Section ↓](#7-testing-verification--quality-gates) |

---

## 1. System Overview & Closed-Loop Architecture

### The Problem
Campus facility grievances (water leaks, power cuts, hazardous exposed wiring, broken laboratory equipment) frequently get trapped in bureaucratic bottlenecks, lost in email threads, or neglected due to lack of transparent accountability.

### The Solution
`SmartComplaintHandler` is an **automated, deterministic, closed-loop grievance routing platform**:
1. **Intake & Code Generation:** Generates a collision-resistant tracking code (`TICK-XXXX`) using cryptographically secure operating system entropy.
2. **Deterministic Keyword Routing:** Scans complaint narratives to assign the responsible campus department (Electrical, Plumbing, IT, Sanitation, Civil, General).
3. **Priority & Hazard Classification:** Identifies safety emergencies (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) with short-circuit rules for hazards (e.g. fire, flooding near outlets).
4. **Load-Balanced Squad Dispatch:** Dispatches complaints to the least-loaded maintenance squad based on real-time active ticket counts.
5. **SLA Countdown & Dual-Sided Resolution:** Ticks live countdown clocks (4h, 12h, 24h, 72h), alerts staff to impending breaches, and requires mandatory repair documentation before ticket closure.

```mermaid
graph TD
    A[Student Submits Grievance] --> B[CSPRNG Ticket Code: TICK-XXXX]
    B --> C[Keyword Router: Department Assignment]
    C --> D[Priority Engine: Hazard Scoring & Urgency]
    D --> E[Workload Dispatcher: Least-Loaded Squad]
    E --> F[SLA Engine: Clock Ticks 4h / 12h / 24h / 72h]
    F --> G[Admin Dashboard: Reassignment & Actions]
    G --> H[Staff Resolution with Mandatory Repair Notes]
    H --> I[Student Live Stepper Updated: RESOLVED]
```

---

## 2. 30-Second Quick Start (How to Run Everything)

### Option A: Windows 1-Click Launch (Recommended)
Double-click the automated launcher in the project root:
* **`run_all.bat`** (or **`start_dev.bat`**)  
  * Automatically sets up Python virtual environments and installs dependencies.
  * Launches the FastAPI backend server on `http://localhost:8000`.
  * Launches the React Vite frontend dev server on `http://localhost:5173`.
  * Automatically opens both browser tabs.
* **To stop all servers:** Double-click **`stop_all.bat`** (cleanly terminates both processes).

---

### Option B: Manual CLI Setup (Any OS)

#### Terminal 1 — Backend (FastAPI + SQLite WAL):
```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
* **Interactive Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **Backend Health Probe:** [http://localhost:8000/health](http://localhost:8000/health)

#### Terminal 2 — Frontend (React 18 + Vite + Tailwind):
```bash
cd frontend
npm install
npm run dev
```
* **React Web Application:** [http://localhost:5173](http://localhost:5173) (Vite proxies `/api` to `:8000`).

---

## 3. Teammate Onboarding Guide: What Do I Do First?

If you are a student or teammate who just joined this project, follow this **exact 6-step checklist**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              NEW TEAMMATE 6-STEP ONBOARDING                            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  STEP 1: Clone the repository and switch to the develop branch:                        │
│          git checkout develop                                                          │
│                                                                                        │
│  STEP 2: Understand the code state:                                                    │
│          - All source files in backend/app/ and frontend/src/ are CLEAN STARTER         │
│            TEMPLATES. Each file has a header pointing directly to its blueprint.       │
│          - A complete reference implementation is saved at tag: v1.0-reference-impl     │
│                                                                                        │
│  STEP 3: Check the Ownership Matrix (Section 4 below) to find your assigned module:    │
│          Dev A (M1 Backend), Dev B (M2 Backend), Dev C (M1/M2 Frontend),               │
│          Dev D (M3/M4 Backend), or Dev E (M5 Backend + Admin Frontend).                │
│                                                                                        │
│  STEP 4: Open your module's blueprint in docs/V1/ (e.g. docs/V1/M1/):                  │
│          Follow Section 1 (Purpose), Section 2 (Required Items), and                   │
│          Section 3 (Implementation Details) to write your file.                        │
│                                                                                        │
│  STEP 5: If you don't understand a concept (e.g. WAL mode, Pydantic, Hooks, CORS),    │
│          click the links in Section 5 of your blueprint to read the corresponding      │
│          manual in docs/developer_guide/.                                              │
│                                                                                        │
│  STEP 6: Verify your work before committing:                                           │
│          pytest backend/tests/test_closed_loop.py -v                                   │
│          npm run build                                                                 │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. 5-Student Team Ownership & Module Matrix

To ensure zero merge conflicts and completely independent parallel progress, work is divided across **5 teammates**:

| Role / Student | Assigned Module | Key Source Files to Implement | Governing Blueprints in `docs/V1/` |
| :--- | :--- | :--- | :--- |
| **Dev A**<br>*(Database & Storage)* | **Module M1 (Backend)** | `backend/app/core/config.py`<br>`backend/app/core/database.py`<br>`backend/app/models/*.py`<br>`backend/app/db/seed.py`<br>`backend/app/api/deps.py` | [**`docs/V1/M1/00_M1_CENTRAL_OVERVIEW.md`**](docs/V1/M1/00_M1_CENTRAL_OVERVIEW.md)<br>Follows blueprints `01` through `10` |
| **Dev B**<br>*(Ingestion & Router)* | **Module M2 (Backend)** | `backend/app/utils/code_generator.py`<br>`backend/app/services/keyword_router.py`<br>`backend/app/schemas/complaint.py`<br>`backend/app/services/ticket_service.py`<br>`backend/app/api/v1/endpoints/complaints.py` | [**`docs/V1/M2/00_M2_CENTRAL_OVERVIEW.md`**](docs/V1/M2/00_M2_CENTRAL_OVERVIEW.md)<br>Follows blueprints `01` through `08` |
| **Dev C**<br>*(Frontend Architecture)* | **Module M1 & M2 (Frontend)** | `frontend/src/api/client.js`<br>`frontend/src/components/Layout.jsx`<br>`frontend/src/router/AppRouter.jsx`<br>`frontend/src/pages/SubmitComplaint.jsx`<br>`frontend/src/pages/TrackTicket.jsx` | [**`docs/V1/M1/`**](docs/V1/M1/00_M1_CENTRAL_OVERVIEW.md#frontend-subsystem-frontend) & [**`docs/V1/M2/`**](docs/V1/M2/00_M2_CENTRAL_OVERVIEW.md#frontend-subsystem-frontend)<br>Follows M1/M2 Frontend blueprints `01`–`05` |
| **Dev D**<br>*(Triage & Dispatch)* | **Module M3 & M4 (Backend)** | `backend/app/services/priority_engine.py`<br>`backend/app/services/classifier.py`<br>`backend/app/services/dispatch_engine.py`<br>`backend/app/services/team_service.py`<br>`backend/app/api/v1/endpoints/priority.py` | [**`docs/V1/M3/00_M3_CENTRAL_OVERVIEW.md`**](docs/V1/M3/00_M3_CENTRAL_OVERVIEW.md)<br>[**`docs/V1/M4/00_M4_CENTRAL_OVERVIEW.md`**](docs/V1/M4/00_M4_CENTRAL_OVERVIEW.md)<br>Follows M3 & M4 Backend suites |
| **Dev E**<br>*(SLA & Admin Console)* | **Module M5 (Backend) + Admin UI** | `backend/app/services/sla_engine.py`<br>`backend/app/services/lifecycle.py`<br>`backend/app/api/v1/endpoints/sla.py`<br>`frontend/src/pages/AdminDashboard.jsx`<br>`frontend/src/components/SLABreachTable.jsx` | [**`docs/V1/M5/00_M5_CENTRAL_OVERVIEW.md`**](docs/V1/M5/00_M5_CENTRAL_OVERVIEW.md)<br>Follows M5 Backend & Frontend blueprints |

> 💡 **Need mock data while backend endpoints are being built?**  
> Frontend developers should use the **Zero-Blocking Mock Contracts** in [**`docs/V1/TEAM_WORKFLOW_AND_GIT_GUIDE.md`**](docs/V1/TEAM_WORKFLOW_AND_GIT_GUIDE.md#3-zero-blocking-mock-data-contracts).

---

## 5. Version 1.0 Module Architecture (M1–M5)

Click into any module to open its central overview, DAG, and blueprints:

```
docs/V1/
├── V1_CENTRAL_BLUEPRINT.md    # Master architecture charter across all modules
├── V1_BLUEPRINT.md            # Full operational lifecycle trace
├── TEAM_WORKFLOW_AND_GIT_GUIDE.md # 5-student operational manual & Git guide
├── M1/                        # Data Storage Engine, Models & Shell
│   ├── 00_M1_CENTRAL_OVERVIEW.md
│   ├── backend/ (10 blueprints)
│   └── frontend/ (5 blueprints)
├── M2/                        # Intake, Code Generator & Keyword Router
│   ├── 00_M2_CENTRAL_OVERVIEW.md
│   ├── backend/ (8 blueprints)
│   └── frontend/ (5 blueprints)
├── M3/                        # Priority Engine & Live Triage Card
│   ├── 00_M3_CENTRAL_OVERVIEW.md
│   ├── backend/ (7 blueprints)
│   └── frontend/ (5 blueprints)
├── M4/                        # Squad Dispatch & Admin Operations Desk
│   ├── 00_M4_CENTRAL_OVERVIEW.md
│   ├── backend/ (7 blueprints)
│   └── frontend/ (5 blueprints)
└── M5/                        # SLA Clocks & Lifecycle State Machine
    ├── 00_M5_CENTRAL_OVERVIEW.md
    ├── backend/ (7 blueprints)
    └── frontend/ (5 blueprints)
```

> 👉 **For the complete module matrix and directory guide, see [docs/V1/README.md](docs/V1/README.md).**

---

## 6. Master Developer Guide Curriculum (34 Manuals)

If you are unfamiliar with any language, framework, or concept, read our authoritative **Developer Guide Suite (`docs/developer_guide/`)**. Every guide is written from the ground up with zero prerequisites:

* 📖 [**`docs/developer_guide/README.md`**](docs/developer_guide/README.md) — Master Handbook & Full-Stack Mental Model.

### Curriculum Overview:
* **Part I: Computer Science, OS & Network Foundations**
  * [`Unit 00A`](docs/developer_guide/00A_DATA_STRUCTURES_ALGORITHMS_AND_COMPLEXITY.md): Data Structures, Algorithms & Complexity
  * [`Unit 00B`](docs/developer_guide/00B_OPERATING_SYSTEMS_PROCESSES_AND_CONCURRENCY_MECHANICS.md): OS Internals, Processes, Threads & Concurrency
  * [`Unit 01A`](docs/developer_guide/01A_COMPUTER_NETWORKING_OSI_DNS_AND_IP_ROUTING.md): Computer Networking, OSI Model, DNS & Routing
  * [`Unit 01B`](docs/developer_guide/01B_HTTP_NETWORK_PROTOCOLS_AND_WIRE_FRAMING.md): HTTP Protocols, TCP Sockets & Wire Framing
* **Part II: Backend Engineering & Databases**
  * [`Guide 01`](docs/developer_guide/01_PYTHON_LANGUAGE_AND_RUNTIME_MECHANICS.md): Python 3.10+ Language & CPython Runtime Mechanics
  * [`Guide 02`](docs/developer_guide/02_FASTAPI_ASGI_WEB_ARCHITECTURE.md): FastAPI & Modern ASGI Web Architecture
  * [`Guide 03`](docs/developer_guide/03_PYDANTIC_V2_DATA_VALIDATION_AND_SCHEMAS.md): Pydantic v2 & Data Contract Engineering
  * [`Unit 03B`](docs/developer_guide/03B_SQL_RELATIONAL_LANGUAGE_AND_QUERY_MECHANICS.md): SQL Relational Language, Queries & Transactions
  * [`Unit 03C`](docs/developer_guide/03C_REGULAR_EXPRESSIONS_AND_AUTOMATA_THEORY.md): Regular Expressions & Automata Theory
  * [`Guide 04`](docs/developer_guide/04_SQLITE_STORAGE_MECHANICS_AND_WAL_MODE.md): SQLite 3 Engine Storage & WAL Mode
  * [`Guide 05`](docs/developer_guide/05_SQLALCHEMY_ORM_AND_DATA_LAYER.md): SQLAlchemy 2.0 ORM & Relational Architecture
* **Part III: Frontend Engineering & UI**
  * [`Unit 05B`](docs/developer_guide/05B_JAVASCRIPT_CORE_LANGUAGE_AND_SYNTAX_PRIMITIVES.md): JavaScript Core Language & Syntax Primitives
  * [`Unit 05C`](docs/developer_guide/05C_TYPESCRIPT_CORE_TYPE_SYSTEM_AND_STATIC_ANALYSIS.md): TypeScript Core Type System & Static Analysis
  * [`Guide 06`](docs/developer_guide/06_JAVASCRIPT_RUNTIME_AND_V8_MECHANICS.md): Modern JavaScript (ES2022+) & V8 Mechanics
  * [`Unit 06B`](docs/developer_guide/06B_HTML5_SEMANTICS_AND_CSS3_FOUNDATIONS.md): HTML5 Semantics, DOM Tree & CSS3 Box Model
  * [`Guide 07`](docs/developer_guide/07_REACT_18_AND_VIRTUAL_DOM_ARCHITECTURE.md): React 18 & Virtual DOM Fiber Architecture
  * [`Guide 08`](docs/developer_guide/08_TAILWIND_CSS_AND_POSTCSS_ENGINEERING.md): Tailwind CSS & PostCSS Engineering
  * [`Guide 09`](docs/developer_guide/09_AXIOS_FETCH_AND_REST_PROTOCOLS.md): Axios & REST Wire Protocols
  * [`Unit 09B`](docs/developer_guide/09B_PACKAGE_MANAGEMENT_DEPENDENCY_GRAPHS_AND_SEMVER.md): Package Management (NPM), Dependency Graphs & SemVer
  * [`Guide 10`](docs/developer_guide/10_VITE_AND_MODERN_BUILD_TOOLCHAINS.md): Vite Build Engine & Module Bundling
* **Part IV: Concurrency, Testing, Release & Browser Security**
  * [`Guides 11–13`](docs/developer_guide/README.md#part-iv-concurrency-testing-release--browser-security): APScheduler, Pytest, Git Internals
  * [`Guide 14 & 14B`](docs/developer_guide/14B_WEB_BROWSER_SECURITY_AND_ORIGIN_POLICIES.md): Multipart Uploads & Browser Security (SOP, CORS, CSP)
  * [`Guides 15–21`](docs/developer_guide/README.md#part-iv-concurrency-testing-release--browser-security): Storage, Alembic, Lucide Icons, WebSockets, Middlewares, Form State Machines, HTTP Caching
  * [`Unit 21B & Guide 22`](docs/developer_guide/21B_CRYPTOGRAPHIC_MATHEMATICS_ENCODING_AND_HASHING.md): Cryptographic Mathematics, Encodings, Hashing & JWT Authentication

---

## 7. Testing, Verification & Quality Gates

### Automated Quality Gates
Before creating a pull request or merging to `develop`, verify your implementation against the test suite:

```bash
# 1. Verify backend closed-loop lifecycle (Intake -> Routing -> Triage -> Dispatch -> SLA -> Resolution)
pytest backend/tests/test_closed_loop.py -v

# 2. Verify frontend production compilation & bundle assets
cd frontend
npm run build
```

### Reference Implementation Fallback
If any teammate gets stuck and wants to see how a complete, working version of all 64 files was implemented:
```bash
# Checkout the working reference implementation tag:
git checkout v1.0-reference-impl

# Return to active development branch:
git checkout develop
```

---

## 8. Directory Architecture & References

* 🗺️ [**`docs/FILE_ARCHITECTURE_GUIDE.md`**](docs/FILE_ARCHITECTURE_GUIDE.md) — Complete 72-file directory anatomy.
* 💡 [**`docs/FUNDAMENTALS_OF_FULL_STACK.md`**](docs/FUNDAMENTALS_OF_FULL_STACK.md) — Full-stack architecture fundamentals.
* ⚖️ [**`docs/TECH_STACK_DECISION.md`**](docs/TECH_STACK_DECISION.md) — Tech stack rationale.
* 🚀 [**`docs/VERSION_BLUEPRINT_ROADMAP.md`**](docs/VERSION_BLUEPRINT_ROADMAP.md) — Roadmap from V1.0 to V2.0 (AI/NLP) and V3.0 (IoT).
