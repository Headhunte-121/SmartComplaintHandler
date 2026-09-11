# Section 4: Workload Dispatch & Queue Balancing (Module 4 Guide)

This guide documents the automated squad dispatch engine: greedy lowest-load heuristics, transaction concurrency controls, atomic counter updates, and administrative capacity visualizers.

---

## 1. Multi-Server Queue Balancing & The Greedy Heuristic

### The Operational Challenge
In a multi-squad campus maintenance department (e.g. Electrical Squad Alpha vs. Electrical Squad Beta), unmanaged dispatch leads to extreme workload skew — one squad receives 15 jobs while another sits completely idle.

### The Algorithm: Greedy Lowest-Active-Load with Deterministic Tie-Breaking
In [`backend/app/services/team_service.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/backend/app/services/team_service.py):

```
Incoming Ticket (Department: Electrical)
                 │
                 ▼
     Query Electrical Squads:
     ┌────────────────────────────────────────────────────────┐
     │ Squad A (active: 4)  |  Squad B (active: 1)  | Squad C │ (active: 6)
     └────────────────────────────────────────────────────────┘
                 │
                 ▼
     Greedy Heuristic: min(teams, key=lambda t: (t.active_ticket_count, t.id))
                 │
                 ▼
     ASSIGNED TO: Squad B (active count atomically becomes 2)
```

Adding `t.id` as a secondary sort key guarantees that if two squads have the exact same active ticket count (e.g. both have 0), the algorithm makes a 100% deterministic decision rather than depending on arbitrary database row ordering.

---

## 2. Concurrency & Atomic Counter Updates

### The Lost Update Problem
If two students submit complaints at the exact same millisecond:
1. Thread 1 reads `Squad A active_count = 3`.
2. Thread 2 reads `Squad A active_count = 3`.
3. Thread 1 calculates $3 + 1 = 4$ and commits.
4. Thread 2 calculates $3 + 1 = 4$ and commits.
5. **The Bug:** Two tickets were assigned, but the count only incremented once!

### Atomic Transaction Isolation
To prevent lost updates:
* We encapsulate assignment and counter increment inside a single SQLAlchemy transaction:
  ```python
  ticket.assigned_team_id = target_team.id
  ticket.status = "ASSIGNED"
  target_team.active_ticket_count += 1
  db.commit()  # Atomically commits both changes simultaneously
  ```

---

## 3. Reassignment Mechanics & Capacity Auditing

When a supervisor reassigns a ticket from Squad 1 to Squad 2:
1. Old squad's counter decrements: `old_team.active_ticket_count = max(0, old_team.active_ticket_count - 1)`.
2. New squad's counter increments: `new_team.active_ticket_count += 1`.
3. Ticket's `assigned_team_id` is updated.
4. An audit note is appended to `ticket.resolution_notes`:
   ```python
   ticket.resolution_notes = (ticket.resolution_notes or "") + f"\n[Reassigned to {new_team.name}]: {reason}"
   ```

---

## 4. Admin Workload Grid & Capacity Visualizers in React

In [`frontend/src/pages/AdminDashboard.jsx`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/frontend/src/pages/AdminDashboard.jsx), squad capacity is visualized using dynamic percentage bars:

```jsx
const utilizationPct = Math.min((team.active_ticket_count / 10) * 100, 100);
const barColor = utilizationPct > 80 ? 'bg-red-500' : utilizationPct > 50 ? 'bg-amber-500' : 'bg-blue-500';

return (
  <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
    <p className="font-semibold text-slate-800">{team.name}</p>
    <div className="flex justify-between text-xs text-slate-500 mt-2 mb-1">
      <span>Active Load</span>
      <span className="font-bold">{team.active_ticket_count} tickets</span>
    </div>
    <div className="w-full bg-slate-100 rounded-full h-2">
      <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${utilizationPct}%` }}></div>
    </div>
  </div>
);
```
