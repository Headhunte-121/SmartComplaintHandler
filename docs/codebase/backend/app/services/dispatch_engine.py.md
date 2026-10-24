# Comprehensive Code Walkthrough & Line-by-Line Guide: `backend/app/services/dispatch_engine.py`

> **File Location**: [`backend/app/services/dispatch_engine.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/backend/app/services/dispatch_engine.py)  
> **Prerequisites**: Basic knowledge of C or Python (functions, dictionaries, SQL aggregation `COUNT`, list sorting with lambda keys, boolean logic). No advanced queueing theory background is assumed.  
> **What this file is**: The autonomous workload balancing and maintenance squad dispatch engine. Once a complaint is classified into a department (e.g. Electrical), this engine decides **which specific physical maintenance squad** should be assigned the work order. It balances real-time squad queue depths (least-loaded queue routing), incorporates geographic proximity bias for authentic IIIT Naya Raipur campus zones (Hostel vs. Academic), and features an emergency short-circuit bypass for life-threatening `CRITICAL` incidents.

---

## Block 1: Imports & Campus Dispatch Registries (Lines 1–70)

```python
"""
SmartComplaintHandler - Workload Dispatch Engine
Blueprint Reference: V1/M4/backend/01_dispatch_engine.md
Role: Least-loaded queue balancing algorithm dispatching tickets to squads with lowest load,
      incorporating authentic IIIT Naya Raipur hostel and academic zone affinity.
"""
from typing import Dict, List, Optional
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.team import MaintenanceTeam
from app.models.department import Department
from app.models.ticket import Ticket

# Emergency rapid-response squads designated for short-circuit allocation on CRITICAL priority
EMERGENCY_SQUAD_MAP: Dict[int, str] = {
    1: "Substation High-Voltage Team",  # Department 1: Electrical Services
    2: "Water Supply Emergency Team",   # Department 2: Plumbing Services
    3: "Structural Fixtures Crew",      # Department 3: Civil & Carpentry
    4: "Network & Wi-Fi Squad",         # Department 4: IT & Infrastructure
}

# Authentic IIIT Naya Raipur campus zone affinity keyword mappings for geographic proximity bias
ZONE_AFFINITY_MAP: Dict[str, List[str]] = {
    "Hostel": [
        "hostel",
        "mess",
        "dormitory",
        "room",
        "hall",
        "ramanujan",
        "bhabha",
        "bose",
        "raman",
        "shabhari",
        "transit",
        "wing a",
        "wing b",
    ],
    "Academic": [
        "academic",
        "class",
        "hall",
        "lab",
        "department",
        "seminar",
        "library",
        "krc",
        "idealab",
        "idea lab",
        "vlsi",
        "iot",
        "131c",
        "131e",
        "e-101",
        "e-102",
        "sac",
        "mph",
    ],
}

# Ticket lifecycle statuses considered active (unresolved) in squad work queues
ACTIVE_TICKET_STATUSES: List[str] = [
    "SUBMITTED",
    "ASSIGNED",
    "IN_PROGRESS",
    "ESCALATED",
    "ON_HOLD",
]
```

### 1. Plain-English Purpose
Loads data structuring types and database tools, links ORM models (`MaintenanceTeam`, `Department`, `Ticket`), registers designated emergency rapid-response teams, maps IIIT Naya Raipur campus building landmarks to geographic zones (Hostels vs. Academic Blocks), and defines which ticket statuses constitute active pending work.

### 2. Line-by-Line Breakdown
- **Lines 1–6 (`""" ... """`)**: Module docstring citing the blueprint reference (Module 4, Section 1).
- **Line 7 (`from typing import Dict, List, Optional`)**: Python type hints.
- **Line 8 (`from sqlalchemy import func`)**: SQL aggregate functions provider (`func.count`).
- **Line 9 (`from sqlalchemy.orm import Session`)**: Database transaction session.
- **Lines 11–13 (`from app.models...`)**:
  - `MaintenanceTeam`: Squad entity (e.g. "Hostel Block-A Electricians").
  - `Department`: Parent facility division.
  - `Ticket`: Complaint database record.
- **Lines 16–21 (`EMERGENCY_SQUAD_MAP = { ... }`)**:
  - Maps numerical department IDs to specialized high-readiness emergency crews. For example, if Department 1 (Electrical) receives a `CRITICAL` fire or shock report, the system bypasses standard queue balancing and assigns it immediately to the `"Substation High-Voltage Team"`.
- **Lines 24–60 (`ZONE_AFFINITY_MAP = { ... }`)**:
  - Realistic IIIT Naya Raipur campus zoning:
    - `"Hostel"` Zone: Keywords identifying student residences (Ramanujan, Bhabha, Bose, Raman, Shabhari, Dining Mess, Wings A/B).
    - `"Academic"` Zone: Keywords identifying educational spaces (Knowledge Resource Center / KRC library, IdeaLab, VLSI and IoT labs, SAC / Student Activity Center, MPH / Multi-Purpose Hall, lecture halls E-101/102).
- **Lines 63–69 (`ACTIVE_TICKET_STATUSES = [ ... ]`)**:
  - List of unresolved statuses: `SUBMITTED`, `ASSIGNED`, `IN_PROGRESS`, `ESCALATED`, and `ON_HOLD`. `RESOLVED` and `CLOSED` tickets are finished and are excluded from queue counts.

### 3. Deep Term & Concept Expansion
- **Queue Depth**: In queueing theory, queue depth is the number of active, unprocessed jobs waiting in line for a service unit. If Squad A has 5 pending tickets and Squad B has 1 pending ticket, Squad B has a queue depth of 1 and is the "least-loaded" squad.
- **Geographic Proximity Bias**: If an electrician is stationed in the Ramanujan Hostel workshop, walking to a hostel room takes 2 minutes. Walking to the academic VLSI lab takes 15 minutes across campus. Factoring in location reduces travel fatigue and expedites repair turnaround.

### 4. Runtime Mechanics & Security
- **Configuration Immutability**: All mapping dictionaries are declared at module scope in uppercase snake_case, serving as static lookup references without per-request allocation overhead.

---

## Block 2: Zone Affinity Evaluation: `compute_zone_affinity_bonus` (Lines 72–87)

```python
def compute_zone_affinity_bonus(location: str, team_name: str) -> int:
    """
    Returns 1 if the IIIT-NR location matches the squad's zone specialization (Hostel vs Academic), else 0.
    """
    loc_lower = (location or "").lower()
    squad_name_lower = (team_name or "").lower()

    has_hostel_affinity = any(kw in loc_lower for kw in ZONE_AFFINITY_MAP["Hostel"])
    has_academic_affinity = any(kw in loc_lower for kw in ZONE_AFFINITY_MAP["Academic"])

    if has_hostel_affinity and "hostel" in squad_name_lower:
        return 1
    if has_academic_affinity and any(term in squad_name_lower for term in ["academic", "lab", "class"]):
        return 1
    return 0
```

### 1. Plain-English Purpose
Calculates whether a physical maintenance squad specializes in the same campus zone where the complaint occurred. Returns `1` (affinity bonus) if the squad matches the zone, or `0` if they do not match.

### 2. Line-by-Line Breakdown
- **Line 72 (`def compute_zone_affinity_bonus(location: str, team_name: str) -> int:`)**:
  - Inputs: `location` string (e.g. `"Ramanujan Hostel Room 204"`) and `team_name` (e.g. `"Hostel Quick-Response Plumbing"`).
- **Lines 76–77**: Converts both strings to lowercase for case-insensitive matching.
- **Lines 79–80 (`has_hostel_affinity = any(...)`, `has_academic_affinity = any(...)`)**:
  - `any(kw in loc_lower for kw in ...)`: Iterates through the zone keywords. Returns `True` as soon as any keyword is found in the location string.
- **Lines 82–85 (Bonus Match Checks)**:
  - If the location is in the hostel zone and `"hostel"` is in the squad's name $\to$ returns `1`.
  - If the location is in the academic zone and the squad's name contains `"academic"`, `"lab"`, or `"class"` $\to$ returns `1`.
- **Line 86 (`return 0`)**:
  - If no affinity matches, returns `0`.

### 3. Deep Term & Concept Expansion
- **Python `any(...)` Built-in**: Evaluates an iterable of boolean expressions and short-circuits to `True` upon finding the first true value. In C, this is equivalent to a `for` loop with `if (match) return true;`.

---

## Block 3: Optimal Squad Selection Algorithm: `select_optimal_team` (Lines 89–176)

```python
def select_optimal_team(
    db: Session,
    department_id: int,
    priority: str = "MEDIUM",
    location: str = "",
) -> Optional[MaintenanceTeam]:
    """
    Select the optimal maintenance squad using emergency short-circuiting,
    availability filtering, least-loaded queue balancing, and IIIT-NR zone affinity.

    Args:
        db: Active SQLAlchemy database session.
        department_id: Foreign key of the responsible department.
        priority: Triage priority ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW').
        location: Complaint location string for zone matching.

    Returns:
        The selected MaintenanceTeam ORM entity, or None if no active squads exist.
    """
    normalized_priority = (priority or "MEDIUM").strip().upper()

    # 1. Emergency Short-Circuit Bypass for CRITICAL safety incidents
    if normalized_priority == "CRITICAL" and department_id in EMERGENCY_SQUAD_MAP:
        emergency_name = EMERGENCY_SQUAD_MAP[department_id]
        emergency_squad = (
            db.query(MaintenanceTeam)
            .filter(
                MaintenanceTeam.department_id == department_id,
                MaintenanceTeam.name == emergency_name,
                MaintenanceTeam.is_active == True,
            )
            .first()
        )
        if emergency_squad:
            return emergency_squad

    # 2. Query all active squads belonging to the designated department
    candidates: List[MaintenanceTeam] = (
        db.query(MaintenanceTeam)
        .filter(
            MaintenanceTeam.department_id == department_id,
            MaintenanceTeam.is_active == True,
        )
        .all()
    )

    if not candidates:
        return None

    # 3. Workload Inspection: Calculate active queue depth for each candidate
    # 4. Zone Affinity Bonus: Apply preference credit if squad specialization matches IIIT-NR zone
    loc_lower = (location or "").lower()
    has_hostel_affinity = any(kw in loc_lower for kw in ZONE_AFFINITY_MAP["Hostel"])
    has_academic_affinity = any(kw in loc_lower for kw in ZONE_AFFINITY_MAP["Academic"])

    scored_candidates = []
    for squad in candidates:
        raw_queue_depth = (
            db.query(func.count(Ticket.id))
            .filter(
                Ticket.assigned_team_id == squad.id,
                Ticket.status.in_(ACTIVE_TICKET_STATUSES),
            )
            .scalar()
            or 0
        )

        effective_depth = raw_queue_depth
        squad_name_lower = squad.name.lower()

        # Apply 1-ticket zone preference credit
        if has_hostel_affinity and "hostel" in squad_name_lower:
            effective_depth -= 1
        elif has_academic_affinity and any(term in squad_name_lower for term in ["academic", "lab", "class"]):
            effective_depth -= 1

        scored_candidates.append({
            "squad": squad,
            "effective_depth": effective_depth,
            "raw_depth": raw_queue_depth,
            "id": squad.id,
        })

    # 5. Deterministic Selection: Sort by (effective_depth, id)
    scored_candidates.sort(key=lambda x: (x["effective_depth"], x["id"]))

    return scored_candidates[0]["squad"]
```

### 1. Plain-English Purpose
The heart of the automated dispatch engine. Given a department, priority, and location, it executes a 5-step decision pipeline:
1. **Emergency Short-Circuit**: If the ticket is `CRITICAL`, routes immediately to the specialized emergency squad regardless of their workload.
2. **Squad Availability Filtering**: Queries only active squads (`is_active == True`) belonging to that department.
3. **Queue Inspection**: Counts how many active, unfinished tickets are currently assigned to each candidate squad.
4. **Zone Credit**: If a squad is physically stationed in the same zone as the incident, deducts 1 ticket from their effective depth ($\text{Effective Depth} = \text{Raw Depth} - 1$).
5. **Deterministic Assignment**: Picks the squad with the lowest effective queue depth. Ties are broken deterministically by squad ID.

### 2. Line-by-Line Breakdown
- **Lines 89–94 (`def select_optimal_team(...)`)**:
  - Parameters: database session `db`, `department_id`, `priority` (default `"MEDIUM"`), and `location`.
- **Line 108 (`normalized_priority = (priority or "MEDIUM").strip().upper()`)**:
  - Normalizes string casing and whitespace.
- **Lines 111–124 (Step 1: Emergency Short-Circuit)**:
  - If priority is `"CRITICAL"` and the department has a designated emergency team in `EMERGENCY_SQUAD_MAP`:
    - Queries the database for that specific team.
    - If found and active, returns it **immediately**. Emergency life-safety issues cannot wait for standard queue balancing.
- **Lines 126–136 (Step 2: Candidate Squad Query)**:
  - Fetches all active squads (`is_active == True`) for the department.
  - If no active squads exist, returns `None` (ticket remains unassigned for supervisor triage).
- **Lines 140–142 (Zone Keyword Pre-Computation)**:
  - Computes `has_hostel_affinity` and `has_academic_affinity` once before entering the squad evaluation loop.
- **Lines 144–170 (Steps 3 & 4: Queue Depth & Affinity Loop)**:
  - For each candidate `squad`:
    - `db.query(func.count(Ticket.id)).filter(...).scalar() or 0`: Executes an SQL `COUNT` query counting active unresolved tickets for that squad.
    - `effective_depth = raw_queue_depth`: Starts with raw count.
    - If the squad has zone affinity, applies a 1-ticket credit (`effective_depth -= 1`).
    - Stores candidate metadata in `scored_candidates`.
- **Line 173 (Step 5: Sorting & Selection)**:
  - `scored_candidates.sort(key=lambda x: (x["effective_depth"], x["id"]))`:
    - Sorts candidate squads in ascending order of `effective_depth`.
    - If Squad A and Squad B both have an effective depth of 2, `x["id"]` breaks the tie deterministically (lower squad ID wins).
- **Line 175 (`return scored_candidates[0]["squad"]`)**:
  - Returns the optimal squad ORM instance at index 0.

### 3. Deep Term & Concept Expansion
- **Why Subtract 1 for Zone Credit? (`effective_depth -= 1`)**:
  - Imagine Squad A (Hostel Specialist) has 3 active tickets, and Squad B (Academic Specialist) has 2 active tickets.
  - A new complaint arrives from Ramanujan Hostel.
  - Squad A's effective depth becomes $3 - 1 = 2$.
  - Now Squad A and Squad B are tied at 2. The tie-breaker assigns it to Squad A because their physical workshop is right next to the hostel, eliminating cross-campus travel time!
- **`.scalar()` in SQLAlchemy**: When executing an aggregation like `SELECT COUNT(*)`, the database returns a single row containing a single numerical column (e.g. `(4,)`). Calling `.scalar()` unpacks that single scalar integer directly.

### 4. Runtime Mechanics & Security
- **Graceful Failure**: If all maintenance teams in a department are temporarily marked inactive (`is_active = False`), the function returns `None`. The ticket submission continues smoothly, leaving `assigned_team_id = NULL` for manual supervisory assignment rather than crashing.

---

## Block 4: Explainable Dispatch Rationale: `generate_dispatch_reason` (Lines 178–202)

```python
def generate_dispatch_reason(
    team_name: str,
    queue_depth: int,
    is_emergency: bool = False,
) -> str:
    """
    Generate an explainable diagnostic rationale string for work orders and logs.

    Args:
        team_name: Name of the assigned maintenance squad.
        queue_depth: Count of active open tickets in the squad's queue.
        is_emergency: Whether the squad was assigned via CRITICAL emergency bypass.

    Returns:
        Structured explanation string.
    """
    if is_emergency:
        return (
            f"Emergency Short-Circuit Dispatch: Allocated directly to specialized "
            f"emergency unit '{team_name}' for critical incident response."
        )
    return (
        f"Dispatched to '{team_name}': Least-loaded active squad "
        f"(Queue depth: {queue_depth} active tickets)."
    )
```

### 1. Plain-English Purpose
Generates a human-readable explanation describing *why* a specific team was assigned the ticket. This explanation is saved into the ticket's dispatch log and displayed on supervisor dashboards, providing operational transparency.

### 2. Line-by-Line Breakdown
- **Lines 178–182 (`def generate_dispatch_reason(...) -> str:`)**: Takes squad name, queue depth integer, and emergency flag.
- **Lines 194–198 (`if is_emergency: ...`)**: Returns emergency rationale string.
- **Lines 199–202 (`return f"Dispatched to '{team_name}': Least-loaded active squad..."`)**: Returns standard least-loaded queue rationale string.

---

## 5. Viva & Technical Defense Guide

> [!TIP]
> **Q1: What is the "Least-Loaded Queue" algorithm and why is it used in dispatching complaints?**  
> **Answer**: In campus facilities management, naive round-robin dispatch (assigning tickets alternately 1, 2, 1, 2...) fails because some repairs take 10 minutes while others take 3 days. A squad could be overwhelmed with 10 complex jobs while another squad sits completely idle. The Least-Loaded Queue algorithm inspects the live database count of active, unresolved tickets for each squad in real time and automatically routes new complaints to the squad with the smallest current backlog, balancing workload across the workforce.

> [!TIP]
> **Q2: What is "Emergency Short-Circuit Bypass" and when does it trigger?**  
> **Answer**: When a ticket is classified with `CRITICAL` priority (e.g. electrical fire, severe gas leak, or burst main water pipe), the standard queue balancing algorithm is bypassed. The system looks up the designated emergency unit in `EMERGENCY_SQUAD_MAP` (e.g. `"Substation High-Voltage Team"` for Electrical) and immediately allocates the ticket to them. Life-safety incidents cannot wait in a least-loaded queue.

> [!TIP]
> **Q3: How does the system incorporate geographic proximity without needing full GPS routing math?**  
> **Answer**: Via the **Zone Affinity Credit** system. The campus is partitioned into two primary operational zones: `"Hostel"` and `"Academic"`. If a complaint's location keywords match a squad's zone specialization (e.g. Ramanujan Hostel matching a Hostel squad), the engine deducts 1 ticket from their effective queue depth. This mathematical bias favors nearby squads while still routing away if the nearby squad is severely overloaded.

> [!TIP]
> **Q4: How does the dispatch engine handle ties when two squads have the exact same queue depth?**  
> **Answer**: Ties are broken deterministically by sorting on a tuple of `(effective_depth, squad.id)`. The squad with the lower primary key ID is selected. This guarantees reproducible, deterministic system behavior without random variation.

---

## 6. Quick-Reference Viva Summary Table

| Concept / Keyword | Meaning in Basic C / Python | Role in `dispatch_engine.py` |
| :--- | :--- | :--- |
| `EMERGENCY_SQUAD_MAP` | Constant lookup dictionary | Designates rapid-response units for immediate `CRITICAL` dispatch. |
| `ZONE_AFFINITY_MAP` | Landmark keyword dictionary | Partitions IIIT-NR into Hostel and Academic geographic zones. |
| `ACTIVE_TICKET_STATUSES` | Array of status strings | Defines unresolved statuses that count toward active squad queue depth. |
| Emergency Short-Circuit | `if (priority == "CRITICAL")` bypass | Allocates emergency tickets directly to specialized hazard units. |
| Queue Depth Calculation | SQL `SELECT COUNT(*)` | Queries live count of unresolved tickets per candidate squad. |
| Zone Affinity Credit | `effective_depth -= 1` | 1-ticket credit favoring squads stationed near the incident site. |
| Deterministic Tie-Breaking | Tuple sort `(depth, id)` | Selects lower squad ID if effective queue depths are equal. |
| `generate_dispatch_reason` | String formatting function | Generates explainable audit rationale explaining the dispatch decision. |
