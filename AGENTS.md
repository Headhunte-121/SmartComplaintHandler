# AGENTS.md — System Operating Guidelines for AI Agents & Developers

> **Target Audience:** All AI Coding Assistants (Google Antigravity, Claude Code, Cursor, GitHub Copilot, OpenAI Codex) and human software engineers contributing to the `SmartComplaintHandler` repository.
> **Scope:** Full-stack codebase (`backend/`, `frontend/`, `docs/V1/`, database, and CI/CD scripts).

---

## 1. Primary Directive: The "Additional Changes" Documentation Protocol

Whenever you perform development work that introduces new features, bug fixes, edge-case reconciliations, schema modifications, or team merge conflict resolutions to any module (**M1, M2, M3, M4, M5**), you **MUST** document those changes in the respective module's documentation.

### The Rule
Do **NOT** leave code modifications undocumented. For every module touched, ensure the module's central blueprint (`docs/V1/M<N>/00_M<N>_CENTRAL_OVERVIEW.md`) and/or the relevant sub-file contains an up-to-date section titled:

```markdown
# 8. Additional Changes & Development Modifications (Implementation Audit)
```

### Standard Entry Template
Use the following format for each record:

```markdown
### [YYYY-MM-DD] - <Descriptive Title of Change>
* **Files Modified:**
  - `backend/app/...` (or `frontend/src/...`)
  - `docs/V1/M<N>/...`
* **What Was Changed:**
  Concise explanation of the code, schema, API endpoint, or UI component modified.
* **Why It Was Changed:**
  Technical rationale (e.g. edge-case handling, teammate merge conflict reconciliation, performance optimization, UX refinement).
* **Cross-Module Impact:**
  Note whether this change affects other modules (e.g., M1 User model, M4 Technician Dispatch) or if backward-compatible aliases were provided.
* **Verification Proof:**
  Command executed and result (e.g., `37/37 pytest passed`, `npm run build succeeded in 13.3s`).
```

---

## 2. Blueprint Writing Standard: Functional Responsibilities (No Rigid QA Test Cases)

When authoring or updating blueprint markdown specifications in `docs/V1/`, **NEVER** use rigid, academic QA test case language (`Test Case 1: ...`, `Test Case 2: ...`).

Every file's testing/verification section (Section 6 or Section 7) **MUST** strictly follow the plain-English, 3-part functional structure:

1. `### What This File Is Responsible For`  
   Explain what the file owns in plain English (*"This component/module is responsible for..."*).
2. `### What It Should Perform`  
   Enumerate the operational capabilities, safeguards, and behaviors (*"When rendered / invoked, it should perform this..."*).
3. `### How to See It Performing Its Job on the Live Website`  
   Provide concrete, interactive steps for any human to test on the running web app (`http://localhost:5173/` and `http://localhost:8000/docs`).

---

## 3. Module-Isolated Git Milestone Sync Protocol (Pull, Stage, Verify & Push)

To prevent team merge disasters, cross-contamination, and accidental overwrites in multi-developer environments, agents and developers must adhere to this strict git synchronization protocol whenever a **major milestone** is reached (e.g. multiple related files in a module are completed).

---

### The Golden Rule: Module Isolation
> [!IMPORTANT]
> **NEVER run `git add .` or `git add -A`.**  
> Blind staging picks up other teammates' in-progress work, local database files (`smart_complaints.db`), temporary scratch files, and files belonging to other modules.  
> **You must ONLY stage and push the specific files assigned to your module.**

---

### Step-by-Step Multi-File Milestone Sync Workflow

```
[ DEVELOPER COMPLETES MULTIPLE FILES IN ASSIGNED MODULE ]
                          │
                          ▼
            STEP 1: Run Local Tests
            .\backend\venv\Scripts\python.exe -m pytest backend/tests -v
            npm run build (in frontend/)
                          │
                          ▼
            STEP 2: Pull Latest Team Code (Safe Merge)
            git pull --no-rebase origin develop
                          │
                          ▼
            STEP 3: Reconcile Conflicts with Compatibility Aliases
            (Never delete or break teammate functions/models)
                          │
                          ▼
            STEP 4: Selectively Stage ONLY Your Assigned Module Files
            git add docs/V1/M<N>/ backend/app/... frontend/src/...
                          │
                          ▼
            STEP 5: Commit with Conventional Message
            git commit -m "feat(M<N>): <milestone summary>"
                          │
                          ▼
            STEP 6: Re-Verify Test Suite (Quality Gate)
            .\backend\venv\Scripts\python.exe -m pytest backend/tests -v
                          │
                          ▼
            STEP 7: Push Assigned Module to GitHub
            git push origin develop
```

---

### Per-Module File Ownership & Exact Staging Commands

Whenever multiple files in a module are finished, copy and run the exact isolated command for that module:

#### 🔷 Module M1: Data Layer, Core Models & Application Shell
```powershell
# 1. Pull latest
git pull origin develop --no-rebase

# 2. Stage ONLY M1 files (docs, backend models/core, frontend shell)
git add docs/V1/M1/ `
        backend/app/core/config.py `
        backend/app/core/database.py `
        backend/app/db/base.py `
        backend/app/db/seed.py `
        backend/app/models/base.py `
        backend/app/models/department.py `
        backend/app/models/team.py `
        backend/app/models/ticket.py `
        backend/app/models/__init__.py `
        backend/app/api/deps.py `
        frontend/vite.config.js `
        frontend/tailwind.config.js `
        frontend/src/api/client.js `
        frontend/src/components/Layout.jsx `
        frontend/src/components/Navbar.jsx `
        frontend/src/components/Footer.jsx `
        frontend/src/router/AppRouter.jsx

# 3. Commit, re-test, and push
git commit -m "feat(M1): complete core data models and application shell"
.\backend\venv\Scripts\python.exe -m pytest backend/tests -q
git push origin develop
```

#### 🔷 Module M2: Complaint Ingestion & Keyword Routing
```powershell
# 1. Pull latest
git pull origin develop --no-rebase

# 2. Stage ONLY M2 files (docs, code generator, intake schemas/routes, submission UI)
git add docs/V1/M2/ `
        backend/app/utils/code_generator.py `
        backend/app/services/keyword_router.py `
        backend/app/schemas/ticket.py `
        backend/app/schemas/complaint.py `
        backend/app/services/ticket_service.py `
        backend/app/api/v1/endpoints/complaints.py `
        backend/app/api/v1/router.py `
        frontend/src/api/complaints.js `
        frontend/src/pages/SubmitComplaint.jsx `
        frontend/src/components/SubmissionSuccessModal.jsx `
        frontend/src/pages/TrackTicket.jsx

# 3. Commit, re-test, and push
git commit -m "feat(M2): complete complaint ingestion and keyword routing"
.\backend\venv\Scripts\python.exe -m pytest backend/tests -q
git push origin develop
```

#### 🔷 Module M3: Priority Triage, Classifier Engine & Safety Watchdog
```powershell
# 1. Pull latest
git pull origin develop --no-rebase

# 2. Stage ONLY M3 files (docs, triage engines, priority schemas/endpoints, triage UI)
git add docs/V1/M3/ `
        backend/app/services/priority_engine.py `
        backend/app/services/classifier.py `
        backend/app/schemas/priority.py `
        backend/app/api/v1/endpoints/priority.py `
        backend/app/services/ticket_service.py `
        backend/app/api/v1/router.py `
        backend/tests/test_m3_triage.py `
        frontend/src/api/triage.js `
        frontend/src/components/PriorityBadge.jsx `
        frontend/src/components/LiveTriageCard.jsx `
        frontend/src/components/PriorityOverrideModal.jsx

# 3. Commit, re-test, and push
git commit -m "feat(M3): complete priority triage engine and supervisor override"
.\backend\venv\Scripts\python.exe -m pytest backend/tests -q
git push origin develop
```

#### 🔷 Module M4: Workload Dispatch & Operations Desk
```powershell
# 1. Pull latest
git pull origin develop --no-rebase

# 2. Stage ONLY M4 files (docs, dispatch engine, assignment schemas/endpoints, queue UI)
git add docs/V1/M4/ `
        backend/app/services/dispatch_engine.py `
        backend/app/schemas/assignment.py `
        backend/app/services/team_service.py `
        backend/app/services/ticket_service.py `
        backend/app/api/v1/endpoints/assignment.py `
        backend/app/api/v1/router.py `
        backend/tests/test_m4_dispatch_engine.py `
        frontend/src/api/assignment.js `
        frontend/src/pages/AdminDashboard.jsx `
        frontend/src/components/TeamWorkloadView.jsx `
        frontend/src/components/ReassignTeamModal.jsx

# 3. Commit, re-test, and push
git commit -m "feat(M4): complete workload dispatch engine and admin operations desk"
.\backend\venv\Scripts\python.exe -m pytest backend/tests -q
git push origin develop
```

#### 🔷 Module M5: SLA Timers & Lifecycle Automata
```powershell
# 1. Pull latest
git pull origin develop --no-rebase

# 2. Stage ONLY M5 files (docs, SLA engine, lifecycle automata, analytics UI)
git add docs/V1/M5/ `
        backend/app/services/sla_engine.py `
        backend/app/services/lifecycle.py `
        backend/app/schemas/sla.py `
        backend/app/services/ticket_service.py `
        backend/app/api/v1/endpoints/sla.py `
        backend/app/api/v1/router.py `
        backend/tests/test_m5_api.py `
        backend/tests/test_m5_lifecycle.py `
        backend/tests/test_m5_sla_engine.py `
        frontend/src/api/sla.js `
        frontend/src/components/SLACountdownTimer.jsx `
        frontend/src/components/ResolutionNotesModal.jsx `
        frontend/src/components/SLABreachTable.jsx

# 3. Commit, re-test, and push
git commit -m "feat(M5): complete SLA engine and lifecycle countdown timers"
.\backend\venv\Scripts\python.exe -m pytest backend/tests -q
git push origin develop
```

---

### Files That Must NEVER Be Committed or Pushed
* `smart_complaints.db` (local SQLite database)
* `backend/venv/` or any virtual environment files
* `frontend/node_modules/` or `frontend/dist/`
* Temporary scratch scripts or test logs
* Incomplete or work-in-progress files belonging to another person's module

---

## 4. Local Execution & Quality Assurance Standards

Before marking any task as complete or committing changes, verify that the application builds and tests pass cleanly:

### Backend Testing (FastAPI / Pytest)
Always execute pytest using the project's virtual environment:
```powershell
# Windows PowerShell
.\backend\venv\Scripts\python.exe -m pytest backend/tests -v
```
* **Requirement:** 100% of existing tests must pass with 0 failures.
* If a new feature or endpoint is added, create matching test cases in `backend/tests/`.

### Frontend Verification (Vite / React)
Test production build compilation:
```powershell
cd frontend
npm run build
```
* **Requirement:** Must complete with 0 compilation or syntax errors.

### Local Development Servers
* **Backend API & Swagger Docs:**
  ```powershell
  cd backend
  .\venv\Scripts\Activate.ps1
  uvicorn app.main:app --port 8000 --reload
  # Swagger UI: http://localhost:8000/docs
  ```
* **Frontend Single-Page App:**
  ```powershell
  cd frontend
  npm run dev
  # Live UI: http://localhost:5173/
  ```

---

## 5. Module Map & Architectural Ownership

| Module | Core Responsibility | Key Code Directories | Documentation Blueprint |
| :--- | :--- | :--- | :--- |
| **M1** | Auth, RBAC (Student/Staff/Admin), Team Management | `backend/app/models/user.py`, `team.py` | `docs/V1/M1/` |
| **M2** | Grievance Intake, Form State, File Attachments | `backend/app/models/ticket.py`, `frontend/src/pages/SubmitTicket.jsx` | `docs/V1/M2/` |
| **M3** | Priority Triage, Classifier Engine, Safety Watchdog, Override Modal | `backend/app/services/priority_engine.py`, `classifier.py`, `frontend/src/components/PriorityBadge.jsx` | `docs/V1/M3/` |
| **M4** | Technician Dispatching, Work Order Queue, Status Lifecycles | `backend/app/services/assignment.py`, `frontend/src/pages/TechnicianQueue.jsx` | `docs/V1/M4/` |
| **M5** | Student Feedback, Rating, SLA Telemetry & Resolution Metrics | `backend/app/models/feedback.py`, `frontend/src/pages/AnalyticsDashboard.jsx` | `docs/V1/M5/` |

---

## 6. Checklist for AI Agents Before Completing Any Turn

- [ ] Have all code modifications been tested with pytest and `npm run build`?
- [ ] If any changes, bug fixes, or reconciliations were made to a module, was an entry added to the **"Additional Changes & Development Modifications"** section in `docs/V1/M<N>/`?
- [ ] Are all blueprint verification sections written in the **"What it is responsible for / What it should perform / How to see it performing"** format?
- [ ] Is git status clean and free of temporary scratch files?
- [ ] Did you avoid running `git push`? (Keep commits strictly local unless requested).
