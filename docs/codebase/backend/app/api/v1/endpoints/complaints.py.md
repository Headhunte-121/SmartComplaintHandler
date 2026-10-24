# Comprehensive Code Walkthrough & Line-by-Line Guide: `backend/app/api/v1/endpoints/complaints.py`

> **File Location**: [`backend/app/api/v1/endpoints/complaints.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/backend/app/api/v1/endpoints/complaints.py)  
> **Prerequisites**: Basic knowledge of C or Python (functions, HTTP requests, SQL queries, strings, dictionaries). No advanced web security background is assumed.  
> **What this file is**: The primary complaint management API controller. It handles student complaint intake (`POST /`), public status lookups with automatic PII privacy masking (`GET /{tracking_code}`), role-segregated complaint listings (`GET /`), closed-loop student satisfaction ratings (`POST /{tracking_code}/feedback`), and direct technician ticket updates (`PATCH /{tracking_code}`).

---

## Block 1: Imports and Framework Setup (Lines 1–32)

```python
"""
SmartComplaintHandler - Complaint & Ticket Endpoints
Blueprint Reference: V1/M2/backend/05_complaint_endpoints.md
Role: REST routes for student complaint submission (POST), status tracking by code (GET),
      and IDOR-protected listing & feedback endpoints.
"""
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db, get_optional_current_user, require_roles
from app.core.config import settings
from app.models.department import Department
from app.models.ticket import Ticket
from app.schemas.ticket import (
    FeedbackSubmitRequest,
    TicketCreate,
    TicketDirectUpdateRequest,
    TicketResponse,
)
from app.schemas.user import UserResponse
from app.services.ticket_service import create_ticket, list_tickets, submit_ticket_feedback

router = APIRouter()
```

### 1. Plain-English Purpose:
Imports date utilities, type hints, FastAPI routing and parameter validation tools (`Query`), database eager loading (`joinedload`), entity models, validation schemas, and service functions. Instantiates the tickets router.

### 2. Line-by-Line Breakdown:
- **Lines 1–6**: Docstring referencing Module 2 Blueprint for Complaint Endpoints.
- **Line 7 (`from datetime import datetime, timezone`)**: UTC datetime utilities for timestamping resolution events.
- **Line 8 (`from typing import List, Optional`)**: Type hints.
- **Line 9 (`from fastapi import APIRouter, Depends, HTTPException, Query, status`)**:
  - `Query`: Validates URL query parameters (e.g. `skip`, `limit`) with numeric bounds (`ge=1, le=1000`).
- **Line 10 (`from sqlalchemy.orm import Session, joinedload`)**:
  - `joinedload`: Emits an SQL `LEFT OUTER JOIN` to fetch tickets and their department names in a single database roundtrip, eliminating the N+1 query problem.
- **Lines 12–19**: Imports dependencies, models, schemas, and ticket service functions.
- **Line 21 (`router = APIRouter()`)**: Instantiates the complaint router.

---

## Block 2: PII Privacy Masking Functions (Lines 34–60)

```python
def _mask_display_name(name: Optional[str]) -> Optional[str]:
    """Masks personal names (e.g. 'Aarav Sharma' -> 'A***v S****a') to protect student privacy."""
    if not name:
        return name
    parts = name.strip().split()
    masked = []
    for part in parts:
        if len(part) <= 2:
            masked.append(part[0] + "*")
        else:
            masked.append(part[0] + ("*" * (len(part) - 2)) + part[-1])
    return " ".join(masked)


def _mask_display_email(email: Optional[str]) -> Optional[str]:
    """Masks email addresses (e.g. 'student@iiitnr.edu.in' -> 's*****t@iiitnr.edu.in') to protect student PII."""
    if not email:
        return email
    clean = email.strip()
    if "@" not in clean:
        return clean
    username, domain = clean.split("@", 1)
    if len(username) <= 2:
        masked_user = username[0] + "*"
    else:
        masked_user = username[0] + ("*" * (len(username) - 2)) + username[-1]
    return f"{masked_user}@{domain}"
```

### 1. Plain-English Purpose:
Anonymizes student Personally Identifiable Information (PII) when complaint tickets are viewed on public tracking pages or displayed on campus transparency boards. Replaces middle characters of names and emails with asterisks (`Aarav Sharma` $\to$ `A***v S****a`, `student@iiitnr.edu.in` $\to$ `s*****t@iiitnr.edu.in`).

### 2. Line-by-Line Breakdown:
- **Lines 34–45 (`_mask_display_name`)**: Splits name into words; keeps the first and last letters of each word, replacing intermediate characters with asterisks `*`.
- **Lines 48–60 (`_mask_display_email`)**: Splits email at `@`; preserves the first and last characters of the username and retains the domain (`@iiitnr.edu.in`).

### 3. Deep Term & Concept Expansion:
- **Why Mask PII on Public Tracking?**:
  Anyone holding a tracking code can view ticket progress. If a ticket contains a student's full name and email, an unauthorized person viewing the screen could harvest student contact details. Masking PII preserves privacy while allowing the student to recognize their own complaint.

---

## Block 3: Complaint Submission: `POST /` (Lines 62–84)

```python
@router.post(
    "",
    response_model=TicketResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a new complaint ticket",
)
def submit_complaint(
    payload: TicketCreate,
    db: Session = Depends(get_db),
    current_user: Optional[UserResponse] = Depends(get_optional_current_user),
):
    """
    Public student complaint intake with optional authenticated attribution.
    Automatically assigns unique tracking code, sets status to SUBMITTED,
    and calculates initial SLA deadline based on urgency tier.
    """
    ticket = create_ticket(
        db=db,
        title=payload.title,
        description=payload.description,
        location=payload.location,
        student_name=payload.student_name,
        student_email=payload.student_email,
        current_user=current_user,
    )
    return ticket
```

### 1. Plain-English Purpose:
The main complaint submission endpoint. Accepts the problem title, description, location, and optional student details. It calls `create_ticket()` to generate a unique tracking code (e.g. `IIITNR-ELE-2026-0042`), calculate the SLA resolution deadline, trigger automated AI triage, and return the new ticket with HTTP 201 Created.

### 2. Line-by-Line Breakdown:
- **Line 62 (`@router.post("", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)`)**: Mounts at `POST /api/v1/tickets`.
- **Lines 67–71**: Injects validated payload (`TicketCreate`), database session (`get_db`), and optional logged-in user (`get_optional_current_user`).
- **Lines 73–82**: Calls `create_ticket()`, linking the ticket to the student's profile if logged in, or marking it anonymous if unauthenticated.
- **Line 83 (`return ticket`)**: Returns serialized ticket with tracking code and SLA.

---

## Block 4: Public Tracking & IDOR Defense: `GET /{tracking_code}` (Lines 86–128)

```python
@router.get(
    "/{tracking_code}",
    response_model=TicketResponse,
    summary="Retrieve ticket by unique tracking code",
)
def get_ticket_by_tracking_code(
    tracking_code: str,
    db: Session = Depends(get_db),
    current_user: Optional[UserResponse] = Depends(get_optional_current_user),
):
    """
    Public ticket status tracking.
    Enforces privacy masking on student PII unless accessed by the ticket author,
    an assigned technician, or a campus administrator.
    """
    ticket = (
        db.query(Ticket)
        .options(joinedload(Ticket.department), joinedload(Ticket.assigned_team))
        .filter(Ticket.tracking_code == tracking_code.strip())
        .first()
    )
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket with tracking code '{tracking_code}' was not found.",
        )

    # Privacy check: If not the author or staff, mask student PII
    is_staff = current_user and current_user.role in ("ADMIN", "SUPER_ADMIN", "TECHNICIAN")
    is_author = current_user and current_user.email and ticket.student_email and current_user.email.lower() == ticket.student_email.lower()

    resp = TicketResponse.model_validate(ticket)
    if not (is_staff or is_author):
        resp.student_name = _mask_display_name(resp.student_name)
        resp.student_email = _mask_display_email(resp.student_email)
    return resp
```

### 1. Plain-English Purpose:
Enables public complaint tracking via tracking code without requiring a login. Enforces an intelligent privacy barrier: if the viewer is the ticket author or university staff, they see full student contact details; if an anonymous stranger looks up the code, student names and emails are masked.

### 2. Line-by-Line Breakdown:
- **Line 86 (`@router.get("/{tracking_code}", ...)`)**: HTTP GET route at `/api/v1/tickets/{tracking_code}`.
- **Lines 98–103**: Queries `Ticket` by tracking code while eagerly joining department and assigned squad. If missing, raises HTTP 404 Not Found.
- **Lines 108–110**: Computes `is_staff` and `is_author` boolean authorization flags.
- **Lines 112–116**: Converts ticket to `TicketResponse`. If viewer is neither author nor staff, masks `student_name` and `student_email` before returning.

---

## Block 5: Scoped Ticket Listing & Role Segregation: `GET /` (Lines 130–174)

```python
@router.get(
    "",
    response_model=List[TicketResponse],
    summary="List tickets with role-based filtering",
)
def list_all_tickets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    department_id: Optional[int] = Query(None),
    assigned_team_id: Optional[int] = Query(None),
    current_user: UserResponse = Depends(require_roles(["STUDENT", "STAFF", "FACULTY", "TECHNICIAN", "ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db),
):
    """
    Role-segregated ticket listing:
    - Students see only their own complaints (matched by student_email).
    - Technicians see tickets assigned to their squad or department.
    - Admins and Super Admins see all campus tickets.
    """
    return list_tickets(
        db=db,
        current_user=current_user,
        skip=skip,
        limit=limit,
        status_filter=status,
        priority_filter=priority,
        department_id_filter=department_id,
        team_id_filter=assigned_team_id,
    )
```

### 1. Plain-English Purpose:
The master ticket queue endpoint. Strictly enforces role segregation:
- **Students**: Filtered to see only their own complaints (`WHERE student_email = current_user.email`).
- **Technicians**: Filtered to view only jobs assigned to their squad or department.
- **Administrators**: Granted visibility across all campus tickets with pagination (`skip`, `limit`).

---

## Block 6: Closed-Loop Student Feedback: `POST /{tracking_code}/feedback` (Lines 176–200)

```python
@router.post(
    "/{tracking_code}/feedback",
    response_model=TicketResponse,
    summary="Submit student feedback and close ticket",
)
def submit_feedback(
    tracking_code: str,
    payload: FeedbackSubmitRequest,
    db: Session = Depends(get_db),
):
    """
    Closed-loop feedback submission.
    Allows the student to rate completed work (1-5 stars) and add comments.
    Automatically transitions ticket status from RESOLVED to CLOSED.
    """
    ticket = submit_ticket_feedback(
        db=db,
        tracking_code=tracking_code.strip(),
        rating=payload.rating,
        comments=payload.comments,
        student_name=payload.student_name,
    )
    return ticket
```

### 1. Plain-English Purpose:
Implements the final step in the closed-loop complaint lifecycle. Once a technician marks a problem resolved, the student rates the work (1 to 5 stars) and enters remarks. Submitting feedback transitions the ticket status from `RESOLVED` to `CLOSED`.

---

## Block 7: Technician & Supervisor Direct Patch: `PATCH /{tracking_code}` (Lines 202–270)

```python
@router.patch(
    "/{tracking_code}",
    response_model=TicketResponse,
    summary="Directly update ticket fields (Technicians & Admins only)",
)
def update_ticket_direct(
    tracking_code: str,
    payload: TicketDirectUpdateRequest,
    current_user: UserResponse = Depends(require_roles(["TECHNICIAN", "ADMIN", "SUPER_ADMIN"])),
    db: Session = Depends(get_db),
):
    """
    Allows staff to update ticket status, resolution notes, priority, or department.
    If status transitions to RESOLVED, automatically stamps resolved_at timestamp.
    """
    ticket = db.query(Ticket).filter(Ticket.tracking_code == tracking_code.strip()).first()
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket '{tracking_code}' not found",
        )

    data = payload.model_dump(exclude_unset=True) if hasattr(payload, "model_dump") else payload.dict(exclude_unset=True)

    # If technician marks ticket resolved, stamp resolved_at in UTC
    if data.get("status") == "RESOLVED" and ticket.status != "RESOLVED":
        ticket.resolved_at = datetime.now(timezone.utc)

    for field, value in data.items():
        if hasattr(ticket, field) and value is not None:
            setattr(ticket, field, value)

    db.commit()
    db.refresh(ticket)
    return ticket
```

### 1. Plain-English Purpose:
Direct update route for field technicians and supervisors. Allows updating ticket status (e.g. `IN_PROGRESS`, `RESOLVED`), assigning departments, or entering repair resolution notes. If status changes to `RESOLVED`, it automatically records the `resolved_at` UTC timestamp.

### 2. Line-by-Line Breakdown:
- **Line 202 (`@router.patch("/{tracking_code}")`)**: HTTP PATCH route.
- **Line 208 (`require_roles(["TECHNICIAN", "ADMIN", "SUPER_ADMIN"])`)**: Students cannot modify tickets; only staff hold update permissions.
- **Line 214 (`data = payload.model_dump(exclude_unset=True)`)**: Extracts only fields explicitly submitted by the client, ignoring untouched fields.
- **Lines 216–218**: Automatically stamps `ticket.resolved_at = datetime.now(timezone.utc)` when status becomes `RESOLVED`.
- **Lines 220–222 (`setattr(ticket, field, value)`)**: Dynamically updates changed fields on the SQLAlchemy model.
- **Lines 224–226**: Commits transaction, refreshes model, and returns updated ticket.

---

## Overall File Viva & Technical Defense Guide

### Top 10 Viva Questions on `backend/app/api/v1/endpoints/complaints.py`:

#### Q1: What is the primary role of `endpoints/complaints.py`?
> **Model Answer**:  
> *"Sir, `complaints.py` is the central operational controller for grievances. It handles complaint intake (`POST /`), public tracking by non-sequential tracking code (`GET /{tracking_code}`), role-segregated queue listing (`GET /`), closed-loop student feedback (`POST /{tracking_code}/feedback`), and technician repair updates (`PATCH /{tracking_code}`)."*

#### Q2: How does `get_ticket_by_tracking_code` protect student privacy?
> **Model Answer**:  
> *"Sir, lines 108–116 enforce PII masking. When a ticket is looked up by its tracking code, the system checks if the viewer is the ticket's author or university staff. If the viewer is an external party, `_mask_display_name` and `_mask_display_email` mask personal details (e.g. `A***v S****a`), preventing student identity harvesting."*

#### Q3: Why does `list_all_tickets` implement role segregation?
> **Model Answer**:  
> *"Sir, to prevent Insecure Direct Object Reference (IDOR) data leaks. Students must only be allowed to see their own submitted grievances. Technicians only see tickets assigned to their squad or department. Administrators are granted university-wide oversight."*

#### Q4: What is the purpose of `joinedload` in database queries?
> **Model Answer**:  
> *"Sir, `joinedload` prevents the N+1 query problem. Instead of fetching tickets in one query and then making separate database roundtrips to fetch each department and squad name, `joinedload` issues an SQL `LEFT OUTER JOIN`, fetching tickets, departments, and squads in a single database query."*

#### Q5: What makes this a "Closed-Loop" complaint management system?
> **Model Answer**:  
> *"Sir, in open-loop systems, tickets terminate when technicians mark them done. In our closed-loop architecture, technician completion transitions the ticket to `RESOLVED`, triggering an automated feedback prompt. The ticket only reaches final `CLOSED` status when the student rates the repair via `POST /{tracking_code}/feedback`."*

#### Q6: What does `payload.model_dump(exclude_unset=True)` do in `update_ticket_direct`?
> **Model Answer**:  
> *"Sir, it extracts only the specific fields that the client sent in the HTTP request body. Any field omitted by the client is excluded from the update dictionary, ensuring that partial `PATCH` updates do not overwrite existing database columns with null values."*

#### Q7: How does `update_ticket_direct` automatically handle the resolution timestamp?
> **Model Answer**:  
> *"Sir, line 217 detects if `data.get('status') == 'RESOLVED'` and `ticket.status != 'RESOLVED'`. If transitioning to resolved, it automatically sets `ticket.resolved_at = datetime.now(timezone.utc)`, creating an audit timestamp used for SLA compliance metrics."*

#### Q8: What validation is enforced on pagination parameters in `list_all_tickets`?
> **Model Answer**:  
> *"Sir, line 131 uses `skip: int = Query(0, ge=0)` and `limit: int = Query(100, ge=1, le=1000)`. Setting `le=1000` prevents malicious callers from requesting millions of rows in a single query, protecting database memory."*

#### Q9: What HTTP status code is returned when a new complaint is filed?
> **Model Answer**:  
> *"Sir, line 64 specifies `status_code=status.HTTP_201_CREATED`, following REST best practices which require returning HTTP 201 for successful resource creation."*

#### Q10: How does `setattr(ticket, field, value)` work?
> **Model Answer**:  
> *"Sir, `setattr` is a built-in Python function that dynamically assigns a value to an object attribute by string name. Lines 220–222 iterate through changed fields from `model_dump()` and update the corresponding columns on the SQLAlchemy model before committing."*

---

## Quick Viva Summary Table

| HTTP Method | Route URL | Role Required | What it does | Key Security / Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **`POST`** | `/tickets` | Public / Student | Creates new complaint ticket (201 Created) | Auto-generates tracking code & SLA |
| **`GET`** | `/tickets/{tracking_code}`| Public | Looks up ticket progress by code | Masks PII unless viewed by author/staff |
| **`GET`** | `/tickets` | Authenticated | Lists tickets with role segregation | Students see own; staff see squad/all |
| **`POST`** | `/tickets/{tracking_code}/feedback`| Public / Student | Submits 1–5 star rating & closes ticket | Completes closed-loop lifecycle |
| **`PATCH`** | `/tickets/{tracking_code}`| Technician / Admin | Updates ticket status, notes, squad | Stamps `resolved_at` upon resolution |
