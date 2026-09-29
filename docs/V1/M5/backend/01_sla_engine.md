# Module M5 Backend: Deterministic SLA Calculation Engine Specification

Authoritative Engineering Blueprint for `backend/app/services/sla_engine.py`.

---

## Section 1: Standard Purpose & Industry Role

### Standard Industry Role & Real-World Use Cases
In enterprise service desk platforms, IT service management (ITSM) frameworks (such as ITIL), and customer support infrastructures, a Service Level Agreement (SLA, a formalized contractual commitment specifying the maximum allowable time duration between ticket creation and verified resolution) is the primary metric of operational performance. Without an automated SLA calculation engine, support tickets languish indefinitely in unmonitored queues with no measurable accountability.

An SLA calculation engine (a deterministic computational service that converts categorical priority levels into precise, timestamped calendar deadlines and tracks real-time elapsed durations against those deadlines) provides the mathematical foundation for service commitments. It operates as a pure, stateless domain service that executes temporal arithmetic (calculations involving dates, times, durations, and timezones) to establish target resolution timestamps, evaluate breach conditions, and compute remaining time buffers.

In physical facility operations (such as university campuses, hospital networks, or municipal utilities), SLA engines enforce differentiated response tiers: life-safety hazards require immediate 4-hour intervention, while routine cosmetic repairs are allotted 72 hours.

### What WE Are Specifically Using It For in Smart Complaint Handler
In `SmartComplaintHandler`, `backend/app/services/sla_engine.py` is the authoritative temporal calculation service for all campus maintenance complaints:
1. It defines the formal institutional policy dictionary `SLA_POLICY`, mapping calculated priority levels (Module M3) to exact turnaround durations:
   - `CRITICAL`: 4 Hours (physical hazard, electrical sparking, active flooding)
   - `HIGH`: 12 Hours (major operational outage, hostel Wi-Fi drop, broken exterior door)
   - `MEDIUM`: 24 Hours (routine maintenance, classroom ceiling fan, window latch)
   - `LOW`: 72 Hours (cosmetic repairs, paint peeling, minor desk scratches)
2. It exposes `calculate_sla_deadline(created_at, priority)`: A pure function that takes a complaint creation timestamp and its priority level, adding the designated hourly duration using UTC-normalized Python `timedelta` objects to compute the immutable `sla_deadline`.
3. It exposes `calculate_time_remaining(sla_deadline, current_time)`: Computes the remaining time buffer in seconds, returns boolean breach flags, and formats human-readable countdown strings ("3h 15m remaining" or "Breached by 1h 45m").
4. It exposes `compute_sla_breach_status(sla_deadline, status, resolved_at)`: Evaluates whether an open or completed complaint is `ON_TRACK`, `APPROACHING_BREACH` (less than 20% of SLA time remaining), `BREACHED` (overdue while still open), `RESOLVED_MET` (closed within target), or `RESOLVED_BREACHED` (closed past target).

### Future AI Integration & Roadmap Hooks
In Version 2 (V2), when our platform introduces automated AI-driven operational optimization via Gemini API predictive endpoints, this engine provides:
1. Dynamic Predictive SLA Adjustment: A hybrid calculation hook allowing the SLA engine to accept an optional machine learning duration estimate from Gemini AI (e.g. evaluating active supply chain backorders for replacement plumbing valves), generating an "Estimated Completion Time" alongside the hard institutional SLA deadline.
2. Anomaly Drift Detection: A temporal comparison function that contrasts actual historical resolution durations against static SLA targets, feeding timing drift metrics into Gemini AI to recommend policy re-calibrations for specific campus buildings.
3. Zero-Latency Safety Fallback: If external AI predictive services time out or experience downtime, this deterministic engine acts as the zero-latency safety fallback, guaranteeing that every ticket receives an immediate, legally binding SLA deadline upon creation.

### How Other Components Standardly Interact with This File
1. `ticket_service.py` (Module M5 Backend) imports `calculate_sla_deadline` and invokes it during `create_ticket()` to compute and stamp `sla_deadline` onto the `Ticket` ORM model before executing the database commit.
2. `endpoints/sla.py` (Module M5 Backend) calls `compute_sla_breach_status` when filtering active breaches for the administrative monitoring queue.
3. Frontend components (`SLACountdownTimer.jsx` and `SLABreachTable.jsx`) mirror the calculation logic defined in this specification to ensure client-side timer ticks remain in perfect mathematical synchronization with backend evaluation logic.

### The Core Problem It Solves & Why It Exists
Without this engine:
- Tickets exist in the database with null deadlines, allowing urgent repairs (such as leaking water pipes) to sit unattended for weeks without triggering alarms.
- Facility managers cannot measure staff performance or identify operational bottlenecks because there is no baseline target to compare completion times against.
- Calculating remaining time using disparate client-side clocks causes timezone drift and inconsistent breach alerts between students and staff.

---

## Section 2: What Must Be in This File & Why Each Item Is Needed

### 1. Institutional SLA Policy Dictionary (`SLA_POLICY`)
* Constant Definition: An immutable dictionary mapping priority string keys to integer turnaround hours:
  - `"CRITICAL"`: `4`
  - `"HIGH"`: `12`
  - `"MEDIUM"`: `24`
  - `"LOW"`: `72`
* Fallback Policy Constant: `DEFAULT_SLA_HOURS = 24`. Used defensively if an unrecognized or malformed priority string is encountered.
* Warning Threshold Ratio: `WARNING_THRESHOLD_RATIO = 0.20` (20%). Defines the window where a ticket enters `APPROACHING_BREACH` state (e.g. when less than 48 minutes remain on a 4-hour critical ticket).

### 2. `calculate_sla_deadline(created_at, priority)` Function Specification
* Function Signature: `def calculate_sla_deadline(created_at: datetime, priority: str) -> datetime`
* Input Sanitization:
  - Verifies that `created_at` is an instance of Python's `datetime.datetime`. If a naive datetime is passed, it is explicitly normalized to UTC.
  - Normalizes `priority`: Strips whitespace and converts to uppercase (`priority.strip().upper()`).
* Duration Resolution: Looks up the turnaround hours from `SLA_POLICY`. If the key is not found, logs a warning and applies `DEFAULT_SLA_HOURS`.
* Temporal Addition: Constructs a `datetime.timedelta(hours=turnaround_hours)` and computes:
  `sla_deadline = created_at + timedelta(hours=turnaround_hours)`
* Return Value: Returns the calculated target resolution `datetime` object in UTC timezone.

### 3. `calculate_time_remaining(sla_deadline, current_time)` Function Specification
* Function Signature: `def calculate_time_remaining(sla_deadline: datetime, current_time: datetime | None = None) -> dict`
* Reference Clock Resolution: If `current_time` is `None`, defaults to `datetime.now(timezone.utc)` (or `datetime.utcnow()`).
* Temporal Difference Calculation:
  `delta = sla_deadline - current_time`
  `total_seconds = delta.total_seconds()`
* Output Fields Dictionary:
  - `remaining_seconds`: Float representing seconds remaining (negative if overdue).
  - `is_breached`: Boolean. `True` if `total_seconds < 0`, otherwise `False`.
  - `hours`: Absolute integer hours: `int(abs(total_seconds) // 3600)`.
  - `minutes`: Absolute integer minutes: `int((abs(total_seconds) % 3600) // 60)`.
  - `formatted_string`: Human-readable display text:
    - If not breached: `"{hours}h {minutes}m remaining"`
    - If breached: `"Breached by {hours}h {minutes}m"`

### 4. `compute_sla_breach_status(sla_deadline, status, resolved_at)` Function Specification
* Function Signature: `def compute_sla_breach_status(sla_deadline: datetime, status: str, resolved_at: datetime | None = None) -> str`
* Status Evaluation Logic:
  - Terminal Resolved State (`status in ["RESOLVED", "CLOSED"]`):
    - If `resolved_at` is populated and `resolved_at <= sla_deadline`: Returns `"RESOLVED_MET"`.
    - If `resolved_at` is populated and `resolved_at > sla_deadline`: Returns `"RESOLVED_BREACHED"`.
    - If `resolved_at` is null (defensive check): Returns `"RESOLVED_MET"`.
  - Terminal Cancelled State (`status == "CANCELLED"`):
    - Returns `"CANCELLED"`.
  - Active Unresolved State (`status in ["SUBMITTED", "IN_PROGRESS", "ESCALATED"]`):
    - Compares `current_time` against `sla_deadline`.
    - If `current_time > sla_deadline`: Returns `"BREACHED"`.
    - Computes total SLA duration and remaining duration. If `remaining_seconds / total_duration_seconds < WARNING_THRESHOLD_RATIO`: Returns `"APPROACHING_BREACH"`.
    - Otherwise: Returns `"ON_TRACK"`.

---

## Section 3: Component Life-Cycle: Input, Process, Output (IPO Table)

| Life-Cycle Phase | Primary Input | Internal Transformation & Logic | Final Output |
| :--- | :--- | :--- | :--- |
| **1. Complaint Ingestion** | `created_at = 2026-09-11 10:00:00 UTC`, `priority = 'CRITICAL'` | Looks up `SLA_POLICY['CRITICAL'] = 4`; adds 4 hours via `timedelta(hours=4)`. | `sla_deadline = 2026-09-11 14:00:00 UTC` committed to SQLite. |
| **2. Active Countdown Query** | `sla_deadline = 14:00:00`, `current_time = 12:30:00` | Difference is `+5400` seconds; computes 1 hour and 30 minutes remaining; `is_breached = False`. | `{ remaining_seconds: 5400, is_breached: false, formatted_string: '1h 30m remaining' }`. |
| **3. Warning Evaluation** | Remaining time = 40 minutes on 4-hour ticket | Calculates `40m / 240m = 0.166` (16.6%); detects ratio is `< 0.20`. | Returns status `"APPROACHING_BREACH"`; triggers visual amber alert in UI. |
| **4. Overdue Detection** | `sla_deadline = 14:00:00`, `current_time = 15:15:00` | Difference is `-4500` seconds; `is_breached = True`; computes 1 hour 15 minutes overdue. | Returns status `"BREACHED"`; formatted string `"Breached by 1h 15m"`. |
| **5. Closure Evaluation** | `sla_deadline = 14:00:00`, `resolved_at = 13:45:00` | Inspects `resolved_at <= sla_deadline`; confirms repair was completed 15 minutes before deadline. | Final status stamped as `"RESOLVED_MET"`; SLA compliance recorded in audit metrics. |

---

## Section 4: Flexibility & Modification Guide

### 🟢 Safe to Modify & Customize
* **SLA Duration Values**: You may safely adjust the turnaround hours in `SLA_POLICY` (e.g. changing `MEDIUM` from `24` to `36` hours, or `LOW` from `72` to `48` hours) to match specific campus administrative commitments without altering any mathematical logic.
* **Warning Threshold Ratio**: You can modify `WARNING_THRESHOLD_RATIO` from `0.20` to `0.25` (25%) or `0.15` (15%) to adjust when the dashboard triggers early breach warnings.
* **Formatted String Phrasing**: You may adjust the string template in `calculate_time_remaining` (e.g. changing `"Breached by Xh Ym"` to `"Overdue: Xh Ym"`).

### 🔴 Strict Non-Negotiables (Do NOT Alter)
* **UTC Timezone Enforcement**: All calculations must operate strictly in UTC (`timezone.utc` or `datetime.utcnow()`). Mixing naive local time with UTC timestamps will produce multi-hour calculation errors, causing false breach alerts.
* **Mathematical Invariance**: `calculate_sla_deadline` must remain a pure function with zero side effects. It must never perform database I/O or mutate input objects; it only calculates and returns the destination timestamp.
* **Priority String Case Normalization**: Always invoke `.strip().upper()` before querying `SLA_POLICY`. Omitting this will cause lowercase strings like `'critical'` to fail lookup and fall back to the generic 24-hour default.

---

## Section 5: Architectural & Theoretical References

This specification operates strictly as an **implementation and integration blueprint**. For the exhaustive computer science fundamentals, language runtime mechanics, and protocol specifications governing this component, consult the following authoritative manuals in the **Developer Guide Suite**:

* [**Unit 00A: Data Structures, Algorithms & Complexity**](../../../developer_guide/00A_DATA_STRUCTURES_ALGORITHMS_AND_COMPLEXITY.md)  
  Algorithmic time and space complexity ($O(N)$, $O(1)$), hash tables, and priority sorting queues.

* [**Unit 03C: Regular Expressions & Automata Theory**](../../../developer_guide/03C_REGULAR_EXPRESSIONS_AND_AUTOMATA_THEORY.md)  
  Chomsky Type 3 regular languages, Deterministic Finite Automata (DFA), word boundaries (`\b`), and linear matching engines.

* [**Unit 21B: Cryptographic Mathematics, Encoding & Hashing**](../../../developer_guide/21B_CRYPTOGRAPHIC_MATHEMATICS_ENCODING_AND_HASHING.md)  
  Shannon entropy, high-entropy cryptographic randomness (`secrets`), and collision-resistant identifier generation.

---

---

## Section 6: Definition of Done & Live Website Verification

### What This File Is Responsible For
This Python module (`backend/app/services/sla_engine.py`) is responsible for **calculating deterministic Service Level Agreement (SLA) target resolution dates and evaluating operational deadline breaches**. It turns institutional facilities policy into precise UTC timestamps and monitors whether grievances are resolved on time.

### What It Should Perform
When evaluating ticket timeliness, this module performs the following operations:
1. **Target SLA Calculation:** Computes `target_resolution_date` based on priority:
   * **`CRITICAL`:** `created_at + 2 Hours` (or 4 Hours max).
   * **`HIGH`:** `created_at + 6 Hours` (or 12 Hours max).
   * **`MEDIUM`:** `created_at + 24 Hours`.
   * **`LOW`:** `created_at + 48 Hours` (or 72 Hours max).
2. **Breach Determination:** Evaluates `datetime.utcnow() > target_resolution_date` for unresolved tickets, calculating exact overdue seconds.
3. **SLA Recalculation on Override:** Recalculates the target resolution deadline when a supervisor modifies ticket priority, preserving fair countdown clocks.

### How to See It Performing Its Job on the Live Website
1. Open **`http://localhost:5173/track`** and enter a tracking code for a newly submitted ticket.
2. **Observe SLA Engine Live:**
   * Notice the **Resolution Deadline** displayed on the tracking card (e.g. `Target: Today at 4:30 PM (in 2 hours)`).
   * Notice the live SLA countdown timer ticking down the remaining time.
3. Open `http://localhost:8000/docs` and execute `GET /api/v1/tickets/breaches`:
   * Observe the JSON list of tickets that have exceeded their target resolution timestamp.
