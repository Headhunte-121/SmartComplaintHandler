# Section 6: Automated Testing & Collaborative Git Delivery

This guide documents the verification and delivery standards for the platform: Pytest integration testing, end-to-end closed-loop smoke tests, team Git branch management, and resolving merge conflicts in VS Code.

---

## 1. Automated Integration Testing with Pytest & TestClient

### Why Automated Testing is Non-Negotiable
When an engineer refactors the keyword router or priority engine, manual testing across every screen is slow and error-prone. 
FastAPI's `TestClient` (backed by `httpx`) simulates real HTTP requests directly against the ASGI app without needing a running server process, executing in `< 1.5 seconds`.

### The 9-Step Closed-Loop Integration Suite
Located at [`backend/tests/test_closed_loop.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/backend/tests/test_closed_loop.py):

```python
from fastapi.testclient import TestClient
from app.main import app

def test_full_complaint_lifecycle():
    with TestClient(app) as client:
        # 1. Health check
        res = client.get("/health")
        assert res.status_code == 200

        # 2. Ingestion (M2)
        res = client.post("/api/v1/tickets", json={
            "title": "Severe water pipe burst in Chemistry Lab",
            "description": "Continuous flooding with water leaking near electrical outlets.",
            "location": "Science Block, Lab 2"
        })
        assert res.status_code == 201
        data = res.json()
        code = data["tracking_code"]
        ticket_id = data["id"]

        # 3. Lookup (M2)
        res = client.get(f"/api/v1/tickets/{code}")
        assert res.status_code == 200

        # 4. Triage Preview (M3)
        res = client.post("/api/v1/triage-preview", json={"title": data["title"], "description": data["description"]})
        assert res.status_code == 200

        # 5. Workload Check (M4)
        res = client.get("/api/v1/teams/workloads")
        assert res.status_code == 200

        # 6. Reassignment (M4)
        res = client.patch(f"/api/v1/tickets/{ticket_id}/reassign", json={"team_id": 2, "reason": "High pressure pipe"})
        assert res.status_code == 200

        # 7. Lifecycle Advancement (M5)
        res = client.patch(f"/api/v1/tickets/{ticket_id}/status", json={"status": "IN_PROGRESS"})
        assert res.status_code == 200

        # 8. Resolution with Notes (M5)
        res = client.post(f"/api/v1/tickets/{ticket_id}/resolve", json={"resolution_notes": "Fixed gasket."})
        assert res.status_code == 200

        # 9. SLA Breach Query (M5)
        res = client.get("/api/v1/sla/breaches")
        assert res.status_code == 200
```

### Running the Test Suite:
```bash
cd backend
.\venv\Scripts\python -m pytest tests/test_closed_loop.py -v -s
```

---

## 2. Resolving Git Merge Conflicts in VS Code

### Anatomy of a Conflict Marker
When two engineers edit the exact same lines in a file on different branches:

```
<<<<<<< HEAD (Your current branch)
    priority = "P1"
    rationale = "Elevated due to life safety trigger"
=======
    priority = "P2"
    rationale = "Assigned via standard matrix"
>>>>>>> incoming-branch (Teammate's incoming branch)
```

### 3-Step Resolution Procedure in VS Code:
1. **Open File:** VS Code highlights conflicted files in red.
2. **Use Conflict Lens:** Click one of the buttons above the conflict marker:
   * **Accept Current Change:** Keeps your branch's lines.
   * **Accept Incoming Change:** Keeps your teammate's lines.
   * **Accept Both Changes:** Preserves both blocks.
3. **Commit & Push:**
   ```bash
   git add <filename>
   git commit -m "merge: resolve priority assignment conflict with teammate"
   git push origin <your-branch>
   ```

---

## 3. Daily Team Git Cadence

To avoid massive merge conflicts, every developer should follow this daily routine:

```bash
# 1. Start of day: Pull latest shared changes
git checkout develop
git pull origin develop

# 2. Rebase your active branch onto latest develop
git checkout feature-your-task
git rebase develop

# 3. Code, test, and commit small logical units
git add .
git commit -m "feat(m2): add word boundary regex matching in keyword router"

# 4. Push branch to remote
git push origin feature-your-task

# 5. Merge into develop when verified
git checkout develop
git merge feature-your-task
git push origin develop
```
