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

## 3. Strict Git & Repository Collaboration Rules

### 🔴 STRICT NON-NEGOTIABLE: DO NOT PUSH TO GITHUB UNLESS EXPLICITLY DIRECTED
* **NEVER run `git push`** (`git push origin develop`, `git push origin main`, etc.) unless the user explicitly gives you the command in chat (e.g., *"push to develop"* or *"push our changes"*).
* Keep all commits, branches, and merges strictly **local** on the developer's workstation.
* When instructed to commit, use clean conventional commits:
  ```bash
  git add <specific-files>
  git commit -m "feat(M3): add debounced live triage preview card"
  ```

### 🟢 Merging Teammate Changes & Conflict Resolution
* When syncing with remote updates from teammates, use non-rebase merges:
  ```powershell
  git pull --no-rebase origin develop
  ```
* **Preserve Teammate Code via Backward Compatibility:** If a teammate's commit modifies function names, model names, or seed functions (e.g., `seed_database(db)` vs `seed_data()`, or `Team` vs `MaintenanceTeam`), **do not overwrite or delete their code**. Provide an alias or support both signatures so both modules continue running smoothly.

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
