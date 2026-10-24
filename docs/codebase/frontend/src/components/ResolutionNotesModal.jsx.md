# Frontend Source Documentation: `frontend/src/components/ResolutionNotesModal.jsx`

> **File Path**: `frontend/src/components/ResolutionNotesModal.jsx`  
> **Role**: Mandatory Incident Resolution Gate, Inventory Parts Logger, and Technician Audit Completion Dialog.  
> **Target Audience**: College Viva Examiners, Evaluation Committees, System Architects, Students grounded in basic C/Python.

---

## 1. High-Level Architectural Purpose

In low-quality maintenance portals, field technicians often mark complaints as "Resolved" with a single click without documenting what actions were taken. This leads to severe institutional shortcomings:
1. Students find issues marked resolved when the underlying physical fault remains untouched.
2. Facility directors cannot audit inventory consumption (e.g. how many MCB circuit breakers or PVC pipe joints were consumed this semester).
3. If an identical problem reoccurs two days later, the next technician has zero context on prior repair history.

`ResolutionNotesModal.jsx` enforces a strict **Mandatory Resolution Gate**:
1. **Compulsory Descriptive Notes**: A ticket cannot be closed without entering at least 10 characters detailing the physical repair or diagnostic verification performed.
2. **Parts & Consumables Tracking**: Provides an optional input field for cataloging hardware parts replaced (e.g. *"2x PVC Elbow 1-inch, 1x 15A Circuit Breaker"*).
3. **Staff Accountability**: Captures the technician's signature/name and locks the ticket into a terminal `RESOLVED` state, stopping the SLA countdown clock.
4. **Resilient Error Presentation & Stop-Propagation Overlay**: Prevents accidental closures while clicking inside the dialog and displays backend validation errors clearly.

---

## 2. Sequential Code Breakdown & Deep Analysis

```javascript
/**
 * SmartComplaintHandler - Staff Ticket Resolution Modal
 * Blueprint Reference: V1/M5/frontend/03_resolution_notes_modal.md
 * Role: Mandatory closure gate requiring min 10 chars of resolution notes, parts, and technician metadata with dual theme styling.
 */
import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { resolveTicket } from '../api/sla';

export default function ResolutionNotesModal({
  isOpen,
  ticket,
  onClose,
  onResolved,
}) {
  const { isDark } = useTheme();
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [partsReplaced, setPartsReplaced] = useState('');
  const [technicianName, setTechnicianName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [touched, setTouched] = useState(false);
```

### Plain-English Purpose
Imports React hooks, theme context, and the `resolveTicket` API helper. The component declares local state variables for form inputs (`resolutionNotes`, `partsReplaced`, `technicianName`), in-flight status (`isSubmitting`), backend errors (`errorMessage`), and a boolean `touched` flag used for deferred form validation feedback.

### Line-by-Line Breakdown
- `import { resolveTicket } from '../api/sla'`: API transport function that submits the resolution payload to backend endpoint `/sla/{ticket_id}/resolve`.
- `const [touched, setTouched] = useState(false)`: Tracks whether the technician has interacted with the form. This prevents showing red validation warning errors before the user has even begun typing.

---

```javascript
  // Reset form when modal opens with a new ticket
  useEffect(() => {
    if (isOpen) {
      setResolutionNotes('');
      setPartsReplaced('');
      setTechnicianName('');
      setErrorMessage(null);
      setTouched(false);
    }
  }, [isOpen, ticket]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !ticket) {
    return null;
  }
```

### Plain-English Purpose
- Form reset `useEffect`: Clears previous text fields and validation flags whenever the dialog opens for a new ticket.
- Keyboard `useEffect`: Listens for `Escape` to close the dialog, provided a submission is not currently in progress.
- Guard clause: Returns `null` if the modal is closed or ticket is missing.

---

```javascript
  const trimmedLength = resolutionNotes.trim().length;
  const isNotesValid = trimmedLength >= 10;
  const showValidationError = touched && !isNotesValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);

    if (!isNotesValid) {
      setErrorMessage('Resolution notes must contain at least 10 characters detailing the repair.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const updatedTicket = await resolveTicket(
        ticket.id,
        resolutionNotes,
        partsReplaced,
        technicianName
      );
      if (onResolved) {
        onResolved(updatedTicket);
      }
      onClose();
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Failed to resolve ticket. Please try again.';
      setErrorMessage(detail);
    } finally {
      setIsSubmitting(false);
    }
  };
```

### Plain-English Purpose
Validates inputs and handles submission:
- `isNotesValid`: Enforces that `resolutionNotes.trim().length >= 10`.
- `showValidationError`: Shows red error styling only if the user touched the input and the length is insufficient.
- `handleSubmit`: Validates notes, sets `isSubmitting = true`, calls `resolveTicket(...)`, updates the parent view via `onResolved(updatedTicket)`, and dismisses the modal.

### Line-by-Line Breakdown
- `resolutionNotes.trim().length`: Computes non-whitespace character length.
- `if (!isNotesValid) { setErrorMessage(...); return; }`: Client guard preventing invalid submissions.
- `await resolveTicket(ticket.id, resolutionNotes, partsReplaced, technicianName)`: Dispatches the resolution payload.

---

```javascript
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="resolve-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <div
        className={`w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden transition-all ${
          isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100' : 'bg-[#f1f5f9] border-slate-300 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
```

### Plain-English Purpose
Renders the accessible backdrop overlay. Clicking on the dark backdrop calls `onClose()` (dismissing the modal), while clicking *inside* the modal card calls `e.stopPropagation()`, preventing clicks on form controls from bubbling up to the backdrop and accidentally closing the dialog.

### Deep Term & Concept Expansion
- **Event Bubbling & `e.stopPropagation()`**: In DOM event dispatch, an event starts at the target element and "bubbles" upwards through all parent ancestor elements. Without `e.stopPropagation()` on the inner modal container, clicking inside a textarea would trigger the parent backdrop's `onClick` handler and prematurely close the dialog, losing the technician's typed notes.

---

```javascript
        {/* Header */}
        <div
          className={`flex items-start justify-between border-b p-6 ${
            isDark ? 'border-zinc-800 bg-[#161b22]' : 'border-slate-300 bg-[#e2e8f0]/60'
          }`}
        >
          <div>
            <span
              className={`text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border ${
                isDark
                  ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                  : 'text-emerald-800 bg-emerald-100 border-emerald-300'
              }`}
            >
              Incident Resolution Gate
            </span>
            <h3 id="resolve-modal-title" className={`text-base font-bold mt-1 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
              Resolve Complaint
            </h3>
            <p className={`mt-1 text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              <span className={`font-mono font-bold ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>{ticket.tracking_code}</span>
              {' — '}
              {ticket.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
              isDark ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
```

### Plain-English Purpose
Renders the header banner with the "Incident Resolution Gate" badge, ticket tracking code, complaint title, and an accessible "✕" dismissal button.

---

```javascript
        {/* Error Alert Banner */}
        {errorMessage && (
          <div
            className={`m-6 mb-0 rounded-xl border p-3 text-xs ${
              isDark ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-rose-100 border-rose-300 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Resolution Notes Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="resolution_notes" className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                Detailed Resolution &amp; Work Performed <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[11px] font-mono ${trimmedLength >= 10 ? 'text-emerald-500 font-bold' : isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                {trimmedLength} / 1000 chars (min 10)
              </span>
            </div>
            <textarea
              id="resolution_notes"
              rows={4}
              required
              disabled={isSubmitting}
              value={resolutionNotes}
              onChange={(e) => {
                setResolutionNotes(e.target.value);
                if (!touched) setTouched(true);
              }}
              placeholder="Detail the physical repairs completed, components replaced, or verification performed..."
              className={`w-full rounded-xl border p-2.5 text-xs focus:outline-none focus:ring-2 resize-none ${
                showValidationError
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                  : isDark
                  ? 'bg-[#0e1117] border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20'
              }`}
            />
            {showValidationError && (
              <p className="mt-1 text-[11px] text-rose-400">
                Please enter at least 10 characters detailing the repair.
              </p>
            )}
          </div>
```

### Plain-English Purpose
Renders any server error alert and the primary resolution notes `<textarea>`. It features:
- Live character counter: `{trimmedLength} / 1000 chars (min 10)`. Turns bold emerald green when 10 characters are reached.
- Dynamic error border: When `showValidationError === true`, the border glows red (`border-rose-400`) and displays a validation warning paragraph below the input.

---

```javascript
          {/* Parts Replaced Field */}
          <div>
            <label htmlFor="parts_replaced" className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
              Parts Replaced / Materials Consumed <span className={`text-[11px] font-normal ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>(Optional)</span>
            </label>
            <input
              type="text"
              id="parts_replaced"
              disabled={isSubmitting}
              value={partsReplaced}
              onChange={(e) => setPartsReplaced(e.target.value)}
              placeholder="e.g., 2x PVC Elbow 1-inch, 1x 15A Circuit Breaker"
              className={`w-full rounded-xl border p-2.5 text-xs focus:outline-none focus:ring-2 ${
                isDark
                  ? 'bg-[#0e1117] border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20'
              }`}
            />
          </div>

          {/* Technician Name Field */}
          <div>
            <label htmlFor="technician_name" className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
              Technician / Staff Name <span className={`text-[11px] font-normal ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>(Optional)</span>
            </label>
            <input
              type="text"
              id="technician_name"
              disabled={isSubmitting}
              value={technicianName}
              onChange={(e) => setTechnicianName(e.target.value)}
              placeholder="e.g., Dave Miller (Electrical Squad)"
              className={`w-full rounded-xl border p-2.5 text-xs focus:outline-none focus:ring-2 ${
                isDark
                  ? 'bg-[#0e1117] border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20'
              }`}
            />
          </div>
```

### Plain-English Purpose
Renders two optional operational metadata fields:
1. `parts_replaced`: Captures physical plumbing fittings, electrical fixtures, or network cables used during maintenance.
2. `technician_name`: Allows on-duty contractors or field apprentices to record their name alongside the account holder's identity.

---

```javascript
          {/* Action Buttons */}
          <div
            className={`p-4 -mx-6 -mb-6 border-t flex items-center justify-end space-x-2 ${
              isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#e2e8f0]/60 border-slate-300'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer disabled:opacity-50 ${
                isDark
                  ? 'bg-[#161b22] hover:bg-zinc-800 text-zinc-300 border-zinc-700'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isNotesValid || isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white shadow-xs disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Resolving Ticket...</span>
                </>
              ) : (
                <span>Confirm Resolution &amp; Close</span>
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
Renders the modal action buttons:
- "Cancel": Closes dialog without modifying state.
- "Confirm Resolution & Close": The submit button. It remains disabled until `isNotesValid === true` (at least 10 characters). While submitting, it shows a spinning SVG and *"Resolving Ticket..."*.

---

## 3. High-Frequency Viva & Technical Defense Questions

### Q1: Why does this modal require a minimum of 10 characters for resolution notes?
**Model Answer:**  
Requiring at least 10 characters prevents technicians from closing tickets with trivial one-word responses like `"ok"` or `"done"`. Enforcing a descriptive threshold ensures that technicians write meaningful context (e.g. *"Replaced burnt capacitor on motor"* or *"Cleared trap line and tested water flow"*), creating a detailed institutional knowledge base for future maintenance audits.

### Q2: What is the purpose of `e.stopPropagation()` on the inner modal container?
**Model Answer:**  
In the DOM event bubbling hierarchy, click events on child elements bubble up to their parent containers. The outer modal backdrop has an `onClick` handler that calls `onClose()` to dismiss the modal when clicking outside. Calling `e.stopPropagation()` on the inner modal card prevents clicks within the form (e.g. focusing inputs, clicking dropdowns) from bubbling up to the backdrop, preventing accidental dialog closures.

### Q3: What happens to the ticket's SLA clock when the ticket is marked resolved?
**Model Answer:**  
On the backend, `resolveTicket` sets `status = 'RESOLVED'` and records `resolved_at = datetime.utcnow()`. The active countdown timer halts immediately. In the UI, `SLACountdownTimer` compares `resolved_at` against `sla_deadline`:
- If `resolved_at <= sla_deadline`, it confirms `"Resolved on Time"` in emerald.
- If `resolved_at > sla_deadline`, it logs `"Resolved (SLA Breached)"` in amber.

### Q4: Why are `parts_replaced` and `technician_name` optional fields?
**Model Answer:**  
Not every complaint requires consumable spare parts (e.g. resetting a tripped circuit breaker or restarting a frozen Wi-Fi access point requires zero physical parts). Similarly, the system automatically associates the authenticated user's ID with the resolution record; the `technician_name` field exists as an optional convenience when a supervisor records work performed by apprentice contractors.

### Q5: How does the `touched` state improve user experience?
**Model Answer:**  
If validation errors were shown immediately upon opening the modal, the user would see harsh red warning outlines and error messages before they even had a chance to type. By tracking `const [touched, setTouched] = useState(false)` and displaying errors only when `touched && !isNotesValid`, the interface remains welcoming and only presents validation warnings if the user attempts to submit an incomplete form.

---

## 4. Quick Reference Summary Table

| UI Field / Control | Validation Rule | Data Type | Key Purpose |
| :--- | :--- | :--- | :--- |
| **Resolution Notes** | Required (min 10, max 1000 chars) | `string` | Details physical repair performed |
| **Parts Replaced** | Optional | `string` | Tracks consumable materials / parts |
| **Technician Name** | Optional | `string` | Captures field contractor signature |
| **Submit Button** | Disabled if `<10` chars or submitting | `<button type="submit">` | Invokes `resolveTicket()` via HTTP |
| **`e.stopPropagation()`** | Event handler on modal card | JavaScript Event | Prevents dialog from closing on interior clicks |
