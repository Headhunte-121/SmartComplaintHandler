# Frontend Source Documentation: `frontend/src/components/SLACountdownTimer.jsx`

> **File Path**: `frontend/src/components/SLACountdownTimer.jsx`  
> **Role**: Real-Time Ticking SLA Countdown Pill, Automated Breach Detector, and Terminal State Auditor.  
> **Target Audience**: College Viva Examiners, Evaluation Committees, System Architects, Students grounded in basic C/Python.

---

## 1. High-Level Architectural Purpose

In Service Level Agreement (SLA) management, static timestamp strings (such as `"Deadline: 2026-10-24 18:00:00"`) force dispatchers to perform mental arithmetic to determine which tickets are most urgent. 

`SLACountdownTimer.jsx` provides a live, dynamic countdown clock that updates every single second. It replaces static timestamps with an actionable visual timer that shifts color, icon, and animation as deadlines approach or elapse.

The component fulfills four core operational capabilities:
1. **Live Chronometer (`setInterval`)**: Ticks once every 1,000 milliseconds for active tickets, recalculating remaining seconds without triggering full-page reloads.
2. **Terminal State Auditing**: When a ticket is marked `RESOLVED`, it stops ticking and compares the exact `resolved_at` timestamp with the `sla_deadline`. If the technician resolved it after the deadline, it permanently flags the ticket as `"Resolved (SLA Breached)"` in amber; if resolved beforehand, it confirms `"Resolved on Time"` in emerald.
3. **Four-Tier Urgency Thresholds for Active Tickets**:
   - **Breached (`< 0s`)**: Pulsing rose red pill displaying `"Overdue by Xh Ym"`.
   - **Critical Urgency (`< 1 hour`)**: Pulsing amber pill showing real-time seconds (`"Xm Ys remaining"`).
   - **Moderate Attention (`1 to 4 hours`)**: Sky blue pill showing `"Xh Ym remaining"`.
   - **Plentiful Buffer (`> 4 hours`)**: Emerald green pill showing `"Xh Ym remaining"`.
4. **Timezone Protection**: Leverages `parseUtcTimestamp` to ensure UTC database deadlines are not offset by the browser's local timezone (preventing 5.5-hour IST discrepancy bugs).

---

## 2. Sequential Code Breakdown & Deep Analysis

```javascript
/**
 * SmartComplaintHandler - SLA Countdown Timer
 * Blueprint Reference: V1/M5/frontend/02_sla_countdown_timer.md
 * Role: Dynamic countdown pill ticking every second; high-contrast dark command center styling.
 */
import React, { useState, useEffect } from 'react';
import { parseUtcTimestamp } from '../utils/dateUtils';

export default function SLACountdownTimer({
  slaDeadline,
  deadline,
  status = 'SUBMITTED',
  resolvedAt = null,
  resolved_at = null,
  showIcon = true,
  dark = true,
}) {
  const [now, setNow] = useState(Date.now());

  const effectiveDeadline = slaDeadline || deadline;
  const effectiveResolvedAt = resolvedAt || resolved_at;

  const isTerminal = ['RESOLVED', 'CLOSED', 'CANCELLED'].includes(status);
```

### Plain-English Purpose
Imports React hooks and the safe UTC date parser. It accepts flexible props (supporting camelCase `slaDeadline` and snake_case `deadline`), initializes the reactive `now` state with current epoch milliseconds, and evaluates whether the ticket has reached a terminal completion state.

### Line-by-Line Breakdown
- `const [now, setNow] = useState(Date.now())`: Stores the current timestamp in milliseconds. Updating `now` every second triggers a re-render to update the displayed timer.
- `const effectiveDeadline = slaDeadline || deadline`: Logical OR fallback ensuring compatibility regardless of backend API casing.
- `const effectiveResolvedAt = resolvedAt || resolved_at`: Resolution timestamp fallback.
- `const isTerminal = ['RESOLVED', 'CLOSED', 'CANCELLED'].includes(status)`: Boolean checking if the ticket lifecycle has ended. If true, the countdown is permanently stopped.

---

```javascript
  // Set up ticking interval for active tickets
  useEffect(() => {
    if (isTerminal || !effectiveDeadline) {
      return;
    }

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [isTerminal, effectiveDeadline]);
```

### Plain-English Purpose
This `useEffect` establishes the background ticking heartbeat. If the ticket is active and has a deadline, it starts a browser timer (`setInterval`) that fires every 1,000 milliseconds (1 second), updating `now` to the current time. When the component unmounts or the ticket status changes to resolved, `clearInterval(interval)` halts the timer to prevent memory leaks.

### Line-by-Line Breakdown
- `if (isTerminal || !effectiveDeadline) return`: Guard clause. If the ticket is completed or has no deadline, it does not create a timer, conserving browser CPU cycles.
- `const interval = setInterval(..., 1000)`: Registers a recurring timer executing every 1,000ms.
- `return () => clearInterval(interval)`: Essential React cleanup function executed when the component unmounts. In C, this is the equivalent of calling `free()` or closing an open file descriptor.

### Deep Term & Concept Expansion
- **JavaScript Event Loop & `setInterval`**: `setInterval` registers a task in the browser's macro-task queue. Every 1 second, the JavaScript runtime pushes `setNow(Date.now())` to the call stack, updating React state and scheduling a light virtual DOM reconciliation.
- **Dangling Interval Memory Leak**: If `clearInterval` is omitted, the timer continues running in the background indefinitely even after the user navigates to another page, consuming memory and triggering React state update warnings on unmounted components.

---

```javascript
  const deadlineDate = parseUtcTimestamp(effectiveDeadline);

  if (!deadlineDate) {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
          dark
            ? 'bg-slate-900 text-slate-400 border-slate-800'
            : 'bg-slate-100 text-slate-600 border-slate-200'
        }`}
      >
        No Deadline
      </span>
    );
  }
```

### Plain-English Purpose
Parses the deadline string using `parseUtcTimestamp`. If the ticket has no deadline (e.g., an unclassified draft or general announcement), it renders a neutral grey badge displaying *"No Deadline"*.

---

```javascript
  // Handle Terminal States (RESOLVED, CLOSED, CANCELLED)
  if (status === 'RESOLVED') {
    const resolvedDate = parseUtcTimestamp(effectiveResolvedAt);
    const isPastSla = resolvedDate && deadlineDate && resolvedDate.getTime() > deadlineDate.getTime();
    if (isPastSla) {
      return (
        <span
          role="timer"
          aria-live="polite"
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            dark
              ? 'bg-amber-950/80 text-amber-300 border-amber-800/80 shadow-xs'
              : 'bg-amber-50 text-amber-700 border-amber-200 shadow-xs'
          }`}
        >
          {showIcon && (
            <svg className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          Resolved (SLA Breached)
        </span>
      );
    }
    return (
      <span
        role="timer"
        aria-live="polite"
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
          dark
            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80 shadow-xs'
            : 'bg-green-50 text-green-700 border-green-200 shadow-xs'
        }`}
      >
        {showIcon && (
          <svg className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        Resolved on Time
      </span>
    );
  }

  if (status === 'CANCELLED') {
    return ( ... );
  }

  if (status === 'CLOSED') {
    return ( ... );
  }
```

### Plain-English Purpose
Handles completed tickets. For `RESOLVED` tickets, it compares the resolution timestamp against the deadline timestamp. If `resolvedDate > deadlineDate`, it renders an amber badge stating *"Resolved (SLA Breached)"*. If the ticket was resolved within the SLA window, it renders an emerald badge stating *"Resolved on Time"*. For `CANCELLED` and `CLOSED` tickets, it renders clean neutral badges.

### Line-by-Line Breakdown
- `resolvedDate.getTime() > deadlineDate.getTime()`: Direct integer millisecond comparison.
- `role="timer"` & `aria-live="polite"`: Accessibility attributes indicating this content represents time-sensitive status.

---

```javascript
  // Active Ticket Calculation
  const deadlineTime = deadlineDate.getTime();
  const totalSeconds = Math.floor((deadlineTime - now) / 1000);
  const isBreached = totalSeconds < 0;

  // 1. Breached state (< 0s)
  if (isBreached) {
    const overdueSeconds = Math.abs(totalSeconds);
    const hours = Math.floor(overdueSeconds / 3600);
    const minutes = Math.floor((overdueSeconds % 3600) / 60);

    return (
      <span
        role="timer"
        aria-live="polite"
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border animate-pulse ${
          dark
            ? 'bg-rose-950/90 text-rose-300 border-rose-800/90 shadow-xs'
            : 'bg-rose-100 text-rose-700 border-rose-300 shadow-xs'
        }`}
      >
        {showIcon && (
          <svg className="w-3.5 h-3.5 flex-shrink-0 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        Overdue by {hours}h {minutes}m
      </span>
    );
  }
```

### Plain-English Purpose
This handles active tickets that have passed their deadline. When `totalSeconds < 0`, `isBreached` is `true`. It calculates how many hours and minutes have elapsed since the breach occurred and renders an animated pulsing rose badge with an exclamation icon (`"Overdue by Xh Ym"`).

### Line-by-Line Breakdown
- `const totalSeconds = Math.floor((deadlineTime - now) / 1000)`: Calculates second difference.
- `Math.abs(totalSeconds)`: Converts negative seconds into a positive magnitude.
- `Math.floor(overdueSeconds / 3600)`: Integer division extracting full elapsed hours.
- `Math.floor((overdueSeconds % 3600) / 60)`: Modulo arithmetic extracting remaining minutes.
- `animate-pulse`: CSS animation drawing immediate visual focus to overdue incidents.

---

```javascript
  // 2. Urgent / Approaching Breach (< 1 hour)
  if (totalSeconds < 3600) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return (
      <span
        role="timer"
        aria-live="polite"
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border animate-pulse ${
          dark
            ? 'bg-amber-950/90 text-amber-300 border-amber-800/90 shadow-xs'
            : 'bg-amber-50 text-amber-700 border-amber-300 shadow-xs'
        }`}
      >
        {showIcon && (
          <svg className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {minutes}m {seconds}s remaining
      </span>
    );
  }

  // 3. Standard active window (1 to 4 hours)
  if (totalSeconds < 14400) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    return ( ... );
  }

  // 4. Plentiful buffer (> 4 hours)
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return ( ... );
```

### Plain-English Purpose
Renders the three remaining active time bands:
- **Urgent (< 1 hour, < 3600s)**: Renders minutes and live ticking seconds (`"42m 18s remaining"`) with amber pulsing styling. Showing ticking seconds creates psychological urgency for technicians to complete the repair.
- **Moderate Buffer (1 to 4 hours, < 14400s)**: Renders hours and minutes (`"2h 15m remaining"`) with calm sky blue styling.
- **Safe Buffer (> 4 hours)**: Renders hours and minutes (`"18h 40m remaining"`) with reassuring emerald green styling.

---

## 3. High-Frequency Viva & Technical Defense Questions

### Q1: Why does `SLACountdownTimer` display seconds only when less than 1 hour remains?
**Model Answer:**  
Displaying rapidly changing seconds for a ticket with 48 hours remaining creates unnecessary visual noise and distracts operators. However, when less than 60 minutes remain before an official SLA violation, showing exact seconds (`"14m 32s remaining"`) and an amber pulsing animation communicates high urgency to facility supervisors and on-duty technicians, prompting immediate escalation.

### Q2: Why is `clearInterval` crucial in the `useEffect` hook?
**Model Answer:**  
In React, when a component unmounts (e.g. the user navigates away from the ticket dashboard), any active `setInterval` timers remain running in the browser's background thread unless explicitly cancelled. If `clearInterval(interval)` is not called in the `useEffect` cleanup function, the timer will keep running, leading to memory leaks and attempting to call `setNow` on unmounted components.

### Q3: How does the component audit SLA compliance for already-resolved tickets?
**Model Answer:**  
When `status === 'RESOLVED'`, the component does not start an active countdown timer. Instead, it parses both `effectiveResolvedAt` and `deadlineDate` into UTC timestamps and compares their epoch millisecond values:
`resolvedDate.getTime() > deadlineDate.getTime()`.
If true, it permanently displays `"Resolved (SLA Breached)"` in amber; if false, it confirms `"Resolved on Time"` in emerald. This provides an immutable audit trail for administrative performance reporting.

### Q4: How does this component prevent the 5.5-hour Indian Standard Time (IST) offset bug?
**Model Answer:**  
PostgreSQL database timestamps are sent as ISO strings in UTC. If passed directly to `new Date()`, web browsers in India treat naive date strings without a trailing `'Z'` as local IST time, shifting the deadline by 5.5 hours. `SLACountdownTimer` passes all dates through `parseUtcTimestamp`, which detects naive strings and appends a `'Z'` designator, ensuring accurate UTC epoch calculations everywhere.

### Q5: What is the purpose of `role="timer"` and `aria-live="polite"`?
**Model Answer:**  
These are WAI-ARIA accessibility attributes. `role="timer"` defines the element as a numerical counter of elapsed or remaining time. `aria-live="polite"` notifies assistive screen readers that the contents of this element change dynamically, allowing the screen reader to announce updates at the next natural pause in speech without interrupting the user.

---

## 4. Quick Reference Summary Table

| Ticket State | Time Condition | Badge Visual | Icon | Displayed Text |
| :--- | :--- | :--- | :--- | :--- |
| **No Deadline** | `deadline == null` | Slate Grey | None | `No Deadline` |
| **Resolved on Time** | `resolved <= deadline` | Emerald Green | Checkmark Circle | `Resolved on Time` |
| **Resolved Late** | `resolved > deadline` | Amber / Orange | Alert Triangle | `Resolved (SLA Breached)` |
| **Breached** | `totalSeconds < 0` | Rose Red (Pulsing) | Exclamation Octagon | `Overdue by Xh Ym` |
| **Urgent (<1h)** | `0 <= sec < 3600` | Amber (Pulsing) | Clock (Active) | `Xm Ys remaining` |
| **Moderate (1-4h)** | `3600 <= sec < 14400` | Sky Blue | Clock (Static) | `Xh Ym remaining` |
| **Safe (>4h)** | `sec >= 14400` | Emerald Green | Clock (Static) | `Xh Ym remaining` |
