# Module M4 - Frontend File 02: Staff Admin Desk Dashboard
## Target File: `frontend/src/pages/AdminDashboard.jsx`
### Execution Track: Phase 4 (Sequential; Requires Files 01, 03, and 04)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In modern enterprise web applications and IT service management (ITSM) platforms, `pages/AdminDashboard.jsx` defines the **Central Administrative Operational Dashboard**. It serves as the primary visual workstation for campus facility supervisors and operations leads: consolidating incoming ticket queues, rendering interactive multi-parameter filter controls, embedding squad workload telemetry, and providing one-click operational tools for manual reassignment and lifecycle advancement.

### Standard Industry Role & Real-World Use Cases
In professional production systems (such as ServiceNow Incident Management, Zendesk Agent Workspace, and Jira Service Management), central administrative dashboards standardly fulfill four core responsibilities:

1. **Queue Slicing & Multi-Dimensional Filtering:**
   * Empowers operational supervisors to filter hundreds of incoming complaints across multiple dimensions simultaneously (by department, priority tier, assigned squad, and resolution status).
   * Ensures that high-risk emergencies (`CRITICAL`) can be isolated in one click during campus-wide incidents.
2. **Aggregating System Telemetry & Workload Context:**
   * Embeds real-time squad workload visualizations directly above or beside the complaint queue.
   * Supervisors can see which squads are nearing capacity before deciding whether to approve, dispatch, or reassign work orders.
3. **Coordinating Operational State Mutations (Human-in-the-Loop Hub):**
   * Acts as the presentation hub for human supervisory interventions: allowing supervisors to launch reassignment dialogs, trigger automated dispatch on unassigned tickets, and log work notes.
4. **Optimistic UI Feedback & Non-Blocking State Management:**
   * Employs React state hooks to deliver snappy user interactions: updating ticket status badges and reassigned squad tags immediately in the UI while network requests resolve asynchronously in the background.

### What WE Are Specifically Using It For in Smart Complaint Handler
In our campus complaint automation platform, our 5-student engineering team specifically uses `frontend/src/pages/AdminDashboard.jsx` for four concrete operational functions:

1. **Displaying the Campus-Wide Complaint Intake Queue:**
   * Renders an interactive table of all submitted student complaints, displaying tracking codes (`TICK-XXXX`), submission timestamps, locations, department badges, priority tags (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), and assigned maintenance squads.
2. **Providing Multi-Parameter Filter Controls:**
   * Includes dropdown filter bars allowing supervisors to slice the queue:
     * Filter by Department (All, Electrical, Plumbing, IT Support, Carpentry, Sanitation, General).
     * Filter by Priority (All, CRITICAL, HIGH, MEDIUM, LOW).
     * Filter by Status (All, SUBMITTED, ASSIGNED, IN_PROGRESS, RESOLVED).
     * Filter by Assigned Squad (All, Hostel Wiring Squad, etc.).
3. **Embedding the Squad Workload Panel (`TeamWorkloadView`):**
   * Embeds our visual workload component at the top of the page, allowing supervisors to monitor all 12 squads' active queue depths without switching pages.
4. **Triggering Reassignments & Quick Dispatches:**
   * Provides a "Reassign Squad" action button on each ticket row that launches `ReassignTeamModal.jsx`.
   * Provides a "Dispatch Now" action button on any ticket with status `SUBMITTED` or `assigned_team == 'Unassigned'`.

### Future AI Integration & Supervisory Dashboard Stability (V2 Roadmap)
While Version 1 displays deterministic queue data, this dashboard is designed as the permanent visual workstation for future AI operations:
* **AI Recommendation Display:** In V2, when AI predictive dispatch models are introduced, this dashboard will render AI confidence badges and predicted repair durations directly in table rows.
* **The Permanent Human Supervisory Hub:** This dashboard serves as the physical interface for human-in-the-loop governance: if an AI model misinterprets a complaint narrative, the supervisor clicks "Reassign Squad" to correct the machine decision, preserving human control.
* **Stable React Architecture:** Upgrading backend services to AI in V2 requires zero refactoring of this dashboard page.

### How Other Components Standardly Interact with This File
Across the frontend architecture, this page coordinates multiple child components:
* **The Application Router (`frontend/src/App.jsx`):** Mounts this page under the client URL route `/admin`.
* **The Squad Workload View (`frontend/src/components/TeamWorkloadView.jsx`):** Rendered at the top of the dashboard to display squad cards and capacity bars.
* **The Reassignment Modal (`frontend/src/components/ReassignTeamModal.jsx`):** Controlled by modal state on this page; receives the selected ticket when a supervisor clicks "Reassign".
* **The API Clients (`frontend/src/api/assignment.js` and `tickets.js`):** Invoked during initial page mount, search keystrokes, and filter adjustments.

### The Core Problem It Solves & Why It Exists
* **The Information Silo Problem:** Without a unified dashboard, supervisors must query the database manually or check paper registers to find out what work is pending.
* **Delayed Emergency Identification:** Without instant color-coded priority filtering, emergency electrical hazards remain buried under dozens of routine furniture complaints.

---

# 2. What Must Be in This File & Why Each Item Is Needed

To be complete, responsive, and production-grade, `frontend/src/pages/AdminDashboard.jsx` must define, configure, and render the following six structural components:

---

### Item 1: React State Hooks for Data & Filtering
* **What it is:** React state hooks managing complaints, loading status, active filters, and modal visibility.
* **Required State Variables:**
  * `tickets`: Array of complaint objects fetched from `/api/v1/tickets/`.
  * `loading`: Boolean indicating whether initial or refresh data fetching is in progress.
  * `error`: String containing error messages if network requests fail.
  * `selectedDept`: String/Integer for active department filter (default: `""` for All).
  * `selectedPriority`: String for active priority filter (default: `""` for All).
  * `selectedStatus`: String for active status filter (default: `""` for All).
  * `searchQuery`: String for live text searching across tracking codes and titles.
  * `activeModalTicket`: Object holding the specific ticket currently being reassigned, or `null` when modal is closed.
* **Why it is needed:**
  * Manages the complete interactive lifecycle of the dashboard without page reloads.

---

### Item 2: Telemetry Workload Panel Integration
* **What it is:** Embedding `<TeamWorkloadView />` at the top of the dashboard.
* **Why it is needed:**
  * Gives supervisors immediate visual context on squad saturation before they reassign tickets or dispatch new complaints.

---

### Item 3: Multi-Parameter Filtering Bar
* **What it is:** A horizontal Tailwind flexbox container housing interactive filter dropdowns and a search input.
* **Elements:**
  * Search input: Live text search with placeholder `"Search by code or title..."`.
  * Department dropdown: Options for all 6 campus departments.
  * Priority dropdown: Options for `CRITICAL`, `HIGH`, `MEDIUM`, and `LOW`.
  * Status dropdown: Options for `SUBMITTED`, `ASSIGNED`, `IN_PROGRESS`, and `RESOLVED`.
  * Refresh button: Triggers data refetch with a rotating sync icon.
* **Why it is needed:**
  * Allows supervisors to isolate specific operational queues in under 1 second.

---

### Item 4: Interactive Complaints Data Table
* **What it is:** A styled HTML `<table>` rendering ticket records with responsive column headers.
* **Columns:**
  1. `Tracking Code`: Bold badge linking to ticket details.
  2. `Title & Location`: Complaint title with secondary location text below.
  3. `Department`: Colored pill badge (e.g. Blue for Electrical, Cyan for Plumbing).
  4. `Priority`: High-contrast severity badge:
     * `CRITICAL`: Red pill with pulse animation (`bg-rose-100 text-rose-800 animate-pulse`).
     * `HIGH`: Orange pill (`bg-amber-100 text-amber-800`).
     * `MEDIUM`: Yellow pill (`bg-yellow-100 text-yellow-800`).
     * `LOW`: Slate pill (`bg-slate-100 text-slate-700`).
  5. `Assigned Squad`: Squad name badge or `"Unassigned"` indicator.
  6. `Status`: Status badge (`SUBMITTED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`).
  7. `Actions`: Interactive buttons for "Reassign" and "Dispatch Now".
* **Why it is needed:**
  * Displays all essential incident data in a compact, scannable format.

---

### Item 5: Quick Operational Action Handlers
* **What it is:** Event handler functions bound to row action buttons:
  * `handleOpenReassign(ticket)`: Sets `activeModalTicket = ticket`, opening the modal.
  * `handleQuickDispatch(ticketId)`: Calls `triggerTicketDispatch(ticketId)`, shows a success toast, and refreshes the ticket row.
* **Why it is needed:**
  * Allows immediate execution of operational commands without navigating to separate pages.

---

### Item 6: Modal Dialog Integration (`ReassignTeamModal`)
* **What it is:** Conditionally rendering `<ReassignTeamModal ticket={activeModalTicket} isOpen={!!activeModalTicket} onClose={() => setActiveModalTicket(null)} onReassigned={handleReassignedSuccess} />`.
* **Why it is needed:**
  * Completes the supervisory reassignment workflow cleanly with modal overlay semantics.

---

# 3. Component Life-Cycle: Input, Process, Output (IPO Table)

The following table documents the component life-cycle for `frontend/src/pages/AdminDashboard.jsx`:

| Life-Cycle Stage | Event Trigger | Internal React Processing | Visual UI Output |
| :--- | :--- | :--- | :--- |
| **Mounting (Fetch)** | Component mounts (`useEffect`) | Calls `fetch('/api/v1/tickets/')`. Sets `loading = true`. | Renders skeleton loader or loading spinner across table. |
| **Data Loaded** | Network promise resolves | Sets `tickets = response.data`, sets `loading = false`. | Renders full complaints table and embeds `<TeamWorkloadView />`. |
| **Filter Applied** | User selects "CRITICAL" priority | React re-evaluates filtered array in memory: `tickets.filter(t => t.priority === 'CRITICAL')`. | Table instantly updates to show only critical emergency complaints. |
| **Search Keystroke** | User types `"TICK-8F"` | Filters tickets by tracking code substring. | Table filters down in real-time as user types. |
| **Reassign Clicked** | User clicks "Reassign" on row | Sets `activeModalTicket = ticket`. | Renders `<ReassignTeamModal />` overlay over the dashboard. |
| **Reassignment Success**| Modal emits `onReassigned` | Updates local ticket in state: `ticket.assigned_team = newTeamName`. | Row updates squad badge immediately; shows success banner. |

---

# 4. Flexibility & Modification Guide: What Can Be Changed vs. Strict Non-Negotiables

To maintain design and functional consistency across the frontend team, follow these rules:

### 🟢 Safe to Modify (Configurable Parameters)
* **Table Styling & Theme Colors:** You can customize Tailwind classes for table borders, hover effects (`hover:bg-slate-50`), and font sizes.
* **Pagination Controls:** You can implement client-side or server-side pagination (e.g. showing 15 tickets per page with Next/Previous buttons).
* **Workload Panel Layout:** You can render `<TeamWorkloadView />` in a collapsible accordion or place it in a side drawer rather than at the top of the page.
* **Column Order:** You can reorder table columns to suit your team's visual preference.

### 🔴 Strict Non-Negotiables (System Breaking Changes)
* **DO NOT Hardcode Ticket Data:** All complaint records must be fetched dynamically from `/api/v1/tickets/` via the API client.
* **DO NOT Omit the Reassignment Audit Reason:** When opening `ReassignTeamModal`, ensure the modal forces the user to enter an explanation before allowing submission.
* **DO NOT Remove Priority Badges:** Priority tiers (`CRITICAL`, `HIGH`, etc.) must remain visually prominent with distinct colors to ensure emergency visibility.
* **DO NOT Mutate State Directly:** Never write `tickets[0].assigned_team = 'New Team'`. Always use React state updater functions (`setTickets(...)`) to trigger component re-renders properly.

---

# 5. Architectural & Theoretical References

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

# 6. Definition of Done: Observable Verification Checklist

Before considering `frontend/src/pages/AdminDashboard.jsx` complete, verify each of the following operational checkpoints:

### Implementation Checklist
- [ ] File exists at `frontend/src/pages/AdminDashboard.jsx`.
- [ ] Fetches tickets on mount using `useEffect` and displays a loading indicator while pending.
- [ ] Embeds `<TeamWorkloadView />` to display squad workload cards.
- [ ] Implements multi-tier filter bar with department, priority, status, and search inputs.
- [ ] Displays complaint table with columns for Code, Title, Location, Department, Priority, Assigned Squad, Status, and Actions.
- [ ] Applies high-contrast styling to priority badges (`CRITICAL` has visible red styling).
- [ ] Each row includes a "Reassign" button that launches `ReassignTeamModal`.
- [ ] Unassigned tickets display a "Dispatch Now" button that calls `triggerTicketDispatch`.
- [ ] Contains zero triple-backtick code blocks.

### Browser Verification Procedure

1. **Verify Dashboard Rendering & Queue Display:**
   * Open the frontend application in your browser: `http://localhost:5173/admin`.
   * Observe that the complaints table renders with ticket tracking codes, department pills, and priority badges.
2. **Verify Priority Filtering:**
   * Select `"CRITICAL"` in the priority filter dropdown.
   * Observe that only critical emergency complaints remain visible in the table.
3. **Verify Reassignment Modal Launch:**
   * Click the "Reassign" button on any complaint row.
   * Observe that the `ReassignTeamModal` dialog opens smoothly over the dashboard, populated with the selected ticket's details.
