# Module M5 Frontend: Dynamic SLA Countdown Timer Specification

Authoritative Engineering Blueprint for `src/components/SLACountdownTimer.jsx`.

---

## Section 1: Standard Purpose & Industry Role

### Standard Industry Role & Real-World Use Cases
In time-sensitive web applications (such as emergency dispatch centers, logistics delivery trackers, or customer service desks), displaying static deadlines (e.g. "Target: 02:00 PM") forces users to perform mental subtraction against the current time. As minutes tick by, users become anxious, repeatedly reloading the browser to determine whether an issue is overdue.

A dynamic countdown timer (an interactive UI component that continuously calculates the delta between the current wall-clock time and a future timestamp, updating the display on a periodic interval) provides instant visual urgency. In enterprise operations, countdown timers use color-shifting severity bands (e.g. green for plenty of time, amber for approaching deadlines, pulsing red for contractual breaches) to immediately direct operator attention to high-risk tasks.

### What WE Are Specifically Using It For in Smart Complaint Handler
In `SmartComplaintHandler`, `src/components/SLACountdownTimer.jsx` is the universal time-tracking visual indicator embedded across both student and staff portals:
1. It mounts in `TrackTicket.jsx` (Module M2), providing students with live, reassuring countdowns showing exactly how much time remains before their campus maintenance team is scheduled to resolve the complaint.
2. It mounts in `AdminDashboard.jsx` (Module M4) and `SLABreachTable.jsx` (Module M5), enabling facility managers to scan active ticket queues and identify overdue repairs at a glance.
3. It updates every 1000 milliseconds via a React `useEffect` interval hook, calculating the exact difference between `new Date()` and `new Date(slaDeadline)`.
4. It implements an automated 4-tier color transition system:
   - Green (`bg-emerald-50 text-emerald-700`): > 4 Hours remaining (Safe operating buffer).
   - Sky Blue (`bg-sky-50 text-sky-700`): 1 to 4 Hours remaining (Standard active window).
   - Pulsing Amber (`bg-amber-50 text-amber-700 animate-pulse`): < 1 Hour remaining (Urgent attention required).
   - Pulsing Red (`bg-rose-100 text-rose-700 font-bold animate-pulse`): Breached (Overdue, displaying "Overdue by Xh Ym").
5. If the ticket is already completed (`status === 'RESOLVED'`), the timer freezes its interval and displays an official static compliance badge: "Resolved on Time" (Green) or "Resolved (SLA Breached)" (Amber).

### Future AI Integration & Roadmap Hooks
In Version 2 (V2), when our platform introduces automated AI-driven operational optimization via Gemini API, this timer component provides:
1. AI Dynamic Prediction Overlay: A toggleable secondary badge displaying Gemini AI's real-time predicted completion time (e.g. "AI Forecast: Ready in ~45m") alongside the contractual SLA target.
2. Micro-Interaction Pulse: A smooth GPU-accelerated glow animation triggered when background AI workers detect high risk and elevate the ticket's priority.
3. Intelligent Tooltip Breakdown: An expandable tooltip rendering machine learning feature weights (e.g. "Turnaround influenced by: Squad Workload 65%, Parts In-Stock 35%").

### How Other Components Standardly Interact with This File
1. `TrackTicket.jsx` imports `SLACountdownTimer` and renders it inside the Ticket Overview Card: `<SLACountdownTimer slaDeadline={ticket.sla_deadline} status={ticket.status} resolvedAt={ticket.resolved_at} />`.
2. `AdminDashboard.jsx` and `SLABreachTable.jsx` render the countdown timer inside table cells to display live SLA status for every row.

### The Core Problem It Solves & Why It Exists
Without this dynamic timer:
- Students and staff are forced to manually parse ISO date strings and calculate remaining hours in their heads.
- Critical tickets that are 10 minutes from breaching look identical to tickets with 3 days remaining, causing technicians to prioritize the wrong tasks.
- Leaving browser tabs open shows stale static numbers that do not reflect the passage of time.

---

## Section 2: What Must Be in This File & Why Each Item Is Needed

### 1. Component Props Contract
* `slaDeadline`: ISO 8601 string or Date object representing the target resolution timestamp. Required.
* `status`: Current ticket lifecycle status string (e.g. `'SUBMITTED'`, `'IN_PROGRESS'`, `'RESOLVED'`). Required.
* `resolvedAt`: Optional ISO 8601 string representing when the ticket was resolved.
* `showIcon`: Boolean prop (defaults to `true`) controlling whether the SVG clock/alert icon is rendered alongside the text.

### 2. Internal State Architecture
* `timeRemaining`: State object updated every second:
  - `totalSeconds`: Integer representing elapsed seconds until deadline (negative if past deadline).
  - `hours`: Integer hours remaining.
  - `minutes`: Integer minutes remaining.
  - `seconds`: Integer seconds remaining.
  - `isBreached`: Boolean flag (`true` when `totalSeconds < 0`).
  - `formattedString`: Formatted display text (e.g. `"2h 15m remaining"` or `"Overdue by 1h 30m"`).

### 3. Interval Lifecycle Mechanics (`useEffect`)
* Terminal State Freezing Guard:
  - Checks if `['RESOLVED', 'CLOSED', 'CANCELLED'].includes(status)`.
  - If true, does NOT initialize a `setInterval()` timer; instead, computes the terminal display state once and returns immediately, saving browser CPU cycles.
* Interval Setup:
  - Initializes `const timer = setInterval(calculateTime, 1000)`.
  - Executes `calculateTime()` immediately on mount to prevent a 1-second blank delay.
* Cleanup Function:
  - Returns `() => clearInterval(timer)` to guarantee that when the component unmounts or navigating to another page, the background timer is destroyed, preventing memory leaks.

### 4. Dynamic Visual Styling Logic (`getTimerStyle()`)
* Evaluates `status` and `timeRemaining` to return Tailwind CSS classes:
  - Resolved on Time (`status === 'RESOLVED' && resolvedAt <= slaDeadline`):
    - `bg-emerald-50 text-emerald-700 border-emerald-200`
    - Text: "Resolved on Time" | Icon: SVG checkmark circle
  - Resolved Past SLA (`status === 'RESOLVED' && resolvedAt > slaDeadline`):
    - `bg-amber-50 text-amber-700 border-amber-200`
    - Text: "Resolved (SLA Breached)" | Icon: SVG alert circle
  - Cancelled State:
    - `bg-slate-50 text-slate-500 border-slate-200`
    - Text: "Cancelled"
  - Active Breached (`isBreached === true`):
    - `bg-rose-100 text-rose-700 border-rose-300 font-bold animate-pulse`
    - Text: `Overdue by {hours}h {minutes}m` | Icon: SVG exclamation triangle
  - Active Approaching Breach (`totalSeconds < 3600`, less than 1 hour):
    - `bg-amber-50 text-amber-700 border-amber-300 font-semibold animate-pulse`
    - Text: `{minutes}m {seconds}s remaining` | Icon: SVG clock with pulsing dot
  - Active Standard (`totalSeconds < 14400`, 1 to 4 hours):
    - `bg-sky-50 text-sky-700 border-sky-200 font-medium`
    - Text: `{hours}h {minutes}m remaining` | Icon: SVG clock
  - Active Plentiful (> 4 hours):
    - `bg-emerald-50 text-emerald-700 border-emerald-200 font-medium`
    - Text: `{hours}h {minutes}m remaining` | Icon: SVG clock

### 5. Rendered HTML Structure
* Container Tag: `<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border shadow-xs transition-colors duration-300 ...">`.
* Accessibility Attributes: `role="timer"` and `aria-live="polite"`.

---

## Section 3: Component Life-Cycle: Input, Process, Output (IPO Table)

| Life-Cycle Phase | Primary Input | Internal Calculation & Transformation | Final Output |
| :--- | :--- | :--- | :--- |
| **1. Mount (Open Ticket)** | `slaDeadline = 2h from now`, `status = 'IN_PROGRESS'` | Computes `totalSeconds = 7200`; sets hours=2, minutes=0; mounts 1000ms `setInterval`. | Sky blue pill rendered: `2h 0m remaining`. |
| **2. Ticking Progress** | 60 seconds elapse | Interval fires; recalculates `totalSeconds = 7140`; updates state. | Text updates smoothly: `1h 59m remaining`. |
| **3. Urgency Threshold** | Timer drops to 45 minutes | Detects `totalSeconds < 3600`; switches color classes to amber warning; activates pulse. | Pulsing amber badge: `45m 0s remaining`. |
| **4. Breach Transition** | Current time passes deadline | `totalSeconds` becomes negative (-1); sets `isBreached = true`; switches styling to rose/red. | High-contrast pulsing red badge: `Overdue by 0h 1m`. |
| **5. Ticket Closure** | Ticket resolved; props update with `status = 'RESOLVED'` | Clears active interval; compares `resolvedAt` against `slaDeadline`. | Interval destroyed; static green badge rendered: `Resolved on Time`. |

---

## Section 4: Flexibility & Modification Guide

### 🟢 Safe to Modify & Customize
* **Urgency Thresholds**: You may adjust the threshold for amber warnings from 1 hour (`3600` seconds) to 2 hours (`7200` seconds) based on facility response policies.
* **Display Format Granularity**: You can choose whether to display seconds (`Xh Ym Zs`) or hide seconds when more than 1 hour remains to minimize visual distraction.
* **Icon Selection**: You can customize the SVG icons used for each severity tier without affecting timing calculations.

### 🔴 Strict Non-Negotiables (Do NOT Alter)
* **Cleanup Function in `useEffect`**: You must always return `() => clearInterval(timer)` from the `useEffect` hook. Omitting the cleanup function causes orphan timer intervals to continue executing indefinitely in the background, consuming browser memory and triggering React state update warnings on unmounted components.
* **UTC Parsing Consistency**: When instantiating `new Date(slaDeadline)`, ensure the incoming string includes timezone information (e.g. ending in `'Z'`). Parsing naive date strings in Safari can result in `Invalid Date` errors.
* **Interval Freezing on Resolved Status**: Do NOT allow the interval timer to continue ticking when `status === 'RESOLVED'`. Tickets that are physically complete must remain frozen at their resolution state.

---

## Section 5: Architectural & Theoretical References

This specification operates strictly as an **implementation and integration blueprint**. For the exhaustive computer science fundamentals, language runtime mechanics, and protocol specifications governing this component, consult the following authoritative manuals in the **Developer Guide Suite**:

* [**Guide 07: React 18 Architecture & Virtual DOM**](../../../developer_guide/07_REACT_18_AND_VIRTUAL_DOM_ARCHITECTURE.md)  
  Fiber tree reconciliation, React Hooks lifecycle (`useState`, `useEffect`, `useCallback`, `useMemo`), and closure capture safety.

* [**Guide 08: Tailwind CSS & PostCSS Architecture**](../../../developer_guide/08_TAILWIND_CSS_AND_POSTCSS_ENGINEERING.md)  
  Semantic design tokens, responsive breakpoints, and utility class composition.

* [**Guide 20: Form State Machines & Optimistic UI**](../../../developer_guide/20_FORM_STATE_MACHINES_AND_OPTIMISTIC_UI.md)  
  Controlled input architectures, debounced event handling, and form validation state automata.

* [**Unit 05B: JavaScript Core Language & Syntax Primitives**](../../../developer_guide/05B_JAVASCRIPT_CORE_LANGUAGE_AND_SYNTAX_PRIMITIVES.md)  
  Object destructuring, arrow functions, and array declarative manipulation methods.

* [**Unit 06B: HTML5 Semantics & CSS3 Foundations**](../../../developer_guide/06B_HTML5_SEMANTICS_AND_CSS3_FOUNDATIONS.md)  
  Form controls, interactive focus indicators, and WCAG accessibility standards.

---

---

## Section 6: Definition of Done & Live Website Verification

### What This File Is Responsible For
This React component (`frontend/src/components/SLACountdownTimer.jsx`) is responsible for **rendering an active, real-time countdown timer tracking the time remaining before a complaint breaches its resolution deadline**. It translates static timestamps into living, urgent visual feedback for students and staff.

### What It Should Perform
When rendered on screen, this component performs:
1. **Real-Time Temporal Ticking:** Executes a 1-second `setInterval` timer calculating remaining hours, minutes, and seconds relative to `target_resolution_date`.
2. **Dynamic Severity Color Coding:**
   * **Green:** More than 4 hours remaining (`bg-emerald-50 text-emerald-700`).
   * **Amber:** 1 to 4 hours remaining (`bg-amber-50 text-amber-700`).
   * **Red:** Less than 1 hour remaining (`bg-rose-50 text-rose-700`).
   * **Flashing Red (`BREACHED`):** Target date exceeded; renders a pulsing overdue badge displaying how long the ticket has been overdue (e.g. `Overdue by 1h 24m`).
3. **Lifecycle Awareness:** If ticket status is `RESOLVED`, freezes the timer and displays a calm green checkmark with total turnaround duration.

### How to See It Performing Its Job on the Live Website
1. Open **`http://localhost:5173/track?code=TICK-1001`** (or open the Admin Dashboard).
2. **Observe Countdown Timer Live:**
   * Notice the timer pill ticking down seconds in real time.
   * If the ticket is fresh, observe the calm green or amber badge.
   * Find an overdue ticket (or test with past target date): observe the bright red **`BREACHED`** badge displaying the exact overdue time.
