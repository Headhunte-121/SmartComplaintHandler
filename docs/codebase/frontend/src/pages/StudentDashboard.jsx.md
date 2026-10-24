# StudentDashboard.jsx — Exhaustive Sequential Technical Documentation

> **File Path**: `frontend/src/pages/StudentDashboard.jsx`  
> **Target Audience**: College Viva Examiners, Project Review Committee, Academic Evaluators, and Engineers grounded in foundational C and Python programming.  
> **Module Classification**: Frontend Authenticated Student Self-Service Portal / Grievance Lifecycle Workstation / Residence & Dual-Auth Management Console.

---

## 1. Module Overview & Architectural Purpose

`StudentDashboard.jsx` serves as the primary operational home for registered students at IIIT Naya Raipur. Rather than functioning simply as a passive list of past submissions, this workstation integrates four vital capabilities into a single, cohesive interface:
1. **Real-Time Grievance Lifecycle Monitor**: Aggregates all maintenance tickets submitted by the authenticated student, organizing them into filterable views (`All`, `Active`, `Resolved`) with real-time SLA countdown clocks and live squad assignments.
2. **Bento Key Performance Indicator (KPI) Deck**: Displays aggregate personal telemetry, computing the count of active grievances, resolved issues, and the average satisfaction rating across closed tickets.
3. **In-Place Residence Management Drawer**: Allows students to update their permanent campus hostel, floor, and room number with synchronous persistence to the backend user database (`updateProfile()`).
4. **Interactive 5-Star Technician Quality Feedback Engine**: Empowers students to rate completed repairs with interactive star hover animations and commentary, holding maintenance squads accountable to institutional standards.
5. **Hybrid Dual-Authentication Gate**: Detects if a student signed in via Google OAuth without a password and presents an integrated modal to establish permanent email/password credentials.

### Foundational Programming Analogy (C & Python)
- In **C programming**, consider an interactive terminal dashboard reading student records from disk:
  ```c
  struct Student user;
  struct Complaint tickets[100];
  int ticket_count = load_student_tickets(user.email, tickets);
  calculate_kpis(tickets, ticket_count, &active, &resolved, &avg_satisfaction);
  render_dashboard_menu(&user, tickets, ticket_count);
  ```
- In **Python (`Django` or `Flask-Login`)**, this corresponds to a protected view `/student` that queries `Complaint.objects.filter(student_email=request.user.email)` and renders an account management template.

---

## 2. Integrated Sequential Code Walkthrough & Inline Technical Breakdown

Below is the exhaustive, sequential, line-by-line examination of `StudentDashboard.jsx`.

---

### Snippet 1: Module Header, React Hooks, Router & Component Imports

```javascript
/**
 * SmartComplaintHandler - Student Portal & Request History Workstation
 * Flush Edge-to-Edge Dark Command Twin Layout with Consistent Institutional Palette
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchComplaints, submitFeedback } from '../api/complaints';
import PriorityBadge from '../components/PriorityBadge';
import SLACountdownTimer from '../components/SLACountdownTimer';
import CampusMapSelector from '../components/CampusMapSelector';
import SetPasswordModal from '../components/SetPasswordModal';
import {
  IIITNR_MAP_UPDATED_EVENT,
  getCampusBuildings,
  getHostelBuildings,
  getFloorsForBuilding,
  getRoomsForBuilding,
  inferFloorFromItem,
} from '../data/iiitnrCampusData';
```

#### Plain-English Purpose & C/Python Analogy
Imports foundational React hooks, routing tools, application contexts, API communication endpoints, sub-components, and campus spatial lookup helpers.
- In **C**, this corresponds to `#include` directives bringing in memory management, database adapters, and UI rendering modules.
- In **Python**, it corresponds to importing `datetime`, REST client functions, and component definitions.

#### Line-by-Line Breakdown
- **Lines 1–4**: File docstring defining layout standards.
- **Line 5**: Imports `React`, `useState`, `useEffect`, and `useMemo`.
- **Line 6**: Imports `Link` for declarative client-side routing.
- **Lines 7–8**: Imports `useAuth` (session credentials) and `useTheme` (color modes).
- **Line 9**: Imports API functions:
  - `fetchComplaints`: Queries complaints filtered by student email.
  - `submitFeedback`: Posts star ratings and comments on resolved tickets.
- **Lines 10–13**: Imports reusable UI sub-components: `PriorityBadge`, `SLACountdownTimer`, `CampusMapSelector`, and `SetPasswordModal`.
- **Lines 14–21**: Imports cartographic utilities from `iiitnrCampusData.js` to manage hostel lists, floor plans, and room hierarchies.

---

### Snippet 2: Component Signature, State Declarations & Lazy Initializers

```javascript
export default function StudentDashboard() {
  const { isDark } = useTheme();
  const { currentUser, updateProfile } = useAuth();
  const activeUser = currentUser;

  const [allBuildings, setAllBuildings] = useState(() => getCampusBuildings());
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCampusMap, setShowCampusMap] = useState(false);

  const hostelsList = useMemo(() => getHostelBuildings(allBuildings), [allBuildings]);

  const [isResidenceModalOpen, setIsResidenceModalOpen] = useState(false);
  const [selectedHostel, setSelectedHostel] = useState(
    activeUser?.hostel_name || hostelsList[0]?.name || 'Ramanujan House (Boys Hostel)'
  );
  const [selectedFloor, setSelectedFloor] = useState(() => {
    return inferFloorFromItem(activeUser?.room_number) || '2';
  });
  const [selectedRoom, setSelectedRoom] = useState(activeUser?.room_number || '');
  const [customRoomInput, setCustomRoomInput] = useState('');
  const [savingResidence, setSavingResidence] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const [selectedTicketForFeedback, setSelectedTicketForFeedback] = useState(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingHover, setRatingHover] = useState(0);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const studentEmail = activeUser?.email || null;
```

#### Plain-English Purpose & C/Python Analogy
Initializes the student workstation state. It binds to the active user's profile, manages the list of tickets, tracks search filters, manages the residence change modal, and coordinates the 5-star feedback rating modal.
- In **C programming**, this is setting up an application state structure containing arrays of tickets, modal visibility flags, and form input buffers.
- In **Python**, it corresponds to declaring reactive variables in an interactive dashboard class.

#### Line-by-Line Breakdown
- **Line 23**: Declares and exports default component `StudentDashboard`.
- **Lines 24–26**: Destructures theme and authentication contexts, aliasing `activeUser = currentUser`.
- **Line 28**: `allBuildings`: Lazy state initialized with `getCampusBuildings()`.
- **Lines 29–33**: Ticket state management:
  - `tickets`: Array storing the student's complaints fetched from API.
  - `loading`: Boolean indicating network fetch status.
  - `activeTab`: Filter toggle (`'ALL'`, `'ACTIVE'`, `'RESOLVED'`).
  - `searchQuery`: Text query string filtering tickets by code, title, or room.
  - `showCampusMap`: Boolean toggle expanding/collapsing the embedded CAD campus twin.
- **Line 35**: `hostelsList`: Memoized array of residential hostels derived from `allBuildings`.
- **Lines 37–47**: Residence modal state:
  - `isResidenceModalOpen`: Modal visibility flag.
  - `selectedHostel`: Selected hostel name string.
  - `selectedFloor`: Floor number string, inferred via `inferFloorFromItem()`.
  - `selectedRoom`, `customRoomInput`: Selected room dropdown value and custom override text.
  - `savingResidence`: Loading spinner boolean during profile save.
  - `isPasswordModalOpen`: Dual-login password modal flag.
- **Lines 49–54**: Feedback rating modal state:
  - `selectedTicketForFeedback`: Ticket entity currently open for star rating.
  - `ratingScore`: Integer between 1 and 5 (default 5).
  - `ratingHover`: Integer tracking hover state for star animation.
  - `feedbackComments`: Text comment string.
  - `isSubmittingFeedback`: Boolean lock during API feedback post.
- **Line 56**: Evaluates `studentEmail`.

---

### Snippet 3: Dynamic Spatial Cascades & Floor/Room Handlers

```javascript
  useEffect(() => {
    const sync = () => setAllBuildings(getCampusBuildings());
    window.addEventListener(IIITNR_MAP_UPDATED_EVENT, sync);
    return () => window.removeEventListener(IIITNR_MAP_UPDATED_EVENT, sync);
  }, []);

  const availableFloors = useMemo(
    () => getFloorsForBuilding(selectedHostel, allBuildings),
    [selectedHostel, allBuildings]
  );

  const availableRooms = useMemo(
    () => getRoomsForBuilding(selectedHostel, selectedFloor, null, allBuildings),
    [selectedHostel, selectedFloor, allBuildings]
  );

  const filteredRooms = useMemo(() => {
    const onlyRooms = availableRooms.filter((r) => r.includes('Room') || r.includes('Suite'));
    return onlyRooms.length > 0 ? onlyRooms : availableRooms;
  }, [availableRooms]);

  const handleSelectHostel = (newHostelName) => {
    setSelectedHostel(newHostelName);
    setCustomRoomInput('');
    const targetFloors = getFloorsForBuilding(newHostelName, allBuildings);
    const validFloorIds = targetFloors.map((f) => String(f.id));
    const nextFloor = validFloorIds.includes(String(selectedFloor))
      ? selectedFloor
      : (targetFloors[0]?.id || '1');
    setSelectedFloor(nextFloor);
    const targetRooms = getRoomsForBuilding(newHostelName, nextFloor, null, allBuildings);
    const roomCandidates = targetRooms.filter((r) => r.includes('Room') || r.includes('Suite'));
    const finalRoomList = roomCandidates.length > 0 ? roomCandidates : targetRooms;
    if (finalRoomList.length > 0) {
      setSelectedRoom(finalRoomList[0]);
    } else {
      setSelectedRoom('');
    }
  };

  const handleSelectFloor = (newFloor) => {
    setSelectedFloor(newFloor);
    setCustomRoomInput('');
    const nextRooms = getRoomsForBuilding(selectedHostel, newFloor, null, allBuildings);
    const roomCandidates = nextRooms.filter((r) => r.includes('Room') || r.includes('Suite'));
    const finalRoomList = roomCandidates.length > 0 ? roomCandidates : nextRooms;
    if (finalRoomList.length > 0) {
      setSelectedRoom(finalRoomList[0]);
    } else {
      setSelectedRoom('');
    }
  };

  // Keep selectedRoom aligned if filteredRooms changes
  useEffect(() => {
    if (filteredRooms.length > 0 && !filteredRooms.includes(selectedRoom) && !customRoomInput) {
      setSelectedRoom(filteredRooms[0]);
    }
  }, [filteredRooms]);
```

#### Plain-English Purpose & C/Python Analogy
Governs spatial hierarchy inside the residence selector. When a student selects a different hostel, the available floors and rooms are recomputed. If the currently selected floor is invalid in the new building, it cascades to the first valid floor and picks the first residential room.
- In **C programming**, this is resetting child index pointers when parent structs change.
- In **Python**, it corresponds to dependent model filters in chained combo-boxes.

#### Line-by-Line Breakdown
- **Lines 57–61**: Subscribes to `IIITNR_MAP_UPDATED_EVENT` to refresh building data if an admin edits geometry.
- **Lines 63–71**: Computes `availableFloors` and `availableRooms` for the active `selectedHostel` and `selectedFloor`.
- **Lines 73–76**: `filteredRooms`: Filters out utility spaces (e.g. laundry, electrical shafts) to prioritize actual residential dorms (`Room` or `Suite`).
- **Lines 78–95**: `handleSelectHostel(newHostelName)`: Updates hostel, validates floor existence, cascades to valid floor, and picks the first room.
- **Lines 97–108**: `handleSelectFloor(newFloor)`: Updates floor and picks the first room on that floor.
- **Lines 111–115**: `useEffect`: Automatically aligns `selectedRoom` with the first element of `filteredRooms` if the active selection becomes orphaned.

---

### Snippet 4: Student Complaints Loader & Residence Persistence Handler

```javascript
  const loadStudentTickets = async () => {
    if (!studentEmail) {
      setTickets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchComplaints({ student_email: studentEmail, limit: 100 });
      setTickets(Array.isArray(data) ? data : []);
    } catch (_) {
      // handled gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentTickets();
  }, [studentEmail]);

  const handleSaveResidence = async (e) => {
    e.preventDefault();
    setSavingResidence(true);
    const finalRoom = customRoomInput.trim() || selectedRoom;
    try {
      await updateProfile({
        hostel_name: selectedHostel,
        room_number: finalRoom,
      });
      setIsResidenceModalOpen(false);
    } finally {
      setSavingResidence(false);
    }
  };
```

#### Plain-English Purpose & C/Python Analogy
Handles data loading and persistence:
1. `loadStudentTickets`: Queries the API for all tickets logged under `studentEmail`.
2. `handleSaveResidence`: Saves the updated hostel name and room number to the student's profile via `updateProfile()` and closes the modal.
- In **C/Python**, these are network transaction functions executing `SELECT` and `UPDATE` API requests.

#### Line-by-Line Breakdown
- **Lines 117–132**: `loadStudentTickets`: Sets loading state, fetches up to 100 complaints for `studentEmail`, populates `tickets`, and releases the loading state in `finally`.
- **Lines 134–136**: `useEffect`: Automatically triggers `loadStudentTickets()` whenever `studentEmail` changes.
- **Lines 138–151**: `handleSaveResidence(e)`: Resolves `finalRoom` (from custom input or select dropdown), calls `await updateProfile(...)`, and closes the modal.

---

### Snippet 5: Feedback Rating Submission Engine & KPI Aggregation

```javascript
  const handleSubmitRating = async (e) => {
    e.preventDefault();
    if (!selectedTicketForFeedback) return;
    setIsSubmittingFeedback(true);
    try {
      const updated = await submitFeedback(
        selectedTicketForFeedback.tracking_code,
        ratingScore,
        feedbackComments,
        activeUser?.name
      );
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
      setSelectedTicketForFeedback(null);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const activeTickets = tickets.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED');
  const resolvedTickets = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED');
  const ratedTickets = tickets.filter((t) => t.feedback_rating != null);
  const avgSatisfaction =
    ratedTickets.length > 0
      ? (ratedTickets.reduce((sum, t) => sum + t.feedback_rating, 0) / ratedTickets.length).toFixed(1)
      : null;
```

#### Plain-English Purpose & C/Python Analogy
Submits student ratings to the API and calculates the Bento KPI metrics:
- In `handleSubmitRating`, posts the rating and updates the local ticket object in memory using React state immutability (`prev.map(...)`), avoiding an expensive full-table re-fetch.
- Calculates active tickets, resolved tickets, and average satisfaction score.
- In **C programming**, this is calculating array statistics with a `for` loop:
  ```c
  float sum = 0; int rated = 0;
  for(int i=0; i<count; i++) {
      if (tickets[i].rating > 0) { sum += tickets[i].rating; rated++; }
  }
  float avg = rated > 0 ? (sum / rated) : 0.0;
  ```
- In **Python**, it resembles list comprehensions and `sum() / len()`.

#### Line-by-Line Breakdown
- **Lines 153–169**: `handleSubmitRating`:
  - Dispatches `await submitFeedback(...)`.
  - Maps through `tickets`, replacing the updated ticket in place.
  - Closes modal by setting `selectedTicketForFeedback = null`.
- **Lines 171–177**: KPI aggregations:
  - `activeTickets`: Excludes `'RESOLVED'` and `'CLOSED'`.
  - `resolvedTickets`: Includes only `'RESOLVED'` and `'CLOSED'`.
  - `ratedTickets`: Filters tickets where `feedback_rating != null`.
  - `avgSatisfaction`: Computes arithmetic mean formatted to 1 decimal place (`.toFixed(1)`).

---

### Snippet 6: Tab & Search Query Filters + Status Badge Style Resolver

```javascript
  const tabFiltered =
    activeTab === 'ACTIVE' ? activeTickets : activeTab === 'RESOLVED' ? resolvedTickets : tickets;

  const displayedTickets = tabFiltered.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.tracking_code || '').toLowerCase().includes(q) ||
      (t.title || '').toLowerCase().includes(q) ||
      (t.location || '').toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status) => {
    if (isDark) {
      switch (status) {
        case 'SUBMITTED':
          return 'bg-sky-950/80 text-sky-400 border-sky-800/80';
        case 'ASSIGNED':
          return 'bg-amber-950/80 text-amber-400 border-amber-800/80';
        case 'IN_PROGRESS':
          return 'bg-indigo-950/80 text-indigo-400 border-indigo-800/80';
        case 'ESCALATED':
          return 'bg-rose-950/80 text-rose-400 border-rose-800/80 animate-pulse';
        case 'RESOLVED':
          return 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80';
        default:
          return 'bg-zinc-800 text-zinc-400 border-zinc-700';
      }
    } else {
      switch (status) {
        case 'SUBMITTED':
          return 'bg-sky-100 text-sky-800 border-sky-300 font-bold';
        case 'ASSIGNED':
          return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
        case 'IN_PROGRESS':
          return 'bg-indigo-100 text-indigo-800 border-indigo-300 font-bold';
        case 'ESCALATED':
          return 'bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse';
        case 'RESOLVED':
          return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
        default:
          return 'bg-slate-200 text-slate-700 border-slate-300 font-bold';
      }
    }
  };

  const currentHostelLabel = activeUser?.hostel_name || hostelsList[0]?.name || 'Ramanujan House';
  const currentRoomLabel = activeUser?.room_number || 'Room 204';
```

#### Plain-English Purpose & C/Python Analogy
Filters the tickets array based on the active tab (`ALL`, `ACTIVE`, `RESOLVED`) and fuzzy search query (`tracking_code`, `title`, `location`), then resolves Tailwind CSS styling classes for each status.
- In **C/Python**, this is multi-parameter filtering on an array of structs.

#### Line-by-Line Breakdown
- **Lines 179–180**: Evaluates `tabFiltered` by checking `activeTab`.
- **Lines 182–190**: `displayedTickets`: Filters `tabFiltered` against lowercase `searchQuery`, searching across tracking code, title, and location strings.
- **Lines 192–224**: `getStatusBadge(status)`: Returns color-coded CSS classes for light and dark themes. Note that `'ESCALATED'` includes `animate-pulse` for urgency.
- **Lines 226–227**: Fallback labels for hostel and room.

---

### Snippet 7: Flush Command Deck Student Profile Header

```javascript
  return (
    <div
      className={`w-full min-h-screen flex flex-col space-y-0 animate-fade-in transition-colors duration-200 ${
        isDark ? 'bg-[#0e1117] text-zinc-100' : 'bg-white text-slate-800'
      }`}
    >
      {/* Flush Command Deck Student Profile Header */}
      <div
        className={`w-full border-b px-4 sm:px-8 lg:px-12 py-8 relative overflow-hidden transition-colors ${
          isDark
            ? 'bg-[#161b22] border-zinc-800 text-zinc-100'
            : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-xs'
        }`}
      >
        {/* Ambient background glow auras */}
        <div className={`absolute -right-24 -bottom-24 w-96 h-96 rounded-full blur-3xl pointer-events-none ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-500/5'}`} />
        <div className={`absolute -left-24 -top-24 w-96 h-96 rounded-full blur-3xl pointer-events-none ${isDark ? 'bg-teal-500/10' : 'bg-slate-300/20'}`} />

        <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center space-x-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-sm border transition-colors ${
                isDark
                  ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-400'
                  : 'bg-emerald-100 border-emerald-300 text-emerald-800'
              }`}
            >
              {activeUser?.avatar || '🎓'}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {activeUser?.name}
                </h1>
                <span
                  className={`text-[10px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                    isDark
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800/80'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}
                >
                  {activeUser?.identifier}
                </span>
                <span className={isDark ? 'text-zinc-600' : 'text-slate-400'}>·</span>
                <span className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>{activeUser?.department}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                <span
                  className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl border text-xs font-semibold ${
                    isDark
                      ? 'bg-[#0e1117] border-zinc-800 text-zinc-200'
                      : 'bg-[#e2e8f0] border-slate-300 text-slate-800'
                  }`}
                >
                  <span>🏠 {currentHostelLabel.split(' (')[0]}</span>
                  <span className={isDark ? 'text-zinc-600' : 'text-slate-400'}>·</span>
                  <span className={`font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{currentRoomLabel}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsResidenceModalOpen(true)}
                  className={`px-3 py-1 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-[#0e1117] hover:bg-zinc-800 border-zinc-800 text-zinc-200 hover:text-white'
                      : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] border-slate-300 text-slate-800 hover:text-slate-950 shadow-2xs'
                  }`}
                >
                  ✏️ Change Room
                </button>
                <button
                  type="button"
                  onClick={() => setShowCampusMap((prev) => !prev)}
                  className={`px-3 py-1 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-[#0e1117] hover:bg-zinc-800 border-emerald-800/80 text-emerald-400'
                      : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] border-emerald-300 text-emerald-800 shadow-2xs'
                  }`}
                >
                  🗺️ {showCampusMap ? 'Hide Map' : 'Campus Map'}
                </button>
                {(!activeUser?.has_password || activeUser?.auth_provider === 'google') && (
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(true)}
                    className={`px-3 py-1 rounded-xl border text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                      isDark
                        ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900 shadow-2xs'
                    }`}
                  >
                    <span>🔑 Set Password (Dual Login)</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0">
            <Link
              to="/submit"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              + Submit Issue
            </Link>
            <button
              onClick={loadStudentTickets}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-xs ${
                isDark
                  ? 'bg-[#0e1117] hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white'
                  : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] border-slate-300 text-slate-700 hover:text-slate-950'
              }`}
              title="Refresh"
            >
              ↻
            </button>
          </div>
        </div>
      </div>
```

#### Plain-English Purpose & C/Python Analogy
Renders the authenticated student's profile header banner:
- Avatar, full name, institutional roll number (`activeUser.identifier`), department.
- Current residential hostel and room badge with "Change Room" modal trigger.
- "Campus Map" drawer toggle button.
- "Set Password (Dual Login)" modal trigger for Google SSO students.
- Primary CTA "+ Submit Issue" and table refresh button `↻`.
- In **Python GUI programming**, this is the user summary card.

#### Line-by-Line Breakdown
- **Lines 230–246**: Outer container with blur auras.
- **Lines 248–275**: Avatar icon and name cluster displaying student name and roll number.
- **Lines 277–323**: Action buttons cluster:
  - Residence badge displaying `currentHostelLabel` and `currentRoomLabel`.
  - `"✏️ Change Room"` button triggering `setIsResidenceModalOpen(true)`.
  - `"🗺️ Campus Map"` button toggling `showCampusMap`.
  - `"🔑 Set Password (Dual Login)"` button conditionally rendered if `has_password` is false.
- **Lines 327–346**: Quick action buttons: `+ Submit Issue` linking to `/submit` and refresh button `↻` calling `loadStudentTickets()`.

---

### Snippet 8: Expandable Campus Map Drawer & Bento KPI Deck

```javascript
      {/* Expandable Digital Twin Campus Map Drawer */}
      {showCampusMap && (
        <div className={`w-full border-b ${isDark ? 'border-zinc-800 bg-[#0e1117]' : 'border-slate-300 bg-white'}`}>
          <CampusMapSelector
            flush={true}
            selectedBuilding={currentHostelLabel}
            selectedRoom={currentRoomLabel}
            studentSavedHostel={currentHostelLabel}
            studentSavedRoom={currentRoomLabel}
            onSelectBuilding={(bName) => {
              handleSelectHostel(bName);
              setIsResidenceModalOpen(true);
            }}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className={`w-full px-4 sm:px-8 lg:px-12 py-10 space-y-8 ${isDark ? 'bg-[#0e1117]' : 'bg-white'}`}>
        {/* Bento KPI Row with Multi-Layer Depth */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div
            className={`p-5 sm:p-6 border rounded-2xl relative overflow-hidden flex items-center justify-between transition-colors ${
              isDark
                ? 'bg-[#161b22] border-zinc-800 shadow-xl text-white'
                : 'bg-[#f1f5f9] border-slate-300 shadow-sm text-slate-900'
            }`}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
            <div>
              <span className={`text-[11px] font-bold uppercase tracking-wider block font-mono ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Active Issues
              </span>
              <div className={`text-3xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{activeTickets.length}</div>
            </div>
            <div
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-lg font-bold shadow-xs ${
                isDark
                  ? 'bg-amber-950/80 border-amber-800/80 text-amber-400'
                  : 'bg-amber-100 border-amber-300 text-amber-800'
              }`}
            >
              ⚡
            </div>
          </div>

          <div
            className={`p-5 sm:p-6 border rounded-2xl relative overflow-hidden flex items-center justify-between transition-colors ${
              isDark
                ? 'bg-[#161b22] border-zinc-800 shadow-xl text-white'
                : 'bg-[#f1f5f9] border-slate-300 shadow-sm text-slate-900'
            }`}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />
            <div>
              <span className={`text-[11px] font-bold uppercase tracking-wider block font-mono ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Resolved
              </span>
              <div className={`text-3xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{resolvedTickets.length}</div>
            </div>
            <div
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-lg font-bold shadow-xs ${
                isDark
                  ? 'bg-emerald-950/80 border-emerald-800/80 text-emerald-400'
                  : 'bg-emerald-100 border-emerald-300 text-emerald-800'
              }`}
            >
              ✓
            </div>
          </div>

          <div
            className={`p-5 sm:p-6 border rounded-2xl relative overflow-hidden flex items-center justify-between transition-colors ${
              isDark
                ? 'bg-[#161b22] border-zinc-800 shadow-xl text-white'
                : 'bg-[#f1f5f9] border-slate-300 shadow-sm text-slate-900'
            }`}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-sky-500" />
            <div>
              <span className={`text-[11px] font-bold uppercase tracking-wider block font-mono ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Avg Satisfaction
              </span>
              <div className={`text-3xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {avgSatisfaction ? `${avgSatisfaction} / 5` : '—'}
              </div>
            </div>
            <div
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-lg font-bold shadow-xs ${
                isDark
                  ? 'bg-sky-950/80 border-sky-800/80 text-sky-400'
                  : 'bg-sky-100 border-sky-300 text-sky-800'
              }`}
            >
              ★
            </div>
          </div>
        </div>
```

#### Plain-English Purpose & C/Python Analogy
Renders the collapsible CAD map drawer and the 3-card Bento KPI row:
1. `Active Issues`: Yellow lightning card displaying `activeTickets.length`.
2. `Resolved`: Green checkmark card displaying `resolvedTickets.length`.
3. `Avg Satisfaction`: Blue star card displaying average star rating (`4.8 / 5`).
- In **Python GUI programming**, this corresponds to statistical summary tiles.

#### Line-by-Line Breakdown
- **Lines 350–364**: Conditional CAD map drawer: mounts `<CampusMapSelector>` when `showCampusMap === true`.
- **Lines 368–446**: Bento KPI Row: 3-column responsive grid (`grid-cols-1 sm:grid-cols-3`):
  - Card 1: Active issues with amber accent and icon `⚡`.
  - Card 2: Resolved count with emerald accent and icon `✓`.
  - Card 3: Average satisfaction rating with sky blue accent and icon `★`.

---

### Snippet 9: Requests Table Header, Search Input & 3-Way Tab Switcher

```javascript
        {/* Issues List Card */}
        <div
          className={`border rounded-2xl overflow-hidden relative transition-colors ${
            isDark
              ? 'bg-[#161b22] border-zinc-800 shadow-2xl text-white'
              : 'bg-[#f1f5f9] border-slate-300 shadow-sm text-slate-900'
          }`}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />

          <div
            className={`p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isDark ? 'border-zinc-800 bg-[#161b22]' : 'border-slate-300 bg-[#f1f5f9]'
            }`}
          >
            <h2 className={`text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              My Maintenance Requests
            </h2>

            <div className="flex flex-wrap items-center gap-2.5">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search code, room, title..."
                className={`w-full sm:w-60 px-3.5 py-2 rounded-xl text-xs transition-all border ${
                  isDark
                    ? 'bg-[#0e1117] border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:bg-[#161b22] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20'
                    : 'bg-[#e2e8f0] border-slate-300 text-slate-900 placeholder-slate-500 hover:border-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20'
                }`}
              />

              <div
                className={`inline-flex items-center p-1 rounded-xl gap-1 border ${
                  isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#cbd5e1]/80 border-slate-300'
                }`}
              >
                <button
                  onClick={() => setActiveTab('ALL')}
                  className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer transition-all ${
                    activeTab === 'ALL'
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : isDark
                      ? 'text-zinc-400 hover:text-white font-medium hover:bg-zinc-800/60'
                      : 'text-slate-700 hover:text-slate-900 font-bold hover:bg-slate-300/80'
                  }`}
                >
                  All ({tickets.length})
                </button>
                <button
                  onClick={() => setActiveTab('ACTIVE')}
                  className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer transition-all ${
                    activeTab === 'ACTIVE'
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : isDark
                      ? 'text-zinc-400 hover:text-white font-medium hover:bg-zinc-800/60'
                      : 'text-slate-700 hover:text-slate-900 font-bold hover:bg-slate-300/80'
                  }`}
                >
                  Active ({activeTickets.length})
                </button>
                <button
                  onClick={() => setActiveTab('RESOLVED')}
                  className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer transition-all ${
                    activeTab === 'RESOLVED'
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : isDark
                      ? 'text-zinc-400 hover:text-white font-medium hover:bg-zinc-800/60'
                      : 'text-slate-700 hover:text-slate-900 font-bold hover:bg-slate-300/80'
                  }`}
                >
                  Resolved ({resolvedTickets.length})
                </button>
              </div>
            </div>
          </div>
```

#### Plain-English Purpose & C/Python Analogy
Renders the controls header for the complaints list. Includes a live text search box and segmented filter buttons (`All`, `Active`, `Resolved`) displaying dynamic item counts in parentheses.
- In **Python/Tkinter**, this is a search entry and tabbed toolbar.

#### Line-by-Line Breakdown
- **Lines 450–456**: Card container with emerald accent line.
- **Lines 458–466**: Card header with title `"My Maintenance Requests"`.
- **Lines 468–478**: Real-time search `<input>` bound to `searchQuery`.
- **Lines 480–522**: Segmented tab switcher buttons:
  - `All ({tickets.length})`
  - `Active ({activeTickets.length})`
  - `Resolved ({resolvedTickets.length})`

---

### Snippet 10: Request List Rendering, SLA Timers & Rate Button

```javascript
          {loading ? (
            <div className={`py-20 text-center text-xs font-mono ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Loading requests...
            </div>
          ) : displayedTickets.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div
                className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto text-xl ${
                  isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-400' : 'bg-[#e2e8f0] border-slate-300 text-slate-600'
                }`}
              >
                📂
              </div>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>No maintenance requests found.</p>
              <Link
                to="/submit"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors"
              >
                + Submit Issue
              </Link>
            </div>
          ) : (
            <div className={isDark ? 'divide-y divide-zinc-800' : 'divide-y divide-slate-300'}>
              {displayedTickets.map((ticket) => {
                const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';
                const hasRating = ticket.feedback_rating != null;

                return (
                  <div
                    key={ticket.id || ticket.tracking_code}
                    className={`p-5 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 group ${
                      isDark ? 'hover:bg-zinc-800/30' : 'hover:bg-slate-200/50'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Link
                          to={`/track?code=${ticket.tracking_code}`}
                          className={`font-mono font-bold px-2.5 py-0.5 rounded-lg border transition-colors ${
                            isDark
                              ? 'text-emerald-400 bg-[#0e1117] border-zinc-800 hover:border-emerald-500'
                              : 'text-emerald-800 bg-[#e2e8f0] border-slate-300 hover:border-emerald-600'
                          }`}
                        >
                          {ticket.tracking_code}
                        </Link>
                        <PriorityBadge priority={ticket.priority} size="sm" dark={isDark} />
                        <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold ${getStatusBadge(ticket.status)}`}>
                          {ticket.status}
                        </span>
                        {ticket.department_name && (
                          <span
                            className={`text-[11px] font-semibold border px-2 py-0.5 rounded ${
                              isDark
                                ? 'text-zinc-300 bg-[#0e1117] border-zinc-800'
                                : 'text-slate-700 bg-[#e2e8f0] border-slate-300'
                            }`}
                          >
                            {ticket.department_name}
                          </span>
                        )}
                      </div>

                      <h3 className={`text-sm font-bold transition-colors ${
                        isDark ? 'text-white group-hover:text-emerald-400' : 'text-slate-900 group-hover:text-emerald-700'
                      }`}>
                        {ticket.title}
                      </h3>
                      <div className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                        📍 {ticket.location} · {new Date(ticket.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2.5 shrink-0">
                      {!isResolved ? (
                        <SLACountdownTimer
                          slaDeadline={ticket.sla_deadline || ticket.target_resolution_date}
                          priority={ticket.priority}
                          status={ticket.status}
                          resolvedAt={ticket.resolved_at}
                          dark={isDark}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTicketForFeedback(ticket);
                            setRatingScore(ticket.feedback_rating || 5);
                            setFeedbackComments(ticket.feedback_comments || '');
                          }}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl border cursor-pointer transition-colors ${
                            isDark
                              ? 'bg-amber-950/80 hover:bg-amber-900/80 border-amber-800 text-amber-300'
                              : 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900'
                          }`}
                        >
                          ★ {hasRating ? `${ticket.feedback_rating}/5` : 'Rate'}
                        </button>
                      )}

                      <Link
                        to={`/track?code=${ticket.tracking_code}`}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors ${
                          isDark
                            ? 'bg-[#0e1117] hover:bg-zinc-800 border-zinc-800 text-zinc-200 hover:text-white'
                            : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] border-slate-300 text-slate-800 hover:text-slate-950'
                        }`}
                      >
                        Details →
                      </Link>
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
Renders the complaints list:
- Handles loading state and empty state with a "+ Submit Issue" action button.
- Maps over `displayedTickets`:
  - Clickable tracking code leading to `/track?code=...`.
  - `PriorityBadge` and `getStatusBadge` pills.
  - Department tag.
  - Ticket title, campus location, and creation date.
  - Dynamic right action: if the ticket is active, displays `SLACountdownTimer`; if resolved, renders a `"Rate"` or `"★ X/5"` feedback button.
  - "Details &rarr;" link.
- In **Python/Django**, this is the main loop rendering table rows.

#### Line-by-Line Breakdown
- **Lines 525–546**: Loading indicator and empty-state placeholder card.
- **Lines 548–639**: Maps over `displayedTickets`:
  - Line 549: Computes `isResolved` boolean.
  - Line 550: Computes `hasRating` boolean.
  - Lines 560–586: Metadata pill row (Tracking code link, PriorityBadge, Status, Department).
  - Lines 588–596: Title and location.
  - Lines 599–623: Dynamic timer/rating block:
    - Active: `<SLACountdownTimer />`.
    - Resolved: Rating button triggering `setSelectedTicketForFeedback(ticket)`.
  - Lines 625–635: "Details &rarr;" link pointing to `/track?code=...`.

---

### Snippet 11: Interactive Residence Reconfiguration Modal

```javascript
      {/* Hostel & Room Modal */}
      {isResidenceModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsResidenceModalOpen(false)}
        >
          <div
            className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 border relative overflow-hidden transition-colors ${
              isDark ? 'bg-[#161b22] border-zinc-800 text-white' : 'bg-[#f1f5f9] border-slate-300 text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />

            <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-zinc-800' : 'border-slate-300'}`}>
              <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Select Your Hostel &amp; Room</h3>
              <button
                type="button"
                onClick={() => setIsResidenceModalOpen(false)}
                className={`w-7 h-7 rounded-lg font-bold text-xs cursor-pointer flex items-center justify-center transition-colors border ${
                  isDark
                    ? 'bg-[#0e1117] hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800'
                    : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] text-slate-700 hover:text-slate-900 border-slate-300'
                }`}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveResidence} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {hostelsList.map((h) => {
                  const active = selectedHostel === h.name;
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => handleSelectHostel(h.name)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? isDark
                            ? 'border-emerald-500 bg-emerald-950/60 shadow-xs'
                            : 'border-emerald-500 bg-emerald-100 shadow-xs'
                          : isDark
                          ? 'border-zinc-800 bg-[#0e1117] hover:border-zinc-700'
                          : 'border-slate-300 bg-[#e2e8f0] hover:border-slate-400'
                      }`}
                    >
                      <div className={`text-xs font-bold ${active ? (isDark ? 'text-emerald-400' : 'text-emerald-900') : (isDark ? 'text-white' : 'text-slate-900')}`}>
                        {h.shortName}
                      </div>
                      <div className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>{h.type}</div>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Floor</label>
                  <select
                    value={selectedFloor}
                    onChange={(e) => handleSelectFloor(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs transition-all border ${
                      isDark
                        ? 'bg-[#0e1117] border-zinc-800 text-white focus:bg-[#161b22] focus:border-emerald-500'
                        : 'bg-[#e2e8f0] border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-600'
                    }`}
                  >
                    {availableFloors.length > 0 ? (
                      availableFloors.map((f) => (
                        <option key={f.id} value={f.id} className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-slate-900'}>
                          {f.label}
                        </option>
                      ))
                    ) : (
                      <option value="1" className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-slate-900'}>
                        Floor 1
                      </option>
                    )}
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Room Number</label>
                  <select
                    value={selectedRoom}
                    onChange={(e) => {
                      setSelectedRoom(e.target.value);
                      setCustomRoomInput('');
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs transition-all border ${
                      isDark
                        ? 'bg-[#0e1117] border-zinc-800 text-white focus:bg-[#161b22] focus:border-emerald-500'
                        : 'bg-[#e2e8f0] border-slate-300 text-slate-900 focus:bg-white focus:border-emerald-600'
                    }`}
                  >
                    {filteredRooms.length > 0 ? (
                      filteredRooms.map((r) => (
                        <option key={r} value={r} className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-slate-900'}>
                          {r}
                        </option>
                      ))
                    ) : (
                      <option value="" className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-slate-900'}>
                        No rooms on this floor
                      </option>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Or Custom Room / Spot</label>
                <input
                  type="text"
                  placeholder="e.g. Room 312 or Guest Suite"
                  value={customRoomInput}
                  onChange={(e) => setCustomRoomInput(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs transition-all border ${
                    isDark
                      ? 'bg-[#0e1117] border-zinc-800 text-white placeholder-zinc-500 focus:bg-[#161b22] focus:border-emerald-500'
                      : 'bg-[#e2e8f0] border-slate-300 text-slate-900 placeholder-slate-500 focus:bg-white focus:border-emerald-600'
                  }`}
                />
              </div>

              <div className={`flex justify-end space-x-2 pt-2 border-t ${isDark ? 'border-zinc-800' : 'border-slate-300'}`}>
                <button
                  type="button"
                  onClick={() => setIsResidenceModalOpen(false)}
                  className={`px-4 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-[#0e1117] hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white'
                      : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] border-slate-300 text-slate-700 hover:text-slate-900'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingResidence}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {savingResidence ? 'Saving...' : 'Save Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
```

#### Plain-English Purpose & C/Python Analogy
Renders an in-place modal dialog allowing the student to change their registered hostel and room:
- Hostel cards grid (`hostelsList.map(...)`).
- Floor and Room dropdown selects populated dynamically.
- Optional custom override input.
- Cancel and "Save Room" submission buttons.
- In **Python/Tkinter**, this is a modal dialog window for user profile configuration.

#### Line-by-Line Breakdown
- **Lines 646–655**: Modal overlay with backdrop blur and backdrop click detection.
- **Lines 657–671**: Header with title `"Select Your Hostel & Room"` and close button `✕`.
- **Lines 674–699**: 2-column hostel selector cards with emerald active border.
- **Lines 701–753**: Floor select and Room select dropdowns.
- **Lines 755–768**: Custom room input field.
- **Lines 770–790**: Footer action buttons: "Cancel" and "Save Room".

---

### Snippet 12: 5-Star Feedback Modal & Dual-Auth Password Modal

```javascript
      {/* Rating Modal */}
      {selectedTicketForFeedback && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in"
          onClick={() => setSelectedTicketForFeedback(null)}
        >
          <div
            className={`w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 border relative overflow-hidden transition-colors ${
              isDark ? 'bg-[#161b22] border-zinc-800 text-white' : 'bg-[#f1f5f9] border-slate-300 text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />

            <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Rate Repair ({selectedTicketForFeedback.tracking_code})
            </h3>
            <form onSubmit={handleSubmitRating} className="space-y-4">
              <div className="flex justify-center space-x-2 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingScore(star)}
                    onMouseEnter={() => setRatingHover(star)}
                    onMouseLeave={() => setRatingHover(0)}
                    className="text-3xl cursor-pointer"
                  >
                    <span className={(ratingHover || ratingScore) >= star ? 'text-amber-400' : (isDark ? 'text-zinc-700' : 'text-slate-300')}>
                      ★
                    </span>
                  </button>
                ))}
              </div>
              <textarea
                rows={3}
                value={feedbackComments}
                onChange={(e) => setFeedbackComments(e.target.value)}
                placeholder="Optional comments regarding work order quality..."
                className={`w-full p-3 rounded-xl text-xs resize-none transition-all border ${
                  isDark
                    ? 'bg-[#0e1117] border-zinc-800 text-white placeholder-zinc-500 focus:bg-[#161b22] focus:border-emerald-500'
                    : 'bg-[#e2e8f0] border-slate-300 text-slate-900 placeholder-slate-500 focus:bg-white focus:border-emerald-600'
                }`}
              />
              <div className={`flex justify-end space-x-2 pt-2 border-t ${isDark ? 'border-zinc-800' : 'border-slate-300'}`}>
                <button
                  type="button"
                  onClick={() => setSelectedTicketForFeedback(null)}
                  className={`px-4 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-[#0e1117] hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white'
                      : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] border-slate-300 text-slate-700 hover:text-slate-900'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFeedback}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  Submit Rating
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SetPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}
```

#### Plain-English Purpose & C/Python Analogy
Renders the 5-star technician rating modal and the dual-auth password configuration modal:
- Star rating widget: Evaluates `(ratingHover || ratingScore) >= star` to provide dynamic hover feedback.
- Feedback comments textarea.
- Embeds `<SetPasswordModal>` to allow Google SSO students to establish standard password authentication.
- In **Python GUI programming**, this is a review submission dialog.

#### Line-by-Line Breakdown
- **Lines 797–806**: Modal overlay guarded by `{selectedTicketForFeedback && (`.
- **Lines 813–828**: Interactive 5-star rating button row:
  - `onMouseEnter={() => setRatingHover(star)}` animates stars on hover.
  - `onMouseLeave={() => setRatingHover(0)}` reverts to saved `ratingScore`.
  - `onClick={() => setRatingScore(star)}` locks in the score.
- **Lines 829–839**: Textarea capturing feedback comments.
- **Lines 840–860**: Action buttons: "Cancel" and "Submit Rating".
- **Lines 865–868**: `<SetPasswordModal>` controlled by `isPasswordModalOpen`.

---

## 3. High-Frequency Viva & Technical Defense Guide

### Q1: How does the student dashboard avoid unnecessary full-page re-renders when a student submits feedback?
**Examiner Answer**:
"In `handleSubmitRating`, rather than re-fetching the entire list of 100 tickets over the network, we update local component state immutably:
```javascript
const updated = await submitFeedback(...);
setTickets((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
```
React's reconciliation engine compares virtual DOM keys and re-renders only the single affected ticket row in the table, updating the star rating badge from 'Rate' to '★ 5/5' instantaneously with zero network overhead."

### Q2: Explain the math and data flow behind the Bento KPI row.
**Examiner Answer**:
"The KPI row derives metrics in real time from the `tickets` array:
1. `activeTickets = tickets.filter(t => t.status !== 'RESOLVED' && t.status !== 'CLOSED');`
2. `resolvedTickets = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED');`
3. `avgSatisfaction`:
   ```javascript
   const ratedTickets = tickets.filter(t => t.feedback_rating != null);
   const avgSatisfaction = ratedTickets.length > 0
     ? (ratedTickets.reduce((sum, t) => sum + t.feedback_rating, 0) / ratedTickets.length).toFixed(1)
     : null;
   ```
This provides immediate institutional transparency: students see their active workload, total resolved repairs, and their historical satisfaction score computed directly from verified closures."

### Q3: Why is `inferFloorFromItem` used when initializing `selectedFloor`?
**Examiner Answer**:
"When a student opens the residence modal, their saved room might be a string such as `'Room 312'` or `'B-204'`. 
`inferFloorFromItem()` applies regular expression parsing to extract the leading digit of the room code (e.g. `'312'` &rarr; `'3'`). This ensures that the floor dropdown defaults to the student's actual physical floor rather than resetting to Ground or Floor 1, creating a frictionless user experience."

---

## 4. Quick-Reference Architecture & Property Table

| Feature / UI Element | State / Hook Used | Architectural Role / Viva Defense |
| :--- | :--- | :--- |
| **Student Profile HUD** | `currentUser` from `useAuth()` | Displays verified student identity, roll number, department, and residence. |
| **Residence Modal** | `isResidenceModalOpen`, `updateProfile` | Updates permanent student hostel and room number in backend database. |
| **CAD Digital Twin Drawer**| `showCampusMap`, `<CampusMapSelector />` | Collapsible full-width vector map viewer synchronized with student residence. |
| **Bento KPI Deck** | `activeTickets`, `resolvedTickets`, `avgSatisfaction` | Real-time computation of personal ticket metrics and satisfaction scores. |
| **Fuzzy Search & Tabs** | `searchQuery`, `activeTab` | Multi-field filtering across tracking code, title, and campus room labels. |
| **Dynamic Action Switch** | `isResolved ? <RateButton> : <SLACountdownTimer>` | Renders live countdown clock for active tickets and 5-star rating trigger for closed ones. |
| **5-Star Rating Engine** | `submitFeedback()`, `ratingHover` | Interactive star hover feedback updating ticket state immutably in memory. |
| **Dual-Auth Password Gate**| `SetPasswordModal`, `has_password` | Allows Google OAuth users to establish email/password credentials. |

---
*Documentation compiled and verified against commit codebase standards. Strictly non-destructive: no application source files modified.*
