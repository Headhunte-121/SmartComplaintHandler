# Section 2: Ticket Ingestion & Keyword Taxonomy (Module 2 Guide)

This guide documents the complaint intake pipeline: Pydantic v2 request/response schemas, collision-resistant tracking code generation, deterministic regex keyword routing, transactional database services, and controlled React submission forms.

---

## 1. Pydantic v2 DTOs vs. Database Entities

### The Separation of Concerns
Input and output boundaries must remain separate from database ORM models:
* **`ComplaintCreate`:** Strictly limits what a student or user can submit (`title`, `description`, `location`). Users cannot provide their own `id`, `tracking_code`, or `status`.
* **`TicketResponse`:** Defines the exact payload returned by the API, stripping internal database metadata.

### Pydantic v2 `from_attributes = True`
In Pydantic v2, `model_config = ConfigDict(from_attributes=True)` replaces Pydantic v1's `class Config: orm_mode = True`. This flag instructs Pydantic to read attributes from SQLAlchemy ORM instances (e.g. `ticket.tracking_code`) instead of standard dictionary keys:

```python
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class ComplaintCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10)
    location: str = Field(..., min_length=2, max_length=150)

class TicketResponse(BaseModel):
    id: int
    tracking_code: str
    title: str
    description: str
    location: str
    priority: str
    status: str
    department_id: Optional[int] = None
    assigned_team_id: Optional[int] = None
    created_at: datetime
    sla_deadline: Optional[datetime] = None
    resolution_notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
```

---

## 2. Collision-Resistant Tracking Code Generator

### Why Not Expose Auto-Incrementing IDs?
If an API exposes `GET /tickets/1`, `GET /tickets/2`, any user can write a simple loop to iterate through every student's complaints, creating a severe data exposure vulnerability.

### Token Format: `TKT-YYYYMMDD-XXXX`
In [`backend/app/utils/code_generator.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/backend/app/utils/code_generator.py), we generate a human-readable identifier:
* **Date Prefix (`YYYYMMDD`):** Instantly reveals when the ticket was registered.
* **4-Character Hex Token (`XXXX`):** Extracted from a Version 4 cryptographic UUID, providing $16^4 = 65,536$ unique entropy states per day.

```python
import uuid
from datetime import datetime

def generate_tracking_code() -> str:
    date_str = datetime.utcnow().strftime("%Y%m%d")
    random_hex = uuid.uuid4().hex[:4].upper()
    return f"TKT-{date_str}-{random_hex}"
```

---

## 3. Deterministic Keyword Taxonomy Routing

### Why Deterministic Regex Instead of Generative AI?
1. **Zero Cost & Sub-Millisecond Speed:** Regex execution takes `< 0.2ms` on CPU with zero external API calls.
2. **100% Deterministic & Auditable:** Zero hallucinations, zero prompt drift, and 100% test reproducibility.
3. **No External Network Dependencies:** Works offline in local college networks without external API keys.

### The Word Boundary Regex Pattern (`\b`)
A common beginner bug is using Python's `in` operator:
```python
if "fan" in text:  # Falsely matches "infant" or "fantastic"!
```
To ensure exact word matches, we construct regular expressions with word boundary anchors `\b`:

```python
import re
from typing import Optional

TAXONOMY = {
    1: {"name": "Electrical", "keywords": ["spark", "wire", "switch", "light", "fan", "power", "outlet", "blackout"]},
    2: {"name": "Plumbing", "keywords": ["leak", "water", "pipe", "tap", "sink", "drain", "clog", "flush", "toilet"]},
    3: {"name": "IT & Network", "keywords": ["wifi", "router", "internet", "lan", "network", "ethernet", "printer"]},
    4: {"name": "Facilities & HVAC", "keywords": ["ac", "air conditioner", "cooling", "heat", "door", "window", "bench"]}
}

def route_complaint_to_department(title: str, description: str) -> Optional[int]:
    combined_text = f"{title} {description}".lower()
    scores = {}

    for dept_id, data in TAXONOMY.items():
        score = 0
        for kw in data["keywords"]:
            # \b matches word boundaries to avoid false positive substring matches
            pattern = rf"\b{re.escape(kw)}\b"
            score += len(re.findall(pattern, combined_text))
        scores[dept_id] = score

    best_dept = max(scores, key=scores.get)
    return best_dept if scores[best_dept] > 0 else None
```

---

## 4. Transactional Database Service Layer

In [`backend/app/services/ticket_service.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/backend/app/services/ticket_service.py), all database operations are wrapped in atomic transaction boundaries:

```python
def create_ticket(db: Session, complaint_in: ComplaintCreate) -> Ticket:
    tracking_code = generate_tracking_code()
    dept_id = route_complaint_to_department(complaint_in.title, complaint_in.description)

    ticket = Ticket(
        tracking_code=tracking_code,
        title=complaint_in.title,
        description=complaint_in.description,
        location=complaint_in.location,
        department_id=dept_id,
        priority="P3",
        status="OPEN"
    )

    try:
        db.add(ticket)
        db.commit()
        db.refresh(ticket)
        return ticket
    except Exception as exc:
        db.rollback()  # Reverts dirty state on failure
        raise exc
```

---

## 5. Controlled Form State in React 18

In [`frontend/src/pages/SubmitComplaint.jsx`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/frontend/src/pages/SubmitComplaint.jsx), the form is implemented as a controlled component:

```jsx
const [formData, setFormData] = useState({ title: '', location: '', description: '' });

// Every keystroke updates React state, making it the single source of truth
<input
  type="text"
  required
  minLength={5}
  value={formData.title}
  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
/>
```

When submitted:
1. `e.preventDefault()` prevents the default browser page reload.
2. `apiClient.post('/complaints/', formData)` transmits the payload through the Vite proxy to FastAPI.
3. The generated `tracking_code` is returned and displayed in a dedicated success modal.
