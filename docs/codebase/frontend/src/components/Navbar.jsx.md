# Frontend Source Documentation: `frontend/src/components/Navbar.jsx`

> **File Path**: `frontend/src/components/Navbar.jsx`  
> **Role**: Modern SaaS Global Navigation Header, Role-Aware Tab Router, Backend Health Monitor, and Profile Management Portal.  
> **Target Audience**: College Viva Examiners, Evaluation Committees, UI/UX Architects, Students grounded in basic C/Python.

---

## 1. High-Level Architectural Purpose

In a web application, the navigation bar (`Navbar`) is the central command center for user orientation, session control, and access routing. 

`Navbar.jsx` provides an enterprise-grade top navigation header inspired by high-productivity developer platforms (Linear, Vercel, and Supabase). Its primary responsibilities include:
1. **Dynamic Role-Based Navigation**: Depending on whether the authenticated user is a `STUDENT`, `TECHNICIAN`, `ADMIN`, or `SUPER_ADMIN`, the navigation bar displays tailored navigation tabs, preventing users from seeing links to unauthorized pages.
2. **Backend Health Telemetry**: On mount, it pings the backend `/health` endpoint and renders a real-time status pill (pulsing green "Live" badge or red "Offline" warning), giving instant visibility into server connectivity.
3. **Student Quick-Action Shortcuts**: Displays a saved campus residence chip (e.g. `Ramanujan · 204`) and a `⌘K` Quick Search trigger for instant room and lab navigation.
4. **Visual Theme Control**: Features a one-click Sun/Moon toggle button that calls `ThemeContext` to switch between Matte Dark and Crisp Light modes.
5. **Session & Security Management**: Houses the user profile dropdown, enabling one-click sign out, access to the Staff & RBAC Directory, and the `SetPasswordModal` launcher for Google OAuth users setting up dual-login credentials.
6. **Responsive Mobile Drawer**: Collapses into an accessible mobile hamburger drawer on small screens.

---

## 2. Sequential Code Breakdown & Deep Analysis

```javascript
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import SetPasswordModal from './SetPasswordModal';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    currentUser,
    logout,
    isStudent,
    isTechnician,
    isAdmin,
    isSuperAdmin,
  } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const isDarkTheme = isDark;
```

### Plain-English Purpose
This section imports the necessary tools and hooks. It extracts user identity and role flags (`isStudent`, `isTechnician`, `isAdmin`, `isSuperAdmin`) from `useAuth()`, active theme state from `useTheme()`, and browser navigation helpers from React Router.

### Line-by-Line Breakdown
- `import { useState, useEffect, useRef } from 'react'`: Standard React hooks for local state, side-effects, and direct DOM references.
- `import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'`:
  - `NavLink`: Specialized link that knows whether its target URL is currently active in the browser.
  - `Link`: Standard client-side navigation link.
  - `useNavigate`: Programmatic navigation function (e.g., `navigate('/login')`).
  - `useLocation`: Returns the current URL location object.
- `useAuth()` & `useTheme()`: Custom context hooks retrieving global authentication and theme state.
- `const isDarkTheme = isDark`: Alias variable used for theme-based CSS conditional logic.

### Deep Term & Concept Expansion
- **`NavLink` vs `Link`**: While `Link` simply updates the URL bar without reloading the page, `NavLink` accepts a function for `className` receiving `{ isActive }`. This allows the component to automatically apply bold text and an active green underline indicator when the user is on that specific page.
- **Client-Side Routing**: When clicking a `<Link>`, the browser does not make a new HTTP GET request for an HTML file. React Router intercepts the click, updates browser history via `history.pushState()`, and swaps the active view component inside the DOM instantly.

---

```javascript
  const [backendHealthy, setBackendHealthy] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const dropdownRef = useRef(null);
```

### Plain-English Purpose
Initializes local state variables for controlling interactive UI states:
- `backendHealthy`: Tri-state boolean (`null` = checking, `true` = healthy, `false` = offline).
- `mobileMenuOpen`: Boolean toggling the mobile responsive dropdown drawer.
- `profileMenuOpen`: Boolean toggling the user profile menu.
- `passwordModalOpen`: Boolean controlling the visibility of the Set/Change Password modal dialog.
- `dropdownRef`: A pointer reference attached to the profile menu HTML container to detect outside mouse clicks.

### Line-by-Line Breakdown
- `useState(null)`: Initial state `null` avoids showing a false "Offline" alarm while the initial health check is in-flight.
- `useRef(null)`: In C terms, this is like creating an unassigned pointer `void *dropdownRef = NULL;`. React assigns the physical DOM element reference to `dropdownRef.current` once the component renders.

---

```javascript
  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || '';
    const healthUrl = apiBase
      ? `${apiBase.replace(/\/api\/v1\/?$/, '')}/health`
      : '/health';

    fetch(healthUrl)
      .then((res) => res.json())
      .then((data) => setBackendHealthy(data.status === 'healthy'))
      .catch(() => setBackendHealthy(false));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
```

### Plain-English Purpose
These two `useEffect` hooks run once when the navigation bar mounts:
1. **Health Check Probe**: Queries the `/health` endpoint on the backend. If the backend responds with `status: "healthy"`, `backendHealthy` is set to `true`. If the server is stopped or returns an error, it is set to `false`.
2. **Click-Outside Listener**: Listens for user mouse clicks anywhere on the webpage. If a click occurs *outside* the profile dropdown container, it automatically closes the menu.

### Line-by-Line Breakdown
- `apiBase.replace(/\/api\/v1\/?$/, '')`: Regex strip removing the API subpath to target the root `/health` endpoint.
- `handleClickOutside = (e) => { ... }`: Evaluates if the clicked target element `e.target` is contained inside `dropdownRef.current`.
- `document.addEventListener('mousedown', handleClickOutside)`: Registers global mouse listener.
- `return () => document.removeEventListener(...)`: Cleanup function preventing dangling event listeners in memory when the component unmounts.

### Deep Term & Concept Expansion
- **DOM Node Containment (`contains`)**: The native method `node.contains(otherNode)` returns `true` if `otherNode` is a child or descendant of `node`. If the user clicks inside the dropdown menu, `contains()` returns `true`, leaving the menu open. If they click elsewhere, it returns `false`, triggering `setProfileMenuOpen(false)`.

---

```javascript
  const handleLogout = () => {
    setProfileMenuOpen(false);
    logout();
    navigate('/login');
  };

  const navTabClasses = ({ isActive }) =>
    `relative h-16 inline-flex items-center gap-2 px-3.5 text-xs sm:text-[13px] transition-colors ${
      isDarkTheme
        ? isActive
          ? 'text-zinc-100 font-bold after:content-[""] after:absolute after:bottom-0 after:left-1 after:right-1 after:h-[2px] after:bg-emerald-500 after:rounded-full'
          : 'text-zinc-400 hover:text-zinc-200 font-medium'
        : isActive
        ? 'text-zinc-900 font-bold after:content-[""] after:absolute after:bottom-0 after:left-1 after:right-1 after:h-[2px] after:bg-emerald-600 after:rounded-full'
        : 'text-slate-600 hover:text-slate-900 font-medium'
    }`;

  const shortHostel = currentUser?.hostel_name
    ? currentUser.hostel_name.split(' ')[0]
    : 'Ramanujan';
  const shortRoom = currentUser?.room_number
    ? currentUser.room_number.replace('Wing ', '').replace(', Room ', '-').replace('Room ', '')
    : '204';
```

### Plain-English Purpose
- `handleLogout`: Closes the dropdown, invokes the centralized `logout()` method (which clears tokens and storage), and redirects the browser to `/login`.
- `navTabClasses`: Dynamic styling function for navigation tabs. Active tabs receive bold text and a subtle 2px emerald underline pill positioned along the bottom border.
- `shortHostel` & `shortRoom`: String formatting helpers that compress long hostel names (e.g., *"Bhabha Boys Hostel"*) into compact chips (e.g., *"Bhabha · 302"*).

---

```javascript
  return (
    <header
      className={`sticky top-0 z-40 h-16 backdrop-blur-md border-b transition-colors relative ${
        isDarkTheme
          ? 'bg-[#0e1117]/95 border-zinc-800 text-zinc-100'
          : 'bg-white/95 border-slate-200 text-slate-800 shadow-xs'
      }`}
    >
      <div className="h-full w-full px-4 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-full gap-4">
          {/* Left: Brand Identity + Breadcrumb Divider + Horizontal Underline Tabs */}
          <div className="flex items-center gap-6 h-full">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center p-1 transition-colors border ${
                  isDarkTheme
                    ? 'bg-zinc-900 border-zinc-800 group-hover:border-zinc-700'
                    : 'bg-slate-50 border-slate-200 group-hover:border-slate-300'
                }`}
              >
                <img
                  src="/iiitnr_logo.png"
                  alt="IIIT Naya Raipur"
                  className="h-full w-auto object-contain"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold tracking-tight ${isDarkTheme ? 'text-zinc-100' : 'text-slate-900'}`}>
                  IIIT-NR
                </span>
                <span className={`font-light text-sm ${isDarkTheme ? 'text-slate-600' : 'text-slate-400'}`}>/</span>
                <span className={`text-xs font-medium ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
                  Facilities
                </span>
                {backendHealthy !== null && (
                  <span
                    className={`hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border ${
                      backendHealthy
                        ? isDarkTheme
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80'
                          : 'bg-green-50 text-green-700 border-green-200'
                        : isDarkTheme
                          ? 'bg-rose-950/80 text-rose-400 border-rose-800/80'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        backendHealthy ? 'bg-emerald-400' : 'bg-rose-500'
                      }`}
                    />
                    {backendHealthy ? 'Live' : 'Offline'}
                  </span>
                )}
              </div>
            </Link>
```

### Plain-English Purpose
Renders the navigation header element. It uses CSS `sticky top-0` and `backdrop-blur-md` so that as users scroll down long lists of tickets, the navbar remains fixed at the top of the viewport with a frosted glass background. On the left side, it renders the official IIIT-NR logo, the `/ Facilities` breadcrumb divider, and the dynamic `Live / Offline` server health pill.

### Line-by-Line Breakdown
- `sticky top-0 z-40`: CSS sticky positioning with high z-index ensuring it stays on top of page content.
- `backdrop-blur-md`: Frosted glass blur effect applied to whatever scrolls underneath the header.
- `backendHealthy !== null && (...)`: Conditional render displaying the health badge once the network response arrives.
- `<span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />`: Small colored dot representing server status.

---

```javascript
            {/* Primary Navigation Links */}
            <nav className={`hidden md:flex items-center h-full border-l pl-4 space-x-1 ${
              isDarkTheme ? 'border-slate-800' : 'border-slate-200'
            }`}>
              {isStudent && (
                <>
                  <NavLink to="/student" className={navTabClasses}>
                    <svg className="w-4 h-4 opacity-75" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>My Issues</span>
                  </NavLink>
                  <NavLink to="/submit" className={navTabClasses}>
                    <svg className="w-4 h-4 opacity-75" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Submit Request</span>
                  </NavLink>
                  <NavLink to="/track" className={navTabClasses}>
                    <svg className="w-4 h-4 opacity-75" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Track Status</span>
                  </NavLink>
                  <NavLink to="/map" className={navTabClasses}>
                    <svg className="w-4 h-4 opacity-75" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span>Campus Map</span>
                  </NavLink>
                </>
              )}
```

### Plain-English Purpose
Renders student-facing navigation tabs. Only users with `isStudent === true` see these tabs. It provides direct access to the student ticket ledger (`/student`), complaint submission form (`/submit`), public ticket tracker (`/track`), and interactive campus digital twin (`/map`).

---

```javascript
              {isTechnician && (
                <>
                  <NavLink to="/technician" className={navTabClasses}>
                    <span>Workstation</span>
                  </NavLink>
                  <NavLink to="/track" className={navTabClasses}>
                    <span>Track Status</span>
                  </NavLink>
                  <NavLink to="/map" className={navTabClasses}>
                    <span>Campus Map</span>
                  </NavLink>
                </>
              )}

              {isAdmin && !isSuperAdmin && (
                <>
                  <NavLink to="/operations" className={navTabClasses}>
                    <span>Operations</span>
                  </NavLink>
                  <NavLink to="/squads" className={navTabClasses}>
                    <span>Squads</span>
                  </NavLink>
                  <NavLink to="/track" className={navTabClasses}>
                    <span>Track Status</span>
                  </NavLink>
                  <NavLink to="/submit" className={navTabClasses}>
                    <span>Submit Request</span>
                  </NavLink>
                  <NavLink to="/map" className={navTabClasses}>
                    <span>Campus Map</span>
                  </NavLink>
                </>
              )}

              {isSuperAdmin && (
                <>
                  <NavLink to="/superadmin" end className={navTabClasses}>
                    <span>Directorate</span>
                  </NavLink>
                  <NavLink to="/operations" className={navTabClasses}>
                    <span>Operations</span>
                  </NavLink>
                  <NavLink to="/squads" className={navTabClasses}>
                    <span>Squads</span>
                  </NavLink>
                  <NavLink to="/superadmin/staff" className={navTabClasses}>
                    <span>Staff &amp; RBAC</span>
                  </NavLink>
                  <NavLink to="/track" className={navTabClasses}>
                    <span>Track Status</span>
                  </NavLink>
                  <NavLink to="/submit" className={navTabClasses}>
                    <span>Submit Request</span>
                  </NavLink>
                  <NavLink to="/map" className={navTabClasses}>
                    <span>Campus Map</span>
                  </NavLink>
                </>
              )}
            </nav>
          </div>
```

### Plain-English Purpose
Renders staff and administrative navigation tiers:
- **Technicians**: Focuses strictly on operational execution (`Workstation`, `Track Status`, `Campus Map`).
- **Facility Admins**: Provides supervisory oversight (`Operations`, `Squads`, `Track Status`, `Submit Request`, `Campus Map`).
- **Super Admins**: Grants executive access (`Directorate`, `Operations`, `Squads`, `Staff & RBAC`, `Track Status`, `Submit Request`, `Campus Map`).

---

```javascript
          {/* Right: Quick Search Trigger + Saved Room Chip + Primary Action + Profile Menu */}
          <div className="hidden sm:flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/submit?mode=search')}
              className={`hidden lg:flex items-center justify-between gap-5 px-3 py-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                isDarkTheme
                  ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
                  : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] border-slate-300 text-slate-700 hover:text-slate-900'
              }`}
              title="Quick-locate any room or laboratory"
            >
              <span className="flex items-center gap-2">
                <svg className={`w-3.5 h-3.5 ${isDarkTheme ? 'text-slate-500' : 'text-slate-500'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Find room or lab...</span>
              </span>
              <kbd className={`px-1.5 py-0.5 text-[10px] font-mono rounded border ${
                isDarkTheme ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-white text-slate-600 border-slate-300'
              }`}>
                ⌘K
              </kbd>
            </button>
```

### Plain-English Purpose
Renders the desktop quick search trigger button. Styled like modern SaaS command palettes, it displays a search magnifying glass and a keyboard badge `⌘K`. Clicking this button immediately navigates the user to the interactive campus location search on the complaint submission page.

---

```javascript
            {currentUser?.hostel_name && (
              <Link
                to="/submit"
                className={`hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  isDarkTheme
                    ? 'bg-[#161b22] hover:bg-zinc-800 border-zinc-800 text-zinc-200 hover:border-zinc-700'
                    : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] border-slate-300 text-slate-800'
                }`}
                title="Your default hostel residence"
              >
                <svg className={`w-3.5 h-3.5 shrink-0 ${isDarkTheme ? 'text-emerald-400' : 'text-emerald-700'}`} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="font-mono text-xs font-medium">
                  {shortHostel} · {shortRoom}
                </span>
              </Link>
            )}

            {/* Theme Toggle Button (One Click) */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${isDarkTheme ? 'light' : 'dark'} mode`}
              title={`Switch to ${isDarkTheme ? 'light' : 'dark'} mode`}
              className={`p-2 rounded-lg border transition-colors cursor-pointer flex items-center justify-center ${
                isDarkTheme
                  ? 'bg-[#161b22] hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-amber-400'
                  : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] border-slate-300 text-slate-700 hover:text-slate-900 shadow-2xs'
              }`}
            >
              {isDarkTheme ? (
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <Link
              to="/submit"
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>+ New Request</span>
            </Link>
```

### Plain-English Purpose
Renders three key action elements on the right side of the navbar:
1. **Saved Residence Chip**: Displays the student's assigned hostel and room number. Clicking it immediately opens the submission form with this room pre-selected.
2. **Theme Switcher**: One-click toggle that flips between dark and light themes, displaying an amber sun icon in dark mode and a slate crescent moon in light mode.
3. **Primary CTA (`+ New Request`)**: An eye-catching green action button that allows students or staff to immediately file an incident report.

---

```javascript
            {currentUser ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                  className={`flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                    isDarkTheme
                      ? 'bg-[#161b22] hover:bg-zinc-800 border-zinc-800 text-zinc-200'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  {currentUser.avatar_url ? (
                    <img
                      src={currentUser.avatar_url}
                      alt={currentUser.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                      {(currentUser.name || 'S')[0].toUpperCase()}
                    </div>
                  )}
                  <span className={`text-xs font-medium max-w-[96px] truncate ${isDarkTheme ? 'text-zinc-200' : 'text-slate-800'}`}>
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
```

### Plain-English Purpose
Renders the user profile pill button. If the user logged in via Google OAuth, it renders their high-resolution Google profile picture (`currentUser.avatar_url`). If they logged in via email/password, it generates a circular avatar with their first initial. Next to the avatar, it displays their first name and a dropdown indicator arrow.

---

```javascript
                {profileMenuOpen && (
                  <div className={`absolute right-0 mt-2 w-64 rounded-xl border shadow-xl py-1.5 z-50 text-xs ${
                    isDarkTheme ? 'bg-[#161b22] border-zinc-800 text-zinc-200' : 'bg-white border-slate-200 text-slate-800'
                  }`}>
                    <div className={`px-3.5 py-2.5 border-b ${isDarkTheme ? 'border-zinc-800' : 'border-slate-100'}`}>
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold truncate ${isDarkTheme ? 'text-zinc-100' : 'text-slate-900'}`}>{currentUser.name}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold border ${
                          isDarkTheme ? 'bg-zinc-800 text-emerald-400 border-zinc-700' : 'bg-green-50 text-green-700 border-green-200'
                        }`}>
                          {currentUser.roleLabel || currentUser.role}
                        </span>
                      </div>
                      <div className={`text-[11px] font-mono mt-0.5 truncate ${isDarkTheme ? 'text-zinc-400' : 'text-slate-500'}`}>
                        {currentUser.email}
                      </div>
                    </div>
```

### Plain-English Purpose
Renders the profile menu dropdown card when `profileMenuOpen` is `true`. The top header displays the user's full name, role badge (e.g. `Super Admin`, `Student`), and institutional email address.

---

```javascript
                    <div className="py-1">
                      {isSuperAdmin && (
                        <Link
                          to="/superadmin/staff"
                          onClick={() => setProfileMenuOpen(false)}
                          className={`w-full px-3.5 py-2 text-left flex items-center gap-2 ${
                            isDarkTheme ? 'text-zinc-300 hover:text-white hover:bg-zinc-800/80' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span>Staff &amp; RBAC Directory</span>
                        </Link>
                      )}

                      <Link
                        to="/student"
                        onClick={() => setProfileMenuOpen(false)}
                        className={`w-full px-3.5 py-2 text-left flex items-center gap-2 ${
                          isDarkTheme ? 'text-zinc-300 hover:text-white hover:bg-zinc-800/80' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                        </svg>
                        <span>My Requests &amp; Room</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          setPasswordModalOpen(true);
                        }}
                        className={`w-full px-3.5 py-2 text-left flex items-center justify-between cursor-pointer ${
                          isDarkTheme ? 'text-zinc-300 hover:text-white hover:bg-zinc-800/80' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                          <span className="truncate">
                            {(!currentUser?.has_password || currentUser?.auth_provider === 'google')
                              ? 'Set Account Password'
                              : 'Change Password'}
                          </span>
                        </div>
                        {(!currentUser?.has_password || currentUser?.auth_provider === 'google') && (
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold border shrink-0 ${
                            isDarkTheme
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            Dual Login
                          </span>
                        )}
                      </button>
                    </div>
```

### Plain-English Purpose
Renders profile action items:
1. **Staff & RBAC Directory**: Visible only to Super Admins, linking directly to the staff management table.
2. **My Requests & Room**: Quick link for students to review their lodging and open tickets.
3. **Password Management Option**: Intelligently labels the action. If a user signed in via Google OAuth and lacks a local password, it says *"Set Account Password"* with a green *"Dual Login"* badge, allowing them to create a password for offline lab login. If they already have a password, it displays *"Change Password"*.

---

```javascript
                    <div className={`border-t pt-1 ${isDarkTheme ? 'border-zinc-800' : 'border-slate-100'}`}>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className={`w-full px-3.5 py-2 text-left text-rose-400 hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer ${
                          isDarkTheme ? 'hover:text-rose-300' : 'text-rose-600 hover:bg-rose-50'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
```

### Plain-English Purpose
Renders the "Sign Out" button at the bottom of the profile dropdown with distinct red hover styling. If no user is logged in (`currentUser === null`), the profile menu is replaced with a clean green *"Sign In"* link directing visitors to `/login`.

---

```javascript
          <div className="flex md:hidden items-center space-x-2">
            {/* Mobile Header Theme Toggle Button (One-Click) */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${isDarkTheme ? 'light' : 'dark'} mode`}
              title={`Switch to ${isDarkTheme ? 'light' : 'dark'} mode`}
              className={`p-2 rounded-lg border transition-colors cursor-pointer flex items-center justify-center ${
                isDarkTheme
                  ? 'bg-[#161b22] hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-amber-400'
                  : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs'
              }`}
            >
              {isDarkTheme ? (
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg ${isDarkTheme ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
```

### Plain-English Purpose
Renders mobile header controls (visible only on mobile viewports via `md:hidden`):
1. A mobile theme toggle button so smartphone users can switch dark/light mode without opening a drawer.
2. A hamburger toggle button that dynamically morphs between 3 horizontal bars (closed state) and an "X" mark (open state).

---

```javascript
        {mobileMenuOpen && (
          <div className={`md:hidden py-3 border-t space-y-1 ${
            isDarkTheme ? 'bg-[#161b22] border-zinc-800' : 'bg-white border-slate-200'
          }`}>
            {isStudent && (
              <>
                <NavLink
                  to="/student"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-xs font-medium rounded-lg ${
                    isDarkTheme ? 'text-zinc-200 hover:bg-zinc-800' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  My Issues
                </NavLink>
                <NavLink
                  to="/submit"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-xs font-semibold rounded-lg ${
                    isDarkTheme ? 'text-emerald-400 hover:bg-zinc-800' : 'text-green-700 hover:bg-green-50'
                  }`}
                >
                  Submit Request
                </NavLink>
              </>
            )}

            {isTechnician && (
              <NavLink
                to="/technician"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 text-xs font-medium rounded-lg ${
                  isDarkTheme ? 'text-zinc-200 hover:bg-zinc-800' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Workstation
              </NavLink>
            )}

            {(isAdmin || isSuperAdmin) && (
              <>
                {isSuperAdmin && (
                  <NavLink
                    to="/superadmin"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 text-xs font-medium rounded-lg ${
                      isDarkTheme ? 'text-zinc-200 hover:bg-zinc-800' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Directorate
                  </NavLink>
                )}
                <NavLink
                  to="/operations"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-xs font-medium rounded-lg ${
                    isDarkTheme ? 'text-zinc-200 hover:bg-zinc-800' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Operations
                </NavLink>
                <NavLink
                  to="/squads"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-xs font-medium rounded-lg ${
                    isDarkTheme ? 'text-zinc-200 hover:bg-zinc-800' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Squads
                </NavLink>
                {isSuperAdmin && (
                  <NavLink
                    to="/superadmin/staff"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 text-xs font-medium rounded-lg ${
                      isDarkTheme ? 'text-zinc-200 hover:bg-zinc-800' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Staff &amp; RBAC
                  </NavLink>
                )}
              </>
            )}

            <NavLink
              to="/track"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 text-xs font-medium rounded-lg ${
                isDarkTheme ? 'text-zinc-200 hover:bg-zinc-800' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              Track Status
            </NavLink>
            <NavLink
              to="/map"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 text-xs font-medium rounded-lg ${
                isDarkTheme ? 'text-zinc-200 hover:bg-zinc-800' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              Campus Map
            </NavLink>
          </div>
        )}
      </div>

      <SetPasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </header>
  );
}
```

### Plain-English Purpose
Renders the collapsible mobile drawer. Each link features an `onClick={() => setMobileMenuOpen(false)}` handler so that navigating to a new route automatically dismisses the mobile drawer. Finally, it mounts the `<SetPasswordModal>` component controlled by `passwordModalOpen`.

---

## 3. High-Frequency Viva & Technical Defense Questions

### Q1: How does `Navbar.jsx` protect against showing unauthorized navigation links to unprivileged users?
**Model Answer:**  
`Navbar.jsx` extracts boolean role flags (`isStudent`, `isTechnician`, `isAdmin`, `isSuperAdmin`) directly from the centralized `useAuth()` hook. It uses conditional rendering blocks (e.g. `{isSuperAdmin && <NavLink to="/superadmin">...}`) so that links to privileged administrative interfaces are never mounted in the DOM for regular students. Even if a student manually inspects the DOM or types the URL directly, backend endpoints and frontend route guards (`RoleRouteGuard` in `AppRouter.jsx`) enforce strict security checks.

### Q2: What is the purpose of the backend health check in `Navbar.jsx`?
**Model Answer:**  
On initial mount, `Navbar.jsx` executes an asynchronous `fetch()` to `/health`. If the backend API server is operational and connected to PostgreSQL, it returns `{ "status": "healthy" }`, and the navbar renders a pulsing green *"Live"* badge. If the server is offline or unreachable, it renders a red *"Offline"* badge. This gives students, technicians, and examiners immediate confirmation of backend availability.

### Q3: How does the profile dropdown menu detect when a user clicks outside of it to close automatically?
**Model Answer:**  
It uses a React reference (`useRef`) attached to the dropdown's outer `<div>` container (`dropdownRef`). A `useEffect` hook registers a `mousedown` event listener on the global `document` object. When a click occurs anywhere on the page, the handler evaluates `!dropdownRef.current.contains(e.target)`. If the clicked DOM element is not an internal descendant of the dropdown container, it calls `setProfileMenuOpen(false)`, closing the menu.

### Q4: Why does `Navbar.jsx` offer a "Set Account Password" option for Google OAuth users?
**Model Answer:**  
When students log in using Google Single Sign-On (OAuth 2.0), they authenticate via their institutional Google accounts without creating a local password in the application's PostgreSQL database. However, in campus server rooms or computer laboratories where external internet access might be restricted or Google OAuth is blocked, users need to log in directly via local username and password. The *"Dual Login"* feature allows Google OAuth users to set up a local password so they can authenticate via either method.

### Q5: Why is `backdrop-blur-md` combined with semi-transparent background colors on the `<header>` element?
**Model Answer:**  
`backdrop-blur-md` applies a CSS backdrop filter that blurs underlying elements scrolling behind the navigation bar. Using semi-transparent background colors like `bg-[#0e1117]/95` (Matte Dark) or `bg-white/95` (Crisp Light) creates a modern frosted glass aesthetic. This ensures high visual contrast and legibility for navigation text and icons while keeping the user aware of content scrolling beneath.

---

## 4. Quick Reference Summary Table

| Element / Feature | Type / Identifier | Primary Responsibility | Key Mechanism |
| :--- | :--- | :--- | :--- |
| `backendHealthy` | State (`boolean\|null`) | Displays server health pill | Probes `/health` on mount; renders green Live or red Offline badge |
| `navTabClasses` | Styling function | Renders active/inactive tabs | Dynamic Tailwind underline: `after:h-[2px] after:bg-emerald-500` |
| `⌘K` Quick Search | Action Button | Direct lab and room navigation | Navigates to `/submit?mode=search` |
| Saved Residence Chip | Link / Badge | One-click complaint filing for room | Extracts `shortHostel` & `shortRoom`; links to `/submit` |
| Theme Toggle | Action Button | Flips between Dark and Light modes | Invokes `toggleTheme()` from `ThemeContext` |
| `dropdownRef` | `useRef(null)` | Profile dropdown click-outside | `mousedown` event listener testing `!ref.current.contains(e.target)` |
| `SetPasswordModal` | Modal Component | Manages account passwords | Controlled via `passwordModalOpen`; supports Dual Login setup |
