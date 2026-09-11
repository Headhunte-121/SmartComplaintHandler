# Module M1 Frontend: Application Router & Client-Side Navigation Specification

Authoritative Engineering Blueprint for `src/App.jsx` and `src/routes/AppRouter.jsx`.

---

## Section 1: Standard Purpose & Industry Role

### Standard Industry Role & Real-World Use Cases
In traditional multi-page web applications, navigating to a new URL prompts the browser to discard the entire existing document, issue a fresh HTTP `GET` request to the web server, download new HTML/CSS/JS files, and reconstruct the DOM from scratch. This model introduces latency, destroys in-memory client state, and produces noticeable white flashes between page views.

Client-side routing (the mechanism in single-page applications where JavaScript intercepts URL changes, updates the browser history, and swaps visible components without requesting a new HTML document from the server) solves this inefficiency. In React ecosystems, React Router DOM (the industry-standard routing library for React applications) enables declarative route mapping: binding URL paths (such as `/`, `/track`, `/admin`) directly to specific component trees.

Code splitting (an optimization technique where application code is split into distinct JavaScript bundles loaded on demand rather than all at once) and React Suspense (a React component that displays a fallback UI, like a spinner or skeleton screen, while child components are asynchronously loading) prevent initial page bloat by ensuring that users only download the code for the specific view they are visiting.

### What WE Are Specifically Using It For in Smart Complaint Handler
In `SmartComplaintHandler`, this routing subsystem serves as the central traffic controller for the entire frontend application:
1. `src/routes/AppRouter.jsx` declares the authoritative route registry:
   - Root index route (`/`): Renders `SubmitComplaint.jsx` (Module M2), allowing students to lodge complaints immediately upon landing.
   - Tracking route (`/track`): Renders `TrackTicket.jsx` (Module M2), providing instant status tracking via tracking codes.
   - Administrative route (`/admin`): Renders `AdminDashboard.jsx` (Module M4), providing facility staff with workload management and ticket re-assignment tools.
   - Catch-all fallback route (`*`): Renders `NotFound.jsx`, an informative 404 screen preventing blank screens when invalid URLs are entered.
2. `src/App.jsx` serves as the top-level application root component, encapsulating the router within a global Error Boundary (a React component that catches JavaScript errors anywhere in its child component tree, logs the errors, and renders a fallback UI instead of crashing the entire page) and providing a Suspense fallback spinner for asynchronous route loading.

### Future AI Integration & Roadmap Hooks
In Version 2 (V2), when our platform introduces automated AI-driven multi-tenant portals, this routing layer provides:
1. Dynamic AI Route Pre-Loading: An intelligent pre-fetching hook that monitors user cursor hover over navigation links (`/track` or `/admin`) and initiates lazy-loading of the route bundle and AI model weights before the user even clicks, achieving perceived zero-latency transitions.
2. AI Supervisor Route Guard: A role-based route guard wrapper (`<AIRouteGuard requiredRole="supervisor" />`) that verifies whether the logged-in administrator has authority to review AI automated classification logs before mounting the supervisory control view.
3. Multimodal Intake Route: A dedicated intake route (`/submit/ai-scan`) dedicated to camera-based image capture of physical defects for Gemini Vision analysis.

### How Other Components Standardly Interact with This File
1. `src/main.jsx` imports and renders `<App />` into the browser root element (`document.getElementById('root')`).
2. Navigation links in `Navbar.jsx` (`NavLink to="/track"`) update the browser address bar, prompting `AppRouter.jsx` to immediately swap the active child component inside `Layout.jsx`.
3. Specialized views in M2 (`SubmissionSuccessModal.jsx`) programmatically navigate the user to `/track?code=TICK-XXXX` using React Router's `useNavigate()` hook.

### The Core Problem It Solves & Why It Exists
Without this blueprint:
- Entering `/track` or `/admin` in the browser address bar triggers a 404 error from the static file server because no physical HTML file exists at those folder paths.
- All application JavaScript is bundled into one massive file, causing initial page loads on mobile networks to be sluggish and resource-intensive.
- An unhandled JavaScript exception in one component crashes the entire browser tab, displaying an intimidating white screen to the user.

---

## Section 2: What Must Be in This File & Why Each Item Is Needed

### 1. `src/routes/AppRouter.jsx` (The Route Tree Registry)
* Router Provider / BrowserRouter Wrapper: Uses `createBrowserRouter` and `RouterProvider` (or `<BrowserRouter>`, `<Routes>`, and `<Route>`) from `react-router-dom` v6.
* Layout Parent Route: Declares the top-level route with `path: '/'` and `element: <Layout />`. Because `Layout` contains the `<Outlet />` component, all child routes inherit the persistent navbar and footer automatically.
* Child Route Definitions:
  - Index Route: Configured with `index: true`, rendering `<SubmitComplaint />`. When a student visits the base URL `http://localhost:5173/`, the complaint form is displayed by default.
  - Tracker Route: Configured with `path: 'track'`, rendering `<TrackTicket />`.
  - Admin Route: Configured with `path: 'admin'`, rendering `<AdminDashboard />`.
  - Catch-All 404 Route: Configured with `path: '*'`, rendering `<NotFound />`.
* Lazy-Loaded Route Imports: Page components are imported via `React.lazy()`:
  - `const SubmitComplaint = React.lazy(() => import('../pages/SubmitComplaint'));`
  - `const TrackTicket = React.lazy(() => import('../pages/TrackTicket'));`
  - `const AdminDashboard = React.lazy(() => import('../pages/AdminDashboard'));`
  This enables bundle splitting so code is loaded only when the user visits that specific page.
* Standalone `NotFound.jsx` Component: A clean presentation component rendering an SVG 404 illustration, an explanation notice ("The page you are looking for does not exist or has been moved"), and a prominent button ("Return to Complaint Portal") that navigates back to `/`.

### 2. `src/App.jsx` (The Root Application Component)
* Global React Suspense Boundary: Wraps `<RouterProvider router={router} />` inside `<React.Suspense fallback={<RouteLoadingSpinner />}>`.
* Loading Fallback Presentation (`RouteLoadingSpinner`): A centered visual loading state rendering an animated SVG spinner with class `animate-spin text-indigo-600` and a message `Loading application...`, preventing content layout jumps during asynchronous chunk downloading.
* Global Error Boundary Implementation: Encapsulates the entire application tree inside a class component or functional wrapper that implements `componentDidCatch` or `getDerivedStateFromError`. If an unexpected runtime error occurs, it displays a friendly error card ("Something went wrong while loading this page") with a "Reload Application" button, preventing complete browser crashes.

---

## Section 3: Component Life-Cycle: Input, Process, Output (IPO Table)

| Life-Cycle Phase | Primary Input | Internal Transformation & Logic | Final Output |
| :--- | :--- | :--- | :--- |
| **1. Application Boot** | Browser accesses `http://localhost:5173/` | `main.jsx` mounts `<App />`; `AppRouter` evaluates root URL `/`; matches parent `Layout` and child index route `SubmitComplaint`. | App Shell mounts with persistent navbar; `SubmitComplaint` form mounts in viewport. |
| **2. Dynamic Code Chunk Loading** | User clicks "Staff Admin Desk" (`/admin`) | React Router triggers `React.lazy()` import for `AdminDashboard.jsx`; Suspense displays `RouteLoadingSpinner` while the browser fetches `AdminDashboard.js` chunk over HTTP. | Loading spinner displays smoothly for <100ms, then renders `AdminDashboard` without page reload. |
| **3. Programmatic Redirect** | Form submits ticket; receives code `TICK-8F2D` | Success modal button triggers `navigate('/track?code=TICK-8F2D')`; Router parses path and search params; mounts `TrackTicket`. | Instant transition to tracker view with tracking code pre-populated from query parameter. |
| **4. Invalid URL Access** | User types `http://localhost:5173/unknown-path` | Router evaluates route tree; matches wildcard `path: '*'`; mounts `NotFound.jsx`. | Clean 404 error page displayed with button to navigate back to `/`. |

---

## Section 4: Flexibility & Modification Guide

### 🟢 Safe to Modify & Customize
* **Loading Spinner Visuals**: You can replace the default SVG spinner in `RouteLoadingSpinner` with a skeleton loader or branded campus animation.
* **Additional Child Routes**: You can safely add new child routes inside `AppRouter.jsx` (such as `path: 'faq'` or `path: 'analytics'`) by creating the page component and registering it as a child under the parent `Layout` route.
* **404 Page Messaging**: You can customize the explanatory text, contact links, and button colors in `NotFound.jsx` to suit institutional guidelines.

### 🔴 Strict Non-Negotiables (Do NOT Alter)
* **Parent-Child Hierarchy in Route Tree**: The index route, `track`, and `admin` routes must remain child routes of `Layout`. Defining them as siblings outside of `Layout` will cause them to render without the navigation bar and footer.
* **Wildcard Route Position**: The catch-all route (`path: '*'`) must be the final entry in the route declarations. Placing it first will cause it to match all incoming URLs, preventing any valid pages from rendering.
* **React Suspense Wrapper**: When using `React.lazy()`, you must wrap the routes inside a `<React.Suspense>` component. Omitting Suspense will throw a fatal React error (`A component suspended while rendering, but no fallback was provided`) whenever a lazy-loaded route chunk is fetched.

---

## Section 5: Advanced Concepts Explained

### 1. The HTML5 History API & Client-Side Navigation
In early web architectures, changing the browser URL without requesting a new HTML file was impossible. Modern client-side routers achieve this using the HTML5 History API:
- `window.history.pushState(state, title, url)`: Pushes a new entry into the browser's session history stack, updating the address bar without triggering a network request or document reload.
- `window.addEventListener('popstate', callback)`: Listens for user interactions with browser Back and Forward navigation buttons.

React Router abstracts these low-level browser APIs into declarative components:
1. When a student clicks `<NavLink to="/track">`, React Router intercepts the browser click event via `event.preventDefault()`.
2. It executes `pushState()` to update the browser URL to `/track`.
3. It broadcasts an internal state change through React Context.
4. The router tree re-evaluates the active path and mounts `<TrackTicket />` into the persistent `<Outlet />`, achieving instant client-side rendering.

### 2. Code Splitting & Dynamic Imports with `React.lazy()`
In a typical build pipeline, all application code is compiled into a single JavaScript bundle (`index.js`). As the application grows to include heavy administrative tables, charting libraries, and modal forms, the bundle size expands to several megabytes, slowing down initial page loads for mobile users filing quick complaints.

Dynamic importing solves this through on-demand loading:
- `React.lazy()` accepts a callback function that calls the dynamic import syntax: `() => import('./pages/AdminDashboard')`.
- During compilation, Vite and Rollup detect dynamic imports and automatically isolate the targeted component and its private dependencies into a distinct bundle chunk (e.g. `AdminDashboard-Bf2a9.js`).
- When a user lands on the student home page (`/`), their browser downloads only the core application shell and the `SubmitComplaint` chunk.
- The administrative dashboard chunk is never downloaded over the network unless a user actually navigates to `/admin`, saving mobile bandwidth and dramatically accelerating initial load times.

### 3. Error Boundaries and Graceful Component Isolation
In React, an unhandled runtime error inside a component's render function or lifecycle hook unmounts the entire component tree by default, leaving the user with an empty white screen and console errors.

An Error Boundary is a specialized component that implements either `static getDerivedStateFromError()` (which updates state so the next render shows the fallback UI) or `componentDidCatch()` (which logs error details to monitoring services).

By wrapping the router tree in a root Error Boundary:
- If an unexpected API response crashes a table inside the Admin Desk, the Error Boundary catches the exception.
- The user is presented with an informative, styled error notification card with a "Refresh" button rather than a dead browser window.
- The top-level application shell and navigation bar remain intact, allowing the user to navigate back to safety.

---

## Section 6: Definition of Done & Verification Protocol

### Observable Verification Checklist
* [ ] `src/routes/AppRouter.jsx` exists and configures `Layout` as parent route with child routes for `/`, `/track`, `/admin`, and `*`.
* [ ] `src/App.jsx` exists, wrapping the router in a global Error Boundary and React Suspense loading fallback.
* [ ] Visiting `http://localhost:5173/` renders the persistent layout and `SubmitComplaint` form.
* [ ] Visiting `http://localhost:5173/track` renders the ticket tracking view.
* [ ] Visiting `http://localhost:5173/admin` renders the admin dashboard view.
* [ ] Visiting an invalid route like `http://localhost:5173/non-existent-page` renders the styled 404 Not Found component with a working return button.
* [ ] Page components are lazy-loaded via `React.lazy()`, verifying that code chunks load asynchronously without throwing Suspense errors.

### Verification Commands & Troubleshooting Matrix

1. **Verify Route Loading & Code Splitting in Browser:**
   Run Vite dev server: `npm run dev`
   Open browser Developer Tools (F12) and switch to the Network tab. Filter by `JS`.
   Load `http://localhost:5173/`. Observe that only base chunks load.
   Click "Staff Admin Desk". Observe a new network request fetching `AdminDashboard.jsx` chunk on demand, followed by instant screen rendering.

2. **Verify 404 Fallback Route:**
   Navigate browser manually to `http://localhost:5173/some/broken/link`.
   Verify the 404 Not Found screen renders with message "The page you are looking for does not exist" and clicking "Return to Complaint Portal" navigates smoothly back to `/`.

3. **Troubleshooting Matrix:**
   * *Problem:* Browser throws error `A component suspended while rendering, but no fallback was provided`.
     * *Cause:* A component imported with `React.lazy()` is rendered outside of a `<React.Suspense fallback={...}>` wrapper.
     * *Fix:* Verify that `<Suspense fallback={<RouteLoadingSpinner />}>` wraps the `<RouterProvider />` or `<Routes>` container in `src/App.jsx`.
   * *Problem:* Navigating to `/track` or `/admin` directly via browser address bar results in 404 from Vite in production preview.
     * *Cause:* The static web server does not have Single Page Application fallback routing enabled (all unmatched paths must serve `index.html`).
     * *Fix:* In development, Vite handles this automatically. For production preview (`npm run preview`), ensure Vite's preview server is used.
   * *Problem:* Clicking the 404 return button does nothing or reloads the broken page.
     * *Cause:* Button lacks a click handler or uses an incorrect `useNavigate('/')` invocation.
     * *Fix:* Verify the button uses `<Link to="/">Return to Complaint Portal</Link>` or `onClick={() => navigate('/')}`.
