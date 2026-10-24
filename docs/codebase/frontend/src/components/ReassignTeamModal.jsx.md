# Frontend Source Documentation: `frontend/src/components/ReassignTeamModal.jsx`

> **File Path**: `frontend/src/components/ReassignTeamModal.jsx`  
> **Role**: Administrative Squad Reassignment Dialog enforcing Mandatory Audit Logging and Queue Balancing.  
> **Target Audience**: College Viva Examiners, Evaluation Committees, System Architects, Students grounded in basic C/Python.

---

## 1. High-Level Architectural Purpose

In university facilities operations, automatic keyword or AI routing may assign a ticket to a squad that is either overloaded or lacks specific equipment (e.g., assigning a 33kV high-voltage substation breaker fault to an internal hostel lighting crew). 

`ReassignTeamModal.jsx` provides a **Controlled Supervisory Reassignment Interface**:
1. **Workload-Aware Selection**: On open, it automatically queries `fetchSquadWorkloads()`, populating the selection dropdown with every registered maintenance squad, their department division, and their current active ticket count (e.g. *"Plumbing Alpha (Estates) — Active: 4"*).
2. **Mandatory Audit Justification**: Transfers cannot be executed without recording why the change was made (minimum 5 non-whitespace characters). This explanation is permanently appended to the ticket history audit log alongside the supervisor's user credentials.
3. **Transaction Safety**: Automatically casts string form IDs to integers (`Number(selectedTeamId)`) and handles errors defensively without crashing the parent dashboard.

---

## 2. Sequential Code Breakdown & Deep Analysis

```javascript
/**
 * SmartComplaintHandler - Reassign Squad Modal
 * Blueprint Reference: V1/M4/frontend/04_reassign_modal.md
 * Role: Administrative modal allowing squad transfer with mandatory reason audit logging and dual theme styling.
 */
import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { fetchSquadWorkloads, reassignSquad } from '../api/assignment';

export default function ReassignTeamModal({ isOpen, ticket, onClose, onReassigned }) {
  const { isDark } = useTheme();
  const [squads, setSquads] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
```

### Plain-English Purpose
Imports React hooks, theme context, and API helpers for fetching squads and executing reassignments. The component tracks available squads, selected team ID, justification text, in-flight submission status, and server errors.

### Line-by-Line Breakdown
- `import { fetchSquadWorkloads, reassignSquad } from '../api/assignment'`: Client functions handling HTTP communication with backend assignment routers.
- `isOpen`: Boolean controlling modal visibility.
- `ticket`: Target incident entity.
- `onClose`: Dismissal callback.
- `onReassigned`: Completion callback returning updated ticket to parent view.

---

```javascript
  useEffect(() => {
    if (isOpen) {
      fetchSquadWorkloads()
        .then((data) => {
          setSquads(data);
          if (data.length > 0 && !selectedTeamId) {
            setSelectedTeamId(data[0].team_id);
          }
        })
        .catch(() => {});
      setReason('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !ticket) return null;
```

### Plain-English Purpose
Every time the modal opens (`isOpen === true`), it fetches the latest list of squads and their active queue counts from the backend. If squads exist, it automatically defaults the dropdown selection to the first team. It also clears previous justification text and error states. If closed or if no ticket is selected, it returns `null`.

### Line-by-Line Breakdown
- `if (isOpen)`: Executes only when the modal opens.
- `fetchSquadWorkloads()`: Network request fetching array of squad structs.
- `if (data.length > 0 && !selectedTeamId) setSelectedTeamId(data[0].team_id)`: Defensive default selection preventing empty dropdown submits.
- `if (!isOpen || !ticket) return null`: Short-circuit guard unmounting modal from the DOM.

---

```javascript
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeamId) {
      setError('Please select a target maintenance squad.');
      return;
    }
    if (reason.trim().length < 5) {
      setError('Reassignment justification must contain at least 5 characters.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await reassignSquad(ticket.id, Number(selectedTeamId), reason);
      if (onReassigned) {
        onReassigned(res);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to reassign squad.');
    } finally {
      setSubmitting(false);
    }
  };
```

### Plain-English Purpose
Validates input and dispatches the reassignment request:
1. Verifies a target squad was selected.
2. Verifies the trimmed justification contains at least 5 characters.
3. Invokes `reassignSquad(ticket.id, Number(selectedTeamId), reason)` over HTTP.
4. On success, informs the parent dashboard via `onReassigned(res)` and closes the modal.
5. On failure, catches and displays the error message.

### Line-by-Line Breakdown
- `e.preventDefault()`: Prevents browser full-page form submission.
- `Number(selectedTeamId)`: Converts HTML `<select>` string value (e.g. `"3"`) into a primitive integer (`3`) matching backend foreign key types.
- `finally { setSubmitting(false); }`: Ensures button disabled state is released even if the network fails.

---

```javascript
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in">
      <div
        className={`rounded-2xl max-w-lg w-full shadow-2xl border overflow-hidden transition-all ${
          isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100' : 'bg-[#f1f5f9] border-slate-300 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`p-6 border-b flex items-center justify-between ${
            isDark ? 'border-zinc-800 bg-[#161b22]' : 'border-slate-300 bg-[#e2e8f0]/60'
          }`}
        >
          <div>
            <span
              className={`text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border ${
                isDark
                  ? 'text-indigo-400 bg-indigo-950/60 border-indigo-800'
                  : 'text-indigo-800 bg-indigo-100 border-indigo-300'
              }`}
            >
              Supervisor Reassignment Gate
            </span>
            <h2 className={`text-base font-bold mt-1 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
              Reassign Maintenance Squad
            </h2>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Ticket: <strong className={`font-mono ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>{ticket.tracking_code}</strong> — {ticket.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            ✕
          </button>
        </div>
```

### Plain-English Purpose
Renders the semi-transparent overlay and card header. The header features an indigo "Supervisor Reassignment Gate" badge, the modal title, ticket tracking code, and a close button.

---

```javascript
        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div
              className={`p-3 rounded-xl border text-xs ${
                isDark ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-rose-100 border-rose-300 text-rose-800'
              }`}
            >
              {error}
            </div>
          )}

          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
              Select Target Maintenance Squad <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className={`w-full rounded-xl border p-2.5 text-xs focus:outline-none focus:ring-2 ${
                isDark
                  ? 'bg-[#0e1117] border-zinc-800 text-zinc-100 focus:border-emerald-500 focus:ring-emerald-500/20'
                  : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500/20'
              }`}
            >
              {squads.map((s) => (
                <option key={s.team_id} value={s.team_id}>
                  {s.team_name} ({s.department_name}) — Active: {s.active_ticket_count}
                </option>
              ))}
            </select>
          </div>
```

### Plain-English Purpose
Renders any error alert and the target squad selection dropdown. Each `<option>` displays:
- Team Name (e.g. `Electrical Team 1`)
- Department Division (e.g. `Electrical Engineering`)
- Real-time Active Queue Depth (e.g. `Active: 3`)
This information empowers supervisors to choose a squad with capacity rather than accidentally assigning to an overloaded team.

---

```javascript
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                Reason for Reassignment <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[10px] font-mono ${reason.trim().length >= 5 ? 'text-emerald-500 font-bold' : isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                {reason.trim().length}/5 chars min
              </span>
            </div>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Original squad overloaded; specialized high-voltage equipment required."
              className={`w-full rounded-xl border p-2.5 text-xs focus:outline-none focus:ring-2 resize-none ${
                isDark
                  ? 'bg-[#0e1117] border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20'
              }`}
            />
          </div>

          <div
            className={`p-4 -mx-6 -mb-6 border-t flex items-center justify-end space-x-2 ${
              isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#e2e8f0]/60 border-slate-300'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#161b22] hover:bg-zinc-800 text-zinc-300 border-zinc-700'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || reason.trim().length < 5}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {submitting ? 'Reassigning...' : 'Confirm Reassignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### Plain-English Purpose
Renders the mandatory justification box and dialog actions:
- Textarea with live character counter: turns emerald once 5 characters are typed.
- Submit button disabled if `submitting` is active or if `reason.trim().length < 5`.
- Cancel button for closing without modifications.

---

## 3. High-Frequency Viva & Technical Defense Questions

### Q1: Why does `ReassignTeamModal` fetch squad workloads on open?
**Model Answer:**  
Squad queue depth changes constantly as tickets are completed and new complaints arrive. By querying `fetchSquadWorkloads()` every time the modal opens, supervisors are presented with **real-time queue counts** for every squad in the dropdown (e.g. `Squad Alpha — Active: 8` vs `Squad Beta — Active: 1`). This prevents supervisors from transferring a ticket to a squad that is already at capacity.

### Q2: Why is the team ID converted with `Number(selectedTeamId)`?
**Model Answer:**  
HTML `<select>` elements always return option values as strings (e.g. `"4"`). However, the backend FastAPI endpoint and Pydantic schema expect an integer primary key (`target_team_id: int`). Passing a string without conversion can result in an HTTP 422 Unprocessable Entity validation error. Explicit conversion guarantees type contract compliance.

### Q3: Why is `reason.trim().length < 5` enforced on both the client and backend?
**Model Answer:**  
Enforcing a 5-character justification prevents accidental or frivolous reassignments. Client-side validation disables the submit button immediately, providing instant feedback and preventing unnecessary HTTP requests. Backend validation acts as a second line of defense, ensuring that direct API requests (e.g. via cURL or Postman) cannot bypass audit requirements.

### Q4: What happens in the database when a ticket is reassigned?
**Model Answer:**  
The backend executes an atomic database transaction:
1. Updates the `assigned_team_id` foreign key on the `tickets` table.
2. Updates `assigned_technician_id` to `NULL` (so the new squad's lead can dispatch to an available technician).
3. Inserts an immutable audit record in `ticket_history` detailing: `previous_team_id`, `new_team_id`, `changed_by_user_id`, `reason`, and `timestamp`.

### Q5: How does this modal update the parent view without a page reload?
**Model Answer:**  
Upon receiving a successful HTTP response from `reassignSquad`, the modal invokes `onReassigned(res)`. The parent dashboard (such as `AdminDashboard.jsx`) receives the updated ticket object, updates its internal tickets state array via `setTickets(prev => prev.map(...))`, and triggers a targeted React re-render. The modal then closes via `onClose()`.

---

## 4. Quick Reference Summary Table

| UI Element / Field | Type / Binding | Constraint / Validation | Purpose |
| :--- | :--- | :--- | :--- |
| **Squad Dropdown** | `<select>` | Pre-selects first squad | Displays squad name, department, & active queue count |
| **Reason Textarea** | `<textarea>` | Min 5 chars (`reason.trim().length >= 5`) | Mandatory justification for audit logging |
| **Character Counter** | Dynamic `<span>` | Green if $\ge 5$, grey if $<5$ | Visual indicator for validation compliance |
| **Confirm Button** | `<button type="submit">` | Disabled if submitting or $<5$ chars | Calls `reassignSquad(ticket.id, Number(id), reason)` |
| **Parent Callback** | `onReassigned(res)` | Executes on HTTP 200 | Updates parent ticket list without page reload |
