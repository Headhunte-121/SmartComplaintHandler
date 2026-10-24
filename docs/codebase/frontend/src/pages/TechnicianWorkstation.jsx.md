# TechnicianWorkstation.jsx — Exhaustive Sequential Technical Documentation

> **File Path**: `frontend/src/pages/TechnicianWorkstation.jsx`  
> **Target Audience**: College Viva Examiners, Project Review Committee, Academic Evaluators, and Engineers grounded in foundational C and Python programming.  
> **Module Classification**: Frontend Field Technician Operations Console / Squad Work Order Dispatch Engine / Closed-Loop Resolution Workstation.

---

## 1. Module Overview & Architectural Purpose

In enterprise facility management platforms, frontline technicians require a streamlined, distraction-free console optimized for on-site mobile and tablet devices. `TechnicianWorkstation.jsx` provides the **dedicated boots-on-the-ground repair workbench** strictly designed for campus technicians across all trades (Electrical, Plumbing, Sanitation, Carpentry, and IT Network Operations).

This workstation enforces a rigorous, auditable maintenance lifecycle through five foundational mechanisms:
1. **Automated Squad Detection**: Inspects the authenticated technician's user profile (`teamId`, department name, or email) to automatically bind their view to their specific squad queue without requiring manual squad switching.
2. **Deterministic Lifecycle State Transitions**:
   - `ASSIGNED` &rarr; `IN_PROGRESS`: Technician clicks "Commence Work" to clock in on-site diagnostics.
   - `IN_PROGRESS` &rarr; `ON_HOLD`: Allows technicians to pause work orders when awaiting replacement inventory (e.g. circuit breakers, water valves) with mandatory justification notes.
   - `ON_HOLD` &rarr; `IN_PROGRESS`: Allows resuming repair once parts are acquired.
   - `IN_PROGRESS` &rarr; `RESOLVED`: Enforces closed-loop verification by requiring technicians to record detailed closure notes and itemize replaced parts before ticket resolution is accepted.
3. **Structured Supervisory Escalation**: Provides a safety valve for edge cases (e.g., misrouted trade assignment, campus safety hazards, or capacity constraints). Features four pre-configured escalation templates with automated text generation and target squad recommendations.
4. **High-Urgency Critical Queue Alerts**: Highlights tickets having `CRITICAL` priority or `ESCALATED` status in prominent warning cards, keeping emergency incidents front-and-center.
5. **Real-Time SLA Countdown Telemetry**: Embeds `SLACountdownTimer` on all active work orders, preventing deadline breaches through clear visual countdowns.

### Foundational Programming Analogy (C & Python)
- In **C programming**, think of this console as an event-driven Finite State Machine (FSM):
  ```c
  enum TicketStatus { ASSIGNED, IN_PROGRESS, ON_HOLD, ESCALATED, RESOLVED, CLOSED };
  void transition_state(Ticket* t, enum TicketStatus next, const char* audit_note) {
      log_audit_trail(t, audit_note);
      t->status = next;
      update_database(t);
  }
  ```
- In **Python (`Celery` / `FastAPI`)**, it represents a technician task worker dashboard processing work orders from an assigned message queue, transitioning job states, and emitting status telemetry.

---

## 2. Integrated Sequential Code Walkthrough & Inline Technical Breakdown

Below is the exhaustive, sequential, line-by-line examination of `TechnicianWorkstation.jsx`.

---

### Snippet 1: Module Header, React Hooks, Router & Component Imports

```javascript
/**
 * SmartComplaintHandler - Field Technician Workstation
 * Dedicated boots-on-the-ground repair console strictly for Technicians.
 * Auto-detects assigned squad, provides live SLA countdowns, parts-needed hold gates,
 * and closed-loop resolution verification.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchComplaints } from '../api/complaints';
import { updateTicketStatus, escalateTicket } from '../api/sla';
import PriorityBadge from '../components/PriorityBadge';
import SLACountdownTimer from '../components/SLACountdownTimer';
import ResolutionNotesModal from '../components/ResolutionNotesModal';
```

#### Plain-English Purpose & C/Python Analogy
Imports standard React state and memoization hooks, routing links, authentication/theme providers, API mutation functions (`updateTicketStatus`, `escalateTicket`), and specialized operational modal components.
- In **C**, this corresponds to `#include` directives bringing in network API drivers, string builders, and modal dialog handlers.
- In **Python**, it corresponds to importing REST client methods, datetime helpers, and UI component definitions.

#### Line-by-Line Breakdown
- **Lines 1–6**: File docstring defining operational requirements (auto-detected squad, live SLA countdowns, hold gates, and resolution verification).
- **Line 7**: Imports `React`, `useState`, `useEffect`, and `useMemo`.
- **Line 8**: Imports `Link` from `react-router-dom`.
- **Lines 9–10**: Imports `useAuth` and `useTheme` hooks.
- **Line 11**: Imports `fetchComplaints` API function.
- **Line 12**: Imports `updateTicketStatus` and `escalateTicket` from `api/sla.js`.
- **Lines 13–15**: Imports reusable components: `PriorityBadge`, `SLACountdownTimer`, and `ResolutionNotesModal`.

---

### Snippet 2: Campus Squads Dataset & Escalation Presets Configuration

```javascript
const CAMPUS_SQUADS = [
  { id: 1, name: 'Substation High-Voltage Team', dept: 'Electrical' },
  { id: 6, name: 'Hostel Electrical Squad 1', dept: 'Electrical' },
  { id: 2, name: 'Water Supply Rapid Response', dept: 'Plumbing' },
  { id: 7, name: 'Hostel Plumbing Squad 2', dept: 'Plumbing' },
  { id: 3, name: 'Sanitation Rapid Response', dept: 'Sanitation' },
  { id: 4, name: 'Structural Fixtures Crew', dept: 'Carpentry' },
  { id: 5, name: 'Network & Wi-Fi Squad', dept: 'IT Support' },
];

const ESCALATION_PRESETS = [
  {
    id: 'misrouted',
    icon: '🏐',
    label: 'Misrouted Category / Wrong Squad',
    hint: 'Issue belongs to a different trade (e.g. sports nets, carpentry, civil fixtures).',
    defaultTarget: 'Carpentry (Structural Fixtures Crew)',
    getText: (ticket, squad) =>
      `Misrouted ticket: The reported issue ("${ticket.title}") does not pertain to the ${squad.name} (${squad.dept}) trade. Requesting supervisor review and manual reassignment to the appropriate maintenance crew.`,
  },
  {
    id: 'parts',
    icon: '📦',
    label: 'Parts / Vendor Procurement Required',
    hint: 'Specialized replacement materials or external vendor contractor required.',
    defaultTarget: '',
    getText: (ticket, squad) =>
      `Parts / Procurement dependency: Resolution of work order "${ticket.title}" requires specialized replacement parts or vendor intervention not available in ${squad.name} inventory.`,
  },
  {
    id: 'hazard',
    icon: '⚠️',
    label: 'Structural / Campus Safety Hazard',
    hint: 'Physical or safety hazard requiring immediate inspection and site containment.',
    defaultTarget: '',
    getText: (ticket, squad) =>
      `Campus Safety Hazard: Physical risk observed on-site for ticket "${ticket.title}". Immediate supervisor inspection and safety protocol activation requested.`,
  },
  {
    id: 'capacity',
    icon: '⏱️',
    label: 'Scope Exceeds Capacity / SLA Risk',
    hint: 'Scope or backlog threatens SLA breach without cross-squad support.',
    defaultTarget: '',
    getText: (ticket, squad) =>
      `Capacity constraint / SLA risk: Repair work for ticket "${ticket.title}" exceeds single-technician shift capacity. Requesting supervisor assistance or workload rebalancing.`,
  },
];
```

#### Plain-English Purpose & C/Python Analogy
Defines two constant data tables:
1. `CAMPUS_SQUADS`: Master mapping of squad identifiers, squad names, and trade departments.
2. `ESCALATION_PRESETS`: Reusable escalation templates providing one-tap justification text generation for field technicians.
- In **C**, these are constant arrays of structs (`const Squad CAMPUS_SQUADS[]`, `const EscalationPreset ESCALATION_PRESETS[]`).
- In **Python**, they are module-level lists of dictionaries with generator lambda functions.

#### Line-by-Line Breakdown
- **Lines 17–25**: `CAMPUS_SQUADS`: Seven institutional squads covering High-Voltage, Hostel Electrical, Water Supply, Hostel Plumbing, Sanitation, Carpentry/Fixtures, and IT Networking.
- **Lines 27–64**: `ESCALATION_PRESETS`: Four standardized operational escalation scenarios:
  - `misrouted`: Used when an issue is assigned to the wrong squad (e.g. sports net repair routed to electrical).
  - `parts`: Used when spare parts are not in stock.
  - `hazard`: Used for physical, electrical, or structural safety hazards requiring immediate site isolation.
  - `capacity`: Used when ticket volume or complexity threatens SLA breach.
  - Each preset defines an `icon`, `label`, `hint`, `defaultTarget`, and a `getText(ticket, squad)` generator function.

---

### Snippet 3: Component Signature & Auto-Squad Detection Engine

```javascript
export default function TechnicianWorkstation() {
  const { currentUser } = useAuth();
  const { isDark } = useTheme();
  const activeUser = currentUser;

  // Auto-detect assigned squad based on employee profile
  const assignedSquad = useMemo(() => {
    if (activeUser?.teamId) {
      const match = CAMPUS_SQUADS.find((s) => s.id === Number(activeUser.teamId));
      if (match) return match;
    }
    const email = (activeUser?.email || '').toLowerCase();
    const dept = (activeUser?.department_name || '').toLowerCase();

    if (dept.includes('it') || dept.includes('network')) {
      return CAMPUS_SQUADS.find((s) => s.id === 5); // Network & Wi-Fi Squad
    }
    if (dept.includes('elect') || dept.includes('power')) {
      return CAMPUS_SQUADS.find((s) => s.id === 6); // Hostel Electrical Squad 1
    }
    if (dept.includes('plumb')) {
      return CAMPUS_SQUADS.find((s) => s.id === 7); // Hostel Plumbing Squad 2
    }
    if (dept.includes('sanit')) {
      return CAMPUS_SQUADS.find((s) => s.id === 3); // Sanitation Rapid Response
    }
    if (dept.includes('carp')) {
      return CAMPUS_SQUADS.find((s) => s.id === 4); // Structural Fixtures Crew
    }
    return CAMPUS_SQUADS[0];
  }, [activeUser]);
```

#### Plain-English Purpose & C/Python Analogy
Defines the component and executes the **Automated Squad Detection Algorithm**. Rather than forcing technicians to select their team from a dropdown on every login, this memoized calculation resolves their squad:
1. First, checks explicit `teamId` on the user record.
2. If absent, performs fuzzy keyword matching on `department_name` and `email` (e.g., `'it'` &rarr; Squad 5, `'elect'` &rarr; Squad 6, etc.).
3. Defaults safely to `CAMPUS_SQUADS[0]`.
- In **C programming**, this is a cascading lookup function: `const Squad* detect_user_squad(const User* u)`.
- In **Python**, it resembles pattern matching over user dictionary attributes.

#### Line-by-Line Breakdown
- **Line 66**: Declares and exports default component `TechnicianWorkstation`.
- **Lines 67–69**: Destructures `currentUser` and `isDark`.
- **Lines 72–96**: `useMemo(() => ..., [activeUser])`:
  - Checks if `activeUser?.teamId` matches any squad ID.
  - Normalizes `email` and `department_name` to lowercase.
  - Maps keywords (`'it'`, `'network'`, `'elect'`, `'power'`, `'plumb'`, `'sanit'`, `'carp'`) to specific squads.
  - Re-evaluates only if `activeUser` changes.

---

### Snippet 4: Workstation State Hooks & Modal Keyboard Listener Effect

```javascript
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ACTIVE'); // 'ACTIVE' | 'COMPLETED'
  const [actionSuccess, setActionSuccess] = useState(null);

  // Resolution modal state
  const [resolvingTicket, setResolvingTicket] = useState(null);

  // Hold / Parts Needed modal state
  const [holdingTicket, setHoldingTicket] = useState(null);
  const [holdReason, setHoldReason] = useState('Awaiting replacement spare parts from central institutional inventory.');
  const [submittingHold, setSubmittingHold] = useState(false);

  // Supervisory Escalation modal state
  const [escalatingTicket, setEscalatingTicket] = useState(null);
  const [escalateReason, setEscalateReason] = useState('');
  const [suggestedTargetDept, setSuggestedTargetDept] = useState('');
  const [submittingEscalate, setSubmittingEscalate] = useState(false);

  // Keyboard accessibility: dismiss modals on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (escalatingTicket) setEscalatingTicket(null);
        if (holdingTicket) setHoldingTicket(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [escalatingTicket, holdingTicket]);
```

#### Plain-English Purpose & C/Python Analogy
Declares state variables for ticket queues, tab filters, notification alerts, and three interactive modal dialogs (Resolution, Hold, Escalation). Attaches a keyboard listener to dismiss open modals when the user presses `Escape`.
- In **C/Win32**, this is handling message `WM_KEYDOWN` with `VK_ESCAPE`.

#### Line-by-Line Breakdown
- **Lines 98–103**: Queue state: `tickets` array, `loading` boolean, `error` string, `activeTab` (`'ACTIVE'` vs `'COMPLETED'`), and temporary `actionSuccess` banner.
- **Line 105**: `resolvingTicket`: Stores ticket object currently being resolved in `ResolutionNotesModal`.
- **Lines 108–110**: Hold modal state: `holdingTicket`, `holdReason`, and `submittingHold` lock flag.
- **Lines 113–116**: Escalation modal state: `escalatingTicket`, `escalateReason`, `suggestedTargetDept`, and `submittingEscalate` lock flag.
- **Lines 119–128**: `useEffect`: Global `Escape` key listener dismissing active modals.

---

### Snippet 5: Squad Work Orders Loader

```javascript
  const loadWorkOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchComplaints({ team_id: assignedSquad.id, limit: 100 });
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Unable to load squad work orders.');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkOrders();
  }, [assignedSquad.id]);
```

#### Plain-English Purpose & C/Python Analogy
Fetches all work orders assigned to the technician's squad (`team_id: assignedSquad.id`) from the backend API.
- In **C**, this is an SQL query: `SELECT * FROM complaints WHERE assigned_team_id = ? LIMIT 100;`.
- In **Python**, it corresponds to an API request `fetchComplaints(team_id=squad_id)`.

#### Line-by-Line Breakdown
- **Lines 130–142**: `loadWorkOrders`: Sets `loading = true`, queries `/api/v1/complaints?team_id=...`, updates `tickets`, catches errors, and resets loading in `finally`.
- **Lines 144–146**: `useEffect`: Automatically triggers `loadWorkOrders()` whenever `assignedSquad.id` changes.

---

### Snippet 6: Lifecycle State Transition Handlers (`handleStartWork`, `handleConfirmHold`)

```javascript
  const handleStartWork = async (ticket) => {
    try {
      await updateTicketStatus(
        ticket.id,
        'IN_PROGRESS',
        `Technician ${activeUser?.name || 'Staff'} commenced on-site diagnostics and physical repair work.`,
        activeUser?.name || 'Field Technician'
      );
      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, status: 'IN_PROGRESS' } : t))
      );
      setActionSuccess(`Work order ${ticket.tracking_code} transitioned to IN_PROGRESS.`);
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to update work order status.');
    }
  };

  const handleConfirmHold = async (e) => {
    e.preventDefault();
    if (!holdingTicket) return;
    setSubmittingHold(true);
    try {
      await updateTicketStatus(
        holdingTicket.id,
        'ON_HOLD',
        `Work paused: ${holdReason.trim()}`,
        activeUser?.name || 'Field Technician'
      );
      setTickets((prev) =>
        prev.map((t) => (t.id === holdingTicket.id ? { ...t, status: 'ON_HOLD' } : t))
      );
      setActionSuccess(`Work order ${holdingTicket.tracking_code} placed ON_HOLD.`);
      setHoldingTicket(null);
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to place ticket on hold.');
    } finally {
      setSubmittingHold(false);
    }
  };
```

#### Plain-English Purpose & C/Python Analogy
Executes forward lifecycle state transitions:
1. `handleStartWork`: Transitions a ticket from `SUBMITTED`, `ASSIGNED`, or `ON_HOLD` into `IN_PROGRESS`, appending an audit trail log with the technician's name.
2. `handleConfirmHold`: Pauses an `IN_PROGRESS` ticket, transitioning it to `ON_HOLD` with the specified parts justification reason.
- In **C/Python**, these are status mutation handlers updating database rows and audit log tables.

#### Line-by-Line Breakdown
- **Lines 148–164**: `handleStartWork`:
  - Calls `updateTicketStatus(ticket.id, 'IN_PROGRESS', ...)`.
  - Immutably updates the ticket status in local React state.
  - Displays a $3.5\text{s}$ confirmation toast.
- **Lines 166–188**: `handleConfirmHold`:
  - Halts default form submit.
  - Calls `updateTicketStatus(holdingTicket.id, 'ON_HOLD', ...)`.
  - Updates local state, closes hold modal (`setHoldingTicket(null)`), and displays confirmation.

---

### Snippet 7: Supervisory Escalation Engine (`handleOpenEscalate`, `handleConfirmEscalate`)

```javascript
  const handleOpenEscalate = (ticket) => {
    const defaultPreset = ESCALATION_PRESETS[0];
    setEscalateReason(defaultPreset.getText(ticket, assignedSquad));
    setSuggestedTargetDept(defaultPreset.defaultTarget);
    setEscalatingTicket(ticket);
    setError(null);
  };

  const handleConfirmEscalate = async (e) => {
    e.preventDefault();
    if (!escalatingTicket) return;
    const finalReason = [
      escalateReason.trim(),
      suggestedTargetDept ? `[Recommended Squad Target: ${suggestedTargetDept}]` : ''
    ].filter(Boolean).join('\n');

    if (finalReason.length < 5) {
      setError('Please provide an escalation justification of at least 5 characters.');
      return;
    }

    setSubmittingEscalate(true);
    setError(null);
    try {
      await escalateTicket(
        escalatingTicket.id,
        finalReason,
        activeUser?.name || activeUser?.email || 'Field Technician'
      );
      setTickets((prev) =>
        prev.map((t) =>
          t.id === escalatingTicket.id
            ? {
                ...t,
                status: 'ESCALATED',
                resolution_notes: t.resolution_notes
                  ? `${t.resolution_notes}\n[ESCALATION: ${new Date().toISOString()} | Technician: ${activeUser?.name || 'Staff'} | Reason: ${finalReason}]`
                  : `[ESCALATION: ${new Date().toISOString()} | Technician: ${activeUser?.name || 'Staff'} | Reason: ${finalReason}]`,
              }
            : t
        )
      );
      setActionSuccess(`Work order ${escalatingTicket.tracking_code} escalated to supervisor for review and reassignment.`);
      setEscalatingTicket(null);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to escalate ticket to supervisor.');
    } finally {
      setSubmittingEscalate(false);
    }
  };
```

#### Plain-English Purpose & C/Python Analogy
Implements the escalation safety protocol:
- `handleOpenEscalate`: Pre-populates the escalation modal with default preset text and recommended target department.
- `handleConfirmEscalate`: Combines the justification text and target recommendation, validates length ($\ge 5$ characters), dispatches `escalateTicket()` API call, appends a timestamped audit entry to `resolution_notes`, and transitions ticket status to `ESCALATED`.
- In **C/Python**, this is raising an administrative exception flag and notifying management.

#### Line-by-Line Breakdown
- **Lines 190–196**: `handleOpenEscalate`: Initializes modal state using `ESCALATION_PRESETS[0]`.
- **Lines 198–240**: `handleConfirmEscalate`:
  - Combines `escalateReason` with `suggestedTargetDept`.
  - Validates minimum 5 characters.
  - Calls `await escalateTicket(...)`.
  - Updates ticket in state, appending `[ESCALATION: timestamp | Technician | Reason]`.
  - Closes modal and triggers toast notification.

---

### Snippet 8: Resolution Callback & Filter Aggregators

```javascript
  const handleTicketResolved = (updatedTicket) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === updatedTicket.id ? { ...t, ...updatedTicket, status: 'RESOLVED' } : t))
    );
    setActionSuccess(`Ticket ${updatedTicket.tracking_code} resolved and closure notes recorded.`);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const activeWorkOrders = tickets.filter(
    (t) => t.status === 'SUBMITTED' || t.status === 'IN_PROGRESS' || t.status === 'ESCALATED' || t.status === 'ON_HOLD'
  );
  const completedWorkOrders = tickets.filter(
    (t) => t.status === 'RESOLVED' || t.status === 'CLOSED'
  );
  const criticalOrders = activeWorkOrders.filter(
    (t) => t.priority === 'CRITICAL' || t.status === 'ESCALATED'
  );
  const displayedOrders = activeTab === 'ACTIVE' ? activeWorkOrders : completedWorkOrders;
```

#### Plain-English Purpose & C/Python Analogy
Integrates ticket closure and splits the work order collection into filtered subsets (Active, Completed, Critical).
- In **C/Python**, this is partitioning an array into categorized linked lists.

#### Line-by-Line Breakdown
- **Lines 242–248**: `handleTicketResolved(updatedTicket)`: Callback fired by `ResolutionNotesModal` upon successful ticket resolution, updating local ticket status to `'RESOLVED'`.
- **Lines 250–259**: Array filter aggregations:
  - `activeWorkOrders`: Includes `'SUBMITTED'`, `'IN_PROGRESS'`, `'ESCALATED'`, `'ON_HOLD'`.
  - `completedWorkOrders`: Includes `'RESOLVED'` and `'CLOSED'`.
  - `criticalOrders`: Filters active work orders where priority is `'CRITICAL'` or status is `'ESCALATED'`.
  - `displayedOrders`: Selects active or completed orders based on `activeTab`.

---

### Snippet 9: Flush Field Operations Hero Header

```javascript
  return (
    <div
      className={`w-full min-h-screen flex flex-col space-y-0 animate-fade-in transition-colors duration-200 ${
        isDark ? 'bg-[#0e1117] text-zinc-100' : 'bg-white text-slate-800'
      }`}
    >
      {/* Flush Field Operations Hero Header */}
      <div
        className={`w-full border-b px-4 sm:px-8 lg:px-12 py-8 relative overflow-hidden transition-colors ${
          isDark
            ? 'bg-[#161b22] border-zinc-800 text-zinc-100'
            : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-xs'
        }`}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-inner border ${
                isDark ? 'bg-zinc-800/80 border-zinc-700 text-emerald-400' : 'bg-slate-100 border-slate-300 text-emerald-700'
              }`}
            >
              🛠️
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  Field Technician Console
                </span>
                <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>•</span>
                <span className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  {activeUser?.name || 'Authorized Field Staff'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                {assignedSquad.name}
              </h1>
              <div className="pt-1.5 flex flex-wrap items-center gap-2 text-xs">
                <span className={`px-2.5 py-1 rounded-lg border font-mono font-bold text-xs ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-emerald-400' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                }`}>
                  Trade: {assignedSquad.dept}
                </span>
                <span className={`px-2.5 py-1 rounded-lg border font-mono text-[11px] ${
                  isDark ? 'bg-zinc-800/60 border-zinc-700 text-zinc-300' : 'bg-white border-slate-300 text-slate-700'
                }`}>
                  Shift: Active On-Duty Dispatch
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              type="button"
              onClick={loadWorkOrders}
              className={`px-4 py-2.5 rounded-xl border font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer ${
                isDark
                  ? 'bg-[#0e1117] hover:bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
              }`}
            >
              <svg className={`w-4 h-4 text-emerald-500 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>
      </div>
```

#### Plain-English Purpose & C/Python Analogy
Renders the top operational command header showing the technician's name, assigned squad title, trade department, duty status, and queue refresh button.
- In **Python GUI programming**, this is the main technician header frame.

#### Line-by-Line Breakdown
- **Lines 262–274**: Root container and banner frame with theme-reactive backgrounds.
- **Lines 276–310**: Technician identity block: Tool icon `🛠️`, `"Field Technician Console"` badge, technician name, squad title (`assignedSquad.name`), trade badge, and shift status.
- **Lines 312–328**: Refresh button with animated spinning SVG icon when `loading === true`.

---

### Snippet 10: Urgent Complaints Banner & Bento Telemetry Strip

```javascript
      {/* Main Full-Width Content */}
      <div className={`w-full px-4 sm:px-8 lg:px-12 py-8 sm:py-10 space-y-8 ${isDark ? 'bg-[#0e1117]' : 'bg-white'}`}>
        {actionSuccess && (
          <div
            className={`p-4 rounded-xl border text-xs font-bold flex items-center space-x-3 animate-fade-in shadow-xs ${
              isDark
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
              ✓
            </span>
            <span>{actionSuccess}</span>
          </div>
        )}

        {criticalOrders.length > 0 && (
          <div
            className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isDark
                ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center text-xl shrink-0 font-black shadow-md shadow-rose-600/20">
                ⚡
              </div>
              <div>
                <h3 className={`text-sm font-black tracking-tight ${isDark ? 'text-rose-200' : 'text-rose-900'}`}>
                  High-Urgency Complaints Queue ({criticalOrders.length} Critical / Expedited)
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-rose-300/80' : 'text-rose-700'}`}>
                  Immediate attention required for high-priority facility complaints in your squad queue.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('ACTIVE')}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
            >
              View Urgent Complaints
            </button>
          </div>
        )}

        {/* Bento Telemetry Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div
            className={`p-5 border-l-4 border-l-amber-500 flex items-center justify-between rounded-2xl border transition-colors ${
              isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-sm' : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-2xs'
            }`}
          >
            <div>
              <span className={`text-[11px] font-bold uppercase tracking-wider block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                Assigned Queue
              </span>
              <div className={`text-3xl font-black mt-1 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                {activeWorkOrders.length}
              </div>
              <span className={`text-[11px] mt-0.5 block ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                {assignedSquad.name}
              </span>
            </div>
            <div
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-xl font-bold ${
                isDark ? 'bg-amber-950/60 border-amber-800 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}
            >
              📋
            </div>
          </div>

          <div
            className={`p-5 border-l-4 border-l-rose-500 flex items-center justify-between rounded-2xl border transition-colors ${
              isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-sm' : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-2xs'
            }`}
          >
            <div>
              <span className={`text-[11px] font-bold uppercase tracking-wider block ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>
                Critical / Escalated
              </span>
              <div className={`text-3xl font-black mt-1 ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>
                {criticalOrders.length}
              </div>
              <span className={`text-[11px] mt-0.5 block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                2-hour SLA priority gate
              </span>
            </div>
            <div
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-xl font-bold ${
                isDark ? 'bg-rose-950/60 border-rose-800 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              ⚡
            </div>
          </div>

          <div
            className={`p-5 border-l-4 border-l-emerald-500 flex items-center justify-between rounded-2xl border transition-colors ${
              isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-sm' : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-2xs'
            }`}
          >
            <div>
              <span className={`text-[11px] font-bold uppercase tracking-wider block ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                Completed Repairs
              </span>
              <div className={`text-3xl font-black mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                {completedWorkOrders.length}
              </div>
              <span className={`text-[11px] mt-0.5 block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                Verified with closure notes
              </span>
            </div>
            <div
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-xl font-bold ${
                isDark ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
            >
              ✓
            </div>
          </div>
        </div>
```

#### Plain-English Purpose & C/Python Analogy
Renders temporary success banners, an emergency critical alert banner (when high-priority tickets are in queue), and a 3-card telemetry strip:
1. `Assigned Queue` (active work orders count).
2. `Critical / Escalated` (urgent 2h SLA tickets count).
3. `Completed Repairs` (verified closed tickets count).
- In **C/Python**, this is rendering summary metric counters.

#### Line-by-Line Breakdown
- **Lines 333–346**: Conditional green success toast with checkmark `✓`.
- **Lines 348–377**: High-urgency alert card: Mounted if `criticalOrders.length > 0`, featuring a flashing lightning bolt icon `⚡` and a shortcut button to the active queue.
- **Lines 380–455**: 3-card telemetry strip:
  - Card 1: Amber border, `activeWorkOrders.length`, clipboard icon `📋`.
  - Card 2: Rose border, `criticalOrders.length`, lightning bolt `⚡`, reminder of "2-hour SLA priority gate".
  - Card 3: Emerald border, `completedWorkOrders.length`, checkmark `✓`, label "Verified with closure notes".

---

### Snippet 11: Work Orders Roster & 2-Way Tab Switcher

```javascript
        {/* Work Orders Roster */}
        <div
          className={`rounded-2xl border overflow-hidden transition-colors ${
            isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-xl' : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-sm'
          }`}
        >
          <div
            className={`p-5 sm:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isDark ? 'border-zinc-800 bg-[#161b22]' : 'border-slate-300 bg-[#e2e8f0]/60'
            }`}
          >
            <div>
              <h2 className={`text-base font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                Work Orders — {assignedSquad.name}
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Start physical triage, pause for parts, and document closure proof with replaced parts.
              </p>
            </div>

            <div
              className={`flex items-center space-x-1 p-1 rounded-xl border ${
                isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#e2e8f0] border-slate-300'
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveTab('ACTIVE')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'ACTIVE'
                    ? isDark
                      ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                      : 'bg-white text-slate-900 shadow-2xs'
                    : isDark
                    ? 'text-zinc-400 hover:text-zinc-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active Queue ({activeWorkOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('COMPLETED')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'COMPLETED'
                    ? isDark
                      ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                      : 'bg-white text-slate-900 shadow-2xs'
                    : isDark
                    ? 'text-zinc-400 hover:text-zinc-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Completed ({completedWorkOrders.length})
              </button>
            </div>
          </div>
```

#### Plain-English Purpose & C/Python Analogy
Renders the container header for the squad queue. Provides two segmented tabs:
- `Active Queue ({activeWorkOrders.length})`
- `Completed ({completedWorkOrders.length})`
- In **Python GUI programming**, this is a tabbed listbox container.

#### Line-by-Line Breakdown
- **Lines 458–462**: Container card with rounded corners and border.
- **Lines 464–476**: Header displaying squad title and operational instructions.
- **Lines 478–513**: 2-button tab switcher toggling `activeTab` between `'ACTIVE'` and `'COMPLETED'`.

---

### Snippet 12: Work Order Card Rendering & Metadata Roster

```javascript
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 mx-auto border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Loading squad work orders...</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center space-y-3 px-4">
              <p className="text-xs font-bold text-rose-500">{error}</p>
              <button
                type="button"
                onClick={loadWorkOrders}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl"
              >
                Retry
              </button>
            </div>
          ) : displayedOrders.length === 0 ? (
            <div className="py-20 text-center space-y-3 max-w-sm mx-auto px-4">
              <div
                className={`w-14 h-14 mx-auto rounded-2xl border flex items-center justify-center text-2xl ${
                  isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-100 border-slate-300'
                }`}
              >
                🔧
              </div>
              <h3 className={`text-base font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>Queue Clear</h3>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                No work orders in this state for {assignedSquad.name}.
              </p>
            </div>
          ) : (
            <div className={`divide-y ${isDark ? 'divide-zinc-800/80' : 'divide-slate-200'}`}>
              {displayedOrders.map((ticket) => {
                const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';
                const isClosed = ticket.status === 'CLOSED';
                const isSubmitted = ticket.status === 'SUBMITTED' || ticket.status === 'ASSIGNED' || ticket.status === 'PENDING';
                const isInProgress = ticket.status === 'IN_PROGRESS';
                const isEscalated = ticket.status === 'ESCALATED';
                const isOnHold = ticket.status === 'ON_HOLD';

                return (
                  <div
                    key={ticket.id || ticket.tracking_code}
                    className={`p-5 sm:p-6 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-5 ${
                      isDark ? 'hover:bg-zinc-800/40 text-zinc-200' : 'hover:bg-[#cbd5e1]/30 text-slate-800'
                    }`}
                  >
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Link
                          to={`/track?code=${ticket.tracking_code}`}
                          className={`font-mono font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                            isDark
                              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800 hover:bg-emerald-900/90'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                          }`}
                        >
                          {ticket.tracking_code}
                        </Link>
                        <PriorityBadge priority={ticket.priority} dark={isDark} />
                        <span
                          className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${
                            ticket.status === 'IN_PROGRESS'
                              ? isDark
                                ? 'bg-blue-950/80 text-blue-400 border-blue-800'
                                : 'bg-blue-100 text-blue-800 border-blue-300'
                              : ticket.status === 'ESCALATED'
                              ? isDark
                                ? 'bg-rose-950/80 text-rose-400 border-rose-800 animate-pulse'
                                : 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                              : ticket.status === 'ON_HOLD'
                              ? isDark
                                ? 'bg-amber-950/80 text-amber-400 border-amber-800'
                                : 'bg-amber-100 text-amber-800 border-amber-300'
                              : ticket.status === 'RESOLVED'
                              ? isDark
                                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : isDark
                              ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                              : 'bg-slate-200 text-slate-700 border-slate-300'
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </div>

                      <div>
                        <h3 className={`text-sm sm:text-base font-bold tracking-tight ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                          {ticket.title}
                        </h3>
                        <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                          {ticket.description}
                        </p>
                      </div>

                      {/* Prominent Physical Location & Contact Info */}
                      <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                        <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 font-bold ${
                          isDark ? 'bg-zinc-800/80 border-zinc-700 text-zinc-200' : 'bg-white border-slate-300 text-slate-800'
                        }`}>
                          <span>📍 Location:</span>
                          <span className="text-emerald-500">{ticket.location}</span>
                        </div>

                        {ticket.student_name && (
                          <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 text-[11px] ${
                            isDark ? 'bg-zinc-800/40 border-zinc-700 text-zinc-300' : 'bg-white border-slate-300 text-slate-700'
                          }`}>
                            <span>👤 Submitter:</span>
                            <strong>{ticket.student_name}</strong>
                            {ticket.student_email && (
                              <a
                                href={`mailto:${ticket.student_email}?subject=Regarding Grievance ${ticket.tracking_code}`}
                                className="ml-1 text-emerald-500 underline hover:text-emerald-400 font-mono"
                                title="Click to email student"
                              >
                                {ticket.student_email}
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      {ticket.resolution_notes && (
                        <div
                          className={`mt-2 p-3 rounded-xl border text-xs space-y-1 ${
                            isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-300' : 'bg-[#e2e8f0] border-slate-300 text-slate-800 shadow-2xs'
                          }`}
                        >
                          <div className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                            Audit Trail &amp; Repair Notes
                          </div>
                          <pre className="text-[11px] font-mono whitespace-pre-wrap leading-relaxed">
                            {ticket.resolution_notes}
                          </pre>
                        </div>
                      )}

                      {/* Closed Loop Student Feedback Display */}
                      {isResolved && ticket.feedback_rating && (
                        <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                          isDark ? 'bg-amber-950/20 border-amber-800/40 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
                        }`}>
                          <span className="text-base font-bold">★ {ticket.feedback_rating}/5</span>
                          <span className="text-xs italic">
                            "{ticket.feedback_comments || 'Student confirmed satisfaction with resolution.'}"
                          </span>
                        </div>
                      )}
                    </div>
```

#### Plain-English Purpose & C/Python Analogy
Renders individual work order cards:
- Handles loading spinner, API error view with retry button, and "Queue Clear" empty state card.
- Renders tracking code link, PriorityBadge, status pill (with pulsating animation for `ESCALATED`).
- Displays issue title and description.
- Renders prominent location badge (`📍 Location:`) and student contact shortcut (`mailto:`).
- Displays audit trail notes (`resolution_notes`) and closed-loop student feedback ratings (`★ X/5`).
- In **Python/Django**, this is iterating over ticket querysets to generate responsive cards.

#### Line-by-Line Breakdown
- **Lines 515–545**: Loading, error, and empty-queue state handlers.
- **Lines 547–554**: Evaluates status flags (`isResolved`, `isInProgress`, `isEscalated`, `isOnHold`, etc.).
- **Lines 563–600**: Header badges row.
- **Lines 602–609**: Title and description.
- **Lines 612–637**: Location pill and submitter email link.
- **Lines 639–652**: Audit trail notes box with `<pre>` formatting.
- **Lines 655–664**: Closed-loop star rating box.

---

### Snippet 13: Dynamic Action Buttons & Modal Form Triggers

```javascript
                    <div
                      className={`flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 ${
                        isDark ? 'border-zinc-800' : 'border-slate-300'
                      }`}
                    >
                      {!isResolved ? (
                        <div className="space-y-1 text-left sm:text-right">
                          <span className={`text-[10px] uppercase font-bold tracking-wider block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                            SLA Target Countdown
                          </span>
                          <SLACountdownTimer
                            slaDeadline={ticket.sla_deadline || ticket.target_resolution_date}
                            priority={ticket.priority}
                            status={ticket.status}
                            resolvedAt={ticket.resolved_at}
                            dark={isDark}
                          />
                        </div>
                      ) : (
                        <div className="space-y-1 text-left sm:text-right">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500 flex items-center sm:justify-end space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Closed &amp; Verified</span>
                          </span>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        {(isSubmitted || isOnHold) && (
                          <button
                            type="button"
                            onClick={() => handleStartWork(ticket)}
                            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                          >
                            ▶ {isOnHold ? 'Resume Repair' : 'Commence Work'}
                          </button>
                        )}

                        {isInProgress && (
                          <>
                            <button
                              type="button"
                              onClick={() => setHoldingTicket(ticket)}
                              className="px-3 py-2 bg-amber-700/80 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                            >
                              ⏳ Hold (Parts)
                            </button>

                            <button
                              type="button"
                              onClick={() => setResolvingTicket(ticket)}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                            >
                              ✓ Complete &amp; Log
                            </button>
                          </>
                        )}

                        {/* Escalate to Supervisor Button */}
                        {!isResolved && !isClosed && (
                          isEscalated ? (
                            <span
                              className={`px-3 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 ${
                                isDark
                                  ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                                  : 'bg-rose-50 border-rose-300 text-rose-800'
                              }`}
                              title="Under supervisory review for manual reassignment"
                            >
                              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                              ⚠️ Escalated to Supervisor
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenEscalate(ticket)}
                              className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                                isDark
                                  ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-800/80 hover:border-rose-700'
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300 shadow-2xs'
                              }`}
                              title="Escalate to Supervisor for review or manual squad reassignment"
                            >
                              <span>⚠️ Escalate to Supervisor</span>
                            </button>
                          )
                        )}

                        <Link
                          to={`/track?code=${ticket.tracking_code}`}
                          className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors text-center ${
                            isDark
                              ? 'bg-[#0e1117] hover:bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                              : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                          }`}
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
```

#### Plain-English Purpose & C/Python Analogy
Renders the action controls on each card:
- Real-time SLA Countdown Timer.
- Lifecycle Action Buttons:
  - "▶ Commence Work" / "▶ Resume Repair" if submitted or on hold.
  - "⏳ Hold (Parts)" and "✓ Complete & Log" if in progress.
  - "⚠️ Escalate to Supervisor" button (or pulsing escalated indicator if already escalated).
  - "Details" link leading to `/track?code=...`.
- In **C/Python**, these are state machine transition commands bound to user clicks.

#### Line-by-Line Breakdown
- **Lines 672–692**: SLA countdown timer or "Closed & Verified" badge.
- **Lines 694–703**: "Commence Work" button calling `handleStartWork()`.
- **Lines 705–723**: "Hold (Parts)" and "Complete & Log" buttons triggering modals.
- **Lines 725–753**: Supervisory Escalation control: Renders active pulsing ping if already escalated; otherwise renders button opening the escalation modal.
- **Lines 755–765**: "Details" link.

---

### Snippet 14: Pause Work Order (Hold / Parts Delay Gate) Modal

```javascript
      {/* Hold Reason Modal */}
      {holdingTicket && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="hold-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setHoldingTicket(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in"
        >
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 animate-scale-up ${
            isDark ? 'bg-[#161b22] border-zinc-700 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            <h3 id="hold-modal-title" className="text-base font-bold">Pause Work Order (Parts / Delay Gate)</h3>
            <p className="text-xs text-slate-400">
              Provide the justification for pausing work order <strong>{holdingTicket.tracking_code}</strong> (e.g. required replacement parts or awaiting specialized tools).
            </p>
            <form onSubmit={handleConfirmHold} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Reason / Required Inventory</label>
                <textarea
                  rows={3}
                  required
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                  placeholder="e.g. Awaiting 3/4 inch brass gate valve from central store..."
                  className={`w-full p-3 rounded-xl border text-xs focus:outline-none ${
                    isDark ? 'bg-[#0e1117] border-zinc-700 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => setHoldingTicket(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                    isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingHold}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white cursor-pointer shadow-sm"
                >
                  {submittingHold ? 'Recording...' : 'Confirm Hold Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
```

#### Plain-English Purpose & C/Python Analogy
Renders an accessible dialog modal capturing the inventory/spare-parts justification when pausing a ticket.
- In **C/Python**, this is a modal dialog prompting for delay justification strings.

#### Line-by-Line Breakdown
- **Lines 776–785**: Modal backdrop with accessibility attributes (`role="dialog"`, `aria-modal="true"`) and click-outside dismissal.
- **Lines 789–792**: Title and ticket reference text.
- **Lines 794–806**: Required `<textarea>` capturing `holdReason`.
- **Lines 807–825**: "Cancel" and "Confirm Hold Status" buttons.

---

### Snippet 15: Supervisory Escalation Modal & Resolution Notes Modal

```javascript
      {/* Supervisory Escalation Modal */}
      {escalatingTicket && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="escalate-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEscalatingTicket(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in"
        >
          <div
            className={`w-full max-w-lg p-6 sm:p-7 rounded-2xl border shadow-2xl space-y-4 animate-scale-up ${
              isDark ? 'bg-[#161b22] border-zinc-700 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border bg-rose-500/20 text-rose-400 border-rose-500/30">
                  Supervisory Escalation Gate
                </span>
                <h3 id="escalate-modal-title" className="text-base font-black mt-1">
                  Escalate Work Order to Supervisor
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEscalatingTicket(null)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer text-xs ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                ✕
              </button>
            </div>

            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Flag this ticket for immediate supervisory intervention. The Facility Admin can review your reason, override trade assignment, and manually reassign the ticket to the correct maintenance squad.
            </p>

            <div className={`p-3 rounded-xl border text-xs space-y-1 ${
              isDark ? 'bg-zinc-800/40 border-zinc-700 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-emerald-400">{escalatingTicket.tracking_code}</span>
                <span className="font-semibold text-[11px] opacity-75">{assignedSquad.name} ({assignedSquad.dept})</span>
              </div>
              <div className="font-bold truncate">{escalatingTicket.title}</div>
              <div className="text-[11px] opacity-80">📍 {escalatingTicket.location || 'Campus'}</div>
            </div>

            {/* Quick Reason Presets */}
            <div className="space-y-1.5">
              <label className={`block text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Quick Select Escalation Reason
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {ESCALATION_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setEscalateReason(preset.getText(escalatingTicket, assignedSquad));
                      if (preset.defaultTarget) setSuggestedTargetDept(preset.defaultTarget);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isDark
                        ? 'bg-zinc-800/50 hover:bg-zinc-800 border-zinc-700 text-zinc-200 hover:border-rose-500/50'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800 hover:border-rose-400'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5 text-xs text-rose-500">
                      <span>{preset.icon}</span>
                      <span>{preset.label}</span>
                    </div>
                    <div className={`text-[10px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      {preset.hint}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleConfirmEscalate} className="space-y-4 text-xs pt-1">
              <div>
                <label className={`block font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Escalation Justification (Required)
                </label>
                <textarea
                  rows={3}
                  required
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  placeholder="Detail why this ticket requires supervisory review (e.g. misrouted trade, structural hazard, or specialized equipment needed)..."
                  className={`w-full p-3 rounded-xl border text-xs focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-[#0e1117] border-zinc-700 text-zinc-100 focus:border-rose-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-rose-500 shadow-2xs'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Recommended Squad Trade (Optional suggestion for Supervisor)
                </label>
                <select
                  value={suggestedTargetDept}
                  onChange={(e) => setSuggestedTargetDept(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none ${
                    isDark
                      ? 'bg-[#0e1117] border-zinc-700 text-zinc-100 focus:border-rose-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-rose-500'
                  }`}
                >
                  <option value="">-- Let Supervisor Decide Target Squad --</option>
                  <option value="Carpentry (Structural Fixtures Crew)">Carpentry (Structural Fixtures Crew - Sports / Nets / Wooden Fixtures)</option>
                  <option value="General Administration (Facilities & Civil Squad)">General Administration (Facilities &amp; Civil Infrastructure)</option>
                  <option value="Electrical (Hostel Electrical Squad 1)">Electrical (Hostel Electrical Squad 1 - Power / Lighting / Motors)</option>
                  <option value="Plumbing (Hostel Plumbing Squad 2)">Plumbing (Hostel Plumbing Squad 2 - Water / Drainage)</option>
                  <option value="Sanitation (Sanitation Rapid Response)">Sanitation (Sanitation Rapid Response - Waste / Cleaning)</option>
                  <option value="IT Support (Network & Wi-Fi Squad)">IT Support (Network &amp; Wi-Fi Squad - LAN / Access Points)</option>
                </select>
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => setEscalatingTicket(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                    isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700' : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEscalate}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-1.5 transition-all"
                >
                  {submittingEscalate ? (
                    <span>Escalating...</span>
                  ) : (
                    <>
                      <span>⚠️ Confirm Escalation to Supervisor</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resolvingTicket && (
        <ResolutionNotesModal
          isOpen={!!resolvingTicket}
          ticket={resolvingTicket}
          onClose={() => setResolvingTicket(null)}
          onResolved={handleTicketResolved}
        />
      )}
    </div>
  );
}
```

#### Plain-English Purpose & C/Python Analogy
Renders the complete supervisory escalation modal:
- 4 preset cards automatically generating professional escalation text.
- Justification textarea.
- Optional dropdown suggesting the correct destination squad to the supervisor.
- Embeds `<ResolutionNotesModal>` ensuring that work orders cannot be marked as resolved without recording physical proof of repair.
- In **Python GUI programming**, this is an escalation dialog frame and resolution dialog wrapper.

#### Line-by-Line Breakdown
- **Lines 831–864**: Escalation modal wrapper and header with close button `✕`.
- **Lines 870–879**: Ticket reference card showing code, title, and location.
- **Lines 881–911**: Quick reason preset buttons: maps over `ESCALATION_PRESETS`, populating `escalateReason` and `suggestedTargetDept`.
- **Lines 913–930**: Required justification textarea.
- **Lines 932–953**: Target squad dropdown select.
- **Lines 955–959**: Error alert box.
- **Lines 961–985**: Action buttons: "Cancel" and "Confirm Escalation to Supervisor".
- **Lines 990–997**: `<ResolutionNotesModal>`: Invoked when `resolvingTicket` is non-null, passing `handleTicketResolved` callback.

---

## 3. High-Frequency Viva & Technical Defense Guide

### Q1: How does the technician workstation automatically detect which squad a technician belongs to?
**Examiner Answer**:
"In `TechnicianWorkstation.jsx`, squad detection is computed via `useMemo`:
```javascript
const assignedSquad = useMemo(() => {
  if (activeUser?.teamId) {
    const match = CAMPUS_SQUADS.find((s) => s.id === Number(activeUser.teamId));
    if (match) return match;
  }
  const email = (activeUser?.email || '').toLowerCase();
  const dept = (activeUser?.department_name || '').toLowerCase();
  if (dept.includes('it') || dept.includes('network')) return CAMPUS_SQUADS.find(s => s.id === 5);
  if (dept.includes('elect') || dept.includes('power')) return CAMPUS_SQUADS.find(s => s.id === 6);
  ...
}, [activeUser]);
```
It first inspects the authoritative `teamId` from the database. If missing, it applies keyword heuristics to the department and email attributes. This ensures that every technician is locked into their specific queue upon login, preventing accidental cross-trade interference."

### Q2: Explain the operational state machine transitions supported on this workstation.
**Examiner Answer**:
"The workstation models a 5-state deterministic Finite State Machine:
1. `ASSIGNED` &rarr; `IN_PROGRESS`: Triggered by `handleStartWork()`. Signals on-site diagnostic commencement.
2. `IN_PROGRESS` &rarr; `ON_HOLD`: Triggered by `handleConfirmHold()`. Enforces an operational pause when waiting for spare parts or central store procurement.
3. `ON_HOLD` &rarr; `IN_PROGRESS`: Triggered by `handleStartWork()`. Resumes repair once inventory arrives.
4. `IN_PROGRESS` &rarr; `RESOLVED`: Enforced via `ResolutionNotesModal`. Prevents ticket closure unless the technician logs specific work performed and itemizes replacement parts.
5. Any Active State &rarr; `ESCALATED`: Triggered by `handleConfirmEscalate()`. Alerts supervisors of misrouted trade classifications or safety hazards."

### Q3: Why is supervisory escalation implemented as a structured modal with presets instead of a simple button click?
**Examiner Answer**:
"Unstructured escalations degrade managerial efficiency because supervisors must waste time contacting technicians to understand why a ticket was returned. 
Our escalation modal provides four standardized presets (Misrouted Trade, Procurement Dependency, Safety Hazard, Scope/Capacity Risk) that auto-generate clear, professional justification text and allow technicians to suggest the correct destination squad. This allows facility supervisors to review and reassign tickets with a single click."

---

## 4. Quick-Reference Architecture & Property Table

| Feature / UI Element | State / Hook Used | Architectural Role / Viva Defense |
| :--- | :--- | :--- |
| **Auto-Squad Detection** | `assignedSquad`, `useMemo()` | Automatically binds technician to their trade squad (Electrical, Plumbing, IT, etc.). |
| **Squad Work Queue Fetch**| `loadWorkOrders()`, `fetchComplaints` | Queries complaints filtered strictly by `team_id: assignedSquad.id`. |
| **Lifecycle State Machine**| `updateTicketStatus()`, `handleStartWork` | Deterministic transitions: Assigned &rarr; In Progress &rarr; On Hold &rarr; Resolved. |
| **Parts Delay Gate** | `holdingTicket`, `handleConfirmHold` | Captures required inventory justifications when pausing repairs. |
| **Supervisory Escalation** | `escalatingTicket`, `ESCALATION_PRESETS` | Generates standardized justification notes and recommends target squads. |
| **Closed-Loop Resolution** | `<ResolutionNotesModal />` | Mandates technical repair proof and itemized spare parts before closure. |
| **High-Urgency Alert** | `criticalOrders.length > 0` | Surfaces 2-hour SLA Critical and Escalated work orders in prominent rose alert cards. |
| **Modal Escape Dismissal** | Native `useEffect` on `keydown` | Closes active Hold or Escalation modals when pressing the `Escape` key. |

---
*Documentation compiled and verified against commit codebase standards. Strictly non-destructive: no application source files modified.*
