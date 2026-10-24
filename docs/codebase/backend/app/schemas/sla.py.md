# Comprehensive Code Walkthrough & Line-by-Line Guide: `backend/app/schemas/sla.py`

> **File Location**: [`backend/app/schemas/sla.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/backend/app/schemas/sla.py)  
> **Prerequisites**: Basic knowledge of C or Python (classes, enums, strings, timestamps, integers). No advanced SLA or operations management background is assumed.  
> **What this file is**: The data contracts for SLA monitoring and complaint lifecycle state machines. It defines valid ticket status states (`TicketStatusEnum`), validates technician resolution reports (`TicketResolveRequest`), models supervisor escalations (`EscalationRequest`), and serializes real-time SLA breach countdowns (`SLABreachResponse`).

---

## Block 1: Imports & `TicketStatusEnum` Definition (Lines 1–27)

```python
"""
SmartComplaintHandler - SLA & Lifecycle Schemas
Blueprint Reference: V1/M5/backend/03_sla_schemas.md
Role: DTOs for lifecycle status updates, closure documentation, and active breach reporting.
"""
from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

HAS_PYDANTIC_V2 = hasattr(BaseModel, "model_validate")
if HAS_PYDANTIC_V2:
    from pydantic import ConfigDict, field_serializer
else:
    from pydantic import root_validator


class TicketStatusEnum(str, Enum):
    """Enumeration of all valid ticket lifecycle states."""
    SUBMITTED = "SUBMITTED"
    IN_PROGRESS = "IN_PROGRESS"
    ESCALATED = "ESCALATED"
    ON_HOLD = "ON_HOLD"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"
```

### 1. Plain-English Purpose:
Establishes the official 7 states that a campus complaint can transition through during its lifetime. Inheriting from `(str, Enum)` ensures that API requests can only use these exact 7 strings.

### 2. Line-by-Line Breakdown:
- **Lines 1–5**: Docstring referencing Module 5 Blueprint for SLA and Lifecycle Schemas.
- **Line 6 (`from datetime import datetime, timezone`)**: UTC datetime utilities.
- **Line 7 (`from enum import Enum`)**: Standard Python enum support.
- **Line 8 (`from typing import Optional`)**: Type hint for optional payload fields.
- **Line 9 (`from pydantic import BaseModel, Field`)**: Pydantic base classes.
- **Lines 11–15**: Pydantic v1 vs v2 compatibility check.
- **Line 18 (`class TicketStatusEnum(str, Enum):`)**: String enum class.
- **Lines 20–26**: Seven valid lifecycle states:
  - `SUBMITTED`: Newly filed, awaiting triage.
  - `IN_PROGRESS`: Assigned to technician and work actively underway.
  - `ESCALATED`: High-risk or overdue complaint escalated to supervisors.
  - `ON_HOLD`: Temporarily paused (e.g. waiting for spare parts delivery).
  - `RESOLVED`: Field technician completed repair.
  - `CLOSED`: Student verified fix or auto-closed.
  - `CANCELLED`: Invalid duplicate or withdrawn grievance.

---

## Block 2: `StatusUpdateRequest` Schema (Lines 29–34)

```python
class StatusUpdateRequest(BaseModel):
    """Request schema for generic ticket lifecycle status transitions."""
    status: TicketStatusEnum = Field(..., description="Target lifecycle status")
    notes: Optional[str] = Field(None, max_length=1000, description="Optional transition remarks or rationale")
    actor: str = Field("Staff", max_length=100, description="Name or identifier of the operator")
```

### 1. Plain-English Purpose:
Data contract for general status transitions (e.g. moving a ticket to `IN_PROGRESS` or `ON_HOLD`). Captures the target status enum, optional notes explaining the change, and the name of the operator who triggered the transition.

---

## Block 3: `TicketResolveRequest` Schema (Lines 36–54)

```python
class TicketResolveRequest(BaseModel):
    """Request schema for ticket resolution and formal work closure."""
    resolution_notes: str = Field(
        ...,
        min_length=10,
        max_length=2000,
        description="Mandatory substantive explanation of repair performed (minimum 10 characters)",
    )
    parts_replaced: Optional[str] = Field(
        None,
        max_length=500,
        description="Optional list or summary of replacement components consumed",
    )
    technician_name: Optional[str] = Field(
        None,
        max_length=150,
        description="Optional name of field worker who completed the repair",
    )
```

### 1. Plain-English Purpose:
The completion certificate submitted by a field technician. It strictly mandates a detailed explanation of the repair (`resolution_notes`, minimum 10 characters) and optionally records replacement inventory parts and worker identity.

### 2. Line-by-Line Breakdown:
- **Line 36 (`class TicketResolveRequest(BaseModel):`)**: Schema class.
- **Lines 38–43 (`resolution_notes`)**: Mandatory substantive explanation. Requiring `min_length=10` prevents technicians from closing tickets with empty or lazy notes (like "done" or "fixed").
- **Lines 44–48 (`parts_replaced`)**: Consumed campus inventory (e.g. `"1x 15A MCB switch, 2m copper wire"`).
- **Lines 49–53 (`technician_name`)**: Submitting technician's name.

---

## Block 4: `EscalationRequest` Schema (Lines 56–69)

```python
class EscalationRequest(BaseModel):
    """Request schema for supervisory escalation of stagnant or high-risk complaints."""
    escalation_reason: str = Field(
        ...,
        min_length=5,
        max_length=1000,
        description="Mandatory justification for supervisory escalation (minimum 5 characters)",
    )
    supervisor_id: Optional[str] = Field(
        None,
        max_length=100,
        description="Optional supervisor or manager identifier",
    )
```

### 1. Plain-English Purpose:
Data contract used when a complaint is stalled, overdue, or presents a severe campus hazard, escalating the ticket directly to senior department administrators or the Estate Officer.

---

## Block 5: `SLABreachResponse` Schema (Lines 71–107)

```python
class SLABreachResponse(BaseModel):
    """DTO for reporting overdue and near-breach tickets to supervisory dashboards."""
    ticket_id: int
    tracking_code: str
    title: str
    location: Optional[str] = None
    department_name: Optional[str] = None
    assigned_team_name: Optional[str] = None
    priority: str
    sla_deadline: datetime
    remaining_seconds: int
    overdue_seconds: int
    is_breached: bool
    status: str

    if HAS_PYDANTIC_V2:
        model_config = ConfigDict(from_attributes=True)

        @field_serializer("sla_deadline", when_used="json-unless-none")
        def _serialize_sla_deadline_utc(self, dt: Optional[datetime]) -> Optional[str]:
            if dt is None:
                return None
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            else:
                dt = dt.astimezone(timezone.utc)
            return dt.isoformat()
    else:
        class Config:
            orm_mode = True

        @classmethod
        def model_validate(cls, obj):
            if isinstance(obj, dict):
                return cls(**obj)
            return cls.from_orm(obj)
```

### 1. Plain-English Purpose:
The real-time monitor payload displayed on the administrative SLA Breach Table. It tells supervisors whether a ticket is already breached (`is_breached = True`), how many seconds it has been overdue (`overdue_seconds`), or how many seconds remain before breach occurs (`remaining_seconds`), with UTC timestamp formatting.

### 2. Line-by-Line Breakdown:
- **Lines 73–80**: Ticket identification, location, squad, priority, and deadline timestamp.
- **Line 81 (`remaining_seconds: int`)**: Countdown in seconds until deadline expires (0 if already breached).
- **Line 82 (`overdue_seconds: int`)**: Count of seconds elapsed past the deadline (0 if still within SLA).
- **Line 83 (`is_breached: bool`)**: True if `now > sla_deadline` and status is unresolved.
- **Line 87 (`ConfigDict(from_attributes=True)`)**: Enables ORM model serialization.
- **Lines 89–97 (`_serialize_sla_deadline_utc`)**: Formats deadline into standardized UTC ISO 8601 strings.

---

## Block 6: `TicketLifecycleResponse` Schema (Lines 109–145)

```python
class TicketLifecycleResponse(BaseModel):
    """DTO returned following status modifications and ticket closures."""
    id: int
    tracking_code: str
    status: str
    new_status: Optional[str] = None
    resolved: Optional[bool] = None
    priority: str
    sla_deadline: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None

    if HAS_PYDANTIC_V2:
        model_config = ConfigDict(from_attributes=True)

        def model_post_init(self, __context):
            if self.new_status is None:
                self.new_status = self.status
            if self.resolved is None:
                self.resolved = self.status == "RESOLVED"
    else:
        class Config:
            orm_mode = True

        @root_validator(pre=False)
        def _populate_lifecycle_fields(cls, values):
            if values.get("new_status") is None and values.get("status") is not None:
                values["new_status"] = values["status"]
            if values.get("resolved") is None and values.get("status") is not None:
                values["resolved"] = values["status"] == "RESOLVED"
            return values

        @classmethod
        def model_validate(cls, obj):
            if isinstance(obj, dict):
                return cls(**obj)
            return cls.from_orm(obj)
```

### 1. Plain-English Purpose:
Standard response returned after any state transition. Automatically computes helper fields: `new_status` (synchronized to `status`) and `resolved` (boolean `True` if `status == "RESOLVED"`).

---

## Overall File Viva & Technical Defense Guide

### Top 5 Viva Questions on `backend/app/schemas/sla.py`:

#### Q1: What is the role of `schemas/sla.py`?
> **Model Answer**:  
> *"Sir, `schemas/sla.py` defines the data contracts for Module 5's SLA and Lifecycle Engine. It validates lifecycle state transitions (`TicketStatusEnum`, `StatusUpdateRequest`), mandates technician repair documentation (`TicketResolveRequest`), supports supervisory escalations (`EscalationRequest`), and serializes real-time countdown metrics for the SLA breach monitor (`SLABreachResponse`)."*

#### Q2: Why is `min_length=10` enforced on `resolution_notes` in `TicketResolveRequest`?
> **Model Answer**:  
> *"Sir, in maintenance operations, technicians must be held accountable for physical repairs. Enforcing `min_length=10` prevents technicians from closing tickets with careless, uninformative notes like 'done' or 'ok', ensuring that substantive actions taken are permanently recorded."*

#### Q3: How does `SLABreachResponse` calculate `remaining_seconds` vs `overdue_seconds`?
> **Model Answer**:  
> *"Sir, the SLA engine compares the ticket's `sla_deadline` against the current UTC timestamp (`now = datetime.now(timezone.utc)`):  
> - If `now < sla_deadline`: `remaining_seconds = int((sla_deadline - now).total_seconds())` and `overdue_seconds = 0`.  
> - If `now >= sla_deadline`: `remaining_seconds = 0` and `overdue_seconds = int((now - sla_deadline).total_seconds())`, with `is_breached = True`."*

#### Q4: What are the 7 valid states in `TicketStatusEnum`?
> **Model Answer**:  
> *"Sir, the 7 states are: `SUBMITTED`, `IN_PROGRESS`, `ESCALATED`, `ON_HOLD`, `RESOLVED`, `CLOSED`, and `CANCELLED`. Transitions between these states are governed by the lifecycle state machine."*

#### Q5: What is the purpose of `parts_replaced` in `TicketResolveRequest`?
> **Model Answer**:  
> *"Sir, `parts_replaced` provides operational tracking of campus spare parts (e.g. MCBs, capacitors, water valves). It allows department supervisors to monitor inventory consumption across maintenance teams."*

---

## Quick Viva Summary Table

| Schema Class | Direction | Purpose | Key Validations |
| :--- | :--- | :--- | :--- |
| **`TicketStatusEnum`** | State Enum | 7 valid complaint lifecycle states | String enum constants |
| **`StatusUpdateRequest`**| Incoming (Request) | Generic status transition payload | Validates against `TicketStatusEnum` |
| **`TicketResolveRequest`**| Incoming (Request) | Technician resolution submission | `resolution_notes` min 10 chars |
| **`EscalationRequest`** | Incoming (Request) | Supervisory escalation justification | `escalation_reason` min 5 chars |
| **`SLABreachResponse`** | Outgoing (Response)| Real-time SLA breach countdown table | `remaining_seconds`, `overdue_seconds`, UTC ISO |
| **`TicketLifecycleResponse`**| Outgoing (Response)| Post-transition response envelope | Auto-populates `resolved: bool` in post-init |
