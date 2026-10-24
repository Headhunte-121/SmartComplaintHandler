# Maintenance Squads & Dispatch Balancer (`SquadsPage.jsx`)

Comprehensive architectural and line-by-line documentation for `frontend/src/pages/SquadsPage.jsx`. This document provides collegiate viva committees, code reviewers, and systems architects with an exhaustive dissection of the workload balancing engine, priority demand ranking algorithm, live ticket drawer inspection, and squad reassignment workflows.

---

## 1. Module Header & Library Imports

```jsx
/**
 * SmartComplaintHandler - Maintenance Squads & Workload Balancer
 * Line-by-line squad roster ranked dynamically by issue severity (Most Issues at Top, Least at Bottom)
 * Supports supervisory queue inspection and live squad load rebalancing.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchSquadWorkloads } from '../api/assignment';
import { fetchComplaints } from '../api/complaints';
import { fetchActiveBreaches } from '../api/sla';
import PriorityBadge from '../components/PriorityBadge';
import ReassignTeamModal from '../components/ReassignTeamModal';
import SLACountdownTimer from '../components/SLACountdownTimer';
import { isDeadlineOverdue } from '../utils/dateUtils';
```

### Plain-English Purpose
The header imports essential React state hooks, security context, theme state, backend REST client functions for squad workloads, complaints, and SLA breaches, and reusable UI components. Together, they allow administrators to dynamically inspect team backlogs, monitor overdue work orders, and transfer tickets from overloaded squads to available technicians.

### Line-by-Line Breakdown
- **Lines 1–5**: Comment header stating the purpose of the squad balancer: a line-by-line roster sorted dynamically by issue severity (bottlenecks at the top) with live squad load rebalancing.
- **Line 6**: Imports core React hooks: `useState` (reactive state storage), `useEffect` (side-effect lifecycle manager), and `useMemo` (memoized computation cache).
- **Line 7**: Imports `useAuth` hook to access authenticated user profile and roles.
- **Line 8**: Imports `useTheme` hook to read `isDark` boolean mode.
- **Line 9**: Imports `fetchSquadWorkloads` from `../api/assignment` to retrieve squad telemetry and active ticket counts from the backend assignment engine.
- **Line 10**: Imports `fetchComplaints` from `../api/complaints` to query the list of active grievances.
- **Line 11**: Imports `fetchActiveBreaches` from `../api/sla` to identify tickets currently exceeding their SLA deadline.
- **Line 12**: Imports `PriorityBadge` component for colored urgency indicators (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
- **Line 13**: Imports `ReassignTeamModal` dialog allowing supervisors to transfer work orders across squads.
- **Line 14**: Imports `SLACountdownTimer` for live ticking countdowns to breach deadlines.
- **Line 15**: Imports `isDeadlineOverdue` utility function from `../utils/dateUtils`.

---

## 2. Department Visual Icons Dictionary

```jsx
const CAMPUS_DEPT_ICONS = {
  Electrical: '⚡',
  Plumbing: '🚰',
  Sanitation: '🧹',
  Carpentry: '🪚',
  'IT Support': '💻',
  'General Administration': '🏛️',
};
```

### Plain-English Purpose
Acts as a static key-value lookup mapping each institutional engineering trade to its representative emoji icon, improving visual scanning speed during high-stress dispatch triage.

### Line-by-Line Breakdown
- **Lines 17–24**: Defines `CAMPUS_DEPT_ICONS` mapping `'Electrical'` to `⚡`, `'Plumbing'` to `🚰`, `'Sanitation'` to `🧹`, `'Carpentry'` to `🪚`, `'IT Support'` to `💻`, and `'General Administration'` to `🏛️`.

---

## 3. Component Declaration & State Management

```jsx
export default function SquadsPage() {
  const { isDark } = useTheme();
  const { currentUser } = useAuth();

  const [teams, setTeams] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [breaches, setBreaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Expanded squad ID for detail view
  const [expandedTeamId, setExpandedTeamId] = useState(null);

  // Reassign modal state
  const [reassignTicket, setReassignTicket] = useState(null);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };
```

### Plain-English Purpose
Initializes reactive memory buffers tracking the squad roster, active tickets, breach lists, network loading indicators, expandable drawer IDs, and modal reassignment targets.

### Line-by-Line Breakdown
- **Lines 26–28**: Declares default export `SquadsPage` and extracts `isDark` and `currentUser`.
- **Lines 30–32**: Initializes `teams` (squad metadata list), `tickets` (complaints list), and `breaches` (breached ticket objects) as empty arrays.
- **Lines 33–35**: Initializes `loading` boolean flag (`true`), `error` message string (`null`), and `toastMsg` string (`null`).
- **Line 38**: `expandedTeamId` stores the primary key ID of the squad whose ticket drawer is currently open (`null` when collapsed).
- **Lines 41–42**: `reassignTicket` holds the complaint object selected for squad transfer; `reassignModalOpen` toggles modal visibility.
- **Lines 44–47**: `showToast` displays temporary feedback banners, auto-clearing after $3500\text{ ms}$.

---

## 4. Concurrent Data Fetching Lifecycle

```jsx
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [teamList, ticketList, breachList] = await Promise.all([
        fetchSquadWorkloads().catch(() => []),
        fetchComplaints().catch(() => []),
        fetchActiveBreaches().catch(() => []),
      ]);
      setTeams(Array.isArray(teamList) ? teamList : []);
      setTickets(Array.isArray(ticketList) ? ticketList : []);
      setBreaches(Array.isArray(breachList) ? breachList : []);
    } catch (err) {
      setError('Failed to load squad workload telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);
```

### Plain-English Purpose
Executes concurrent asynchronous network queries against three backend endpoints simultaneously. By wrapping each query in an isolated `.catch(() => [])` handler, failure of one micro-service (e.g., SLA engine) does not crash the entire squad telemetry interface.

### Line-by-Line Breakdown
- **Lines 49–51**: `loadData` sets `loading` to `true` and clears previous errors.
- **Lines 53–57**: Uses `Promise.all` to query `fetchSquadWorkloads`, `fetchComplaints`, and `fetchActiveBreaches` concurrently. Each promise has a `.catch(() => [])` trap to ensure non-blocking fallback to empty arrays.
- **Lines 58–60**: Stores returned lists into their respective state variables with defensive array checks (`Array.isArray(...) ? ... : []`).
- **Lines 61–65**: Catches unexpected fatal runtime errors, setting a descriptive error string, and resets `loading` to `false` in the `finally` block.
- **Lines 68–70**: `useEffect` executes `loadData()` once when the component mounts.

---

## 5. Dynamic Workload Scoring & Sorting Algorithm

```jsx
  const overdueTicketIds = useMemo(() => {
    const set = new Set();
    breaches.forEach((b) => {
      if (b.is_breached && b.ticket_id) set.add(b.ticket_id);
    });
    return set;
  }, [breaches]);

  // Build enhanced squad objects and sort dynamically: MOST ISSUES AT TOP, LEAST AT BOTTOM
  const sortedSquads = useMemo(() => {
    const enhanced = teams.map((team) => {
      const squadTickets = tickets.filter(
        (t) => t.assigned_team_id === team.team_id || t.assigned_team_name === team.team_name
      );
      const activeTickets = squadTickets.filter(
        (t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED' && t.status !== 'CANCELLED'
      );
      const overdueTickets = activeTickets.filter(
        (t) =>
          overdueTicketIds.has(t.id) ||
          (t.sla_deadline && isDeadlineOverdue(t.sla_deadline))
      );
      const onHoldTickets = activeTickets.filter((t) => t.status === 'ON_HOLD');
      const inProgressTickets = activeTickets.filter(
        (t) => t.status === 'IN_PROGRESS' || t.status === 'ESCALATED'
      );
      const submittedTickets = activeTickets.filter(
        (t) => t.status === 'SUBMITTED' || t.status === 'ASSIGNED' || t.status === 'PENDING'
      );

      // Issues score: overdue counts highest (weight 4), on-hold (weight 2), backlog (weight 1)
      const issuesScore =
        overdueTickets.length * 4 + onHoldTickets.length * 2 + activeTickets.length;

      let capacityStatus = 'Optimal Capacity';
      let capacityColor = isDark ? 'text-emerald-400 border-emerald-800 bg-emerald-950/40' : 'text-emerald-800 border-emerald-300 bg-emerald-50';

      if (overdueTickets.length > 0 || activeTickets.length >= 6) {
        capacityStatus = 'Critical Backlog';
        capacityColor = isDark ? 'text-rose-400 border-rose-800 bg-rose-950/40 animate-pulse' : 'text-rose-800 border-rose-300 bg-rose-50';
      } else if (onHoldTickets.length > 0 || activeTickets.length >= 3) {
        capacityStatus = 'Heavy Load';
        capacityColor = isDark ? 'text-amber-400 border-amber-800 bg-amber-950/40' : 'text-amber-800 border-amber-300 bg-amber-50';
      }

      return {
        ...team,
        activeTickets,
        overdueCount: overdueTickets.length,
        onHoldCount: onHoldTickets.length,
        inProgressCount: inProgressTickets.length,
        submittedCount: submittedTickets.length,
        totalActive: activeTickets.length,
        issuesScore,
        capacityStatus,
        capacityColor,
      };
    });

    // Sort descending by issuesScore (most issues first, least issues at the bottom)
    return enhanced.sort((a, b) => b.issuesScore - a.issuesScore);
  }, [teams, tickets, overdueTicketIds, isDark]);
```

### Plain-English Purpose
This is the core algorithmic balancer. It correlates tickets with squads and calculates a weighted **Priority Demand Stress Index** (`issuesScore`):
$$\text{issuesScore} = (\text{overdueCount} \times 4) + (\text{onHoldCount} \times 2) + \text{totalActive}$$
Squads are dynamically sorted in descending order of stress. The squad facing the most critical bottlenecks appears at the very top of the screen (labeled `Highest Demand`), while squads with free bandwidth appear at the bottom (`Optimal Free Capacity`), enabling instantaneous supervisory load rebalancing.

### Line-by-Line Breakdown
- **Lines 72–78**: `overdueTicketIds` constructs a high-performance hash set (`new Set()`) containing primary keys of tickets with confirmed breaches, providing $O(1)$ constant-time membership lookups.
- **Lines 81–82**: `sortedSquads` maps over `teams` to compute real-time workload statistics.
- **Lines 83–85**: Filters `tickets` matching either `team.team_id` or `team.team_name`.
- **Lines 86–88**: Excludes terminal states (`RESOLVED`, `CLOSED`, `CANCELLED`) to isolate live active work orders.
- **Lines 89–93**: Identifies overdue tickets by checking the breach hash set or evaluating `isDeadlineOverdue(t.sla_deadline)`.
- **Lines 94–100**: Categorizes tickets into status cohorts: `onHoldTickets` (`ON_HOLD`), `inProgressTickets` (`IN_PROGRESS`, `ESCALATED`), and `submittedTickets` (`SUBMITTED`, `ASSIGNED`, `PENDING`).
- **Lines 102–104**: Computes composite stress score:
  - Overdue breaches carry a $4\times$ penalty weight.
  - On-hold tickets (blocked on spare parts or equipment) carry a $2\times$ penalty weight.
  - Active backlog tickets carry a $1\times$ weight.
- **Lines 106–115**: Evaluates capacity status tiers:
  - **Critical Backlog** (Rose badge + pulse animation): Triggered if $\text{overdueCount} > 0$ or $\text{activeTickets} \ge 6$.
  - **Heavy Load** (Amber badge): Triggered if $\text{onHoldCount} > 0$ or $\text{activeTickets} \ge 3$.
  - **Optimal Capacity** (Emerald badge): All remaining squads with manageable load.
- **Lines 117–128**: Returns enhanced squad object containing all sub-counts, scores, and CSS classes.
- **Lines 131–133**: Executes descending sort `enhanced.sort((a, b) => b.issuesScore - a.issuesScore)` and caches the result.

---

## 6. Ticket Reassignment Handlers

```jsx
  const handleOpenReassign = (ticket) => {
    setReassignTicket(ticket);
    setReassignModalOpen(true);
  };

  const handleReassignSuccess = (ticketId, newTeamName) => {
    showToast(`Ticket #${ticketId} transferred to ${newTeamName}.`);
    loadData();
  };
```

### Plain-English Purpose
These functions manage modal lifecycle and post-transfer data synchronization. When an administrator reallocates a work order, the modal closes, a confirmation banner displays, and the entire squad roster re-queries the backend to re-sort the queues dynamically.

### Line-by-Line Breakdown
- **Lines 135–138**: `handleOpenReassign` stores target ticket into `reassignTicket` and sets `reassignModalOpen(true)`.
- **Lines 140–143**: `handleReassignSuccess` receives confirmation parameters, invokes `showToast`, and executes `loadData()` to re-fetch updated squad allocations.

---

## 7. Roster Presentation & Detailed Ticket Drawer

```jsx
        {/* Line-by-Line Squad Roster */}
        <div className="space-y-4">
          {sortedSquads.map((squad, index) => {
            const isExpanded = expandedTeamId === squad.team_id;
            const rankLabel = index === 0 ? 'Highest Demand' : index === sortedSquads.length - 1 ? 'Optimal Free Capacity' : `#${index + 1}`;

            return (
              <div
                key={squad.team_id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isDark
                    ? 'bg-[#161b22] border-zinc-800 hover:border-zinc-700'
                    : 'bg-white border-slate-300 hover:border-slate-400 shadow-xs'
                }`}
              >
                {/* Squad Line Row Header */}
                <div
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer select-none"
                  onClick={() => setExpandedTeamId(isExpanded ? null : squad.team_id)}
                >
                  <div className="flex items-center gap-4 min-w-[260px]">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border ${
                      isDark ? 'bg-zinc-800/80 border-zinc-700' : 'bg-slate-100 border-slate-200'
                    }`}>
                      {CAMPUS_DEPT_ICONS[squad.department_name] || '🛠️'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`text-sm font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                          {squad.team_name}
                        </h3>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${squad.capacityColor}`}>
                          {squad.capacityStatus}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                          {squad.department_name}
                        </span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                          index === 0
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 font-bold'
                            : isDark
                            ? 'bg-zinc-800/60 border-zinc-700 text-zinc-400'
                            : 'bg-slate-100 border-slate-200 text-slate-600'
                        }`}>
                          {rankLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Badges Line-by-Line Breakdown */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    {/* Overdue Badge */}
                    <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 ${
                      squad.overdueCount > 0
                        ? isDark
                          ? 'bg-rose-950/60 border-rose-800 text-rose-300 font-bold'
                          : 'bg-rose-50 border-rose-300 text-rose-800 font-bold'
                        : isDark
                        ? 'bg-zinc-800/40 border-zinc-800 text-zinc-500'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}>
                      <span>⚠️ Overdue:</span>
                      <span className="font-bold">{squad.overdueCount}</span>
                    </div>

                    {/* On Hold Badge */}
                    <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 ${
                      squad.onHoldCount > 0
                        ? isDark
                          ? 'bg-amber-950/60 border-amber-800 text-amber-300 font-bold'
                          : 'bg-amber-50 border-amber-300 text-amber-800 font-bold'
                        : isDark
                        ? 'bg-zinc-800/40 border-zinc-800 text-zinc-500'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}>
                      <span>⏳ On Hold:</span>
                      <span className="font-bold">{squad.onHoldCount}</span>
                    </div>

                    {/* In Progress Badge */}
                    <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 ${
                      squad.inProgressCount > 0
                        ? isDark
                          ? 'bg-blue-950/60 border-blue-800 text-blue-300 font-bold'
                          : 'bg-blue-50 border-blue-300 text-blue-800 font-bold'
                        : isDark
                        ? 'bg-zinc-800/40 border-zinc-800 text-zinc-500'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}>
                      <span>🔧 In Work:</span>
                      <span className="font-bold">{squad.inProgressCount}</span>
                    </div>

                    {/* Total Active Queue Depth */}
                    <div className={`px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 ${
                      isDark ? 'bg-zinc-800/80 border-zinc-700 text-zinc-200' : 'bg-slate-100 border-slate-300 text-slate-900'
                    }`}>
                      <span>Active Queue:</span>
                      <span className="text-sm font-black">{squad.totalActive}</span>
                    </div>

                    <button
                      type="button"
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors flex items-center gap-1 shrink-0 ${
                        isExpanded
                          ? isDark
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : isDark
                          ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                      }`}
                    >
                      <span>{isExpanded ? 'Hide Tickets ▴' : 'View Tickets ▾'}</span>
                    </button>
                  </div>
                </div>
```

### Plain-English Purpose
Renders each squad as an interactive card. The header row highlights department trade icons, capacity stress tiers, rank indicators, and distinct status badges (`Overdue`, `On Hold`, `In Work`, `Active Queue`). Clicking anywhere on the row toggles the expanded work order drawer.

---

## 8. High-Frequency Viva & Technical Defense Guide

### Q1: Why are squads ranked by a custom `issuesScore` instead of simply total ticket count?
**Viva Answer**: Raw ticket volume is a misleading metric for operational stress. A squad with 10 minor routine inspection tickets is not bottlenecked, whereas a squad with 2 overdue critical power outages and 3 tickets stalled on spare parts is in severe crisis. By weighting overdue SLA breaches at $4\times$ and on-hold dependencies at $2\times$, `SquadsPage.jsx` ensures teams facing severe delivery failures bubble to the top of supervisory attention immediately.

### Q2: How does the component prevent UI freezing when sorting large volumes of tickets?
**Viva Answer**: The sorting algorithm is wrapped in `useMemo` with dependency array `[teams, tickets, overdueTicketIds, isDark]`. Ticket filtering and mathematical weighting execute only when backend data actually updates, keeping client-side UI re-renders at a steady $60\text{ FPS}$ even when supervisors interact with other UI elements.

### Q3: What is the architectural role of `ReassignTeamModal` in this view?
**Viva Answer**: In enterprise maintenance operations, triage must be actionable. Merely observing a bottleneck is insufficient; supervisors need instant remediation controls. When a squad is flagged with `Critical Backlog`, the supervisor expands their ticket drawer and clicks `Reassign Squad` on any work order. `ReassignTeamModal` invokes the backend assignment endpoint (`/api/v1/assignment/reassign`), immediately offloading the ticket to a squad with `Optimal Free Capacity`.

### Q4: How are overdue tickets detected if the SLA micro-service is offline?
**Viva Answer**: The application employs dual-check redundancy. First, it queries `fetchActiveBreaches()`. Second, inside the `overdueTickets` filter, it checks `(t.sla_deadline && isDeadlineOverdue(t.sla_deadline))`. Even if the active breaches table endpoint fails or returns an empty list, client-side timestamp comparison catches overdue tickets locally.

---

## 9. Quick Reference Summary Table

| Identifier / Hook | Type / Scope | Operational Definition |
| :--- | :--- | :--- |
| `CAMPUS_DEPT_ICONS` | Constant Dictionary | Visual emoji glyph mapping for institutional engineering trades |
| `loadData` | Async Coordinator | Dispatches concurrent API queries for squads, complaints, and SLA breaches |
| `overdueTicketIds` | Memoized `Set` | Hash set of breached ticket IDs enabling $O(1)$ constant-time lookup |
| `sortedSquads` | Memoized Array | Squad objects sorted descending by Priority Demand Stress Index (`issuesScore`) |
| `issuesScore` | Weighted Metric | Mathematical formula: $(\text{overdue} \times 4) + (\text{onHold} \times 2) + \text{active}$ |
| `capacityStatus` | Classification State | Categorizes squads into `Critical Backlog`, `Heavy Load`, or `Optimal Capacity` |
| `expandedTeamId` | State (`number|null`)| Tracks currently open squad drawer revealing active work orders |
| `handleReassignSuccess` | Callback Handler | Triggers UI feedback toast and executes live reload of squad queues |
