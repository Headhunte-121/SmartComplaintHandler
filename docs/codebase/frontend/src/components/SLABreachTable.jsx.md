# Frontend Source Documentation: `frontend/src/components/SLABreachTable.jsx`

> **File Path**: `frontend/src/components/SLABreachTable.jsx`  
> **Role**: Supervisory Exception Monitoring Workstation, Automated Polling Queue, and SLA Escalation Dispatcher.  
> **Target Audience**: College Viva Examiners, Evaluation Committees, System Architects, Students grounded in basic C/Python.

---

## 1. High-Level Architectural Purpose

In traditional enterprise ticketing systems, facility managers often have to search through thousands of open tickets to identify which ones are about to breach their Service Level Agreement (SLA). This "needle in a haystack" approach leads to delayed maintenance, student dissatisfaction, and unfulfilled campus administrative commitments.

`SLABreachTable.jsx` implements **Management by Exception**. Instead of displaying every normal ticket, it acts as a dedicated high-priority radar that surfaces *only* tickets requiring urgent supervisory intervention:
1. **Automated Background Polling**: Automatically refreshes the breach queue every 30 seconds (`refreshInterval = 30000`) without requiring manual browser refreshes.
2. **Dual-Tier Risk Classification**:
   - **Overdue Breaches (`is_breached === true`)**: Tickets where the deadline has already passed, highlighted with pulsing rose-red indicators and overdue durations (`"3h 15m overdue"`).
   - **Approaching Breach (`is_breached === false`)**: Tickets nearing expiration (typically under 1 hour remaining), highlighted in amber (`"45m remaining"`).
3. **One-Click Supervisory Interventions**:
   - **Escalate (`onEscalate`)**: Opens the priority override modal to upgrade priority or summon emergency backup.
   - **Reassign (`onReassign`)**: Opens the squad reassignment modal to transfer the ticket to a less-burdened field crew.
4. **Reassuring Zero-Breach Empty State**: If all campus maintenance is on schedule, it renders an emerald green shield graphic confirming zero operational bottlenecks.

---

## 2. Sequential Code Breakdown & Deep Analysis

```javascript
/**
 * SmartComplaintHandler - SLA Breach Escalation Panel
 * Blueprint Reference: V1/M5/frontend/04_sla_breach_table.md
 * Role: Supervisory exception monitoring workstation surfacing overdue and near-breach tickets with dual theme styling.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { fetchActiveBreaches } from '../api/sla';
import PriorityBadge from './PriorityBadge';

export default function SLABreachTable({
  onEscalate,
  onReassign,
  refreshInterval = 30000,
}) {
  const { isDark } = useTheme();
  const [breaches, setBreaches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTier, setFilterTier] = useState('ALL'); // 'ALL' | 'BREACHED' | 'APPROACHING'
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [error, setError] = useState(null);
```

### Plain-English Purpose
Imports dependencies and defines the component. It accepts callback functions for escalation and reassignment and a configurable polling interval (defaulting to 30,000 milliseconds = 30 seconds). It initializes reactive states for breaches data, loading indicators, active filter tab, last refresh timestamp, and error messages.

### Line-by-Line Breakdown
- `import { useState, useEffect, useCallback } from 'react'`: Standard React hooks.
- `import { fetchActiveBreaches } from '../api/sla'`: API function making the HTTP request to the backend breach queue endpoint.
- `import PriorityBadge from './PriorityBadge'`: Reusable priority pill component.
- `onEscalate`, `onReassign`: Callback prop functions triggered when supervisor clicks action buttons.
- `refreshInterval = 30000`: Default parameter setting polling frequency to 30 seconds.
- `filterTier`: State variable storing active filter tab (`'ALL'`, `'BREACHED'`, or `'APPROACHING'`).
- `lastRefreshed`: Stores `Date` instance representing the exact time data was fetched.

---

```javascript
  const loadBreaches = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchActiveBreaches();
      setBreaches(data || []);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to fetch active SLA breaches.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load and automated background polling
  useEffect(() => {
    loadBreaches();
    const timer = setInterval(loadBreaches, refreshInterval);
    return () => clearInterval(timer);
  }, [loadBreaches, refreshInterval]);
```

### Plain-English Purpose
- `loadBreaches`: Asynchronous fetcher wrapped in `useCallback` to prevent unnecessary re-creations. It queries `/sla/breaches`, updates the queue array, records the timestamp, and handles network failures gracefully.
- `useEffect`: Executes `loadBreaches()` immediately upon mounting, then starts a recurring `setInterval` timer polling every 30 seconds. When the component unmounts, `clearInterval(timer)` terminates the background polling.

### Line-by-Line Breakdown
- `useCallback(async () => { ... }, [])`: Memoizes `loadBreaches` with an empty dependency array so its pointer reference remains stable.
- `const data = await fetchActiveBreaches()`: Awaits the network response.
- `setBreaches(data || [])`: Ensures `breaches` is always an array, even if the backend returns null.
- `const timer = setInterval(loadBreaches, refreshInterval)`: Spawns recurring background polling.
- `return () => clearInterval(timer)`: Cleanup callback freeing timer resources.

### Deep Term & Concept Expansion
- **Polling vs WebSockets**: For administrative escalation tables where deadlines are measured in hours or minutes, HTTP short-polling every 30 seconds is highly efficient. It avoids the persistent memory footprint and firewall complexity of full-duplex WebSockets while guaranteeing that facility managers never view data older than 30 seconds.

---

```javascript
  const overdueCount = breaches.filter((b) => b.is_breached).length;
  const approachingCount = breaches.filter((b) => !b.is_breached).length;

  const filteredBreaches = breaches.filter((b) => {
    if (filterTier === 'BREACHED') return b.is_breached;
    if (filterTier === 'APPROACHING') return !b.is_breached;
    return true;
  });

  const formatDuration = (item) => {
    if (item.is_breached) {
      const hours = Math.floor(item.overdue_seconds / 3600);
      const minutes = Math.floor((item.overdue_seconds % 3600) / 60);
      return `${hours}h ${minutes}m overdue`;
    }
    const hours = Math.floor(item.remaining_seconds / 3600);
    const minutes = Math.floor((item.remaining_seconds % 3600) / 60);
    if (hours === 0) {
      return `${minutes}m remaining`;
    }
    return `${hours}h ${minutes}m remaining`;
  };
```

### Plain-English Purpose
Calculates dynamic statistics and formats display values:
- `overdueCount` & `approachingCount`: Tallies breached vs. near-breach tickets.
- `filteredBreaches`: Filters the active display array based on the selected tab.
- `formatDuration`: Formats raw seconds into human-readable strings like `"2h 15m overdue"` or `"45m remaining"`.

### Line-by-Line Breakdown
- `.filter((b) => b.is_breached).length`: Fast $O(N)$ linear filter counting breached tickets.
- `Math.floor(item.overdue_seconds / 3600)`: Extracts whole hours.
- `Math.floor((item.overdue_seconds % 3600) / 60)`: Extracts remainder minutes.

---

```javascript
  return (
    <div
      className={`rounded-2xl border p-6 shadow-xs transition-colors ${
        isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100' : 'bg-[#f1f5f9] border-slate-300 text-slate-900'
      }`}
    >
      {/* Header Bar */}
      <div
        className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5 ${
          isDark ? 'border-zinc-800' : 'border-slate-300'
        }`}
      >
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className={`text-base font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
              Active SLA Escalations &amp; Breaches
            </h3>
            {overdueCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/20 px-2.5 py-0.5 text-xs font-bold text-rose-400 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                {overdueCount} Overdue
              </span>
            ) : (
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                  isDark
                    ? 'border-emerald-800 bg-emerald-950/60 text-emerald-300'
                    : 'border-emerald-300 bg-emerald-100 text-emerald-800'
                }`}
              >
                0 Overdue
              </span>
            )}
          </div>
          <p className={`mt-1 text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
            Exception-based supervisory monitoring &bull; Refreshed at{' '}
            {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadBreaches}
            disabled={isLoading}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-2xs disabled:opacity-50 cursor-pointer transition-colors ${
              isDark
                ? 'bg-[#0e1117] hover:bg-zinc-800 text-zinc-200 border-zinc-700'
                : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] text-slate-800 border-slate-300'
            }`}
            title="Refresh breach queue"
          >
            <svg
              className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-emerald-400' : isDark ? 'text-zinc-400' : 'text-slate-600'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{isLoading ? 'Polling...' : 'Refresh'}</span>
          </button>
        </div>
      </div>
```

### Plain-English Purpose
Renders the panel header. It displays the title, a dynamic badge (pulsing red if overdue tickets exist; calm emerald if 0 overdue), the timestamp of the last successful refresh, and a manual "Refresh" button whose icon spins while polling is active.

---

```javascript
      {/* Filter Tabs Bar */}
      <div
        className={`mt-4 flex items-center gap-2 border-b pb-3 ${
          isDark ? 'border-zinc-800' : 'border-slate-300'
        }`}
      >
        <button
          type="button"
          onClick={() => setFilterTier('ALL')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
            filterTier === 'ALL'
              ? isDark ? 'bg-zinc-800 text-white border border-zinc-700' : 'bg-slate-900 text-white'
              : isDark ? 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200' : 'text-slate-600 hover:bg-[#cbd5e1]/50 hover:text-slate-900'
          }`}
        >
          All High-Risk ({breaches.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterTier('BREACHED')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
            filterTier === 'BREACHED'
              ? 'bg-rose-600 text-white'
              : isDark ? 'text-rose-400 hover:bg-rose-950/40' : 'text-rose-700 hover:bg-rose-100'
          }`}
        >
          Overdue Breaches ({overdueCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterTier('APPROACHING')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
            filterTier === 'APPROACHING'
              ? 'bg-amber-600 text-white'
              : isDark ? 'text-amber-400 hover:bg-amber-950/40' : 'text-amber-700 hover:bg-amber-100'
          }`}
        >
          Approaching Breach ({approachingCount})
        </button>
      </div>
```

### Plain-English Purpose
Renders three filter pill buttons enabling facility supervisors to slice the exception queue:
1. **All High-Risk**: Shows the total count of both breached and near-breach tickets.
2. **Overdue Breaches**: Highlights tickets that have officially violated SLA commitments (active rose button).
3. **Approaching Breach**: Highlights tickets that have not yet breached but are entering the danger zone (amber button).

---

```javascript
      {/* Content Area */}
      <div className="mt-4">
        {breaches.length === 0 && !isLoading ? (
          /* Zero-Breach Empty State Callout */
          <div
            className={`rounded-2xl border p-10 text-center transition-colors ${
              isDark ? 'border-emerald-800/60 bg-emerald-950/20' : 'border-emerald-300 bg-emerald-50/70'
            }`}
          >
            <div
              className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${
                isDark ? 'bg-emerald-900/60 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h4 className={`text-sm font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
              Zero Active SLA Breaches
            </h4>
            <p className={`mt-1 text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              All campus maintenance queues are operating smoothly within target commitments.
            </p>
          </div>
```

### Plain-English Purpose
The "Zero-Breach Empty State". In exception monitoring, having an empty list is a positive sign: it means every campus complaint is being serviced on schedule. Instead of a blank screen, it renders an emerald shield icon and a clear message confirming healthy operations.

---

```javascript
          /* Table of Breached and Nearing-Breach Tickets */
          <div
            className={`overflow-x-auto rounded-xl border transition-colors ${
              isDark ? 'border-zinc-800 bg-[#0e1117]' : 'border-slate-300 bg-white'
            }`}
          >
            <table className="w-full text-left text-xs">
              <thead
                className={`border-b text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  isDark ? 'border-zinc-800 bg-[#161b22] text-zinc-400' : 'border-slate-300 bg-[#e2e8f0] text-slate-700'
                }`}
              >
                <tr>
                  <th className="px-4 py-3">Tracking Code</th>
                  <th className="px-4 py-3">Issue &amp; Location</th>
                  <th className="px-4 py-3">Department &amp; Squad</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">SLA Status</th>
                  <th className="px-4 py-3 text-right">Supervisory Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-slate-200'}`}>
                {filteredBreaches.map((ticket) => (
                  <tr
                    key={ticket.ticket_id}
                    className={`transition-colors ${
                      isDark ? 'hover:bg-zinc-800/40 text-zinc-200' : 'hover:bg-[#cbd5e1]/40 text-slate-800'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            ticket.is_breached ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
                          }`}
                        />
                        <span className={`font-mono font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                          {ticket.tracking_code}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className={`font-semibold truncate ${isDark ? 'text-zinc-100' : 'text-slate-900'}`} title={ticket.title}>
                        {ticket.title}
                      </div>
                      {ticket.location && (
                        <div className={`flex items-center gap-1 text-[11px] truncate ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                          <svg className="h-3 w-3 flex-shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <span>{ticket.location}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className={`font-medium ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>{ticket.department_name || 'Unassigned'}</div>
                      <div className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>{ticket.assigned_team_name || 'No Squad Assigned'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {ticket.is_breached ? (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-500 animate-pulse">
                          {formatDuration(ticket)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-500">
                          {formatDuration(ticket)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {onEscalate && (
                          <button
                            type="button"
                            onClick={() => onEscalate(ticket)}
                            className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                              isDark
                                ? 'border-amber-700/60 bg-amber-950/60 text-amber-300 hover:bg-amber-900/60'
                                : 'border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200'
                            }`}
                          >
                            Escalate
                          </button>
                        )}
                        {onReassign && (
                          <button
                            type="button"
                            onClick={() => onReassign(ticket)}
                            className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                              isDark
                                ? 'border-indigo-700/60 bg-indigo-950/60 text-indigo-300 hover:bg-indigo-900/60'
                                : 'border-indigo-300 bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                            }`}
                          >
                            Reassign
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Plain-English Purpose
Renders the tabular exception queue. Each row displays:
1. **Tracking Code**: Monospace font with an active pulsing status light (red for overdue, amber for approaching).
2. **Issue & Location**: Incident title with tooltip and campus room location.
3. **Department & Squad**: Assigned administrative department and field repair team.
4. **Priority**: Renders `<PriorityBadge priority={ticket.priority} />`.
5. **SLA Status**: Exact duration overdue or time remaining.
6. **Supervisory Action Buttons**: "Escalate" (triggers `onEscalate(ticket)`) and "Reassign" (triggers `onReassign(ticket)`).

---

## 3. High-Frequency Viva & Technical Defense Questions

### Q1: What is "Management by Exception" and how does `SLABreachTable` implement it?
**Model Answer:**  
Management by Exception is an operational strategy where supervisors do not spend time monitoring routine, on-track activities, but instead focus their attention on significant deviations from standard targets. `SLABreachTable` filters out all healthy, compliant tickets and queries *only* tickets that have breached or are about to breach their SLA. This allows campus facility directors to immediately spot and resolve operational bottlenecks.

### Q2: Why does the component use polling via `setInterval` rather than manual reloading?
**Model Answer:**  
In campus facilities management, supervisors often keep this dashboard open on a dedicated wall monitor in the operations room. Background short-polling (`setInterval(loadBreaches, 30000)`) guarantees that the screen continuously updates with fresh server data every 30 seconds without requiring any manual human interaction or causing page flicker.

### Q3: What happens when the supervisor clicks the "Escalate" or "Reassign" buttons?
**Model Answer:**  
The table passes the active ticket object to the parent dashboard via the `onEscalate(ticket)` and `onReassign(ticket)` callback props. The parent dashboard (such as `AdminDashboard.jsx` or `SuperAdminDashboard.jsx`) captures this event and opens the corresponding modal:
- `PriorityOverrideModal`: To elevate priority from `MEDIUM` to `CRITICAL`.
- `ReassignTeamModal`: To transfer the ticket from an overloaded squad to an available team.

### Q4: Why does `formatDuration` handle breached and non-breached tickets differently?
**Model Answer:**  
For breached tickets (`item.is_breached === true`), the remaining time is negative, so the backend sends `overdue_seconds`. `formatDuration` converts this into elapsed breach time (e.g. `"2h 45m overdue"`). For non-breached tickets, it calculates the positive remaining buffer (e.g. `"25m remaining"`). This distinction makes urgency immediately obvious to operators.

### Q5: How does the component ensure that network requests stop if the user navigates away?
**Model Answer:**  
Inside the `useEffect` hook, the recurring timer handle is captured in `const timer = setInterval(...)`. The effect returns a cleanup closure: `() => clearInterval(timer)`. When the user leaves the page or the component unmounts, React immediately calls this cleanup function, halting the timer and preventing wasted background network requests.

---

## 4. Quick Reference Summary Table

| UI Element / Feature | Technical Implementation | Purpose / Behavior |
| :--- | :--- | :--- |
| **Background Polling** | `setInterval(loadBreaches, 30000)` | Auto-refreshes exception queue every 30 seconds |
| **Filter Tabs** | `ALL`, `BREACHED`, `APPROACHING` | Filters display between all risks, only overdue, or only near-breach |
| **Overdue Count Badge** | `breaches.filter(b => b.is_breached).length` | Pulsing red pill if $>0$; calm emerald pill if $=0$ |
| **Zero-Breach Callout** | Conditional render on `breaches.length === 0` | Displays emerald shield confirming zero campus bottlenecks |
| **Escalate Action** | `onClick={() => onEscalate(ticket)}` | Launches priority elevation modal for immediate intervention |
| **Reassign Action** | `onClick={() => onReassign(ticket)}` | Launches squad reassignment modal to balance team workloads |
