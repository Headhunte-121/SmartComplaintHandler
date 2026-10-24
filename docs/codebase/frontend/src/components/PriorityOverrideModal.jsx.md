# Frontend Source Documentation: `frontend/src/components/PriorityOverrideModal.jsx`

> **File Path**: `frontend/src/components/PriorityOverrideModal.jsx`  
> **Role**: Controlled Human-in-the-Loop Supervisory Dialog enforcing Mandatory Justification and Institutional Audit Trails for Priority Escalations.  
> **Target Audience**: College Viva Examiners, Evaluation Committees, Security Auditors, Students grounded in basic C/Python.

---

## 1. High-Level Architectural Purpose

While machine learning classifiers and keyword engines automate ticket triage at scale, automated algorithms cannot foresee every real-world nuance. For example, a student complaint stating *"Water pipe dripping in Server Room B"* might be classified as a routine `MEDIUM` plumbing issue by text classification. However, a facility supervisor realizes that Server Room B houses the campus core switches and high-voltage UPS batteries—making this an emergency `CRITICAL` hazard.

`PriorityOverrideModal.jsx` provides a **Controlled Human-in-the-Loop Override Dialog**:
1. **Prevents Silent or Arbitrary Modifications**: In an enterprise system, priority changes alter contractual SLA resolution clocks and affect technician performance metrics. Therefore, changing priority requires a **mandatory justification of at least 5 characters**.
2. **Permanent Audit Trail Commitment**: The reason entered by the supervisor is sent to the backend and recorded permanently in the ticket's history log alongside the supervisor's user ID and timestamp.
3. **Strict Validation Latch (`canSubmit`)**: The submit button remains disabled until three criteria are met:
   - A *different* priority tier is selected (`newPriority !== currentPriority`).
   - The justification has at least 5 non-whitespace characters (`cleanReason.length >= 5`).
   - No request is currently in-flight (`!submitting`).
4. **Modal Ergonomics & Keyboard Accessibility**: Supports `Escape` key dismissal, backdrop blur click guards, and accessible ARIA dialog roles (`role="dialog"`, `aria-modal="true"`).

---

## 2. Sequential Code Breakdown & Deep Analysis

```javascript
/**
 * SmartComplaintHandler - Administrative Priority Override Modal
 * Blueprint Reference: docs/V1/M3/frontend/04_priority_override_modal.md
 * Role: Controlled human-in-the-loop supervisor dialog requiring mandatory 5-character justification
 *       for institutional audit trail logging before modifying priority tiers.
 */
import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { overrideTicketPriority } from '../api/triage';
import PriorityBadge from './PriorityBadge';

const PRIORITY_OPTIONS = [
  { value: 'CRITICAL', label: 'CRITICAL (2-Hour SLA)', desc: 'Severe facility failure or urgent safety defect' },
  { value: 'HIGH', label: 'HIGH (8-Hour SLA)', desc: 'Major room or lab disruption or locked out' },
  { value: 'MEDIUM', label: 'MEDIUM (24-Hour SLA)', desc: 'Standard operational routine maintenance' },
  { value: 'LOW', label: 'LOW (72-Hour SLA)', desc: 'Minor cosmetic defect or aesthetic touchup' },
];
```

### Plain-English Purpose
Imports dependencies, the API transport function `overrideTicketPriority`, and the reusable `PriorityBadge` component. It defines `PRIORITY_OPTIONS`, an immutable array mapping priority keys to human-friendly labels and SLA durations.

### Line-by-Line Breakdown
- `const PRIORITY_OPTIONS = [ ... ]`: Lookup table populated with values (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), labels, and descriptions for the select dropdown.

---

```javascript
export default function PriorityOverrideModal({
  ticket,
  isOpen,
  onClose,
  onPriorityUpdated,
}) {
  const { isDark } = useTheme();
  const [newPriority, setNewPriority] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Synchronize state when ticket opens or changes
  useEffect(() => {
    if (ticket) {
      setNewPriority(ticket.priority || 'MEDIUM');
      setOverrideReason('');
      setError(null);
      setSubmitting(false);
    }
  }, [ticket, isOpen]);

  // Handle escape key to dismiss
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen && !submitting) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);
```

### Plain-English Purpose
Component entry point and lifecycle state hooks:
- Props: The target `ticket`, boolean visibility flag `isOpen`, dialog dismissal callback `onClose`, and post-update callback `onPriorityUpdated`.
- State sync `useEffect`: Every time the modal opens for a new ticket, it pre-selects the ticket's current priority and resets the justification text, error banner, and submission flags.
- Keyboard `useEffect`: Listens for the `Escape` key to close the dialog naturally without requiring mouse clicks.

### Line-by-Line Breakdown
- `if (!isOpen || !ticket) return null`: Short-circuit render guard. If the modal is closed, React unmounts it completely from the DOM, consuming zero rendering resources.
- `e.key === 'Escape'`: Standard W3C keyboard event property detecting when the physical Esc key is pressed.

---

```javascript
  if (!isOpen || !ticket) return null;

  const cleanReason = overrideReason.trim();
  const isReasonValid = cleanReason.length >= 5;
  const isPriorityChanged = newPriority.toUpperCase() !== (ticket.priority || '').toUpperCase();
  const canSubmit = isPriorityChanged && isReasonValid && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const updatedTicket = await overrideTicketPriority(
        ticket.id,
        newPriority,
        cleanReason
      );
      if (onPriorityUpdated) {
        onPriorityUpdated(updatedTicket);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update priority. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }
```

### Plain-English Purpose
Computes validation flags and handles form submission. 
- `canSubmit` is the master gatekeeper: the supervisor *must* pick a different priority and write at least 5 characters of justification.
- `handleSubmit`: Prevents native HTML form submission, sets `submitting = true`, calls `overrideTicketPriority`, notifies the parent component via `onPriorityUpdated`, and closes the modal upon success.

### Line-by-Line Breakdown
- `cleanReason = overrideReason.trim()`: Strips whitespace so typing 5 spaces (`"     "`) cannot bypass the justification check.
- `isPriorityChanged = newPriority.toUpperCase() !== (ticket.priority || '').toUpperCase()`: Prevents redundant submissions where the supervisor leaves priority unchanged.
- `await overrideTicketPriority(ticket.id, newPriority, cleanReason)`: Dispatches the HTTP `PATCH` request to the backend.

---

```javascript
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
    >
      <div className={`w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden transform transition-all ${
        isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100' : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-xl'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between border-b px-6 py-4 ${
          isDark ? 'border-zinc-800 bg-[#161b22]' : 'border-slate-300 bg-[#e2e8f0]/60'
        }`}>
          <div>
            <h3 id="modal-headline" className={`text-base font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
              Adjust Urgency Priority
            </h3>
            <p className={`text-xs mt-0.5 font-mono ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Complaint #{ticket.tracking_code || ticket.id}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className={`rounded-lg p-1.5 transition-colors disabled:opacity-50 cursor-pointer ${
              isDark ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-800'
            }`}
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
```

### Plain-English Purpose
Renders the semi-transparent blurred modal overlay (`fixed inset-0 z-50 bg-black/75 backdrop-blur-xs`) and dialog card. The header presents the modal headline, ticket tracking code, and an "X" close button with an accessible `aria-label`.

---

```javascript
        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Incident Context Banner */}
          <div className={`rounded-xl border p-4 space-y-2 ${
            isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#e2e8f0] border-slate-300'
          }`}>
            <div className={`text-xs font-semibold uppercase tracking-wider ${
              isDark ? 'text-zinc-400' : 'text-slate-600'
            }`}>
              Complaint Details
            </div>
            <p className={`text-sm font-semibold line-clamp-2 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
              {ticket.title}
            </p>
            <div className="flex items-center space-x-2 pt-1">
              <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Current Level:</span>
              <PriorityBadge priority={ticket.priority} size="sm" dark={isDark} />
            </div>
          </div>
```

### Plain-English Purpose
Displays the "Complaint Details" context banner. Before modifying priority, supervisors see the full ticket title and the current priority tier pill (`<PriorityBadge />`), preventing accidental overrides on the wrong ticket.

---

```javascript
          {/* Target Priority Selector */}
          <div>
            <label htmlFor="priority-select" className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
              isDark ? 'text-zinc-300' : 'text-slate-700'
            }`}>
              New Priority Tier <span className="text-rose-500">*</span>
            </label>
            <select
              id="priority-select"
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              disabled={submitting}
              className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm font-medium shadow-sm transition-all focus:outline-none disabled:opacity-60 ${
                isDark
                  ? 'bg-[#0e1117] border-zinc-800 text-zinc-100 focus:border-emerald-500'
                  : 'bg-[#e2e8f0] border-slate-300 text-slate-900 hover:border-slate-400 focus:bg-white focus:border-emerald-600'
              }`}
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className={isDark ? 'bg-[#161b22] text-zinc-100' : 'bg-white text-slate-900'}>
                  {opt.label}
                </option>
              ))}
            </select>
            {!isPriorityChanged && (
              <p className="text-xs text-amber-500 mt-1 font-medium">
                Please select a different priority tier to enable override.
              </p>
            )}
          </div>
```

### Plain-English Purpose
Renders the priority tier `<select>` dropdown. If the selected priority is identical to the ticket's existing priority, an amber warning message informs the supervisor: *"Please select a different priority tier to enable override."*

---

```javascript
          {/* Mandatory Justification Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="override-reason" className={`block text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-zinc-300' : 'text-slate-700'
              }`}>
                Institutional Justification <span className="text-rose-500">*</span>
              </label>
              <span className={`text-xs ${overrideReason.length >= 5 ? (isDark ? 'text-zinc-400' : 'text-slate-500') : 'text-rose-500 font-medium'}`}>
                {overrideReason.length}/500 (min 5 required)
              </span>
            </div>
            <textarea
              id="override-reason"
              rows={3}
              maxLength={500}
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              disabled={submitting}
              placeholder="State reason for manual priority adjustment (e.g. routine tap leak rather than main pipe burst, or rescheduled maintenance)..."
              className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm shadow-sm transition-all focus:outline-none disabled:opacity-60 resize-none ${
                isDark
                  ? 'bg-[#0e1117] border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500'
                  : 'bg-[#e2e8f0] border-slate-300 text-slate-900 placeholder-slate-500 hover:border-slate-400 focus:bg-white focus:border-emerald-600'
              }`}
            />
            <p className={`text-[11px] mt-1 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
              This explanation is permanently committed into the ticket audit notes alongside your identity.
            </p>
          </div>
```

### Plain-English Purpose
Renders the mandatory justification `<textarea>`. It features:
- Live character counter: `overrideReason.length / 500`.
- Dynamic color cue: Displays in **rose red** if fewer than 5 characters are entered; turns calm **slate** once the 5-character requirement is satisfied.
- Audit warning copy: Informs the supervisor that their explanation is committed permanently alongside their user identity.

---

```javascript
          {/* Error Alert */}
          {error && (
            <div className={`rounded-xl border p-3 text-xs flex items-start space-x-2 ${
              isDark ? 'bg-rose-950/80 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={`rounded-xl border px-4 py-2 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 ${
                isDark
                  ? 'bg-[#0e1117] hover:bg-[#1c2128] border-zinc-700 text-zinc-300 hover:text-white'
                  : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] border-slate-300 text-slate-800 hover:text-slate-950'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-xs focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Applying Override...
                </>
              ) : (
                'Save Priority Change'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### Plain-English Purpose
Renders any server error alert and dialog action buttons:
- "Cancel": Dismisses the modal without changes.
- "Save Priority Change": Submits the update. While the request is in-flight, it disables both buttons and renders a spinning circle with the text *"Applying Override..."*.

---

## 3. High-Frequency Viva & Technical Defense Questions

### Q1: Why does `PriorityOverrideModal` strictly require a minimum 5-character justification?
**Model Answer:**  
In university facility operations, overriding an incident's priority directly alters its contractual Service Level Agreement (SLA) timeline (e.g. elevating from `MEDIUM` 24h to `CRITICAL` 2h). To prevent supervisors from making arbitrary, undocumented changes or bypassing accountability, the system enforces a strict client-side and backend requirement that the operator must explain *why* the priority was adjusted. This text is permanently stored in the audit ledger.

### Q2: Why is the submit button disabled when `isPriorityChanged === false`?
**Model Answer:**  
If a ticket is already marked `HIGH` and the supervisor opens the modal but leaves the dropdown on `HIGH`, submitting the form would fire an unnecessary HTTP network request to the backend. Disabling the submit button until a *different* priority tier is selected enforces good UI ergonomics and avoids redundant database writes.

### Q3: How does the modal handle keyboard navigation and accessibility?
**Model Answer:**  
1. **Escape Key Handling**: A `keydown` event listener monitors for `e.key === 'Escape'` and closes the modal automatically.
2. **ARIA Compliance**: The root container declares `role="dialog"`, `aria-modal="true"`, and `aria-labelledby="modal-headline"`. This informs screen readers that a modal dialog has taken focus and announces the dialog's title.

### Q4: What happens to the ticket's SLA clock when priority is changed?
**Model Answer:**  
When `overrideTicketPriority` executes on the backend, the SLA Engine recalculates the `sla_deadline` based on the new priority's target window (e.g., 2 hours for CRITICAL, 8 hours for HIGH). It recalculates whether the ticket is immediately breached or has remaining time, updates the database record, and logs an entry in `ticket_history`. The updated ticket object is returned to `onPriorityUpdated(updatedTicket)`, instantly refreshing the frontend UI without a page reload.

### Q5: Why is `cleanReason` computed with `.trim()` rather than using raw `overrideReason`?
**Model Answer:**  
If a user presses the spacebar 5 times, `overrideReason.length` is 5, but the string consists entirely of whitespace. In C or JavaScript, whitespace strings contain no semantic information. Calling `.trim()` strips leading and trailing whitespace; checking `cleanReason.length >= 5` guarantees that the supervisor has typed at least 5 meaningful non-whitespace characters.

---

## 4. Quick Reference Summary Table

| UI Element / Field | Type / Event | Validation / Constraint | Key Mechanism |
| :--- | :--- | :--- | :--- |
| **New Priority Select** | HTML `<select>` | Must differ from current priority | Evaluated via `isPriorityChanged` |
| **Justification Box** | HTML `<textarea>` | Min 5 chars, max 500 chars | Evaluated via `cleanReason.length >= 5` |
| **Submit Button** | `<button type="submit">` | Disabled unless `canSubmit === true` | `isPriorityChanged && isReasonValid && !submitting` |
| **Escape Key Listener** | `window.onkeydown` | Closed on `Escape` unless submitting | Cleaned up on modal unmount |
| **Audit Warning** | Descriptive Copy | Informs user of permanent log entry | Reminds supervisor of accountability |
