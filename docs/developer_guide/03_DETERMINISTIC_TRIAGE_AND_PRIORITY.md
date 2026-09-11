# Section 3: Deterministic Triage & Priority Classification (Module 3 Guide)

This guide documents the automated incident triage engine: the 2D Cartesian Severity-Impact Matrix, regex emergency amplifiers, priority evaluation endpoints, real-time debounced React preview components, and semantic priority badges.

---

## 1. The 2D Cartesian Severity-Impact Matrix

### The Operational Problem: Subjective Bias
Students and staff often declare every issue to be critical ("My desk fan is broken, this is an emergency!"). To ensure fair, objective ticket handling, the platform implements the **ITIL Incident Management Cartesian Matrix**:

```
                  ┌─────────────────────────────────────────────────────────────┐
                  │                        IMPACT SCOPE                         │
                  │  CAMPUS_WIDE  │ BLOCK_BUILDING │ FLOOR_WING │ SINGLE_ROOM   │
┌─────────┬───────┼───────────────┼────────────────┼────────────┼───────────────┤
│         │CRIT.  │      P1       │       P1       │     P2     │      P2       │
│         ├───────┼───────────────┼────────────────┼────────────┼───────────────┤
│SEVERITY │HIGH   │      P1       │       P2       │     P3     │      P3       │
│  LEVEL  ├───────┼───────────────┼────────────────┼────────────┼───────────────┤
│         │MEDIUM │      P2       │       P3       │     P3     │      P4       │
│         ├───────┼───────────────┼────────────────┼────────────┼───────────────┤
│         │LOW    │      P3       │       P4       │     P4     │      P4       │
└─────────┴───────┴───────────────┴────────────────┴────────────┴───────────────┘
```

### Orthogonal Axes:
* **Severity (Degree of impairment):** Is the equipment broken, degraded, or an active hazard?
* **Impact (Radius of disruption):** Does it affect one person, a lab, a floor, or the whole campus?

---

## 2. Campus Emergency Amplifiers (Auto-Elevation to P1)

Regardless of what impact scope is selected, certain campus incidents represent immediate threats to life, structural integrity, or campus safety.

In [`backend/app/services/priority_engine.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/backend/app/services/priority_engine.py), text is scanned against safety trigger patterns:

```python
EMERGENCY_TRIGGERS = [
    r"\bgas leak\b",
    r"\bfire\b",
    r"\bsparking\b",
    r"\belectric shock\b",
    r"\bexplosion\b",
    r"\bsmoke\b",
    r"\bflooding\b",
    r"\bshort circuit\b",
    r"\bstructural collapse\b"
]

def evaluate_complaint_priority(title: str, description: str, severity: str = "MEDIUM", impact: str = "SINGLE_ROOM"):
    combined = f"{title} {description}".lower()

    # Rule 1: Emergency Pattern Match
    for pattern in EMERGENCY_TRIGGERS:
        if re.search(pattern, combined):
            return "P1", f"Emergency trigger matched '{pattern}'. Auto-elevated to P1 Critical."

    # Rule 2: 2D Matrix Lookup
    priority = PRIORITY_MATRIX.get((severity.upper(), impact.upper()), "P3")
    return priority, f"Evaluated Severity '{severity}' against Impact '{impact}'."
```

---

## 3. Real-Time Debouncing in React 18

### The Performance Problem
If a student types a 120-character description, sending an HTTP request on every single keypress floods the backend with 120 API requests in under 10 seconds.

### The Solution: `setTimeout` and Cleanup in `useEffect`
In [`frontend/src/components/LiveTriageCard.jsx`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/frontend/src/components/LiveTriageCard.jsx), we delay the API call until the user stops typing for 400 milliseconds:

```jsx
useEffect(() => {
  if ((title + description).trim().length < 5) {
    setEvaluation(null);
    return;
  }

  // Set a timer to execute after 400ms of user idle time
  const timer = setTimeout(async () => {
    try {
      const result = await apiClient.post('/priority/triage-preview', { title, description });
      setEvaluation(result);
    } catch (err) {
      console.error('Triage eval error:', err);
    }
  }, 400);

  // Cleanup: If user types another character before 400ms passes, cancel the pending timer!
  return () => clearTimeout(timer);
}, [title, description]);
```

---

## 4. Semantic Priority Badges & Color Tokens

In [`frontend/src/components/PriorityBadge.jsx`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/frontend/src/components/PriorityBadge.jsx), priority levels are rendered using standardized semantic tokens:

```jsx
const PRIORITY_STYLES = {
  P1: 'bg-red-100 text-red-800 border-red-300 font-bold',
  P2: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
  P3: 'bg-blue-100 text-blue-800 border-blue-300 font-medium',
  P4: 'bg-slate-100 text-slate-800 border-slate-300 font-normal',
};
```
This ensures visual consistency across user forms, technician queues, and administrative dashboards.
