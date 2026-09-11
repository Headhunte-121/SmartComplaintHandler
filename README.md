# Smart Complaint Routing & Workflow Automation Platform (`SmartComplaintHandler`)

Automated closed-loop campus complaint intake, deterministic priority triage, workload-balanced squad dispatch, SLA deadline tracking, and dual-sided resolution monitoring.

## Full-Stack Architecture
- **Backend:** FastAPI, SQLAlchemy 2.0 (SQLite WAL), Pydantic V2
- **Frontend:** React 18, Vite, Tailwind CSS, React Router DOM v6
- **Architecture Blueprints:** Refer to `../V1/V1_CENTRAL_BLUEPRINT.md` and `../V1/TEAM_WORKFLOW_AND_GIT_GUIDE.md`

## Quick Start

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
API Documentation available at `http://localhost:8000/docs`

### Frontend:
```bash
cd frontend
npm install
npm run dev
```
Client runs at `http://localhost:5173` with reverse proxy to `:8000`.
