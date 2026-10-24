# Comprehensive Code Walkthrough & Line-by-Line Guide: `backend/app/services/sla_engine.py`

> **File Location**: [`backend/app/services/sla_engine.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/backend/app/services/sla_engine.py)  
> **Prerequisites**: Basic knowledge of C or Python (functions, integers/floats, datetime math with timestamps, if/elif/else branching). No specialized temporal database background is assumed.  
> **What this file is**: The Service Level Agreement (SLA) deadline and telemetry engine. It translates priority tiers (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) into legal resolution deadlines (2h, 8h, 24h, 72h), calculates remaining signed seconds, detects overdue breaches, normalizes all timestamps to timezone-aware UTC, and produces operational status alerts (`HEALTHY`, `WARNING`, `BREACHED`) for dashboard countdown timers.

---

## Block 1: Imports & Authoritative SLA Policy Registries (Lines 1–20)

```python
"""
SmartComplaintHandler - SLA Deadline Engine
Blueprint Reference: V1/M5/backend/01_sla_engine.md
Role: Calculates resolution deadlines from priority commitments (4h, 12h, 24h, 72h).
"""
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

# Authoritative SLA duration commitments in hours by priority tier
SLA_POLICIES: Dict[str, int] = {
    "CRITICAL": 2,   # 2 Hours: Life safety, severe structural or complete electrical/water failure
    "HIGH": 8,       # 8 Hours: Major utility outage or room-level impediment
    "MEDIUM": 24,    # 24 Hours: Routine physical repairs, single socket, leaking tap
    "LOW": 72,       # 72 Hours: Cosmetic imperfections, minor furniture adjustments
}

DEFAULT_SLA_HOURS: int = 24
DEFAULT_WARNING_THRESHOLD_RATIO: float = 0.20  # Warning trigger when <= 20% of SLA time remains
```

### 1. Plain-English Purpose
Imports standard temporal arithmetic classes (`datetime`, `timedelta`, `timezone`), defines the university's institutional turnaround commitments (in hours) for each priority tier, establishes a 24-hour default fallback, and configures the 20% warning threshold ratio.

### 2. Line-by-Line Breakdown
- **Lines 1–5 (`""" ... """`)**: Module docstring citing Blueprint Reference Module 5 (`01_sla_engine.md`).
- **Line 6 (`from datetime import datetime, timedelta, timezone`)**:
  - `datetime`: Represents a specific point in time (year, month, day, hour, minute, second).
  - `timedelta`: Represents a duration or difference between two points in time (e.g. adding 2 hours).
  - `timezone`: Enables timezone-aware temporal calculations, preventing bugs caused by daylight saving time or server location differences.
- **Line 7 (`from typing import Any, Dict, Optional`)**: Python type hints.
- **Lines 10–15 (`SLA_POLICIES = { ... }`)**:
  - `CRITICAL`: **2 Hours**. Reserved for life-safety emergencies (fires, gas leaks, electrical sparking).
  - `HIGH`: **8 Hours**. Major utility failures (blackouts, broken locks, no water).
  - `MEDIUM`: **24 Hours**. Standard repairs (single leaking tap, fan regulator loose).
  - `LOW`: **72 Hours**. Cosmetic or minor imperfections (scratched paint, loose screws).
- **Line 17 (`DEFAULT_SLA_HOURS = 24`)**: Fallback turnaround time if an unknown priority string is encountered.
- **Line 18 (`DEFAULT_WARNING_THRESHOLD_RATIO = 0.20`)**:
  - Defines the threshold at which a ticket changes from green (`HEALTHY`) to amber (`WARNING`). If less than 20% of the total SLA time budget remains, alert banners appear on technician workstation screens.

### 3. Deep Term & Concept Expansion
- **What is an SLA (Service Level Agreement)?**: A formal contractual commitment between a service provider (campus facilities management) and the end user (students/faculty) specifying the maximum acceptable timeframe to resolve an issue.
- **Timezone Awareness vs. Naive Datetimes**:
  - A "naive" datetime has no timezone attached (e.g. `2026-10-24 16:00:00`). If the backend runs on a server set to UTC and the database operates in Indian Standard Time (IST, UTC+5:30), naive subtractions will be off by 5 hours and 30 minutes!
  - Timezone-aware datetimes store the exact UTC offset, guaranteeing mathematical consistency across international servers and local client browsers.

### 4. Runtime Mechanics & Security
- **Immutability of Policy Dictionary**: `SLA_POLICIES` is declared at module level. The numbers are integer literals, ensuring $O(1)$ dictionary lookups without dynamic allocation overhead.

---

## Block 2: Timezone Normalization Helper: `_ensure_utc` (Lines 21–26)

```python
def _ensure_utc(dt: datetime) -> datetime:
    """Normalize datetime to timezone-aware UTC."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)
```

### 1. Plain-English Purpose
Guarantees that any timestamp processed by the system is converted into a standard timezone-aware UTC object. If a naive datetime is passed, it attaches the `timezone.utc` metadata; if an already-aware datetime is passed, it converts it to the UTC standard.

### 2. Line-by-Line Breakdown
- **Line 21 (`def _ensure_utc(dt: datetime) -> datetime:`)**: Internal helper taking and returning a `datetime`.
- **Line 23 (`if dt.tzinfo is None: return dt.replace(tzinfo=timezone.utc)`)**:
  - Checks if `dt` is a naive timestamp without timezone data (`dt.tzinfo is None`).
  - If naive, attaches UTC timezone metadata directly without shifting the numerical clock hours.
- **Line 25 (`return dt.astimezone(timezone.utc)`)**:
  - If `dt` already possesses timezone information (such as IST or EST), `.astimezone(timezone.utc)` mathematically shifts the clock digits to standard Coordinated Universal Time (UTC).

---

## Block 3: Deadline Calculation: `calculate_sla_deadline` (Lines 28–45)

```python
def calculate_sla_deadline(
    created_at: datetime,
    priority: str,
    custom_hours: Optional[float] = None
) -> datetime:
    """
    Calculate the contractual resolution deadline timestamp from intake time and priority.
    If custom_hours (e.g. from dynamic AI triage) is provided and positive, it uses that duration.
    Otherwise falls back to the authoritative SLA_POLICIES duration commitment.
    """
    normalized_created_at = _ensure_utc(created_at)
    if custom_hours is not None and custom_hours > 0:
        return normalized_created_at + timedelta(hours=float(custom_hours))

    normalized_priority = (priority or "MEDIUM").strip().upper()
    duration_hours = SLA_POLICIES.get(normalized_priority, DEFAULT_SLA_HOURS)
    return normalized_created_at + timedelta(hours=duration_hours)
```

### 1. Plain-English Purpose
Computes the exact deadline timestamp when an incident must be resolved. It takes the complaint creation timestamp and adds the allowed hours based on the priority tier (e.g. `created_at + 2 hours` for `CRITICAL`). If an AI triage service provides a custom granular deadline (e.g. `1.5` hours), it supports that custom duration.

### 2. Line-by-Line Breakdown
- **Lines 28–32 (`def calculate_sla_deadline(...)`)**:
  - `created_at: datetime`: The creation timestamp of the ticket.
  - `priority: str`: Priority string (e.g. `"CRITICAL"`).
  - `custom_hours: Optional[float] = None`: Optional dynamic duration.
- **Line 38 (`normalized_created_at = _ensure_utc(created_at)`)**: Normalizes input to UTC.
- **Lines 39–40 (Dynamic Custom Hours Branch)**:
  - If `custom_hours` is supplied and positive, calculates deadline via `timedelta(hours=float(custom_hours))`.
- **Line 42 (`normalized_priority = (priority or "MEDIUM").strip().upper()`)**: Cleans input string.
- **Line 43 (`duration_hours = SLA_POLICIES.get(normalized_priority, DEFAULT_SLA_HOURS)`)**:
  - Looks up duration in `SLA_POLICIES`. If priority is unrecognized, safely falls back to `DEFAULT_SLA_HOURS` (24).
- **Line 44 (`return normalized_created_at + timedelta(hours=duration_hours)`)**:
  - Adds the duration to the creation timestamp and returns the resulting deadline `datetime`.

### 3. Deep Term & Concept Expansion
- **`timedelta` Arithmetic in Python**:
  - In C, calculating future dates requires converting times to 64-bit epoch seconds (`time_t`), adding $3600 \times \text{hours}$, and converting back with `gmtime()`.
  - In Python, `datetime + timedelta(hours=2)` handles all leap years, month boundaries, and daylight changes automatically.

---

## Block 4: Remaining Seconds & Breach Checkers (Lines 47–82)

```python
def calculate_sla_remaining_seconds(
    sla_deadline: datetime,
    current_time: Optional[datetime] = None
) -> int:
    """
    Calculate signed seconds remaining until the SLA deadline.
    Returns a positive integer if remaining, or negative if overdue.
    
    Args:
        sla_deadline: The contractual deadline timestamp.
        current_time: Reference timestamp (defaults to current UTC time).
        
    Returns:
        Integer signed seconds (positive = remaining, negative = overdue).
    """
    normalized_deadline = _ensure_utc(sla_deadline)
    ref_time = _ensure_utc(current_time) if current_time else datetime.now(timezone.utc)
    return int((normalized_deadline - ref_time).total_seconds())


def is_sla_breached(
    sla_deadline: datetime,
    current_time: Optional[datetime] = None
) -> bool:
    """
    Determine if the current time has passed the contractual SLA deadline.
    
    Args:
        sla_deadline: The contractual deadline timestamp.
        current_time: Reference timestamp (defaults to current UTC time).
        
    Returns:
        True if current time exceeds deadline, False otherwise.
    """
    return calculate_sla_remaining_seconds(sla_deadline, current_time) < 0
```

### 1. Plain-English Purpose
Calculates the remaining time until the deadline in seconds as a signed integer. If the deadline is in the future, the number is positive (e.g. `+3600` seconds = 1 hour remaining). If the deadline has already passed, the number is negative (e.g. `-1800` seconds = 30 minutes overdue). `is_sla_breached` checks if this value is negative.

### 2. Line-by-Line Breakdown
- **Line 47 (`def calculate_sla_remaining_seconds(...) -> int:`)**:
  - Accepts `sla_deadline` and an optional `current_time` (defaults to `datetime.now(timezone.utc)` if omitted).
- **Line 62–63**: Normalizes both timestamps to UTC.
- **Line 64 (`return int((normalized_deadline - ref_time).total_seconds())`)**:
  - Subtracts `ref_time` from `normalized_deadline`.
  - `.total_seconds()` converts the resulting duration into a floating-point number of seconds.
  - `int(...)` casts the result to a signed integer.
- **Line 67 (`def is_sla_breached(...) -> bool:`)**:
  - Returns `True` if `calculate_sla_remaining_seconds < 0`, otherwise `False`.

### 3. Deep Term & Concept Expansion
- **Why Accept an Optional `current_time` Parameter?**: In production, `current_time` is omitted and defaults to `now()`. In automated unit testing, accepting an explicit `current_time` allows developers to test simulated future scenarios (e.g. *"What happens 3 hours from now?"*) deterministically without freezing or manipulating the operating system clock.

---

## Block 5: Comprehensive SLA Telemetry: `get_sla_status` (Lines 84–133)

```python
def get_sla_status(
    sla_deadline: datetime,
    priority: str,
    current_time: Optional[datetime] = None,
    warning_threshold_ratio: float = DEFAULT_WARNING_THRESHOLD_RATIO
) -> Dict[str, Any]:
    """
    Calculate comprehensive SLA operational telemetry for dashboards and alerts.
    
    Args:
        sla_deadline: The contractual deadline timestamp.
        priority: Priority tier of the ticket.
        current_time: Reference timestamp (defaults to current UTC time).
        warning_threshold_ratio: Ratio of total duration triggering warning tier.
        
    Returns:
        Dictionary containing status ('HEALTHY', 'WARNING', 'BREACHED'),
        remaining_seconds, overdue_seconds, is_breached, deadline, and priority.
    """
    normalized_deadline = _ensure_utc(sla_deadline)
    ref_time = _ensure_utc(current_time) if current_time else datetime.now(timezone.utc)
    normalized_priority = (priority or "MEDIUM").strip().upper()
    
    total_allocated_hours = SLA_POLICIES.get(normalized_priority, DEFAULT_SLA_HOURS)
    total_allocated_seconds = total_allocated_hours * 3600
    
    raw_remaining_seconds = calculate_sla_remaining_seconds(normalized_deadline, ref_time)
    is_breached = raw_remaining_seconds < 0
    
    if is_breached:
        status = "BREACHED"
        overdue_seconds = abs(raw_remaining_seconds)
        remaining_seconds = 0
    elif raw_remaining_seconds <= total_allocated_seconds * warning_threshold_ratio:
        status = "WARNING"
        overdue_seconds = 0
        remaining_seconds = raw_remaining_seconds
    else:
        status = "HEALTHY"
        overdue_seconds = 0
        remaining_seconds = raw_remaining_seconds
        
    return {
        "status": status,
        "remaining_seconds": remaining_seconds,
        "overdue_seconds": overdue_seconds,
        "is_breached": is_breached,
        "deadline": normalized_deadline,
        "priority": normalized_priority,
    }
```

### 1. Plain-English Purpose
The master telemetry compiler for countdown badges and supervisor dashboards. It categorizes every ticket into one of three operational health states:
- `"BREACHED"`: The deadline has expired ($\text{Remaining} < 0$).
- `"WARNING"`: The ticket has $\le 20\%$ of its allotted time budget remaining.
- `"HEALTHY"`: The ticket has $> 20\%$ of its time budget remaining.
It returns clean non-negative integers for both `remaining_seconds` and `overdue_seconds`.

### 2. Line-by-Line Breakdown
- **Lines 103–105**: Normalizes deadline, reference time, and priority string.
- **Lines 107–108**: Looks up total hours and converts to seconds:
  $$\text{Total Seconds} = \text{Total Hours} \times 3600$$
- **Line 110 (`raw_remaining_seconds = calculate_sla_remaining_seconds(...)`)**: Calculates signed difference in seconds.
- **Line 111 (`is_breached = raw_remaining_seconds < 0`)**: Boolean breach flag.
- **Lines 113–124 (Status Classification Branching)**:
  - **If breached**: Sets `status = "BREACHED"`, calculates `overdue_seconds = abs(raw_remaining_seconds)`, and zeroes out `remaining_seconds = 0`.
  - **Else if $\le 20\%$ remaining** (`raw_remaining_seconds <= total_allocated_seconds * 0.20`): Sets `status = "WARNING"`.
  - **Else**: Sets `status = "HEALTHY"`.
- **Lines 126–133 (`return { ... }`)**: Returns the telemetry dictionary consumed by frontend countdown components.

### 3. Deep Term & Concept Expansion
- **`abs(...)` (Absolute Value)**: If `raw_remaining_seconds` is `-900` (15 minutes overdue), `abs(-900)` returns `900`. The frontend can display: `"Overdue by 15 minutes"` without awkward negative numbers.

### 4. Runtime Mechanics & Security
- **Pure Mathematical Execution**: All operations are integer and float arithmetic executed entirely in CPU registers ($O(1)$ time complexity, sub-microsecond latency).

---

## 6. Viva & Technical Defense Guide

> [!TIP]
> **Q1: What are the exact SLA commitments for each priority tier in SmartComplaintHandler?**  
> **Answer**: The commitments configured in `SLA_POLICIES` are:
> - `CRITICAL`: **2 Hours** (Life-safety emergencies, fires, live electrical wires).
> - `HIGH`: **8 Hours** (Major disruptions, campus blackouts, broken locks, no water).
> - `MEDIUM`: **24 Hours** (Standard repairs, leaking taps, fan regulators).
> - `LOW`: **72 Hours** (Cosmetic imperfections, minor furniture adjustments).

> [!TIP]
> **Q2: Why are all timestamps normalized to timezone-aware UTC via `_ensure_utc`?**  
> **Answer**: In a client-server architecture, the database server, backend API worker, and client web browser may all operate in different timezones (e.g. UTC on cloud servers, IST for students). Naive timestamps without timezone data lead to subtraction errors of 5.5 hours. Converting all timestamps to timezone-aware UTC ensures mathematical precision across all machines.

> [!TIP]
> **Q3: How does the system determine when to show an amber "WARNING" badge on a ticket?**  
> **Answer**: In `get_sla_status`, the warning tier is triggered when the remaining time is less than or equal to 20% of the total allocated duration:
> $$\text{Remaining Seconds} \le \text{Total Allocated Seconds} \times 0.20$$
> For a `MEDIUM` ticket (24 hours = 86,400 seconds), the warning threshold triggers when remaining time drops below $24 \times 0.20 = 4.8\text{ hours}$.

> [!TIP]
> **Q4: Why does `get_sla_status` separate `remaining_seconds` and `overdue_seconds` instead of returning one signed number?**  
> **Answer**: It simplifies frontend rendering and prevents negative time display glitches. When a ticket breaches, `remaining_seconds` is clamped to 0, and `overdue_seconds` provides a positive duration representing how long the ticket has been overdue. Frontend UI components can directly render `"Overdue by 2h 15m"` without writing complex client-side sign-flipping logic.

---

## 7. Quick-Reference Viva Summary Table

| Concept / Keyword | Meaning in Basic C / Python | Role in `sla_engine.py` |
| :--- | :--- | :--- |
| `SLA_POLICIES` | Constant lookup dictionary | Authoritative hours: CRITICAL (2h), HIGH (8h), MEDIUM (24h), LOW (72h). |
| `DEFAULT_SLA_HOURS = 24` | Fallback constant | Default turnaround used when an invalid priority is supplied. |
| `_ensure_utc(dt)` | Normalization helper | Ensures timestamps are timezone-aware UTC objects. |
| `calculate_sla_deadline` | Temporal addition function | Adds priority duration hours to intake time (`created_at + timedelta`). |
| `calculate_sla_remaining_seconds` | Signed duration function | Returns positive seconds remaining or negative seconds overdue. |
| `is_sla_breached` | Boolean check function | Returns `True` if current time has passed the contractual deadline. |
| `get_sla_status` | Telemetry compiler | Categorizes tickets into `HEALTHY`, `WARNING`, or `BREACHED`. |
| Warning Threshold 0.20 | Percentage boundary | Triggers warning tier when $\le 20\%$ of time budget remains. |
| `abs(raw_remaining_seconds)` | Absolute value | Converts negative overdue seconds into a positive overdue duration. |
