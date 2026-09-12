# Master Engineering Blueprint: Version 1.0 (Closed-Loop Workflow)
## The Definitive Full-Stack Module Architecture & Technical Specifications

> **Course Overview & Master Project Charter:**  
> This blueprint defines the complete architectural specification for **Version 1.0** of the **Smart Complaint Routing & Workflow Automation Platform** (`SmartComplaintHandler`).  
> It transforms campus maintenance from passive form submissions into an **automated closed-loop workflow** (Ingestion ➔ Deterministic Classification ➔ Workload-Aware Dispatch ➔ SLA Deadline Monitoring ➔ Dual-Sided Resolution Tracking).  
> Every operational module is divided into dedicated **`backend/`** and **`frontend/`** documentation suites with strict adherence to engineering standards: **executive summary matrices**, **in-place definitions of all technical terms**, **dual-perspective specifications**, and **zero code blocks in functional blueprints**.

---

# Part 0: Front Summary & Master Module Roadmap

Based on platform functional requirements, Version 1.0 is composed of **5 core full-stack modules** that form the closed-loop system:

| Module ID | Module Title | Subfolder Division | What It Actually Does & Solves | Inputs & Outputs | Concurrency Track |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **M1** | **Foundation, Storage Engine & App Shell** | `backend/` (10 files)<br>`frontend/` (5 files) | Establishes SQLite relational schema (`Department`, `Team`, `Ticket`), seed data, `get_db` injector, React 18 application shell, Vite proxy, Tailwind tokens, base Axios client, and persistent layout. | **Input:** System startup & browser navigation<br>**Output:** SQLite DB (`smart_complaints.db`), session injector, mounted app shell with live health indicator | Track 1 (Dev A - Backend)<br>Track 3 (Dev C - Frontend) |
| **M2** | **Ingestion Gateway, Keyword Router & Student Portals** | `backend/` (8 files)<br>`frontend/` (5 files) | Captures student complaints, enforces Pydantic validation, generates collision-resistant tracking codes (`TICK-XXXX`), classifies departments via keyword scanning, launches confirmation modal with 1-click copy, and tracks progress via 3-step stepper. | **Input:** Student complaint text (title, description, location)<br>**Output:** Persisted ticket record (`201 Created`), unique tracking code, and visual progress tracking display | Track 2 (Dev B - Backend)<br>Track 3 (Dev C - Frontend) |
| **M3** | **Deterministic Classification & Priority Engine** | `backend/` (7 files)<br>`frontend/` (5 files) | Evaluates complaint text for life-safety hazards, assigns urgency priority (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), resolves multi-domain keyword conflicts, provides 500ms debounced live preview card, and provides administrative priority override dialog. | **Input:** Complaint text & supervisor override requests<br>**Output:** Calculated priority level, detected hazard flags, normalized confidence score, and auditable override log | Track 2 (Dev B - Backend)<br>Track 3 (Dev C - Frontend) |
| **M4** | **Automated Workload Dispatch & Staff Assignment** | `backend/` (7 files)<br>`frontend/` (5 files) | Inspects active ticket counts across maintenance squads, dispatches complaints to the least-loaded team, provides staff administrative dashboard workstation, visual team workload grid, and auditable squad reassignment modal. | **Input:** Department ID & supervisor reassignment requests<br>**Output:** Assigned maintenance squad name, balanced team queues, and auditable transfer log in `resolution_notes` | Track 2 (Dev B - Backend)<br>Track 3 (Dev C - Frontend) |
| **M5** | **SLA Tracking, Escalation Engine & Lifecycle State Machine** | `backend/` (7 files)<br>`frontend/` (5 files) | Calculates precise resolution deadlines based on priority (4h, 12h, 24h, 72h), executes lifecycle transitions (`SUBMITTED` -> `IN_PROGRESS` -> `RESOLVED`), alerts staff on SLA breach risks, and captures mandatory resolution notes upon closure. | **Input:** Priority level, staff status update clicks, and resolution notes<br>**Output:** `sla_deadline` timestamp, lifecycle status updates, breach alert flags, and complete closed-loop closure notes | Track 2 (Dev B - Backend)<br>Track 3 (Dev C - Frontend) |

---

# The Closed-Loop Workflow: End-to-End Operational Trace

The foundational value of this platform is that it executes an automated, five-stage closed-loop pipeline from complaint intake to verified physical closure:

```
[ STAGE 1: INGESTION - Module M2 ]
Student submits: "Water pipe burst in Hostel B washroom, flooding floor"
  │
  ▼
[ STAGE 2: CLASSIFICATION & PRIORITY - Module M3 ]
Engine scans text & applies weighted heuristic taxonomy:
  • Department: Plumbing & Water Services (ID 2)
  • Priority: HIGH / CRITICAL (detected active flooding & infrastructure damage)
  │
  ▼
[ STAGE 3: WORKLOAD-AWARE DISPATCH - Module M4 ]
Engine inspects active ticket counts across Plumbing squads:
  • Plumbing Squad 1: 4 active tickets (Workload: High)
  • Plumbing Squad 2: 1 active ticket  (Workload: Low)
  ➔ Dispatched to: Plumbing Squad 2 (Least-Loaded Queue)
  │
  ▼
[ STAGE 4: SLA DEADLINE CALCULATION - Module M5 ]
Priority is HIGH ➔ SLA turnaround duration = 12 Hours
  • Calculated Resolution Deadline: Today + 12 Hours
  • Generated Tracking Code: TICK-8F2D
  • Status: SUBMITTED ➔ Saved to SQLite in atomic transaction
  │
  ▼
[ STAGE 5: DUAL-SIDED RESOLUTION & CLOSURE - Modules M2, M4, M5 ]
  • Student Experience:
      - Modal appears: TICK-8F2D displayed with 1-click clipboard copy
      - Opens Track page: 3-step progress bar shows Step 1 (SUBMITTED), Plumbing Squad 2 assigned, 12h deadline
  • Staff Experience:
      - Admin Dashboard: Ticket appears highlighted in Plumbing queue
      - Staff clicks "Start Work" ➔ Status transitions to IN_PROGRESS (Progress bar advances to 50%)
      - Staff performs repair, clicks "Resolve Ticket", enters resolution notes: "Replaced broken 2-inch PVC valve"
      - Status transitions to RESOLVED (Progress bar fills 100%, closure report rendered to student)
```

---

# Team Concurrency & Dependency Flowchart (DAG)

> **Team Operations Manual & Git Guide Reference:**  
> For the comprehensive 5-student operational manual, 5-day concurrency DAG, zero-blocking mock data contracts, and beginner Git collaboration guide, see [**`TEAM_WORKFLOW_AND_GIT_GUIDE.md`**](TEAM_WORKFLOW_AND_GIT_GUIDE.md).

To enable a 5-student engineering team to build this platform concurrently without blocking each other, work is structured across parallel tracks:

```
Track 1 (Dev A - Database & Storage):      [ M1 Backend: SQLite, ORM Models & Seed ] ──────────────────────────┐
                                                                                                               │
Track 2 (Dev B - Backend Workflow & APIs): [ M2 Backend: Ingestion & Routing ] ➔ [ M3/M4/M5 Backend Services ]─┼──> [ E2E Verification & Demo ]
                                                                                                               │
Track 3 (Dev C - Frontend UI Architecture):[ M1 Frontend: Shell & Base Client ] ➔ [ M2/M3/M4/M5 Frontend UI ]──┘
                                           (Builds components with mock API data until backend endpoints mount)
```

### Technical Terms Defined In-Place:
* **Closed-Loop Workflow:** A software system where an initial action triggers an automated sequence of operations (classification, load-balanced assignment, SLA deadline calculation) that only terminates when physical resolution is confirmed with closure documentation.
* **Concurrency Track:** A designated stream of independent development tasks assigned to a team member that can proceed in parallel without waiting for other developers to finish.
* **SLA (Service Level Agreement):** The contractual time limit within which a submitted issue must be inspected and resolved.
* **Load Balancing / Workload Dispatch:** Distributing incoming work orders across operational maintenance squads so no single squad is overwhelmed while others remain idle.
* **Human-in-the-Loop (HITL):** An architectural governance model where automated engines or AI recommend actions, but human supervisors retain exclusive authority to override decisions through auditable controls.

---

# Master Architectural Rules Across All Blueprint Suites

1. **Explicit Full-Stack Division:** Every module directory (`V1/M1/`, `V1/M2/`, `V1/M3/`, `V1/M4/`, `V1/M5/`) is divided into dedicated `backend/` and `frontend/` subfolders, with `00_<Module>_CENTRAL_OVERVIEW.md` serving as the root architecture document.
2. **Strict Zero Code Blocks in Functional Blueprints:** Code blocks (` ``` `) exist exclusively in central overview files for ASCII diagrams. Functional blueprints use precise technical signatures, mathematical formulas, and data tables.
3. **Zero Childish Analogies:** All concepts are explained from first-principles computer science, systems architecture, and modern web engineering.
4. **In-Line Technical Definitions:** Every technical term is defined immediately upon first appearance in the text.
5. **Section 1 Dual Perspective:** Every blueprint defines both standard industry practice and our platform-specific implementation.
6. **Future AI Roadmap & Human Supervisory Gates:** Every module explicitly accounts for Version 2 AI integration (Gemini API) while preserving local deterministic engines as zero-latency safety fallbacks and maintaining human administrative supervisory authority.
