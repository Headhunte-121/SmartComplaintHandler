# Module M5 Frontend: SLA Breach Escalation Panel Specification

Authoritative Engineering Blueprint for `src/components/SLABreachTable.jsx`.

---

## Section 1: Standard Purpose & Industry Role

### Standard Industry Role & Real-World Use Cases
In high-volume service delivery platforms (such as emergency medical dispatch, airline operations, or IT infrastructure monitoring), operational managers cannot afford to hunt through thousands of routine tickets to find the three critical issues that are about to fail contractual commitments. Operational dashboards must provide Exception-Based Reporting (a management philosophy where systems automatically isolate, highlight, and surface only the anomalous cases requiring human intervention, while filtering out routine on-track workflows).

An SLA breach escalation panel (a dedicated supervisory workstation that filters, ranks, and surfaces active tickets that have breached or are in imminent danger of breaching their resolution deadlines) acts as the control tower of the organization.

In enterprise facility operations, this panel enables supervisors to:
1. Identify chronic operational bottlenecks across maintenance squads.
2. Intervene proactively on near-breach tickets before students experience prolonged utility outages.
3. Reassign stagnant tickets or authorize overtime dispatch with single-click escalation actions.

### What WE Are Specifically Using It For in Smart Complaint Handler
In `SmartComplaintHandler`, `src/components/SLABreachTable.jsx` is the primary supervisory oversight component embedded within `AdminDashboard.jsx` (Module M4):
1. It queries `GET /api/v1/sla/breaches/active` via `fetchActiveBreaches()` from `@/api/sla` on initial mount and continuously polls for updates every 30 seconds (`refreshInterval = 30000`).
2. It renders an exception-based monitoring workstation displaying:
   - A high-visibility header banner with a pulsing red counter pill ("3 Active SLA Breaches").
   - Filter tabs allowing supervisors to view "All High-Risk Issues", "Overdue (Breached)", or "Approaching Breach (< 20% time remaining)".
   - A structured data table rendering: Monospace Tracking Code, Title & Location, Department & Assigned Squad, Priority Badge, Live Overdue Duration, and Supervisory Action Buttons.
3. It integrates single-click supervisory actions:
   - "Escalate": Opens an escalation dialog to elevate supervisor visibility.
   - "Reassign Squad": Launches `ReassignTeamModal.jsx` (Module M4) to transfer the overdue ticket to a less-loaded maintenance team.
4. When zero breaches exist across the campus, it renders a reassuring emerald empty state: "Zero Active SLA Breaches. All campus maintenance queues are operating within target deadlines."

### Future AI Integration & Roadmap Hooks
In Version 2 (V2), when our platform introduces automated AI-driven operational optimization via Gemini API, this breach escalation panel provides:
1. AI Predictive Root-Cause Badges: Machine learning analysis tags embedded in table rows explaining why a ticket is delayed (e.g. "AI Diagnostic: Delayed by specialty part delivery" or "Squad 1 currently at 120% capacity").
2. AI One-Click Rebalancing Recommendation: A supervisory action button ("Apply AI Rebalance") that automatically computes the optimal squad reassignment across all breached tickets to minimize campus-wide resolution delays.
3. Real-Time WebSocket Streaming: Replacing 30-second interval polling with an active WebSocket feed from backend Gemini monitoring agents, streaming instant table row updates when operational anomalies are detected.

### How Other Components Standardly Interact with This File
1. `AdminDashboard.jsx` (Module M4) embeds `<SLABreachTable onEscalate={handleOpenEscalateModal} onReassign={handleOpenReassignModal} />` as the top priority section above the general ticket table.
2. It interacts downward with `src/api/sla.js` (Module M5) to fetch breach data and dispatch escalation requests.
3. It embeds `<PriorityBadge />` (Module M3) to render high-contrast priority indicators for each row.

### The Core Problem It Solves & Why It Exists
Without this breach escalation panel:
- Overdue tickets remain buried on page 4 of the general ticket table, unnoticed by staff until angry students escalate to university deans.
- Supervisors have no way of knowing which maintenance squads are consistently falling behind on repairs.
- Operational managers waste hours manually cross-referencing timestamps to figure out which issues need immediate dispatch.

---

## Section 2: What Must Be in This File & Why Each Item Is Needed

### 1. Component Props Contract
* `onEscalate`: Callback function `(ticket) => void` triggered when a supervisor clicks the "Escalate" button on a specific row.
* `onReassign`: Callback function `(ticket) => void` triggered when a supervisor clicks the "Reassign Squad" button.
* `refreshInterval`: Integer polling frequency in milliseconds (defaults to `30000` ms / 30 seconds).

### 2. Internal State Architecture
* `breaches`: Array of `SLABreachResponse` objects fetched from the backend.
* `isLoading`: Boolean loading indicator for initial data fetch.
* `filterTier`: String state for active tab: `'ALL'`, `'BREACHED'`, `'APPROACHING'`. Defaults to `'ALL'`.
* `lastRefreshed`: JavaScript Date object recording when data was last polled.

### 3. Data Fetching & Polling Lifecycle (`useEffect`)
* Initial Mount Fetch: Dispatches `loadBreaches()` immediately when the component mounts.
* Periodic Interval Polling:
  - Establishes `const pollTimer = setInterval(loadBreaches, refreshInterval)`.
  - Cleans up with `return () => clearInterval(pollTimer)` on unmount to prevent memory leaks.
* Manual Refresh Trigger: A reload button in the header allowing supervisors to refresh the table instantly.

### 4. Visual Header & Metric Counter Section
* Header Container: A top flex row with class `flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6`.
* Title & Counter Badge:
  - Heading: `<h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">Active SLA Escalations & Breaches</h3>`.
  - Overdue Counter Pill:
    - If breaches exist: `<span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-300 animate-pulse">{overdueCount} Breached</span>`.
    - If zero breaches: `<span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">0 Overdue</span>`.
* Filter Tabs Bar:
  - Interactive tabs:
    - Tab 1: "All High-Risk Issues ({breaches.length})"
    - Tab 2: "Overdue Breaches ({overdueCount})"
    - Tab 3: "Approaching Breach ({approachingCount})"

### 5. Table Columns & Action Cell Hierarchy
* Responsive Table Container: `<div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">`.
* Column Headers:
  - Column 1: "Tracking Code" (Monospace tracking code with status indicator dot).
  - Column 2: "Issue Title & Location" (Title in bold, location in muted subtext with map pin icon).
  - Column 3: "Department & Squad" (Department title pill, assigned squad name).
  - Column 4: "Priority" (Rendered via `<PriorityBadge priority={ticket.priority} />`).
  - Column 5: "SLA Status / Overdue Duration" (Pulsing red text `"1h 45m overdue"` or amber `"35m remaining"`).
  - Column 6: "Supervisory Actions" (Flex row of action buttons).
* Row Action Buttons:
  - "Escalate": Amber/Rose outline button: `<button onClick={() => onEscalate(ticket)} className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100 ...">Escalate</button>`.
  - "Reassign": Indigo outline button: `<button onClick={() => onReassign(ticket)} className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 ...">Reassign</button>`.

### 6. Empty State Component
* Rendered when `breaches.length === 0`:
  - Green-tinted callout container: `bg-emerald-50/50 border border-emerald-200 rounded-2xl p-8 text-center`.
  - Centered SVG shield checkmark icon: `text-emerald-600 h-12 w-12 mx-auto mb-3`.
  - Heading: "Zero Active SLA Breaches".
  - Explanation: "All campus maintenance queues are operating within target response windows. Routine tickets are under active investigation."

---

## Section 3: Component Life-Cycle: Input, Process, Output (IPO Table)

| Life-Cycle Phase | Primary Input | Internal Transformation & Logic | Final Output |
| :--- | :--- | :--- | :--- |
| **1. Initial Mounting** | Component mounts in `AdminDashboard` | Dispatches `fetchActiveBreaches(0.20)`; sets `isLoading = true`; starts 30s interval timer. | Displays table skeleton loader, followed by populated breach rows. |
| **2. Tab Filtering** | Supervisor clicks "Overdue Breaches" | Sets `filterTier = 'BREACHED'`; filters rows where `overdue_seconds > 0`. | Table instantaneously hides near-breach rows, displaying only overdue tickets. |
| **3. Periodic Auto-Refresh** | 30 seconds elapse | Background `pollTimer` executes `fetchActiveBreaches()`; updates state silently. | Table rows re-evaluate; new breaches appear; resolved tickets disappear. |
| **4. Action Delegation** | Supervisor clicks "Escalate" on Row 1 | Invokes `onEscalate(ticket)` prop callback with row data. | Triggers parent dashboard to mount escalation modal dialog. |
| **5. Unmount Cleanup** | User navigates to another page | React calls unmount hook; executes `clearInterval(pollTimer)`. | Polling timer terminated; memory freed cleanly. |

---

## Section 4: Flexibility & Modification Guide

### 🟢 Safe to Modify & Customize
* **Polling Frequency**: You may adjust `refreshInterval` from `30000` ms (30s) to `60000` ms (1 minute) if you wish to reduce local API polling traffic.
* **Table Column Ordering**: You can re-arrange table columns (e.g. moving Priority before Title) to suit specific administrative preference without altering component logic.
* **Empty State Messaging**: You may customize the empty state congratulatory message or add institutional facilities contact links.

### 🔴 Strict Non-Negotiables (Do NOT Alter)
* **Polling Cleanup Function**: You must retain `return () => clearInterval(pollTimer)` inside the `useEffect` hook. Without this, navigating back and forth across dashboard views will spawn multiple concurrent polling intervals that flood the backend with duplicate requests.
* **Action Delegation via Props**: Action buttons must delegate through `onEscalate` and `onReassign` callback props rather than modifying state locally. This pattern preserves unidirectional data flow and allows the parent dashboard to orchestrate modal overlays.
* **Case-Insensitive Priority Rendering**: Ensure priority values are normalized before passing to `<PriorityBadge />`.

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

## Section 6: Definition of Done & Verification Protocol

### Observable Verification Checklist
* [ ] `src/components/SLABreachTable.jsx` exists and is exported as default.
* [ ] Accepts `onEscalate`, `onReassign`, and `refreshInterval` props.
* [ ] Queries `fetchActiveBreaches()` on mount and polls every 30 seconds.
* [ ] Displays header with overdue counter pill and manual refresh button.
* [ ] Filter tabs switch smoothly between "All", "Overdue", and "Approaching".
* [ ] Table rows render Monospace Tracking Code, Title, Location, Department, Priority Badge, and Overdue time.
* [ ] Clicking "Escalate" triggers `onEscalate(ticket)`.
* [ ] Clicking "Reassign" triggers `onReassign(ticket)`.
* [ ] When zero breaches exist, renders the emerald "Zero Active SLA Breaches" callout card.
* [ ] Unmounting the component cleans up background polling intervals cleanly.

### Verification Commands & Troubleshooting Matrix

1. **Verify Table Rendering with Active Breaches:**
   Ensure backend has at least one overdue ticket (deadline in the past).
   Open browser to `http://localhost:5173/admin`.
   Observe: The SLA Breach Table renders at the top of the page.
   Verify the red counter displays `X Breached`. Verify row displays tracking code, priority badge, and red overdue text.

2. **Verify Filter Tabs:**
   Click "Overdue Breaches" tab. Confirm only rows with overdue text are visible.
   Click "All High-Risk Issues" tab. Confirm all high-risk rows return.

3. **Verify Action Delegation Buttons:**
   Click "Escalate" on Row 1.
   Verify that the browser or parent dashboard registers the click event and receives the ticket entity.
   Click "Reassign Squad" on Row 1.
   Verify the reassignment modal opens with Row 1's ticket pre-populated.

4. **Verify Empty State Rendering:**
   When all tickets in the database are on track or resolved:
   Verify the table collapses and the emerald callout card renders: "Zero Active SLA Breaches. All campus maintenance queues are operating within target response windows."

5. **Troubleshooting Matrix:**
   * *Problem:* Table never updates automatically after 30 seconds.
     * *Cause:* `setInterval` was not registered or `refreshInterval` was passed as `0`.
     * *Fix:* Check `setInterval(loadBreaches, refreshInterval)` is called in `useEffect`.
   * *Problem:* Console throws error `TypeError: onEscalate is not a function`.
     * *Cause:* Parent component did not pass `onEscalate` prop.
     * *Fix:* Add defensive check in button handler: `if (onEscalate) onEscalate(ticket);`.
   * *Problem:* Table displays empty even though tickets in SQLite are overdue.
     * *Cause:* The backend endpoint `/api/v1/sla/breaches/active` returned an empty array because `threshold_ratio` was miscalculated or `Ticket.status` was already set to `RESOLVED`.
     * *Fix:* Inspect terminal `curl http://127.0.0.1:8000/api/v1/sla/breaches/active` to verify backend response.
