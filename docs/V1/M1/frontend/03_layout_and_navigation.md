# Module M1 Frontend: Application Shell, Layout & Persistent Navigation Specification

Authoritative Engineering Blueprint for `src/components/Layout.jsx`, `src/components/Navbar.jsx`, and `src/components/Footer.jsx`.

---

## Section 1: Standard Purpose & Industry Role

### Standard Industry Role & Real-World Use Cases
In modern Single Page Applications (SPAs, web applications that load a single HTML page and dynamically update content as the user interacts with the app, without reloading the entire page from the server), visual persistence is paramount. Users expect the top navigation bar, branding elements, authentication status indicators, and footer legal notices to remain mounted and stable while inner page views transition seamlessly.

A persistent layout shell (a parent component that wraps around child view components, rendering shared headers, navigation bars, sidebars, and footers while providing a designated viewport container for child routes) establishes structural continuity. React Router (the standard declarative routing library for React applications) utilizes an `<Outlet />` component (a placeholder component provided by React Router that dynamically renders the matching child route element based on the current browser URL) to project dynamic page content directly into the persistent layout.

A global navigation bar (`Navbar`) manages client-side navigation links, active route highlights, responsive mobile drawer menus, and system status indicators. A footer component provides institutional metadata, version tracking badges, and regulatory disclaimers.

### What WE Are Specifically Using It For in Smart Complaint Handler
In `SmartComplaintHandler`, this component suite forms the global visual frame for the entire college platform:
1. `src/components/Layout.jsx` establishes the full-viewport vertical layout (`min-h-screen flex flex-col bg-slate-50`), placing the navigation bar at the top, a constrained responsive content area in the center (`flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8`), and the institutional footer at the bottom.
2. `src/components/Navbar.jsx` renders our college campus branding, the primary navigation links:
   - "Submit Complaint" (`/`)
   - "Track Complaint" (`/track`)
   - "Staff Admin Desk" (`/admin`)
   It uses React Router's `NavLink` component to automatically apply high-contrast active state styling (`text-indigo-600 border-b-2 border-indigo-600 font-semibold`) to whichever page is currently loaded in the browser.
3. It integrates an automated system heartbeat indicator in the navbar—a small visual status pill that pings our FastAPI `/api/v1/health` endpoint on load, rendering a pulsing green dot (`bg-emerald-500`) when the backend is active, and an amber dot (`bg-amber-500`) with a tooltip warning if the local backend server is offline.
4. `src/components/Footer.jsx` renders the campus facilities management disclaimer, emergency maintenance contact numbers, and the build version badge (`v1.0.0-core`).

### Future AI Integration & Roadmap Hooks
In Version 2 (V2), when our platform introduces automated AI-driven grievance classification and intelligent triage assistance, this shell provides:
1. Global AI Activity Indicator: An AI status badge in the navbar (`Gemini AI Ready` / `Gemini AI Busy`) that illuminates with a subtle violet pulse whenever background natural language processing or contextual keyword extraction is executing.
2. Global System Notification Toast Container: An absolute-positioned portal container in `Layout.jsx` to render system-wide notifications (e.g. "AI detected a potential critical electrical hazard in your hostel—priority elevated automatically").
3. Admin Quick-Switch Drawer: An expandable administrative control drawer allowing supervisors to toggle between standard deterministic routing and real-time AI triage mode without leaving the active screen.

### How Other Components Standardly Interact with This File
1. `src/routes/AppRouter.jsx` mounts `Layout.jsx` as the parent root route element (`path="/" element={<Layout />}`). All page-level views (`SubmitComplaint.jsx`, `TrackTicket.jsx`, `AdminDashboard.jsx`) are defined as child routes nested inside this layout, rendering automatically wherever `<Outlet />` is placed.
2. The navbar links trigger instantaneous client-side navigation without causing browser reloads or destroying in-memory application state.

### The Core Problem It Solves & Why It Exists
Without this blueprint:
- Developers recreate the navigation bar and footer manually on every single page, resulting in flickering headers, duplicated styling code, and broken layout alignment across screens.
- When students navigate between pages, the entire browser window reloads, wiping out search inputs and causing noticeable screen flashing.
- Users have no way of knowing whether the backend server is running, leading to confusion when form submissions fail silently.

---

## Section 2: What Must Be in This File & Why Each Item Is Needed

### 1. `src/components/Layout.jsx` (The Persistent Application Shell)
* Full-Height Flexbox Container: A top-level container element with utility classes `min-h-screen flex flex-col bg-slate-50 text-slate-900`. This guarantees that even on large widescreen monitors with minimal page content, the footer is anchored firmly at the bottom of the viewport rather than floating in the middle of the screen.
* Navbar Placement: Embeds `<Navbar />` at the top of the container outside the dynamic outlet, ensuring it never re-renders or unmounts during page transitions.
* Central Content Outlet: A `<main>` HTML5 semantic wrapper configured with `flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8`. Encapsulates `<Outlet />` from `react-router-dom` to project active child views with consistent horizontal padding and responsive constraints across mobile, tablet, and desktop viewports.
* Footer Placement: Embeds `<Footer />` at the bottom of the flex column.

### 2. `src/components/Navbar.jsx` (The Primary Navigation Header)
* Campus Brand Identity: An institutional brand container on the left containing an SVG campus building/shield icon and the text "SmartComplaintHandler" with a subtle subtitle "Campus Facilities Automation". Clicking the brand logo navigates the user back to the home page (`/`).
* Desktop Navigation Menu: A horizontal flex row of navigation links visible on screens medium and larger (`hidden md:flex space-x-8`). Uses `NavLink` from `react-router-dom`:
  - `to="/"`: "Submit Complaint"
  - `to="/track"`: "Track Complaint"
  - `to="/admin"`: "Staff Admin Desk"
* Dynamic Active State Styling Function: `NavLink` takes a function as its `className` prop: `({ isActive }) => ...`. If `isActive` is true, it renders active indigo styling (`text-indigo-600 border-b-2 border-indigo-600 font-semibold px-3 py-2 text-sm`); otherwise, it renders muted styling (`text-slate-600 hover:text-slate-900 hover:border-b-2 hover:border-slate-300 px-3 py-2 text-sm font-medium transition-colors`).
* Backend System Health Indicator: A subtle pill badge rendering a live operational status:
  - Online state: Small 8px circular dot with class `bg-emerald-500 animate-pulse` accompanied by text `System Online`.
  - Offline/connecting state: Amber dot `bg-amber-500` with text `Connecting...`.
  - Pings `apiClient.get('/health')` or verifies root endpoint connectivity once on initial mount via a React `useEffect` hook.
* Mobile Hamburger Menu Button: A button visible only on mobile screens (`md:hidden`) with an accessible `aria-label="Open main menu"`. Toggles an in-memory boolean state (`isMobileMenuOpen`) using React's `useState`.
* Collapsible Mobile Drawer: A conditional dropdown container rendered below the header when `isMobileMenuOpen` is true. Contains vertical stack of navigation links with generous touch targets (minimum 44px height) for mobile phone screens. Closes automatically when any link is clicked.

### 3. `src/components/Footer.jsx` (The Global Institutional Footer)
* Semantic Footer Tag: Rendered as `<footer className="bg-white border-t border-slate-200 mt-auto">`.
* Institutional Attribution: Displays the college/university name, department of campus facilities, and copyright year.
* Platform Version & Environment Badge: Renders a subtle monospace badge `v1.0.0-core` with class `text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-mono`.
* Emergency Facilities Contact: Displays a prominent warning notice: "For immediate life-safety emergencies (severe fire, gas leaks, electrical sparking), do not submit a web ticket—contact Campus Security directly at 555-0199."

---

## Section 3: Component Life-Cycle: Input, Process, Output (IPO Table)

| Life-Cycle Phase | Primary Input | Internal Transformation & Logic | Final Output |
| :--- | :--- | :--- | :--- |
| **1. Initial Mounting** | Browser URL navigation to `/` | React Router loads `Layout.jsx`; renders `Navbar` and `Footer`; evaluates current route; mounts `SubmitComplaint.jsx` into `<Outlet />`. | Complete application shell rendered on screen in one seamless paint. |
| **2. Health Check Ping** | `Navbar.jsx` mounts | Executes asynchronous `useEffect`; calls `apiClient.get('/health')`; catches errors if server is down; updates `backendStatus` state from `'connecting'` to `'online'` or `'offline'`. | Status pill in header switches from amber to pulsing green dot (`System Online`). |
| **3. Client Route Switch** | Student clicks "Track Complaint" | `NavLink` updates browser history via `history.pushState`; React Router unmounts previous view and mounts `TrackTicket.jsx` into `<Outlet />`. `Navbar` and `Footer` remain completely mounted without re-rendering. | Instantaneous page transition (<16ms) with zero screen flickering; "Track Complaint" link highlights with indigo active border. |
| **4. Mobile Menu Toggle** | Student on mobile taps hamburger icon | Click handler toggles `isMobileMenuOpen` boolean from `false` to `true`. | Mobile navigation drawer slides open with accessible touch links. |

---

## Section 4: Flexibility & Modification Guide

### 🟢 Safe to Modify & Customize
* **Branding Text & Logos**: You may change the institution title from "SmartComplaintHandler" to your specific university name (e.g. "Apex University Facilities Portal") in `Navbar.jsx` and `Footer.jsx`.
* **Emergency Hotline Numbers**: You can modify the phone numbers and contact email addresses displayed in `Footer.jsx` to reflect real campus security contact info.
* **Navigation Links Order**: You may re-order the navigation items in the desktop menu or add external campus links (such as a link to the university campus map) by adding an additional anchor tag in `Navbar.jsx`.
* **Layout Container Width**: You may change `max-w-7xl` in `Layout.jsx` to `max-w-6xl` or `max-w-full px-6` if a wider layout is preferred for specific widescreen monitors.

### 🔴 Strict Non-Negotiables (Do NOT Alter)
* **`<Outlet />` Inside `Layout.jsx`**: Do NOT remove or replace the `<Outlet />` component in `src/components/Layout.jsx`. Removing `<Outlet />` prevents React Router from rendering any page views, resulting in an empty white screen beneath the navbar.
* **`NavLink` vs Regular `<a href="...">` Tags**: Do NOT replace `NavLink` or `Link` components with traditional HTML `<a>` anchor tags for internal application navigation. Regular anchor tags force a full browser page refresh, terminating WebSocket connections, destroying in-memory React state, and causing noticeable screen lag.
* **`min-h-screen flex flex-col` on Root**: Do NOT remove the vertical flexbox styling from `Layout.jsx`. Without `min-h-screen flex flex-col` and `mt-auto` on the footer, the footer will snap immediately beneath short forms, floating awkwardly in the middle of desktop displays.

---

## Section 5: Advanced Concepts Explained

### 1. Component Composition & The React Router Outlet Pattern
In enterprise software architecture, component composition (the architectural pattern of combining simple, specialized components together to build complex user interfaces) prevents bloated "god components."

React Router implements component composition via the `<Outlet />` pattern:
1. The route tree in `AppRouter.jsx` configures `Layout` as a parent route wrapping child routes.
2. The React virtual DOM establishes an inheritance hierarchy where `Layout` is the persistent parent node.
3. When the browser URL changes (for example, from `/` to `/track`), React Router performs reconciliation (the algorithm React uses to diff one tree of elements with another to determine which parts need to be updated).
4. Because the parent `Layout` component did not change, React preserves its DOM elements completely, maintaining the mounted state of the `Navbar` (including the active health check state and mobile menu toggles). React dismounts only the inner component located at `<Outlet />` and mounts the incoming component. This achieves 60 FPS page transitions.

### 2. Declarative Route Active-State Highlighting
In traditional web engineering, highlighting the active navigation link required writing imperative JavaScript to inspect `window.location.pathname`, comparing strings, and manually toggling CSS classes via `classList.add()`.

React Router's `NavLink` provides a declarative state-driven mechanism:
- `NavLink` subscribes directly to the internal Router context.
- During every render cycle, `NavLink` compares its `to` destination with the current location pathname.
- It exposes this match state as a boolean property `isActive` passed into a callback function assigned to the `className` prop:
  `className={({ isActive }) => isActive ? activeClasses : inactiveClasses}`
This eliminates imperative DOM manipulation bugs and guarantees that the active indicator remains in perfect sync even when navigating via browser Forward/Back buttons.

### 3. Asynchronous Health Heartbeat Polling Architecture
To prevent student frustration when the backend is offline, the navbar incorporates an asynchronous health check:
- It initiates an HTTP `GET /health` request once when the navbar mounts via `useEffect()`.
- It maintains three distinct states in React state: `'connecting'` (initial indeterminate state), `'online'` (backend returned HTTP 200), and `'offline'` (network error or timeout).
- By decoupling the health check from page-level data fetching, the UI remains fully responsive. If the backend is offline, the user is immediately alerted by the amber status dot and can restart the backend before attempting to fill out a lengthy complaint form.

---

## Section 6: Definition of Done & Verification Protocol

### Observable Verification Checklist
* [ ] `src/components/Layout.jsx` exists, rendering `Navbar`, `<Outlet />` inside `<main>`, and `Footer`.
* [ ] `src/components/Navbar.jsx` exists with campus branding, desktop navigation links, responsive mobile hamburger menu, and health status dot.
* [ ] `src/components/Footer.jsx` exists with campus attribution, version badge `v1.0.0-core`, and emergency hotline notice.
* [ ] Navigating between `/`, `/track`, and `/admin` transitions page views instantaneously without full page reloads.
* [ ] Active navigation link correctly renders with indigo color and bottom border.
* [ ] On mobile viewports (< 768px), desktop links hide and clicking the hamburger icon smoothly reveals the mobile navigation drawer.
* [ ] When FastAPI backend is running, the health indicator displays a pulsing green dot (`System Online`).

### Verification Commands & Troubleshooting Matrix

1. **Verify Layout Rendering & Route Transitions:**
   Start Vite dev server: `npm run dev`
   Open browser to `http://localhost:5173/`. Verify the navbar and footer appear. Click "Track Complaint". Verify URL changes to `http://localhost:5173/track` with zero browser reload indicator and active styling switches to the clicked link.

2. **Verify Mobile Drawer Responsiveness:**
   In browser Developer Tools (F12), toggle Device Toolbar (Ctrl+Shift+M) to simulate mobile viewport (e.g. iPhone 12, 390px width).
   Verify desktop links disappear and hamburger button appears. Tap hamburger button; verify mobile dropdown opens. Tap "Submit Complaint"; verify drawer closes and navigates.

3. **Verify System Health Indicator:**
   With FastAPI backend running on port 8000, verify navbar renders a green dot with `System Online`.
   Stop the FastAPI process in terminal; refresh frontend; verify navbar renders an amber dot indicating connecting/offline state.

4. **Troubleshooting Matrix:**
   * *Problem:* Content beneath the navbar is completely blank when opening any page.
     * *Cause:* `<Outlet />` from `react-router-dom` was omitted from `src/components/Layout.jsx`.
     * *Fix:* Ensure `import { Outlet } from 'react-router-dom'` is present and `<Outlet />` is rendered inside the `<main>` element of `Layout.jsx`.
   * *Problem:* Clicking navigation links causes a full browser page refresh.
     * *Cause:* Regular `<a href="...">` tags were used instead of `NavLink` or `Link` from `react-router-dom`.
     * *Fix:* Replace all internal `<a>` tags with `<NavLink to="...">`.
   * *Problem:* Footer overlaps or obscures form inputs on mobile screens.
     * *Cause:* Missing `flex-1` on `<main>` or absolute positioning was improperly applied to the footer.
     * *Fix:* Verify `Layout.jsx` has `min-h-screen flex flex-col` on the outer div and `flex-1` on the `<main>` tag, and remove any `absolute` positioning from `Footer.jsx`.
