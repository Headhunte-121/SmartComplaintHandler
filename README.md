# Smart Complaint Routing & Workflow Automation Platform (`SmartComplaintHandler`)

Automated closed-loop campus complaint intake, deterministic priority triage, workload-balanced squad dispatch, SLA deadline tracking, and dual-sided resolution monitoring.

---

## 1. Quick Start (Automated 1-Click Launcher)

On Windows, launch the entire full-stack system automatically:
* **Double-click `start_dev.bat`** (or `run_all.bat`).
  - Sets up virtual environments and installs dependencies automatically if missing.
  - Starts the FastAPI backend server on `http://localhost:8000`.
  - Starts the React Vite frontend client on `http://localhost:5173`.
  - Spawns both terminal windows and opens your default browser tabs.
* **To stop all servers:** Double-click `stop_all.bat` (releases ports `8000` and `5173`).

---

## 2. Manual Terminal Setup

### Backend:
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
* Interactive API Documentation: `http://localhost:8000/docs`
* Health Check: `http://localhost:8000/health`

### Frontend:
```bash
cd frontend
npm install
npm run dev
```
* Web Application: `http://localhost:5173` (proxies `/api` requests to backend `:8000`).

---

## 3. Project Documentation & Blueprints

All engineering blueprints, team workflows, and architecture specifications are tracked directly inside this repository under the [`docs/`](docs/README.md) directory:

* [**`docs/README.md`**](docs/README.md) — Master documentation index.
* [**`docs/developer_guide/README.md`**](docs/developer_guide/README.md) — Complete Developer Engineering Handbook (Language mechanics, architecture rationales, and implementation walkthroughs across all modules).
* [**`docs/V1/TEAM_WORKFLOW_AND_GIT_GUIDE.md`**](docs/V1/TEAM_WORKFLOW_AND_GIT_GUIDE.md) — Team roles, simultaneous file matrix, zero-blocking mocks, and beginner Git command guide.
* [**`docs/V1/V1_CENTRAL_BLUEPRINT.md`**](docs/V1/V1_CENTRAL_BLUEPRINT.md) — Authoritative full-stack architecture specification across Modules M1–M5.
* [**`docs/V1/V1_BLUEPRINT.md`**](docs/V1/V1_BLUEPRINT.md) — Closed-loop operational workflow and trace.
* [**`docs/FILE_ARCHITECTURE_GUIDE.md`**](docs/FILE_ARCHITECTURE_GUIDE.md) — Complete 72-file source directory inventory.
* [**`docs/FUNDAMENTALS_OF_FULL_STACK.md`**](docs/FUNDAMENTALS_OF_FULL_STACK.md) — Full-stack architecture fundamentals guide.
* [**`docs/TECH_STACK_DECISION.md`**](docs/TECH_STACK_DECISION.md) — Architectural trade-offs and tech stack decisions.
* [**`docs/VERSION_BLUEPRINT_ROADMAP.md`**](docs/VERSION_BLUEPRINT_ROADMAP.md) — V1, V2, and V3 roadmap.
