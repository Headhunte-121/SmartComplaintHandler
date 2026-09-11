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

# 5. Advanced Frontend Concepts Explained: State & React Architecture

### 1. Optimistic State Updates with Error Reversion
* **The Concept:** When a user flips an interactive toggle switch, waiting for a network roundtrip (200-500ms) makes the interface feel sluggish and unresponsive.
* **How Optimistic Updates Work:**
  * We immediately update the React state variable (`setWorkloads(...)`) so the toggle flips instantaneously ($0\text{ms}$ delay).
  * Simultaneously, we dispatch the asynchronous network call `toggleSquadAvailability()` in the background.
  * If the network call succeeds, nothing more needs to be done.
  * If the network call fails (e.g. WiFi drops or server returns 500), the `catch` block intercepts the error, alerts the user, and reverts the state back to its previous value. This delivers maximum responsiveness without sacrificing data integrity.

### 2. Micro-Interactions & Accessible State Indicators
* **The Concept:** Micro-interactions are subtle visual animations and state transitions that convey meaning to the user.
* **How We Apply Them in Squad Cards:**
  * When a squad goes off-duty, we don't just change a text label; we apply CSS transition classes (`transition-all duration-300 opacity-60 bg-slate-50 border-dashed`).
  * The supervisor immediately perceives that the squad is inactive, even when scanning the screen peripherally.

### 3. Dynamic Progress Bar Normalization
* **The Concept:** A progress bar element requires a percentage value between $0\%$ and $100\%$.
* **The Math:**
  * We calculate: `const percentage = Math.min(Math.round((squad.active_ticket_count / 10) * 100), 100);`
  * Using `Math.min(..., 100)` ensures that if an emergency causes a squad to have 14 active tickets, the progress bar stays at $100\%$ width rather than overflowing its visual container.

---

# 6. Definition of Done: Observable Verification Checklist

Before considering `frontend/src/components/TeamWorkloadView.jsx` complete, verify each of the following operational checkpoints:

### Implementation Checklist
- [ ] File exists at `frontend/src/components/TeamWorkloadView.jsx`.
- [ ] Fetches squad workloads on mount using `fetchSquadWorkloads`.
- [ ] Renders a responsive grid of squad cards with names, departments, and active counts.
- [ ] Displays color-coded progress bars matching `workload_status` (`LOW`, `NORMAL`, `HIGH`, `AT_CAPACITY`).
- [ ] Each card includes an interactive toggle switch for shift availability.
- [ ] Shift toggles execute optimistic updates with error rollback handling.
- [ ] Off-duty squads render with distinct muted styling and an "Off-Duty" badge.
- [ ] Contains zero triple-backtick code blocks.

### Browser Verification Procedure

1. **Verify Workload Grid Rendering:**
   * Open `http://localhost:5173/admin`.
   * Observe that 12 squad cards appear in a clean grid at the top of the dashboard.
2. **Verify Progress Bar Colors:**
   * Verify that squads with 0-2 tickets display emerald green bars, and squads with higher loads display blue, yellow, or red bars.
3. **Verify Shift Toggle Interaction:**
   * Click the "On-Duty" switch on "Hostel Wiring Squad".
   * Observe that the card immediately dims to an off-duty appearance, and the toggle flips to "Off-Duty".
   * Check the Browser Network Tab: Verify that a `PATCH /api/v1/teams/1/availability` request was sent with `{"is_active": false}` returning HTTP 200.
