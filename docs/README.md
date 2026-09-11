# Smart Complaint Handler - Master Documentation Index

This directory contains the complete technical specifications, architectural blueprints, foundational engineering manuals, and team workflow guides for the **Automated Smart Complaint Routing & Workflow Automation Platform**.

All documentation is tracked directly within this Git repository so every team member has access to the specifications alongside the codebase.

---

## 1. Team Collaboration & Git Workflows

* [**`V1/TEAM_WORKFLOW_AND_GIT_GUIDE.md`**](V1/TEAM_WORKFLOW_AND_GIT_GUIDE.md)  
  *Authoritative team manual.* Includes:
  * **Simultaneous File Matrix:** Group 1 (independent files to code immediately), Group 2 (service implementations), and Group 3 (integration routers).
  * **Zero-Blocking Mock Contracts:** JavaScript contracts for frontend developers to build UI without waiting for backend APIs.
  * **5-Day Concurrency DAG:** Scheduling breakdown across 5 teammates.
  * **In-Depth Git Guide:** 15 essential Git commands explained line-by-line (syntax, internals, terminal output, beginner pitfalls, and merge conflict resolution).

---

## 2. Version 1.0 Engineering Blueprints (`V1/`)

The platform is designed around 5 core operational modules. Every module contains its own overview, architectural DAG, and file-by-file blueprints for backend and frontend:

| Module | Purpose | Central Overview | Subdirectories |
| :--- | :--- | :--- | :--- |
| **System Overview** | Master Full-Stack Architecture & Operational Trace | [**`V1_CENTRAL_BLUEPRINT.md`**](V1/V1_CENTRAL_BLUEPRINT.md) | [**`V1_BLUEPRINT.md`**](V1/V1_BLUEPRINT.md) |
| **M1** | Data Storage & Application Foundation | [**`M1/00_M1_CENTRAL_OVERVIEW.md`**](V1/M1/00_M1_CENTRAL_OVERVIEW.md) | `backend/` (10 files), `frontend/` (5 files) |
| **M2** | Ingestion, Tracking Codes & Keyword Routing | [**`M2/00_M2_CENTRAL_OVERVIEW.md`**](V1/M2/00_M2_CENTRAL_OVERVIEW.md) | `backend/` (8 files), `frontend/` (5 files) |
| **M3** | Deterministic Priority Classification & Triage | [**`M3/00_M3_CENTRAL_OVERVIEW.md`**](V1/M3/00_M3_CENTRAL_OVERVIEW.md) | `backend/` (7 files), `frontend/` (5 files) |
| **M4** | Workload-Balanced Maintenance Squad Dispatch | [**`M4/00_M4_CENTRAL_OVERVIEW.md`**](V1/M4/00_M4_CENTRAL_OVERVIEW.md) | `backend/` (7 files), `frontend/` (5 files) |
| **M5** | SLA Timers & Lifecycle Resolution State Machine | [**`M5/00_M5_CENTRAL_OVERVIEW.md`**](V1/M5/00_M5_CENTRAL_OVERVIEW.md) | `backend/` (7 files), `frontend/` (5 files) |

---

## 3. Foundational Architecture & Design Decisions

* [**`FILE_ARCHITECTURE_GUIDE.md`**](FILE_ARCHITECTURE_GUIDE.md)  
  Complete file inventory and mapping showing how all 72 source files in `backend/` and `frontend/` map directly to their governing blueprints.
* [**`FUNDAMENTALS_OF_FULL_STACK.md`**](FUNDAMENTALS_OF_FULL_STACK.md)  
  In-depth guide explaining fundamental concepts used in the project: FastAPI dependency injection, SQLite WAL mode concurrency, SQLAlchemy ORM mappings, Vite proxying, and client-side routing.
* [**`TECH_STACK_DECISION.md`**](TECH_STACK_DECISION.md)  
  Technical analysis and rationale behind selecting FastAPI, SQLite (WAL mode), React Vite, and Tailwind CSS.
* [**`VERSION_BLUEPRINT_ROADMAP.md`**](VERSION_BLUEPRINT_ROADMAP.md)  
  Long-term evolution roadmap from V1.0 (Rule-Based Closed-Loop Automation) to V2.0 (AI/NLP Classification & Analytics) and V3.0 (Distributed IoT Integration).
* [**`Automated Smart Complaint Routing System`**](Automated%20Smart%20Complaint%20Routing%20System)  
  Original system design prompt specification.
