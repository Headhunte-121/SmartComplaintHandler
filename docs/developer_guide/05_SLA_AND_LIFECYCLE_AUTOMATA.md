# Section 5: SLA Deadlines & Finite State Automata (Module 5 Guide)

This guide documents the ticket lifecycle state machine: Finite State Automata (FSM) transition tables, guard conditions, deterministic SLA deadline computation with Python `timedelta`, and leak-free React countdown timers.

---

## 1. Finite State Automata (FSM) Theory & Transition Graphs

### Formal Model
A ticket lifecycle is governed by a formal Finite State Machine:
$$M = (Q, \Sigma, \delta, q_0, F)$$
* **States ($Q$):** `OPEN`, `TRIAGED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`.
* **Initial State ($q_0$):** `OPEN`.
* **Terminal State ($F$):** `CLOSED`.

```
┌──────────┐    Triage    ┌───────────┐    Dispatch   ┌───────────┐
│   OPEN   │ ───────────▶ │  TRIAGED  │ ────────────▶ │ ASSIGNED  │
└──────────┘              └───────────┘               └─────┬─────┘
                                                            │
                                                     Start  │ Work
                                                            ▼
┌──────────┐   Student    ┌───────────┐   Technician  ┌───────────┐
│  CLOSED  │ ◀─────────── │ RESOLVED  │ ◀──────────── │IN_PROGRESS│
└──────────┘   Confirms   └─────┬─────┘   Completes   └───────────┘
                                │
                                └───▶ [Dispute: Returns to IN_PROGRESS]
```

### Transition Table & Guard Conditions
In [`backend/app/services/lifecycle_fsm.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/backend/app/services/lifecycle_fsm.py):

```python
VALID_TRANSITIONS = {
    "OPEN": {"TRIAGED", "ASSIGNED"},
    "TRIAGED": {"ASSIGNED"},
    "ASSIGNED": {"IN_PROGRESS"},
    "IN_PROGRESS": {"RESOLVED"},
    "RESOLVED": {"CLOSED", "IN_PROGRESS"},  # Re-opens if student disputes resolution!
    "CLOSED": set()  # Terminal state: zero outgoing transitions
}

def validate_state_transition(current_state: str, target_state: str, resolution_notes: str = None):
    curr = current_state.upper()
    target = target_state.upper()

    # Rule 1: Transition Graph Validation
    if target not in VALID_TRANSITIONS.get(curr, set()):
        raise ValueError(f"Illegal state transition from '{curr}' to '{target}'.")

    # Rule 2: Guard Condition - Resolution requires non-empty notes
    if target == "RESOLVED":
        if not resolution_notes or len(resolution_notes.strip()) < 5:
            raise ValueError("Guard Failure: Transition to 'RESOLVED' requires detailed resolution notes.")

    return True
```

---

## 2. Deterministic SLA Deadline Computation

In [`backend/app/services/sla_engine.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/backend/app/services/sla_engine.py), SLA deadlines are computed using Python `timedelta`:

```python
from datetime import datetime, timedelta

SLA_WINDOWS = {
    "P1": timedelta(hours=4),    # Critical Hazard
    "P2": timedelta(hours=24),   # High Impact
    "P3": timedelta(hours=48),   # Standard Maintenance
    "P4": timedelta(hours=72),   # Minor / Cosmetic
}

def compute_sla_deadline(created_at: datetime, priority: str) -> datetime:
    window = SLA_WINDOWS.get(priority.upper(), timedelta(hours=48))
    return created_at + window

def is_sla_breached(deadline: datetime) -> bool:
    if not deadline:
        return False
    return datetime.utcnow() > deadline
```

---

## 3. React Countdown Timer & Preventing Browser Memory Leaks

### The Memory Leak Problem
Calling `setInterval()` inside a React component without a cleanup function causes the interval to run indefinitely in the browser background. If the user navigates away, React logs:
```
Warning: Can't perform a React state update on an unmounted component.
```

### The Solution: Interval Cleanup Hook
In [`frontend/src/components/SLACountdownTimer.jsx`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/frontend/src/components/SLACountdownTimer.jsx):

```jsx
useEffect(() => {
  const timerId = setInterval(() => {
    setTimeLeft(calculateTimeLeft());
  }, 1000);

  // CRITICAL: Cleanup function clears the interval when component unmounts
  return () => clearInterval(timerId);
}, [deadline]);
```

When the remaining duration reaches zero, the component dynamically switches from countdown mode to an animated red `SLA BREACHED` badge.
