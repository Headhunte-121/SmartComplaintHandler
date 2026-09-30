# Module M4 - Frontend File 03: Squad Workload Telemetry Panel
## Target File: `frontend/src/components/TeamWorkloadView.jsx`
### Execution Track: Phase 2 (Can be built in parallel with Files 01 and 04)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In modern operational management platforms and Field Service Management (FSM) user interfaces, `components/TeamWorkloadView.jsx` defines the **Real-Time Workforce Telemetry & Capacity Visualization Component**. It renders an interactive dashboard panel displaying the operational health, queue depth, shift availability, and saturation levels across all maintenance workgroups.

### Standard Industry Role & Real-World Use Cases
In professional production systems (such as dispatch consoles in logistics, healthcare triage boards, and IT incident command centers), visual telemetry panels standardly fulfill four core architectural duties:

1. **At-a-Glance Cognitive Load Reduction:**
   * Replaces dense tabular spreadsheets with intuitive, color-coded visual cards.
   * Enables dispatchers and supervisors to evaluate workforce availability and queue depth across multiple departments in less than 3 seconds.
2. **Visual Capacity Banding & Early Warning Indicators:**
   * Renders dynamic capacity progress bars that transition from green (under-capacity) to yellow (moderate) to red (saturated).
   * Alerts supervisors when specific squads approach critical overload before dispatch bottlenecks occur.
3. **Interactive Operational Shift Controls (Shift Toggling):**
   * Embeds micro-interaction controls (such as toggle switches) allowing supervisors to adjust squad on-duty states directly from the telemetry card without navigating to administrative settings pages.
4. **Decoupled Reusable Presentation:**
   * Implemented as an independent React component that accepts optional filter props (`selectedDepartmentId`), enabling it to be embedded inside the main Admin Desk, rendered in a standalone monitoring kiosk, or loaded into a mobile supervisor app.

### What WE Are Specifically Using It For in Smart Complaint Handler
In our campus complaint automation platform, our 5-student engineering team specifically uses `frontend/src/components/TeamWorkloadView.jsx` for four concrete operational functions:

1. **Visualizing All 12 Campus Maintenance Squads:**
   * Renders a responsive Tailwind CSS card grid displaying all 12 campus squads across our 6 departments (Electrical, Plumbing, Carpentry, IT Support, Sanitation, General Admin).
2. **Displaying Real-Time Queue Depths:**
   * Renders the current count of active complaints (`ASSIGNED` and `IN_PROGRESS`) for each squad, paired with a visual progress bar indicating saturation against a maximum threshold of 10 tickets.
3. **Applying Color-Coded Workload Status Badges:**
   * Visualizes the status band computed by the backend:
     * `LOW` (0-2 tickets): Emerald green pill badge (`bg-emerald-100 text-emerald-800`).
     * `NORMAL` (3-5 tickets): Blue pill badge (`bg-blue-100 text-blue-800`).
     * `HIGH` (6-8 tickets): Amber pill badge (`bg-amber-100 text-amber-800`).
     * `AT_CAPACITY` (9+ tickets): Rose pill badge with alert styling (`bg-rose-100 text-rose-800 font-bold`).
4. **Providing Shift Availability Toggles:**
   * Includes a toggle switch on each card. Clicking the toggle invokes `toggleSquadAvailability(teamId, !is_active)`, instantly taking squads on or off duty with optimistic UI updates.
   * If a squad is toggled off-duty, the card dims visually (`opacity-60 bg-slate-100`) and displays an `"Off-Duty"` badge, signaling that the automated dispatch engine will bypass this crew.

### Future AI Integration & Workforce Telemetry Stability (V2 Roadmap)
While Version 1 displays queue depth based on ticket counts, this component is designed as the permanent presentation shell for future AI workforce intelligence:
* **Dynamic AI Workload Gauges:** In V2, the progress bar will reflect *estimated labor hours* calculated by machine learning models rather than simple ticket counts (e.g. showing that 2 heavy motor rewiring jobs equal 12 hours of labor).
* **AI Recommendation Highlights:** Future AI models can highlight candidate squads with visual pulsing borders (`ring-2 ring-indigo-500`) to recommend the optimal squad to the supervisor before a manual reassignment.
* **Stable Interface:** Upgrading the backend to predictive AI requires zero changes to this component's DOM structure or prop interfaces.

### How Other Components Standardly Interact with This File
Across the frontend architecture, this component is consumed cleanly:
* **The Staff Admin Desk (`frontend/src/pages/AdminDashboard.jsx`):** Renders this component at the top of the dashboard page, passing `selectedDepartmentId` when the supervisor filters by department.
* **The Assignment API Client (`frontend/src/api/assignment.js`):** Invoked by this component's `useEffect` to fetch telemetry data (`fetchSquadWorkloads`) and toggle availability (`toggleSquadAvailability`).

### The Core Problem It Solves & Why It Exists
* **The "Blind Reassignment" Problem:** Without visual queue depths, a supervisor transferring a complaint might reassign it to a squad that already has 12 urgent tickets. This panel provides the context needed to make informed reassignments.
* **Technician Burnout:** By giving real-time visibility into workload imbalances, the team can rebalance squads before technicians become overwhelmed.

---

# 2. What Must Be in This File & Why Each Item Is Needed

To be complete, responsive, and production-grade, `frontend/src/components/TeamWorkloadView.jsx` must define and render the following five structural components:

---

### Item 1: Component Props Specification
* **What it is:** Accepted properties passed down from parent views.
* **Props:**
  * `selectedDepartmentId: Optional[number]` (defaults to `null` to show all squads, or filters cards for a single department).
  * `onSquadSelect: Optional[function]` (optional callback fired when a supervisor clicks a card to filter the ticket table below).
* **Why it is needed:**
  * Allows the panel to adapt seamlessly whether viewing the entire campus or drilling into a specific department.

---

### Item 2: Internal React State Management
* **What it is:** State hooks managing telemetry data and loading states.
* **Required State Variables:**
  * `workloads`: Array of `TeamWorkloadResponse` objects.
  * `loading`: Boolean indicating active API fetching.
  * `error`: Error string if network requests fail.
  * `togglingSquadId`: Integer ID of a squad currently having its shift toggled, disabling double-clicks.
* **Why it is needed:**
  * Encapsulates the complete asynchronous telemetry fetching lifecycle.

---

### Item 3: Responsive Tailwind Grid Container
* **What it is:** A CSS grid container that adapts across screen sizes.
* **Layout Classes:** `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6`
* **Why it is needed:**
  * Renders cleanly on laptop screens (4 columns), tablets (2 columns), and mobile screens (1 column).

---

### Item 4: Individual Squad Telemetry Card Elements
* **What it is:** The visual card rendered for each squad in the grid.
* **Card Anatomy:**
  1. **Header Row:**
     * Squad Name (`text-sm font-semibold text-slate-800`).
     * Department Pill Badge (`text-xs text-slate-500`).
  2. **Active Workload Metrics:**
     * Big numeric counter: `active_ticket_count` with label `"Active Tickets"`.
     * Workload Status Pill: Color-coded badge (`LOW`, `NORMAL`, `HIGH`, `AT_CAPACITY`).
  3. **Queue Saturation Progress Bar:**
     * Background track: `w-full bg-slate-200 h-2 rounded-full overflow-hidden`.
     * Animated fill bar: `h-full transition-all duration-500` with width proportional to `(active_ticket_count / 10) * 100%`.
     * Dynamic color classes based on `workload_status`:
       * `LOW`: `bg-emerald-500`
       * `NORMAL`: `bg-blue-500`
       * `HIGH`: `bg-amber-500`
       * `AT_CAPACITY`: `bg-rose-500`
  4. **Footer Shift Toggle Switch:**
     * Interactive toggle button with label `"On-Duty"` / `"Off-Duty"`.
     * Off-duty cards display a muted visual style (`opacity-60 bg-slate-50 border-dashed`).
* **Why it is needed:**
  * Packages all operational squad metrics into a clean, scannable visual format.

---

### Item 5: Optimistic Shift Toggle Handler
* **What it is:** Event handler for the availability toggle switch.
* **Behavior:**
  1. Sets `togglingSquadId = squad.team_id`.
  2. Optimistically flips `is_active` in local React state:
     `setWorkloads(prev => prev.map(s => s.team_id === squad.team_id ? { ...s, is_active: !s.is_active } : s));`
  3. Calls `toggleSquadAvailability(squad.team_id, !squad.is_active)` via API client.
  4. If the network call fails, reverts local state and shows an error banner.
  5. Clears `togglingSquadId`.
* **Why it is needed:**
  * Delivers instantaneous UI feedback without page delays while preserving backend consistency.

---

# 3. Component Life-Cycle: Input, Process, Output (IPO Table)

The following table documents the component life-cycle for `frontend/src/components/TeamWorkloadView.jsx`:

| Stage | Trigger Event | Internal Processing | Visual UI Output |
| :--- | :--- | :--- | :--- |
| **Mounting** | Component renders | Calls `fetchSquadWorkloads(selectedDepartmentId)`. Sets `loading = true`. | Renders 4 animated skeleton placeholder cards. |
| **Telemetry Ingestion** | Promise resolves | Populates `workloads` state array; sets `loading = false`. | Renders full grid of 12 squad cards with active queue bars and badges. |
| **Department Filter** | `selectedDepartmentId` prop updates | Filters in-memory workloads or refetches for department. | Grid updates to show only the squads belonging to that department. |
| **Shift Toggle Click** | User clicks "On-Duty" switch | 1. Flips `is_active` in state.<br>2. Dispatches HTTP PATCH.<br>3. Reverts on failure. | Toggle switch flips instantly; card dims if off-duty; updates availability tag. |

---

# 4. Flexibility & Modification Guide: What Can Be Changed vs. Strict Non-Negotiables

To preserve UI harmony and functional reliability, adhere to the following rules:

### 🟢 Safe to Modify (Configurable Parameters)
* **Maximum Queue Bar Threshold:** You can adjust the scale divisor for the progress bar (e.g. changing max capacity from `10` to `15` tickets).
* **Card Border & Background Themes:** You can customize Tailwind classes for card styling (e.g. rounded corners `rounded-xl`, shadow levels `shadow-sm`).
* **Grid Columns:** You can adjust responsive column breakpoints (e.g. changing `lg:grid-cols-4` to `lg:grid-cols-3` for wider cards).
* **Refresh Intervals:** You can add an automatic polling interval using `setInterval` (e.g. refreshing queue depths every 30 seconds).

### 🔴 Strict Non-Negotiables (System Breaking Changes)
* **DO NOT Omit the Shift Toggle Error Rollback:** If the network request fails, you MUST revert the optimistic `is_active` toggle. Leaving the UI showing "Off-Duty" when the database is still "On-Duty" causes operational confusion.
* **DO NOT Hardcode Squad Names:** Squad names, departments, and active counts must be populated from the API response payload.
* **DO NOT Clamp Active Counts Below Zero:** Ensure queue count displays strictly reflect the backend `active_ticket_count`.

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

---

---

## Section 6: Definition of Done & Live Website Verification

### What This File Is Responsible For
This React component (`frontend/src/components/TeamWorkloadView.jsx`) is responsible for **visualizing technician team capacity, active ticket queues, and squad availability metrics**. It translates raw workload numbers into clear, color-coded capacity meters.

### What It Should Perform
When rendered inside the dashboard, this component performs:
1. **Dynamic Capacity Bars:** Renders visual progress bars indicating team queue saturation (green for $<60\%$, amber for $60-85\%$, red for $>85\%$).
2. **Status Pill Indicators:** Displays squad availability pills (`Available`, `Busy`, `At Capacity`).
3. **Real-Time Telemetry:** Updates reactively when tickets are assigned or reassigned without requiring a full page refresh.

### How to See It Performing Its Job on the Live Website
Follow these detailed steps to verify the workload panel:

1. **Inspect Team Cards on the Admin Desk:**
   * Open **`http://localhost:5173/admin`**.
   * Look at the **Team Workload Overview** panel in the right sidebar.
   * Confirm that each maintenance squad has a dedicated card displaying:
     * Team Name and Department
     * Active ticket count vs capacity (e.g. `1/10 tickets`)
     * Visual progress bar filled to the exact percentage
     * Availability status badge (`Available`, `Busy`, `At Capacity`)

2. **Verify Color Threshold Transitions:**
   * Check progress bar colors:
     * `<60%` saturation displays in emerald green (`bg-emerald-500`).
     * `60-85%` saturation displays in amber (`bg-amber-500`).
     * `>85%` saturation displays in crimson red (`bg-rose-500`).

3. **Verify Reactive Progress Bar Updates:**
   * Reassign a ticket to a squad: observe that squad's progress bar smoothly expand in real time without reloading the page.
