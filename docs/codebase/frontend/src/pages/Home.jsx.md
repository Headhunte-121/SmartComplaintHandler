# Home.jsx — Exhaustive Sequential Technical Documentation

> **File Path**: `frontend/src/pages/Home.jsx`  
> **Target Audience**: College Viva Examiners, Project Review Committee, Academic Evaluators, and Engineers grounded in foundational C and Python programming.  
> **Module Classification**: Frontend Public Entry Landing Page / Interactive Facility Command Center / GIS Spatial Portal.

---

## 1. Module Overview & Architectural Purpose

`Home.jsx` serves as the primary landing page and **Public Facility Command Center** for the `SmartComplaintHandler` platform at the International Institute of Information Technology, Naya Raipur (IIIT-NR). Unlike standard web portals that greet users with generic static text banners, `Home.jsx` immediately immerses visitors in an operational command deck featuring:
1. **Interactive GIS Digital Twin**: An embedded, full-width vector map viewport allowing immediate exploration of academic blocks, student hostels, sports grounds, and laboratory facilities.
2. **Context-Aware Quick Action Dispatcher**: Evaluates the authenticated user's Role-Based Access Control (RBAC) credentials (Student, Technician, Admin, Super Admin) and renders role-specific workflow shortcuts (e.g. "My Issues", "Operations Desk", "Directorate Console", "Work Orders").
3. **Instant Ticket Tracking Console**: A prominent tracking input field allowing any campus resident or parent to enter an alphanumeric ticket code (e.g., `SCH-A1B2C3D4`) and jump directly to live lifecycle telemetry without logging in.
4. **Campus Facilities & Duty Engineer Directory**: Interactive cards showcasing residential hostels, recreational spots, and verified 24/7 emergency contact details for electrical, networking, and civil maintenance supervisors.

### Foundational Programming Analogy (C & Python)
- In **C programming**, think of `Home.jsx` as the **Interactive Console Main Menu** (`main_menu()`):
  ```c
  void display_main_menu(UserSession* current_user) {
      printf("1. Report Issue at Selected Location\n");
      if (current_user->role == ROLE_STUDENT) printf("2. My Complaints\n");
      if (current_user->role == ROLE_ADMIN)   printf("3. Operations Desk\n");
      printf("4. Track Ticket Code\n");
      printf("5. View Emergency Contacts\n");
  }
  ```
- In **Python (`curses` or a desktop UI like PyQt)**, `Home.jsx` is the primary `QMainWindow` containing a central map canvas widget, a top toolbar dynamically populated based on user permissions, and a dockable contact directory widget.

---

## 2. Integrated Sequential Code Walkthrough & Inline Technical Breakdown

Below is the exhaustive, sequential, line-by-line examination of `Home.jsx`.

---

### Snippet 1: Module Header, React/Router & Context Imports

```javascript
/**
 * SmartComplaintHandler - IIIT Naya Raipur Campus Map & Facility Command Center
 * Flush Edge-to-Edge Dark Command Twin Layout with Consistent Institutional Palette
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import CampusMapSelector from '../components/CampusMapSelector';
import {
  IIITNR_CAMPUS_METADATA,
  IIITNR_MAP_UPDATED_EVENT,
  getCampusBuildings,
  getHostelBuildings,
} from '../data/iiitnrCampusData';
```

#### Plain-English Purpose & C/Python Analogy
Imports standard React state and lifecycle hooks, navigation routing primitives, application context providers, the embedded digital twin component, and campus cartographic data utilities.
- In **C**, this corresponds to `#include` directives bringing in the UI framework, routing dispatcher, session security tokens, and static campus database arrays.
- In **Python**, it corresponds to `import` statements loading `tkinter`, routing modules, and authentication context objects.

#### Line-by-Line Breakdown
- **Lines 1–4**: File docstring defining the layout archetype (flush edge-to-edge dark command twin layout).
- **Line 5**: Imports `React`, `useState` (for managing local state variables), and `useEffect` (for lifecycle subscription to campus map update events).
- **Line 6**: Imports `Link` (client-side declarative anchor tag) and `useNavigate` (imperative programmatic page redirection hook) from `react-router-dom`.
- **Line 7**: Imports `useAuth` hook from `AuthContext`, providing access to user identity and role flags (`currentUser`, `isStudent`, `canAccessOperations`, etc.).
- **Line 8**: Imports `useTheme` hook from `ThemeContext`, exposing the active color scheme mode (`isDark`).
- **Line 9**: Imports `CampusMapSelector`, the interactive 2D GIS vector canvas wrapper.
- **Lines 10–15**: Imports metadata constants and query functions from `iiitnrCampusData.js`:
  - `IIITNR_CAMPUS_METADATA`: Static directory of duty engineers, facility supervisors, and administrative contact numbers.
  - `IIITNR_MAP_UPDATED_EVENT`: Custom window event string fired when an administrator modifies building parameters.
  - `getCampusBuildings()`: Function returning the master array of campus zones.
  - `getHostelBuildings()`: Filter helper extracting residential hostel structures.

---

### Snippet 2: Dynamic Card Icon & Theme Resolvers

```javascript
const getBuildingCardTheme = (h) => {
  const name = (h.name || '').toLowerCase();
  const category = (h.category || '').toUpperCase();

  if (
    name.includes('football') ||
    name.includes('sports') ||
    name.includes('court') ||
    name.includes('amphi') ||
    category === 'INFRASTRUCTURE'
  ) {
    return { icon: '⚽' };
  }

  if (name.includes('park') || name.includes('guest') || name.includes('lawn')) {
    return { icon: '🌿' };
  }

  if (
    category === 'ACADEMIC' ||
    category === 'AMENITY' ||
    name.includes('academic') ||
    name.includes('canteen') ||
    name.includes('auditorium')
  ) {
    return { icon: '🏛️' };
  }

  return { icon: '🛏️' };
};

const getContactTheme = (c) => {
  const role = (c.role || '').toLowerCase();
  if (role.includes('electrical')) return { icon: '⚡' };
  if (role.includes('sr. network') || role.includes('core')) return { icon: '📶' };
  if (role.includes('network') || role.includes('noc')) return { icon: '🌐' };
  return { icon: '🏢' };
};
```

#### Plain-English Purpose & C/Python Analogy
These two pure utility functions inspect entity attributes and return contextual emoji iconography.
- In **C programming**, this is equivalent to a classification function using `strstr()`:
  ```c
  const char* get_building_icon(const char* name, const char* category) {
      if (strstr(name, "sports") || strstr(name, "football")) return "[SPORTS]";
      if (strstr(category, "ACADEMIC")) return "[ACAD]";
      return "[HOSTEL]";
  }
  ```
- In **Python**, it resembles a pattern-matching helper `def get_building_icon(building): ...`.

#### Line-by-Line Breakdown
- **Lines 17–46**: `getBuildingCardTheme(h)`:
  - Normalizes `name` to lowercase and `category` to uppercase to ensure case-insensitive matching.
  - Sports & Infrastructure (`⚽`): Matches football grounds, athletic courts, amphitheater, or category `'INFRASTRUCTURE'`.
  - Green Spaces (`🌿`): Matches lawns, guest houses, and campus parks.
  - Academic & Institutional (`🏛️`): Matches academic complex, canteen, auditorium, or categories `'ACADEMIC'` / `'AMENITY'`.
  - Fallback (`🛏️`): Default icon representing student residential hostels.
- **Lines 48–54**: `getContactTheme(c)`:
  - Inspects engineer role string:
    - Electrical maintenance & HVAC &rarr; `⚡`
    - Senior network engineers & core infrastructure &rarr; `📶`
    - General network operations & NOC technicians &rarr; `🌐`
    - Default administrative facilities &rarr; `🏢`

---

### Snippet 3: Home Component Signature, Hooks, and State Management

```javascript
export default function Home() {
  const navigate = useNavigate();
  const { currentUser, isStudent, canAccessOperations, isTechnician, isSuperAdmin } = useAuth();
  const { isDark } = useTheme();
  const [buildings, setBuildings] = useState(() => getCampusBuildings());
  const [trackingCode, setTrackingCode] = useState('');
  const [selectedMapBuilding, setSelectedMapBuilding] = useState(
    () => getCampusBuildings()[0]?.name || 'Ramanujan House (Boys Hostel)'
  );

  useEffect(() => {
    const sync = () => setBuildings(getCampusBuildings());
    window.addEventListener(IIITNR_MAP_UPDATED_EVENT, sync);
    return () => window.removeEventListener(IIITNR_MAP_UPDATED_EVENT, sync);
  }, []);

  const hostels = getHostelBuildings(buildings);
```

#### Plain-English Purpose & C/Python Analogy
Defines the `Home` component and sets up its operational state. It accesses authentication credentials from context, binds to the theme, manages the list of buildings, captures the ticket tracking search input, and subscribes to window-level custom events to refresh spatial data when an admin makes live edits.
- In **C programming**, this is initializing a local application context struct and registering an event signal handler (`signal(SIGUSR1, sync_handler)`).
- In **Python**, it corresponds to setting up Tkinter observables (`StringVar`, `BooleanVar`) and registering an event listener on the global bus.

#### Line-by-Line Breakdown
- **Line 56**: Declares and exports the default functional component `Home`.
- **Line 57**: Initializes `navigate` hook for programmatic navigation.
- **Line 58**: Destructures user credentials from `useAuth`: `currentUser`, `isStudent`, `canAccessOperations` (true for Admins/Super Admins), `isTechnician`, and `isSuperAdmin`.
- **Line 59**: Destructures `isDark` boolean from `useTheme` for theme switching.
- **Line 60**: `buildings`: Lazy state initialization `() => getCampusBuildings()`. Using a callback function ensures the dataset is only read once during initial mount rather than re-queried on every render pass.
- **Line 61**: `trackingCode`: Controlled input state storing the ticket ID typed by the user.
- **Lines 62–64**: `selectedMapBuilding`: Tracks which campus building is currently selected on the map. Defaults to the first building in the array or `'Ramanujan House (Boys Hostel)'`.
- **Lines 66–70**: `useEffect`: Registers an event listener on `window` listening for `IIITNR_MAP_UPDATED_EVENT`. If a Super Admin updates or resets campus zones in another modal, the listener executes `sync()`, refreshing the `buildings` state. The return block removes the event listener on unmount to prevent memory leaks.
- **Line 72**: Derives `hostels` array by passing `buildings` to `getHostelBuildings()`.

---

### Snippet 4: Tracking Form Submission Handler

```javascript
  const handleTrackSubmit = (e) => {
    e.preventDefault();
    const cleaned = trackingCode.trim().toUpperCase();
    if (!cleaned) return;
    navigate(`/track?code=${encodeURIComponent(cleaned)}`);
  };
```

#### Plain-English Purpose & C/Python Analogy
Validates and sanitizes the user's ticket tracking code input, preventing empty submissions and routing the user to the tracking page with URL encoding.
- In **C programming**, this is equivalent to trimming whitespace, converting characters with `toupper()`, checking `strlen() > 0`, and calling `exec_track(cleaned_str)`.
- In **Python**, it is `cleaned = code.strip().upper(); if cleaned: redirect(f"/track?code={quote(cleaned)}")`.

#### Line-by-Line Breakdown
- **Line 74**: Declares `handleTrackSubmit(e)` receiving the native form submission event.
- **Line 75**: `e.preventDefault()` halts default browser HTTP POST behavior and page reload.
- **Line 76**: Trims leading/trailing whitespace and converts the tracking code to uppercase (`e.g., "sch-1234" -> "SCH-1234"`).
- **Line 77**: If the resulting string is empty, returns early with no action.
- **Line 78**: Navigates to `/track?code=...` using `encodeURIComponent` to protect against URL injection and escape special characters.

---

### Snippet 5: Hero Header & Role-Based Quick Actions

```javascript
  return (
    <div className={`w-full min-h-screen flex flex-col space-y-0 transition-colors ${isDark ? 'bg-[#0e1117] text-zinc-100' : 'bg-white text-slate-900'}`}>
      {/* Matte Command Deck Hero Header */}
      <div className={`w-full px-4 sm:px-8 lg:px-12 py-8 relative border-b transition-colors ${
        isDark ? 'bg-[#161b22] border-zinc-800' : 'bg-white border-slate-200'
      }`}>
        <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold border ${
              isDark
                ? 'bg-zinc-800/80 border-zinc-700 text-emerald-400'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>IIIT Naya Raipur · Sector 24, Atal Nagar</span>
            </div>
            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight ${
              isDark ? 'text-zinc-100' : 'text-slate-900'
            }`}>
              Campus Digital Twin &amp; Maintenance Desk
            </h1>
            <p className={`text-xs sm:text-sm max-w-2xl leading-relaxed ${
              isDark ? 'text-zinc-400' : 'text-slate-600'
            }`}>
              Explore campus buildings, hostels, and academic facilities in interactive GIS space, or dispatch a verified maintenance work order with real-time AI triage.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <Link
                to={`/submit?building=${encodeURIComponent(selectedMapBuilding)}`}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer border border-emerald-600"
              >
                <span>+ Submit Issue ({selectedMapBuilding.split(' (')[0]})</span>
              </Link>
              {isStudent && (
                <Link
                  to="/student"
                  className={`px-4 py-2 rounded-lg border font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-2 ${
                    isDark
                      ? 'bg-[#0e1117] hover:bg-zinc-800 border-zinc-700 text-zinc-200 hover:text-white'
                      : 'bg-[#eef2f6] hover:bg-[#e2e8f0] border-slate-300 text-slate-800'
                  }`}
                >
                  My Issues →
                </Link>
              )}
              {canAccessOperations && (
                <Link
                  to="/operations"
                  className={`px-4 py-2 rounded-lg border font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-2 ${
                    isDark
                      ? 'bg-[#0e1117] hover:bg-zinc-800 border-zinc-700 text-zinc-200 hover:text-white'
                      : 'bg-[#eef2f6] hover:bg-[#e2e8f0] border-slate-300 text-slate-800'
                  }`}
                >
                  Operations Desk →
                </Link>
              )}
              {isSuperAdmin && (
                <Link
                  to="/superadmin"
                  className={`px-4 py-2 rounded-lg border font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-2 ${
                    isDark
                      ? 'bg-[#0e1117] hover:bg-zinc-800 border-zinc-700 text-purple-300 hover:text-purple-200'
                      : 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-800'
                  }`}
                >
                  Directorate Console →
                </Link>
              )}
              {isTechnician && (
                <Link
                  to="/technician"
                  className={`px-4 py-2 rounded-lg border font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-2 ${
                    isDark
                      ? 'bg-[#0e1117] hover:bg-zinc-800 border-zinc-700 text-zinc-200 hover:text-white'
                      : 'bg-[#eef2f6] hover:bg-[#e2e8f0] border-slate-300 text-slate-800'
                  }`}
                >
                  Work Orders →
                </Link>
              )}
            </div>
          </div>
```

#### Plain-English Purpose & C/Python Analogy
Renders the top command banner. It displays institutional identity badges and conditionally renders navigation buttons according to the user's authenticated role.
- In **C/Python**, this is the permission check: `if (has_permission(USER, OP_ADMIN)) show_button("Operations Desk");`.

#### Line-by-Line Breakdown
- **Line 82**: Root container `<div>` with full-viewport height (`min-h-screen`) and theme-reactive background colors.
- **Lines 84–86**: Hero banner container with horizontal padding and bottom border.
- **Lines 89–96**: Institutional location badge: `"IIIT Naya Raipur · Sector 24, Atal Nagar"` with a pulsating emerald dot.
- **Lines 97–106**: Primary H1 title and descriptive subtitle explaining the dual GIS and AI triage maintenance capability.
- **Lines 108–164**: Quick Action Button Cluster:
  - **Lines 109–114**: Primary CTA: `+ Submit Issue ({selectedMapBuilding})`. Dynamically links to `/submit?building=...`, pre-populating whatever building is currently selected on the map.
  - **Lines 115–126**: Conditional student link: Renders `"My Issues →"` pointing to `/student` if `isStudent` is true.
  - **Lines 127–138**: Conditional operations link: Renders `"Operations Desk →"` pointing to `/operations` if `canAccessOperations` is true.
  - **Lines 139–150**: Conditional super admin link: Renders `"Directorate Console →"` in distinctive purple styling pointing to `/superadmin` if `isSuperAdmin` is true.
  - **Lines 151–162**: Conditional technician link: Renders `"Work Orders →"` pointing to `/technician` if `isTechnician` is true.

---

### Snippet 6: Quick Ticket Tracking Form & Flush Map Embed

```javascript
          <form
            onSubmit={handleTrackSubmit}
            className={`flex items-center gap-2 p-1.5 rounded-xl border w-full lg:w-auto ${
              isDark ? 'bg-[#0e1117] border-zinc-700' : 'bg-[#eef2f6] border-slate-300'
            }`}
          >
            <input
              type="text"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              placeholder="Track Code (e.g. SCH-...)"
              className={`w-full sm:w-56 px-3.5 py-2 rounded-lg text-xs font-mono border focus:outline-none transition-colors ${
                isDark
                  ? 'bg-[#161b22] border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600'
              }`}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer shrink-0"
            >
              Track →
            </button>
          </form>
        </div>
      </div>

      {/* Flush Interactive Digital Twin Map */}
      <div className="w-full">
        <CampusMapSelector
          flush={true}
          selectedBuilding={selectedMapBuilding}
          onSelectBuilding={setSelectedMapBuilding}
          studentSavedHostel={currentUser?.hostel_name}
          studentSavedRoom={currentUser?.room_number}
        />
      </div>
```

#### Plain-English Purpose & C/Python Analogy
Renders the quick ticket tracking search input and embeds the full-width interactive campus digital twin.
- In **Python web development**, this is rendering a search bar and embedding a GIS map widget configured with the user's saved profile location.

#### Line-by-Line Breakdown
- **Lines 166–190**: Ticket tracking `<form>`:
  - Binds `onSubmit={handleTrackSubmit}`.
  - Input field uses monospace font (`font-mono`) to accommodate uppercase ticket codes.
  - Submit button labeled `"Track →"` triggers the client-side router transition.
- **Lines 194–202**: Embedded `CampusMapSelector`:
  - `flush={true}`: Instructs the map component to remove outer rounded cards and borders, allowing it to span edge-to-edge across the screen.
  - `selectedBuilding={selectedMapBuilding}`: Controlled building selection state.
  - `onSelectBuilding={setSelectedMapBuilding}`: Callback updating state when a user clicks any building or selects a search result.
  - `studentSavedHostel`, `studentSavedRoom`: Passes student profile metadata so the map can automatically highlight their home residence.

---

### Snippet 7: Hostels & Campus Spots Live Navigator Grid

```javascript
      {/* Flush Hostels & Campus Engineering Contacts Grid */}
      <div className={`w-full px-4 sm:px-8 lg:px-12 py-10 transition-colors ${
        isDark ? 'bg-[#0e1117]' : 'bg-white'
      }`}>
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Hostels & Campus Spots */}
          <div className={`lg:col-span-7 p-6 sm:p-7 space-y-5 rounded-2xl border transition-colors ${
            isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100' : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-sm'
          }`}>
            <div className={`flex items-center justify-between border-b pb-4 ${
              isDark ? 'border-zinc-800' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🏢</span>
                <div>
                  <h3 className={`text-base font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                    IIIT-NR Hostels &amp; Campus Spots
                  </h3>
                  <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Click any spot to select and report an issue
                  </p>
                </div>
              </div>
              <span className={`text-[11px] font-mono font-bold px-3 py-1 rounded-lg border ${
                isDark
                  ? 'text-emerald-400 bg-zinc-800/80 border-zinc-700'
                  : 'text-emerald-700 bg-emerald-50 border-emerald-200'
              }`}>
                Live Navigator
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {hostels.map((h) => {
                const theme = getBuildingCardTheme(h);
                return (
                  <div
                    key={h.id}
                    onClick={() => {
                      setSelectedMapBuilding(h.name);
                      navigate(`/submit?building=${encodeURIComponent(h.name)}`);
                    }}
                    className={`p-3.5 rounded-xl border transition-colors cursor-pointer space-y-2 group ${
                      isDark
                        ? 'bg-[#0e1117] border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
                        : 'bg-[#e2e8f0] border-slate-300 hover:border-slate-400 hover:bg-white hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{theme.icon}</span>
                        <span className={`font-bold text-xs sm:text-sm truncate ${
                          isDark ? 'text-zinc-200 group-hover:text-white' : 'text-slate-800 group-hover:text-slate-950'
                        }`}>
                          {h.name}
                        </span>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border shrink-0 ${
                        isDark
                          ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                          : 'bg-slate-200 text-slate-700 border-slate-300'
                      }`}>
                        {h.mapPin?.badge || 'SPOT'}
                      </span>
                    </div>
                    <div className={`text-[11px] flex items-center justify-between ${
                      isDark ? 'text-zinc-400' : 'text-slate-500'
                    }`}>
                      <span>{h.type}</span>
                      <span className={`font-mono text-[10px] ${
                        isDark ? 'text-zinc-500 group-hover:text-zinc-400' : 'text-slate-400 group-hover:text-slate-600'
                      }`}>
                        {h.gps}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
```

#### Plain-English Purpose & C/Python Analogy
Renders an interactive catalog of student residences and key recreational facilities. Clicking any card selects the building and immediately navigates to the ticket submission form with the building pre-selected in the query string.
- In **C/Python**, this is rendering an array of location records and executing an action when clicked.

#### Line-by-Line Breakdown
- **Lines 205–208**: Outer 12-column grid container.
- **Lines 210–234**: Left panel occupying 7 grid columns (`lg:col-span-7`):
  - Header with building icon `🏢`, title `"IIIT-NR Hostels & Campus Spots"`, and `"Live Navigator"` badge.
- **Lines 236–282**: 2-column card grid (`sm:grid-cols-2`):
  - Maps through `hostels`:
    - Computes `theme = getBuildingCardTheme(h)` to obtain the icon.
    - `onClick`: Sets `selectedMapBuilding = h.name` and navigates to `/submit?building=...`.
    - Card displays building icon, building name (truncated if long), monospace badge (e.g. `'B1'`), facility type, and GPS coordinates.

---

### Snippet 8: Campus Estate & Engineering Emergency Contacts Directory

```javascript
          {/* Campus Estate & Engineering Contacts */}
          <div className={`lg:col-span-5 p-6 sm:p-7 space-y-5 rounded-2xl border transition-colors ${
            isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100' : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-sm'
          }`}>
            <div className={`flex items-center justify-between border-b pb-4 ${
              isDark ? 'border-zinc-800' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📞</span>
                <div>
                  <h3 className={`text-base font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                    Campus Estate &amp; Engineering Contacts
                  </h3>
                  <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Duty facility engineers for urgent maintenance escalations
                  </p>
                </div>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border ${
                isDark
                  ? 'text-zinc-400 bg-zinc-800 border-zinc-700'
                  : 'text-slate-700 bg-[#e2e8f0] border-slate-300'
              }`}>
                24/7 Support
              </span>
            </div>

            <div className="space-y-3">
              {IIITNR_CAMPUS_METADATA.contacts.map((c) => {
                const theme = getContactTheme(c);
                return (
                  <div
                    key={c.email}
                    className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 text-xs transition-colors ${
                      isDark
                        ? 'bg-[#0e1117] border-zinc-800 hover:border-zinc-700'
                        : 'bg-[#e2e8f0] border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{theme.icon}</span>
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          isDark
                            ? 'bg-zinc-800 text-emerald-400 border-zinc-700'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {c.role}
                        </span>
                      </div>
                      <div className={`font-bold text-sm ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{c.name}</div>
                      <div className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{c.office}</div>
                    </div>
                    <div className="text-right font-mono text-[11px] shrink-0 space-y-1.5">
                      <a
                        href={`tel:${c.phone}`}
                        className={`font-semibold px-2.5 py-1 rounded-lg border block transition-colors ${
                          isDark
                            ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-zinc-700'
                            : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-2xs'
                        }`}
                      >
                        📞 {c.phone}
                      </a>
                      <a
                        href={`mailto:${c.email}`}
                        className="text-[10px] text-emerald-500 hover:text-emerald-400 block hover:underline truncate max-w-[150px]"
                      >
                        {c.email}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### Plain-English Purpose & C/Python Analogy
Renders an emergency contact roster for on-duty estate and facilities engineers. Each card features direct telephonic (`tel:`) and email (`mailto:`) protocol links for rapid escalation.
- In **C/Python**, this is iterating over a contact book array and generating clickable hyperlink elements.

#### Line-by-Line Breakdown
- **Lines 286–310**: Right panel occupying 5 grid columns (`lg:col-span-5`):
  - Header with phone icon `📞`, title `"Campus Estate & Engineering Contacts"`, and `"24/7 Support"` badge.
- **Lines 312–359**: Iterates through `IIITNR_CAMPUS_METADATA.contacts`:
  - `getContactTheme(c)` assigns role icons (`⚡` for electrical, `📶` for network, etc.).
  - Displays engineer role badge, full name, and office location.
  - Direct action links:
    - `<a href="tel:...">`: Dialing shortcut launching phone dialer on mobile devices or softphones on desktop.
    - `<a href="mailto:...">`: Mail shortcut opening email client.
- **Lines 362–365**: Closes structural containers and component export.

---

## 3. High-Frequency Viva & Technical Defense Guide

### Q1: How does `Home.jsx` achieve seamless integration between the 2D GIS map and ticket submission?
**Examiner Answer**:
"In `Home.jsx`, the map selection state is maintained in `selectedMapBuilding`. The primary Call to Action (CTA) button binds dynamically to this state:
```javascript
<Link to={`/submit?building=${encodeURIComponent(selectedMapBuilding)}`}>
  + Submit Issue ({selectedMapBuilding.split(' (')[0]})
</Link>
```
When a student clicks on 'Bose House (Boys Hostel)' on the map canvas, `selectedMapBuilding` updates instantly. Clicking the '+ Submit Issue' button passes the selected building via query parameters to `/submit`, where `SubmitComplaint.jsx` automatically pre-fills the location field. This reduces user input effort and eliminates spelling inconsistencies."

### Q2: Why is the custom window event `IIITNR_MAP_UPDATED_EVENT` used instead of React props or Redux?
**Examiner Answer**:
"When a Super Administrator updates building coordinates or zone categories inside the administrative data editor, the change is saved to browser storage or dispatched across decoupled components. 
By dispatching `IIITNR_MAP_UPDATED_EVENT`, any active view in the application—including the landing page—can subscribe via a standard `window.addEventListener()` inside `useEffect`. This decoupled event-driven pattern allows instantaneous spatial synchronization without introducing heavy global state management libraries like Redux or Zustand."

### Q3: How does `Home.jsx` sanitize user input when tracking a ticket code?
**Examiner Answer**:
"In `handleTrackSubmit`:
```javascript
const cleaned = trackingCode.trim().toUpperCase();
if (!cleaned) return;
navigate(`/track?code=${encodeURIComponent(cleaned)}`);
```
1. `trim()` eliminates accidental leading and trailing whitespace.
2. `toUpperCase()` normalizes ticket codes to standard institutional formatting (e.g. `SCH-A1B2C3D4`), allowing case-insensitive user entry.
3. `encodeURIComponent()` sanitizes the parameter against URL manipulation and cross-site scripting (XSS) vectors before dispatching the router navigation."

---

## 4. Quick-Reference Architecture & Property Table

| Feature / UI Element | Props / Hooks Used | Architectural Role / Viva Defense |
| :--- | :--- | :--- |
| **Role-Based Action Bar** | `useAuth()` (`isStudent`, `isTechnician`, etc.) | Conditionally surfaces role-specific portals (Student, Operations, Technician, SuperAdmin). |
| **Edge-to-Edge Vector Canvas** | `<CampusMapSelector flush={true} />` | Renders full-width GIS digital twin without decorative borders. |
| **Instant Ticket Tracker** | `trackingCode`, `handleTrackSubmit` | Sanitizes input and redirects to `/track?code=...` without requiring user authentication. |
| **Decoupled Spatial Sync** | `IIITNR_MAP_UPDATED_EVENT` | Listens for administrative map edits and refreshes local building state automatically. |
| **Live Hostels Navigator** | `getHostelBuildings()`, `navigate()` | Clickable cards that select a building and redirect directly to ticket submission. |
| **Emergency Roster** | `IIITNR_CAMPUS_METADATA.contacts` | Direct telephonic (`tel:`) and email (`mailto:`) links to on-duty campus engineers. |

---
*Documentation compiled and verified against commit codebase standards. Strictly non-destructive: no application source files modified.*
