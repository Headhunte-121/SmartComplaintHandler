# TrackTicket.jsx — Exhaustive Sequential Technical Documentation

> **File Path**: `frontend/src/pages/TrackTicket.jsx`  
> **Target Audience**: College Viva Examiners, Project Review Committee, Academic Evaluators, and Engineers grounded in foundational C and Python programming.  
> **Module Classification**: Frontend Public & Authenticated Grievance Status Inspection Console / Real-Time SLA Countdown & Milestone Tracker.

---

## 1. Module Overview & Architectural Purpose

In enterprise facility management systems, transparency is essential. When students or faculty members lodge maintenance complaints (e.g. for air conditioning failures, laboratory network outages, or plumbing leaks), they require real-time visibility into who is working on the repair, when the issue was escalated, and how much time remains under the institutional Service Level Agreement (SLA).

`TrackTicket.jsx` provides the **public-facing and authenticated status verification console** for the `SmartComplaintHandler` platform:
1. **Zero-Login Public Access**: Anyone holding a valid alphanumeric tracking reference code (e.g., `SCH-20261015-AB12CD`) can query ticket telemetry without logging in, enabling quick checks by students, parents, or external contractors.
2. **Authenticated Quick-History Chips**: If a student is authenticated, the page automatically queries their recent personal grievances and renders one-click chip buttons, eliminating manual code entry.
3. **Dynamic 3-Stage Progress Milestones**: A graphical pipeline visualizes current ticket progress: `Submitted` &rarr; `In Repair / Escalated` &rarr; `Resolved / Closed`.
4. **Real-Time SLA Countdown Engine**: Embeds `SLACountdownTimer` to display live time remaining before breach, calculating color-coded urgencies based on the assigned priority.
5. **Supervisory Escalation Alerts**: Displays high-visibility warning notices if the ticket has breached its resolution window and been escalated to senior facility directors.
6. **Resolution Notes & Satisfaction Star Rating**: Once resolved, displays the technician's official closure notes alongside the student's 1-to-5 star rating and feedback comments.

### Foundational Programming Analogy (C & Python)
- In **C programming**, think of this module as a database record lookup utility:
  ```c
  struct ComplaintTicket ticket;
  if (lookup_by_code(user_input_code, &ticket) == FOUND) {
      display_progress_bar(ticket.status);
      display_sla_remaining(ticket.sla_deadline);
      display_squad_info(&ticket);
  } else {
      print_error("Invalid Ticket Code");
  }
  ```
- In **Python (`FastAPI` or `Flask`)**, it corresponds to an inspection route `/track?code=...` fetching an ORM model and rendering an interactive status template.

---

## 2. Integrated Sequential Code Walkthrough & Inline Technical Breakdown

Below is the exhaustive, sequential, line-by-line examination of `TrackTicket.jsx`.

---

### Snippet 1: Module Header, React Hooks, Router & Component Imports

```javascript
/**
 * SmartComplaintHandler - Grievance Status Tracker
 * Flush Edge-to-Edge Command Layout with Exact SubmitComplaint Dual Theme Palette
 * (Zero Gradients, Pure High-Contrast Solid Surfaces)
 */
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { fetchTicketByCode, fetchComplaints } from '../api/complaints';
import PriorityBadge from '../components/PriorityBadge';
import SLACountdownTimer from '../components/SLACountdownTimer';
```

#### Plain-English Purpose & C/Python Analogy
Imports foundational React hooks, routing tools, context providers, API communication services, and specialized telemetry presentation components (`PriorityBadge`, `SLACountdownTimer`).
- In **C**, this corresponds to `#include` directives loading string utilities, HTTP clients, and status badge formatting libraries.
- In **Python**, it corresponds to `import` statements loading `datetime`, API clients, and template components.

#### Line-by-Line Breakdown
- **Lines 1–5**: File docstring defining the design philosophy (flush command layout, zero gradients, pure high-contrast solid surfaces).
- **Line 6**: Imports `React`, `useState`, and `useEffect`.
- **Line 7**: Imports `Link` (client-side declarative navigation) and `useSearchParams` (for reading and writing URL query strings like `?code=...`).
- **Lines 8–9**: Imports `useTheme` and `useAuth` context hooks.
- **Line 10**: Imports API functions:
  - `fetchTicketByCode`: Fetches a single complaint ticket by its tracking code.
  - `fetchComplaints`: Fetches multiple tickets matching query filters (used to populate recent user tickets).
- **Lines 11–12**: Imports reusable components:
  - `PriorityBadge`: Renders color-coded severity badges (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
  - `SLACountdownTimer`: Live timer ticking down remaining hours and minutes against the ticket's SLA deadline.

---

### Snippet 2: Component Signature & State Declarations

```javascript
export default function TrackTicket() {
  const { isDark } = useTheme();
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchCode, setSearchCode] = useState(searchParams.get('code') || '');
  const [ticket, setTicket] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
```

#### Plain-English Purpose & C/Python Analogy
Defines the `TrackTicket` functional component and initializes nine local state variables and context hooks.
- In **C programming**, this is allocating an inspection context struct:
  ```c
  typedef struct {
      char search_code[32];
      Complaint* active_ticket;
      Complaint recent_list[6];
      bool is_loading;
      char error_msg[128];
  } TrackContext;
  ```
- In **Python**, it corresponds to initializing instance attributes inside a view controller class.

#### Line-by-Line Breakdown
- **Line 14**: Declares and exports default functional component `TrackTicket`.
- **Line 15**: Extracts `isDark` boolean from `ThemeContext`.
- **Line 16**: Extracts `currentUser` from `AuthContext`.
- **Line 17**: Initializes `[searchParams, setSearchParams]` to read and mutate query string parameters.
- **Line 18**: `searchCode`: Initialized with `searchParams.get('code')` or empty string `''`.
- **Line 19**: `ticket`: Stores the retrieved complaint ticket object, or `null` if none searched.
- **Line 20**: `recentTickets`: Array storing up to 6 tickets previously submitted by the logged-in student.
- **Line 21**: `loading`: Boolean indicating an in-flight network request.
- **Line 22**: `error`: Error string displayed if the code is invalid or network fails.
- **Line 23**: `copied`: Boolean tracking whether the user clicked "Copy Code", showing temporary "✓ Copied" confirmation.

---

### Snippet 3: Programmatic Tracking Engine (`performLookup`)

```javascript
  const performLookup = async (codeToSearch) => {
    const clean = (codeToSearch || '').trim().toUpperCase();
    if (!clean) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTicketByCode(clean);
      setTicket(data);
      setSearchParams({ code: clean });
    } catch (err) {
      setTicket(null);
      setError(err.response?.data?.detail || `No ticket found matching '${clean}'. Please verify the tracking code.`);
    } finally {
      setLoading(false);
    }
  };
```

#### Plain-English Purpose & C/Python Analogy
The core lookup dispatcher. It cleans the tracking code, initiates the backend API call to `/api/v1/complaints/track/{code}`, updates URL search params to ensure shareable links, and sets the active `ticket` object.
- In **C programming**, this is sanitizing string input with `toupper()` and executing an SQL `SELECT * FROM complaints WHERE tracking_code = ?`.
- In **Python**, it is `clean = code.strip().upper(); ticket = api.get_ticket(clean)`.

#### Line-by-Line Breakdown
- **Line 25**: Declares `performLookup(codeToSearch)`.
- **Line 26**: Cleans input: trims whitespace and forces uppercase normalization (`e.g., "sch-abc" -> "SCH-ABC"`).
- **Line 27**: If string is empty, exits immediately.
- **Lines 28–34**: `try` block:
  - Sets `loading = true` and resets `error = null`.
  - Dispatches `await fetchTicketByCode(clean)`.
  - On success: updates `ticket` state and synchronizes URL query string `setSearchParams({ code: clean })`.
- **Lines 34–37**: `catch` block: Resets `ticket = null` and formats error message from backend response `err.response?.data?.detail`.
- **Lines 37–39**: `finally` block: Releases loading spinner `setLoading(false)`.

---

### Snippet 4: Authenticated Recent Grievances Query & URL Synchronization Effects

```javascript
  useEffect(() => {
    if (!currentUser?.email) {
      setRecentTickets([]);
      return;
    }
    fetchComplaints({ limit: 6, student_email: currentUser.email })
      .then((list) => {
        if (Array.isArray(list)) setRecentTickets(list.slice(0, 6));
      })
      .catch(() => {});
  }, [currentUser?.email]);

  useEffect(() => {
    const initialCode = searchParams.get('code');
    if (initialCode) {
      setSearchCode(initialCode);
      performLookup(initialCode);
    }
  }, [searchParams]);
```

#### Plain-English Purpose & C/Python Analogy
Two reactive lifecycle hooks:
1. First hook: If a user is logged in, fetches their 6 most recent complaint tickets using their email address.
2. Second hook: Reads the URL parameter `?code=...` on initial load (or on browser back/forward navigation) and automatically triggers `performLookup()`.
- In **Python GUI programming**, these are event bindings that execute on window load and URL routing events.

#### Line-by-Line Breakdown
- **Lines 42–52**: `useEffect` monitoring `currentUser?.email`:
  - If user is not authenticated or email is missing, clears `recentTickets`.
  - Calls `fetchComplaints({ limit: 6, student_email: currentUser.email })`.
  - Slices array to 6 elements and updates `recentTickets`. Catches and silences network errors to prevent disrupting the page.
- **Lines 54–60**: `useEffect` monitoring `searchParams`:
  - Extracts `initialCode = searchParams.get('code')`.
  - If present, populates `searchCode` and executes `performLookup(initialCode)`.

---

### Snippet 5: Clipboard Helper & Milestone Resolvers

```javascript
  const handleCopyCode = (code) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const getStepIndex = (status) => {
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED':
        return 2;
      case 'IN_PROGRESS':
      case 'ASSIGNED':
      case 'ESCALATED':
        return 1;
      default:
        return 0;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED':
        return isDark
          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80'
          : 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'IN_PROGRESS':
        return isDark
          ? 'bg-blue-950/80 text-blue-400 border-blue-800/80'
          : 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ESCALATED':
        return isDark
          ? 'bg-rose-950/80 text-rose-400 border-rose-800/80'
          : 'bg-rose-100 text-rose-800 border-rose-300';
      case 'ASSIGNED':
        return isDark
          ? 'bg-purple-950/80 text-purple-400 border-purple-800/80'
          : 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return isDark
          ? 'bg-amber-950/80 text-amber-400 border-amber-800/80'
          : 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  const stepIndex = ticket ? getStepIndex(ticket.status) : 0;
```

#### Plain-English Purpose & C/Python Analogy
Provides utility functions for copying tracking codes to the OS clipboard, calculating milestone pipeline indices (Stage 0, 1, or 2), and mapping ticket status strings to visual Tailwind badge styles.
- In **C**, `getStepIndex` is a simple `switch(status)` statement returning an integer state enum (`STAGE_SUBMITTED = 0`, `STAGE_REPAIR = 1`, `STAGE_CLOSED = 2`).

#### Line-by-Line Breakdown
- **Lines 62–68**: `handleCopyCode(code)`: Uses `navigator.clipboard.writeText(code)`. Sets `copied = true`, reverting to false after $1800\text{ms}$ via `setTimeout`.
- **Lines 70–82**: `getStepIndex(status)`:
  - Returns `2` for `'RESOLVED'` or `'CLOSED'`.
  - Returns `1` for `'IN_PROGRESS'`, `'ASSIGNED'`, or `'ESCALATED'`.
  - Returns `0` for pending/unassigned states (`'NEW'`, `'OPEN'`).
- **Lines 84–108**: `getStatusBadgeClass(status)`: Maps status to color schemes:
  - `'RESOLVED'` / `'CLOSED'` &rarr; Emerald.
  - `'IN_PROGRESS'` &rarr; Blue.
  - `'ESCALATED'` &rarr; Rose/Red.
  - `'ASSIGNED'` &rarr; Purple.
  - Default &rarr; Amber.
- **Line 110**: Computes `stepIndex = ticket ? getStepIndex(ticket.status) : 0`.

---

### Snippet 6: Header Command Deck & Navigation Actions

```javascript
  return (
    <div className={`w-full min-h-screen flex flex-col space-y-0 transition-colors animate-fade-in ${
      isDark ? 'bg-[#0e1117] text-zinc-100' : 'bg-white text-slate-900'
    }`}>
      {/* Flush Command Deck Header (Solid surfaces, no gradients) */}
      <div className={`w-full border-b px-4 sm:px-8 lg:px-12 py-8 relative transition-colors ${
        isDark ? 'bg-[#161b22] border-zinc-800' : 'bg-white border-slate-200'
      }`}>
        <div className="w-full flex flex-col sm:flex-row sm:items-end justify-between gap-6 relative z-10 max-w-5xl mx-auto">
          <div className="space-y-3">
            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold shadow-xs border ${
              isDark
                ? 'bg-emerald-950/80 border-emerald-800/80 text-emerald-400'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Real-Time SLA &amp; Squad Telemetry Tracker</span>
              <span className={isDark ? 'text-emerald-500' : 'text-emerald-400'}>·</span>
              <span className={`font-mono text-[11px] ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Live</span>
            </div>
            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight ${
              isDark ? 'text-zinc-100' : 'text-slate-900'
            }`}>
              Track Request Status
            </h1>
            <p className={`text-xs sm:text-sm max-w-2xl leading-relaxed ${
              isDark ? 'text-zinc-400' : 'text-slate-600'
            }`}>
              Enter your official reference code to inspect live repair milestones, assigned squad triage, and SLA countdown timers.
            </p>
          </div>

          {/* Quick Navigation Action Links */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/submit"
              className={`px-4 py-2.5 rounded-xl border font-bold text-xs shadow-2xs transition-all inline-flex items-center gap-2 cursor-pointer ${
                isDark
                  ? 'bg-[#0e1117] hover:bg-[#1c2128] border-zinc-700 text-emerald-400 hover:text-emerald-300'
                  : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] border-slate-300 text-emerald-800 hover:text-emerald-900'
              }`}
            >
              <span>+ Lodge New Request</span>
            </Link>
            <Link
              to="/student"
              className={`px-4 py-2.5 rounded-xl border font-bold text-xs shadow-2xs transition-all inline-flex items-center gap-2 cursor-pointer ${
                isDark
                  ? 'bg-[#0e1117] hover:bg-[#1c2128] border-zinc-700 text-zinc-200 hover:text-white'
                  : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] border-slate-300 text-slate-800 hover:text-slate-950'
              }`}
            >
              <span>My Requests →</span>
            </Link>
          </div>
        </div>
      </div>
```

#### Plain-English Purpose & C/Python Analogy
Renders the top command banner. Displays telemetry status badges, primary heading, and navigation shortcuts to lodge a new complaint (`/submit`) or view student requests (`/student`).
- In **Python/Tkinter**, this is the main title block.

#### Line-by-Line Breakdown
- **Lines 113–115**: Root layout wrapper with theme-reactive backgrounds.
- **Lines 117–146**: Banner with pulsating green dot (`animate-ping`) and H1 title.
- **Lines 148–170**: Action buttons linking to `/submit` and `/student`.

---

### Snippet 7: Search Card & Authenticated Recent Grievances Chips

```javascript
      {/* Main Content Area */}
      <div className={`w-full px-4 sm:px-8 lg:px-12 py-10 transition-colors flex-1 ${
        isDark ? 'bg-[#0e1117]' : 'bg-white'
      }`}>
        <div className="max-w-4xl mx-auto space-y-6 w-full">
          {/* Search Card (Solid emerald top accent, no gradient) */}
          <div className={`p-6 sm:p-7 space-y-5 rounded-2xl relative overflow-hidden border transition-colors ${
            isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-md' : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-sm'
          }`}>
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />

            <form
              onSubmit={(e) => {
                e.preventDefault();
                performLookup(searchCode);
              }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                  placeholder="Enter Tracking Code (e.g. SCH-20261015-AB12CD)"
                  className={`w-full px-4 py-3 rounded-xl border font-mono uppercase text-xs sm:text-sm tracking-wider focus:outline-none transition-all ${
                    isDark
                      ? 'bg-[#0e1117] border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                      : 'bg-[#e2e8f0] border-slate-300 text-slate-900 placeholder-slate-500 hover:border-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20'
                  }`}
                />
                {searchCode && (
                  <button
                    type="button"
                    onClick={() => setSearchCode('')}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer ${
                      isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || !searchCode.trim()}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : 'Track →'}
              </button>
            </form>

            {/* Recent Ticket Chips (Authenticated Student Only) */}
            {currentUser && recentTickets.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                <span className={`text-[11px] font-bold uppercase tracking-wider font-mono ${
                  isDark ? 'text-zinc-500' : 'text-slate-600'
                }`}>
                  Your Recent Grievances:
                </span>
                {recentTickets.map((item) => (
                  <button
                    key={item.tracking_code}
                    type="button"
                    onClick={() => {
                      setSearchCode(item.tracking_code);
                      performLookup(item.tracking_code);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold border cursor-pointer transition-all shadow-xs ${
                      isDark
                        ? 'bg-[#0e1117] hover:bg-[#1c2128] text-emerald-400 border-zinc-800 hover:border-emerald-500/80'
                        : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] text-emerald-800 border-slate-300 hover:border-emerald-600'
                    }`}
                  >
                    {item.tracking_code}
                  </button>
                ))}
              </div>
            )}
          </div>
```

#### Plain-English Purpose & C/Python Analogy
Renders the primary tracking input card. When typed, text is automatically uppercased (`e.target.value.toUpperCase()`). If the user is logged in and has previous tickets, renders a row of clickable history chip buttons.
- In **C/Python**, this is reading input with automatic capital letter formatting and listing previous query history.

#### Line-by-Line Breakdown
- **Lines 174–183**: Form card with top emerald accent line.
- **Lines 184–222**: `<form>` element:
  - Input field formatted in uppercase monospace font.
  - Clear button `✕` visible when input is non-empty.
  - Submit button labeled `"Track →"` or `"Searching..."` when disabled.
- **Lines 224–250**: Recent ticket chips: Rendered only when `currentUser && recentTickets.length > 0`. Clicking a chip populates `searchCode` and triggers `performLookup()`.

---

### Snippet 8: Error Banner & Ticket Inspection Header

```javascript
          {error && (
            <div className={`p-4 rounded-xl border text-xs font-semibold shadow-xs flex items-center gap-2.5 ${
              isDark ? 'bg-rose-950/80 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              <span className="text-base">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Ticket Details Inspection Card */}
          {ticket && (
            <div className={`p-6 sm:p-8 space-y-6 rounded-2xl relative overflow-hidden border transition-colors ${
              isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-md' : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-sm'
            }`}>
              <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />

              {/* Header Row */}
              <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5 ${
                isDark ? 'border-zinc-800' : 'border-slate-300'
              }`}>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className={`font-mono text-xl sm:text-2xl font-black ${
                      isDark ? 'text-emerald-400' : 'text-emerald-700'
                    }`}>
                      {ticket.tracking_code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(ticket.tracking_code)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition-colors ${
                        isDark
                          ? 'bg-[#0e1117] hover:bg-[#1c2128] text-zinc-300 hover:text-white border-zinc-700'
                          : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] text-slate-800 hover:text-slate-950 border-slate-300'
                      }`}
                    >
                      {copied ? '✓ Copied' : 'Copy Code'}
                    </button>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide border uppercase font-mono ${
                      getStatusBadgeClass(ticket.status)
                    }`}>
                      {ticket.status}
                    </span>
                    <PriorityBadge priority={ticket.priority} size="md" dark={isDark} />
                  </div>
                  <h2 className={`text-base sm:text-lg font-bold ${
                    isDark ? 'text-zinc-100' : 'text-slate-900'
                  }`}>
                    {ticket.title}
                  </h2>
                </div>

                <SLACountdownTimer
                  slaDeadline={ticket.sla_deadline || ticket.target_resolution_date}
                  priority={ticket.priority}
                  status={ticket.status}
                  resolvedAt={ticket.resolved_at}
                  dark={isDark}
                />
              </div>
```

#### Plain-English Purpose & C/Python Analogy
Renders error banners and the primary ticket inspection header:
- Displays tracking code in large bold typography.
- "Copy Code" button copying the code to clipboard.
- Status badge with color-coded severity.
- `PriorityBadge` indicating triage severity.
- `SLACountdownTimer` showing real-time hours/minutes remaining until SLA breach.
- In **Python GUI programming**, this is the main record header.

#### Line-by-Line Breakdown
- **Lines 253–260**: Conditional error banner with red accent and warning icon.
- **Lines 263–267**: Guard condition `{ticket && (` mounts the inspection card.
- **Lines 270–312**: Inspection card header:
  - `ticket.tracking_code`: Displayed in $20-24\text{px}$ bold font.
  - "Copy Code" button with temporary confirmation feedback.
  - Status pill badge with dynamic CSS class from `getStatusBadgeClass()`.
  - `<PriorityBadge priority={ticket.priority} size="md" dark={isDark} />`.
  - `<SLACountdownTimer>` bound to SLA deadline and resolved timestamps.

---

### Snippet 9: Supervisory Escalation Warning & 3-Step Dynamic Milestone Rail

```javascript
              {/* Escalation Warning (if applicable) */}
              {ticket.status === 'ESCALATED' && (
                <div className={`p-4 rounded-xl border text-xs font-semibold flex items-start gap-3 ${
                  isDark ? 'bg-rose-950/40 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-300 text-rose-800'
                }`}>
                  <span className="text-lg">🚨</span>
                  <div>
                    <span className="font-bold block">Supervisory Escalation Active</span>
                    <span className="text-[11px] opacity-90 mt-0.5 block">
                      This incident has exceeded standard operational thresholds and is directly monitored by Facilities Command.
                    </span>
                  </div>
                </div>
              )}

              {/* 3-Step Milestone Pipeline (Solid rails and circles, no gradient) */}
              <div className={`p-5 sm:p-6 rounded-xl border ${
                isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#e2e8f0]/80 border-slate-300'
              }`}>
                <div className="relative flex items-center justify-between px-2 sm:px-8 py-3">
                  <div className={`absolute top-8 left-10 right-10 h-1 -z-0 ${
                    isDark ? 'bg-zinc-800' : 'bg-slate-300'
                  }`} />
                  <div
                    className="absolute top-8 left-10 h-1 bg-emerald-600 transition-all duration-500 -z-0"
                    style={{
                      width: stepIndex === 2 ? 'calc(100% - 5rem)' : stepIndex === 1 ? '50%' : '0%',
                    }}
                  />

                  {/* Stage 1: Submitted */}
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs bg-emerald-600 text-white shadow-xs ring-4 ${
                      isDark ? 'ring-emerald-950' : 'ring-emerald-100'
                    }`}>
                      ✓
                    </div>
                    <span className={`text-xs font-bold mt-2 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>Submitted</span>
                    <span className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-600'}`}>
                      {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'Logged'}
                    </span>
                  </div>

                  {/* Stage 2: In Repair */}
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                        stepIndex >= 1
                          ? `bg-emerald-600 text-white ring-4 ${isDark ? 'ring-emerald-950' : 'ring-emerald-100'}`
                          : isDark
                            ? 'bg-[#161b22] border-2 border-zinc-700 text-zinc-500'
                            : 'bg-white border-2 border-slate-300 text-slate-400'
                      }`}
                    >
                      {stepIndex > 1 ? '✓' : '2'}
                    </div>
                    <span className={`text-xs font-bold mt-2 ${
                      stepIndex >= 1
                        ? isDark ? 'text-zinc-100' : 'text-slate-900'
                        : isDark ? 'text-zinc-500' : 'text-slate-500'
                    }`}>
                      {ticket.status === 'ESCALATED' ? 'Escalated' : 'In Repair'}
                    </span>
                    <span className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-600'}`}>
                      {ticket.assigned_team_name || 'Squad Dispatched'}
                    </span>
                  </div>

                  {/* Stage 3: Resolved */}
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                        stepIndex === 2
                          ? `bg-emerald-600 text-white ring-4 ${isDark ? 'ring-emerald-950' : 'ring-emerald-100'}`
                          : isDark
                            ? 'bg-[#161b22] border-2 border-zinc-700 text-zinc-500'
                            : 'bg-white border-2 border-slate-300 text-slate-400'
                      }`}
                    >
                      {stepIndex === 2 ? '✓' : '3'}
                    </div>
                    <span className={`text-xs font-bold mt-2 ${
                      stepIndex === 2
                        ? isDark ? 'text-emerald-400 font-black' : 'text-emerald-800 font-black'
                        : isDark ? 'text-zinc-500' : 'text-slate-500'
                    }`}>
                      Resolved
                    </span>
                    <span className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-600'}`}>
                      {stepIndex === 2 ? 'Closure Verified' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
```

#### Plain-English Purpose & C/Python Analogy
Renders the supervisory escalation alert (if ticket status is `ESCALATED`) and the 3-step physical milestone progress rail. The rail animates an emerald bar whose width expands dynamically from `0%` &rarr; `50%` &rarr; `100% - 5rem` based on `stepIndex`.
- In **C graphics**, this is drawing a progress bar connecting 3 milestone circle nodes.

#### Line-by-Line Breakdown
- **Lines 315–327**: Escalation warning box with flashing siren icon `🚨` explaining that standard SLA thresholds were exceeded.
- **Lines 330–407**: Milestone Pipeline:
  - Base grey horizontal track: `absolute top-8 left-10 right-10 h-1`.
  - Dynamic emerald progress bar: width is `0%` for Stage 0, `50%` for Stage 1, and `calc(100% - 5rem)` for Stage 2.
  - Stage 1 node (`Submitted`): Always completed with checkmark `✓` and creation date.
  - Stage 2 node (`In Repair` / `Escalated`): Green checkmark if resolved, green number `2` if in progress, grey if pending. Displays assigned squad name.
  - Stage 3 node (`Resolved`): Displays checkmark `✓` and closure verification status.

---

### Snippet 10: 4-Box Telemetry Grid & Reported Issue Description

```javascript
              {/* 4-Box Telemetry Metadata Grid */}
              <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl border text-xs ${
                isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#e2e8f0] border-slate-300'
              }`}>
                <div>
                  <span className={`font-bold block text-[10px] uppercase font-mono ${
                    isDark ? 'text-zinc-500' : 'text-slate-600'
                  }`}>Department</span>
                  <span className={`font-bold mt-0.5 block ${
                    isDark ? 'text-emerald-400' : 'text-emerald-800'
                  }`}>
                    {ticket.department_name || 'General Maintenance'}
                  </span>
                </div>
                <div>
                  <span className={`font-bold block text-[10px] uppercase font-mono ${
                    isDark ? 'text-zinc-500' : 'text-slate-600'
                  }`}>Assigned Squad</span>
                  <span className={`font-bold mt-0.5 block ${
                    isDark ? 'text-zinc-100' : 'text-slate-900'
                  }`}>
                    {ticket.assigned_team_name || 'Pending Squad'}
                  </span>
                </div>
                <div>
                  <span className={`font-bold block text-[10px] uppercase font-mono ${
                    isDark ? 'text-zinc-500' : 'text-slate-600'
                  }`}>Location</span>
                  <span className={`font-bold mt-0.5 block truncate ${
                    isDark ? 'text-zinc-100' : 'text-slate-900'
                  }`} title={ticket.location}>
                    📍 {ticket.location || 'Campus Facilities'}
                  </span>
                </div>
                <div>
                  <span className={`font-bold block text-[10px] uppercase font-mono ${
                    isDark ? 'text-zinc-500' : 'text-slate-600'
                  }`}>Logged On</span>
                  <span className={`font-bold mt-0.5 block ${
                    isDark ? 'text-zinc-100' : 'text-slate-900'
                  }`}>
                    {ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'Recent'}
                  </span>
                </div>
              </div>

              {/* Description Card */}
              <div className="space-y-1.5">
                <span className={`text-[11px] font-bold uppercase tracking-wider font-mono ${
                  isDark ? 'text-zinc-400' : 'text-slate-600'
                }`}>
                  Reported Issue Description
                </span>
                <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                  isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-300' : 'bg-[#e2e8f0] border-slate-300 text-slate-800'
                }`}>
                  {ticket.description}
                </div>
              </div>
```

#### Plain-English Purpose & C/Python Analogy
Renders a 4-cell diagnostic summary grid (Department, Assigned Squad, Campus Location, Submission Timestamp) followed by the original user problem description.
- In **C/Python**, this is formatting struct fields into a structured summary table.

#### Line-by-Line Breakdown
- **Lines 410–453**: Responsive 4-column metadata grid (`grid-cols-2 sm:grid-cols-4`):
  - Department: Trade department (Electrical, Civil, IT/Network).
  - Assigned Squad: Field repair squad unit.
  - Location: Building and room label with pin icon `📍`.
  - Logged On: Timestamp formatted with `toLocaleString()`.
- **Lines 455–467**: Issue Description box displaying full user text.

---

### Snippet 11: Resolution Notes, Satisfaction Rating & Empty State Explainer

```javascript
              {/* Resolution Notes Log (if resolved) */}
              {ticket.resolution_notes && (
                <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                  isDark
                    ? 'bg-emerald-950/40 border-emerald-800/80 text-zinc-200'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                }`}>
                  <div className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>
                    <span>✓</span>
                    <span>Official Resolution Log</span>
                  </div>
                  <pre className={`font-mono text-[11px] whitespace-pre-wrap ${
                    isDark ? 'text-zinc-300' : 'text-slate-700'
                  }`}>
                    {ticket.resolution_notes}
                  </pre>
                </div>
              )}

              {/* Feedback Rating Display (if rated) */}
              {ticket.feedback_rating != null && (
                <div className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
                  isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#e2e8f0] border-slate-300'
                }`}>
                  <div>
                    <span className={`font-bold block text-[10px] uppercase font-mono ${
                      isDark ? 'text-zinc-500' : 'text-slate-600'
                    }`}>Student Satisfaction Rating</span>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-sm ${star <= ticket.feedback_rating ? 'text-amber-400' : isDark ? 'text-zinc-700' : 'text-slate-400'}`}
                        >
                          ★
                        </span>
                      ))}
                      <span className={`text-xs font-bold ml-1.5 ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>
                        {ticket.feedback_rating} / 5
                      </span>
                    </div>
                  </div>
                  {ticket.feedback_comments && (
                    <span className={`text-xs italic ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                      "{ticket.feedback_comments}"
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Initial / Empty State Card (When no ticket is currently searched) */}
          {!ticket && !loading && !error && (
            <div className={`p-8 rounded-2xl border text-center space-y-5 transition-colors ${
              isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-300' : 'bg-[#f1f5f9] border-slate-300 text-slate-700 shadow-sm'
            }`}>
              <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto text-2xl ${
                isDark ? 'bg-[#0e1117] border-zinc-800 text-emerald-400' : 'bg-[#e2e8f0] border-slate-300 text-emerald-700'
              }`}>
                🔍
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className={`text-base font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                  Live SLA &amp; Dispatch Tracking
                </h3>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Paste your tracking reference code above or tap any recent ticket code to inspect real-time squad assignments and repair status.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2 max-w-2xl mx-auto">
                <div className={`p-3.5 rounded-xl border ${
                  isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#e2e8f0] border-slate-300'
                }`}>
                  <div className="text-emerald-500 font-bold text-xs mb-1">1. Auto-Triage</div>
                  <div className={`text-[11px] leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    Categorized into taxonomy and bound to strict SLA response times.
                  </div>
                </div>
                <div className={`p-3.5 rounded-xl border ${
                  isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#e2e8f0] border-slate-300'
                }`}>
                  <div className="text-blue-500 font-bold text-xs mb-1">2. Squad Dispatch</div>
                  <div className={`text-[11px] leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    Dispatched to dedicated hostel or academic facility repair squads.
                  </div>
                </div>
                <div className={`p-3.5 rounded-xl border ${
                  isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#e2e8f0] border-slate-300'
                }`}>
                  <div className="text-emerald-500 font-bold text-xs mb-1">3. Verified Closure</div>
                  <div className={`text-[11px] leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    Confirmed with mandatory resolution logs and student star ratings.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

#### Plain-English Purpose & C/Python Analogy
Renders the final sub-panels:
1. **Resolution Notes**: Displays technician closure notes in a formatted monospace card (`<pre>`).
2. **Satisfaction Rating**: Renders a 5-star rating widget highlighting filled stars in amber.
3. **Empty State Card**: When no code has been searched yet, renders an onboarding card explaining the 3-phase repair lifecycle (Auto-Triage &rarr; Squad Dispatch &rarr; Verified Closure).
- In **Python GUI programming**, this is an empty-state placeholder view.

#### Line-by-Line Breakdown
- **Lines 470–486**: Conditional Resolution Notes card: Rendered if `ticket.resolution_notes` exists. Uses `<pre whitespace-pre-wrap>` to preserve line breaks and formatting entered by the technician.
- **Lines 488–517**: Conditional Student Feedback Rating: Rendered if `ticket.feedback_rating != null`. Maps over `[1, 2, 3, 4, 5]` to draw filled or unfilled stars (`★`) in amber or slate. Displays student comments in italics.
- **Lines 522–567**: Empty State Card: Displayed when `!ticket && !loading && !error`. Educates users on the platform's automated triage, dispatch, and closure verification workflow.
- **Lines 568–572**: Closes all structural containers.

---

## 3. High-Frequency Viva & Technical Defense Guide

### Q1: How does `TrackTicket` allow unauthenticated tracking while preserving privacy and security?
**Examiner Answer**:
"Ticket tracking is intentionally permitted without requiring user authentication so that students, parents, or staff can quickly check repair statuses from any device. 
To preserve privacy and security:
1. **High-Entropy Tracking Codes**: Tracking codes are generated using cryptographically pseudorandom strings (e.g. `SCH-20261015-AB12CD`), preventing brute-force enumeration attacks.
2. **Data Sanitization**: The endpoint `/api/v1/complaints/track/{code}` returns ticket metadata (title, status, assigned squad, resolution notes), but omits sensitive student personal data (such as phone numbers or student IDs).
3. **Strict Lookup Matching**: The code must match exactly; partial wildcard lookups are disabled on public endpoints."

### Q2: How does the 3-step milestone progress rail dynamically calculate its width?
**Examiner Answer**:
"In `TrackTicket.jsx`, the milestone progress rail uses an inline CSS width style based on `stepIndex`:
```javascript
style={{
  width: stepIndex === 2 ? 'calc(100% - 5rem)' : stepIndex === 1 ? '50%' : '0%',
}}
```
- `stepIndex === 0` (New/Open): Progress bar width is `0%`.
- `stepIndex === 1` (In Progress, Assigned, Escalated): Progress bar extends to `50%`, connecting the 'Submitted' node to the 'In Repair' node.
- `stepIndex === 2` (Resolved, Closed): Progress bar extends across the entire rail (`calc(100% - 5rem)`), connecting through to the 'Resolved' milestone node.
Combined with CSS `transition-all duration-500`, this delivers a smooth animated progression when ticket status updates."

### Q3: How is URL query synchronization handled between `searchParams` and the search input?
**Examiner Answer**:
"We implement bidirectional synchronization between the browser URL and component state:
1. On initial component mount, `useEffect` reads `searchParams.get('code')`. If present, it populates `searchCode` and executes `performLookup(initialCode)`.
2. When a user submits a search form or clicks a recent ticket chip, `performLookup()` invokes `setSearchParams({ code: clean })`.
This ensures that every search generates a shareable, bookmarkable URL (e.g., `https://domain/track?code=SCH-1234`), enabling direct link sharing via SMS or email."

---

## 4. Quick-Reference Architecture & Property Table

| Feature / UI Element | State / Props Used | Architectural Role / Viva Defense |
| :--- | :--- | :--- |
| **URL Parameter Sync** | `useSearchParams()`, `setSearchParams()` | Creates shareable deep-links and synchronizes browser history with search queries. |
| **Recent Grievance Chips** | `currentUser`, `fetchComplaints()` | Fetches last 6 complaints for authenticated users, enabling 1-click status lookup. |
| **Milestone Pipeline** | `getStepIndex(ticket.status)` | Animates 3-stage progress bar: Submitted &rarr; In Repair &rarr; Resolved. |
| **Live SLA Countdown** | `<SLACountdownTimer />` | Computes live hours and minutes remaining until deadline breach. |
| **Supervisory Escalation** | `ticket.status === 'ESCALATED'` | Prominently displays alert when a ticket breaches operational SLA thresholds. |
| **Resolution Notes Log** | `ticket.resolution_notes` | Renders verified technician closure notes inside a formatted monospace card. |
| **Star Rating Display** | `ticket.feedback_rating` | Visualizes 1-to-5 star student satisfaction ratings and feedback commentary. |
| **Clipboard Copy Helper** | `navigator.clipboard.writeText()` | Copies tracking reference code to the OS clipboard with temporary UI confirmation. |

---
*Documentation compiled and verified against commit codebase standards. Strictly non-destructive: no application source files modified.*
