# Module M1 Frontend: 5-Checkpoint Integration Verification & Quality Protocol

Authoritative Engineering Protocol for Frontend Infrastructure Verification, Diagnostic Testing & Quality Assurance.

---

## Section 1: Standard Purpose & Industry Role

### Standard Industry Role & Real-World Use Cases
In modern frontend engineering, foundational infrastructure (build tooling, global styling systems, base network clients, application shells, and routing architectures) must be rigorously validated before feature modules can be safely constructed on top of it. If an application's foundation contains latent defects—such as misconfigured CSS compilers, leaking network interceptors, or broken client-side routing trees—every subsequent screen built by the engineering team inherits those bugs, leading to widespread regressions and high refactoring costs.

A formal frontend verification protocol (a standardized, step-by-step suite of automated commands, browser console checks, and visual inspection criteria used to confirm that foundational web infrastructure meets quality standards) guarantees that:
1. The development and production build toolchains compile without syntax errors or missing dependencies.
2. Network transport layers correctly unwrap payloads and gracefully recover from backend connection outages.
3. Persistent layouts render cleanly across varying viewport dimensions (mobile, tablet, desktop).
4. Client-side navigation transitions between routes without tearing down DOM state or triggering unwanted page refreshes.

### What WE Are Specifically Using It For in Smart Complaint Handler
In `SmartComplaintHandler`, this verification protocol serves as the quality gate for our 5-student engineering team before advancing to feature modules:
1. It validates that the Vite development server starts in under 1 second and the production build compiles cleanly into `dist/`.
2. It verifies that Tailwind CSS is properly scanning JSX templates and compiling utility classes without leaking unstyled HTML.
3. It validates that the base Axios client (`src/api/client.js`) catches network disconnects and normalizes Pydantic 422 validation errors into clean user-facing error objects.
4. It confirms that the persistent layout shell (`Layout.jsx`, `Navbar.jsx`, `Footer.jsx`) anchors the footer to the bottom of the viewport, renders active route indicators, and toggles the mobile hamburger drawer smoothly.
5. It proves that the client-side router (`AppRouter.jsx`) navigates between `/`, `/track`, `/admin`, and the 404 wildcard fallback without page reloads.

### Future AI Integration & Roadmap Hooks
In Version 2 (V2), when our platform introduces automated AI-driven grievance classification and intelligent triage assistance, this verification protocol provides:
1. AI Telemetry Latency Benchmark: Checkpoint testing validating that client-side request interceptors capture round-trip timing for AI inference endpoints without degrading UI frame rates.
2. AI Skeleton Shimmer Verification: Automated visual regression checks verifying that asynchronous AI placeholder animations mount smoothly without triggering cumulative layout shifts (CLS, a Core Web Vital metric measuring visual stability).
3. Graceful AI Circuit Breaker Testing: Synthetic failure tests verifying that if the external Gemini AI service is unreachable, the frontend network layer falls back to local rule-based routing with zero UI crashes.

### How Other Components Standardly Interact with This File
1. Every frontend developer executes this 5-checkpoint protocol locally after pulling changes or completing configuration updates.
2. Continuous Integration (CI) pipelines execute Checkpoint 1 (`npm run build`) to ensure that pull requests do not introduce bundling failures or broken imports.

### The Core Problem It Solves & Why It Exists
Without this verification protocol:
- Developers build complex forms on top of a broken API client, only to discover later that error messages are swallowed or payloads are malformed.
- Styling bugs (such as un-purged CSS or missing Autoprefixer directives) are only discovered when users report that the website looks broken on Safari or mobile devices.
- Team members lose hours debugging routing issues caused by simple syntax mistakes in route path declarations.

---

## Section 2: What Must Be in This File & Why Each Item Is Needed

### Checkpoint 1: Vite Build & Asset Pipeline Verification
* Objective: Confirm that Vite, Rollup, Tailwind CSS, and PostCSS compile cleanly in both development and production modes.
* Verification Criteria:
  - Vite dev server starts on port `5173` without port conflict warnings.
  - Tailwind JIT compiler processes `src/index.css` and generates utility styles on demand.
  - Production build command (`npm run build`) generates a minified `dist/` bundle with CSS size under 25 KB gzipped.

### Checkpoint 2: Base API Client & Error Interceptor Verification
* Objective: Confirm that `src/api/client.js` correctly prepends the base URL, sets a 10-second timeout, unwraps response data, and normalizes errors.
* Verification Criteria:
  - Outbound requests automatically include `Content-Type: application/json` and `Accept: application/json`.
  - Calling `apiClient.get()` returns the inner JSON payload directly, without requiring `.data` unwrapping in caller code.
  - When backend is offline, client catches the error and returns `{ message: 'Backend service unreachable...', status: 0 }`.
  - When backend returns `HTTP 422`, client parses the Pydantic `detail` array into a formatted validation string.

### Checkpoint 3: Application Shell & Persistent Layout Rendering
* Objective: Confirm that `Layout.jsx`, `Navbar.jsx`, and `Footer.jsx` establish a stable viewport container with active state indicators.
* Verification Criteria:
  - Navbar remains anchored at the top; footer remains anchored at the bottom of the viewport (`min-h-screen flex flex-col`).
  - Active navigation link reflects current URL with indigo text and bottom border highlight.
  - Backend health indicator renders a pulsing green dot (`System Online`) when backend is running.
  - Footer renders campus disclaimer, version badge `v1.0.0-core`, and emergency maintenance contact notice.

### Checkpoint 4: Declarative Client-Side Routing & 404 Guard
* Objective: Confirm that `AppRouter.jsx` manages route transitions and 404 fallbacks without full browser page reloads.
* Verification Criteria:
  - Accessing `/` displays the complaint submission page within the layout shell.
  - Accessing `/track` displays the ticket tracking workstation.
  - Accessing `/admin` displays the staff administrative dashboard.
  - Accessing an invalid URL (`/invalid-path`) renders the styled 404 Not Found component.
  - Clicking "Return to Complaint Portal" navigates back to `/` smoothly.
  - Lazy-loaded components load smoothly within the React Suspense boundary.

### Checkpoint 5: Viewport Responsiveness & Mobile Navigation Drawer
* Objective: Confirm that the user interface scales gracefully across mobile, tablet, and desktop viewports.
* Verification Criteria:
  - On desktop screens (>= 768px), horizontal navigation links are visible and mobile hamburger button is hidden.
  - On mobile viewports (< 768px), horizontal links are hidden and mobile hamburger button is visible.
  - Tapping the hamburger button opens the vertical navigation drawer with touch targets of at least 44px height.
  - Tapping any link inside the mobile drawer navigates to the target page and closes the drawer automatically.

---

## Section 3: Component Life-Cycle: Input, Process, Output (IPO Table)

| Verification Phase | Input Action | Execution & Evaluation Procedure | Expected Pass Result |
| :--- | :--- | :--- | :--- |
| **1. Toolchain Check** | Terminal command `npm run build` | Vite and Rollup compile source files, apply PostCSS plugins, and bundle assets into `dist/`. | Exit code 0; `dist/index.html`, `dist/assets/*.js`, and `dist/assets/*.css` (<25 KB) generated. |
| **2. Client Test** | Console command `apiClient.get('/health')` | Axios executes request through interceptor pipeline; tests data unwrapping and error interception. | Returns `{ status: 'healthy' }` directly without `.data` property; catches network failure gracefully. |
| **3. Layout Test** | Browser navigation to `http://localhost:5173/` | Browser parses DOM tree; verifies flexbox column structure and sticky/static elements. | Navbar at top, main container centered (`max-w-7xl`), footer anchored at bottom with zero vertical overflow. |
| **4. Routing Test** | User clicks "Track Complaint" | React Router triggers client-side navigation; updates address bar to `/track`; mounts component into `<Outlet />`. | Immediate component swap (<16ms); no page reload indicator; URL displays `/track`; active styling updates. |
| **5. Mobile Test** | Viewport resized to 375px width | Media queries evaluate; Tailwind `md:hidden` and `hidden md:flex` rules activate. | Desktop menu hides; hamburger button renders; tapping opens drawer with touch-friendly navigation links. |

---

## Section 4: Flexibility & Modification Guide

### 🟢 Safe to Modify & Customize
* **Local Test Port**: If testing on a different port than `5173`, update verification URLs accordingly in local test commands.
* **Additional Verification Scenarios**: You can add custom assertions for specific institutional branding assets, favicon presence, or third-party monitoring tags.
* **Viewport Test Dimensions**: You may test additional viewport widths (e.g. tablet 768px, ultra-wide 1440px) beyond the standard mobile 375px and desktop 1280px.

### 🔴 Strict Non-Negotiables (Do NOT Alter)
* **5-Checkpoint Sequence**: Do NOT skip checkpoints. Verifying routing before confirming that the build toolchain compiles produces invalid test results.
* **Production Build Verification**: Never consider Module M1 frontend complete without running `npm run build`. Dev server mode alone does not catch Rollup bundling errors or syntax incompatibilities.
* **Zero Console Errors Rule**: In the browser Developer Tools console, zero unhandled exceptions, zero 404 asset failures, and zero React key warnings must be present during clean navigation across all routes.

---

## Section 5: Architectural & Theoretical References

This specification operates strictly as an **implementation and integration blueprint**. For the exhaustive computer science fundamentals, language runtime mechanics, and protocol specifications governing this component, consult the following authoritative manuals in the **Developer Guide Suite**:

* [**Guide 10: Vite Build Engine & Module Bundling**](../../../developer_guide/10_VITE_AND_MODERN_BUILD_TOOLCHAINS.md)  
  Production bundle compilation, asset minification, and static export validation.

* [**Guide 07: React 18 Architecture & Virtual DOM**](../../../developer_guide/07_REACT_18_AND_VIRTUAL_DOM_ARCHITECTURE.md)  
  Component mount validation and teardown memory leak prevention.

* [**Unit 14B: Web Browser Security & Origin Policies**](../../../developer_guide/14B_WEB_BROWSER_SECURITY_AND_ORIGIN_POLICIES.md)  
  Browser DevTools console auditing, network inspect validation, and SOP error diagnostics.

---

## Section 6: Complete Verification Commands & Troubleshooting Matrix

### Verification Execution Commands

1. **Execute Development Server Cold-Start Check:**
   Run in frontend root directory:
   `npm run dev`
   Confirm terminal outputs: `VITE v5.x.x ready in xxx ms` and server is bound to `http://localhost:5173/`.

2. **Execute Production Bundle Compilation Check:**
   Run in frontend root directory:
   `npm run build`
   Confirm exit code is 0 and output directory `dist/` contains:
   - `dist/index.html`
   - `dist/assets/index-xxxx.js`
   - `dist/assets/index-xxxx.css` (verify file size is under 25 KB)

3. **Execute Client-Side API Base Test (in Browser Console):**
   Open `http://localhost:5173/` in Google Chrome or Firefox. Open Developer Tools (F12) -> Console.
   Paste the following command:
   `fetch('/api/v1/health').then(r => r.json()).then(d => console.log('API Proxy OK:', d)).catch(e => console.error('Proxy Error:', e));`
   Confirm console outputs: `API Proxy OK: { status: 'healthy' }` (assuming backend is running).

4. **Execute Synthetic Backend Outage Test:**
   Stop the FastAPI backend terminal. Refresh `http://localhost:5173/`.
   Observe the navbar health indicator: verify the status dot changes to amber with tooltip indicating the server is offline.
   Restart FastAPI: verify the indicator returns to green (`System Online`).

5. **Execute Client-Side Route Sweep:**
   Navigate sequentially in the browser:
   - Click "Submit Complaint" -> confirm URL is `http://localhost:5173/`
   - Click "Track Complaint" -> confirm URL is `http://localhost:5173/track`
   - Click "Staff Admin Desk" -> confirm URL is `http://localhost:5173/admin`
   - Type `http://localhost:5173/does-not-exist` -> confirm 404 page renders with "Return to Complaint Portal" button.

### Complete Troubleshooting Matrix

| Symptom / Error | Root Cause | Exact Resolution Procedure |
| :--- | :--- | :--- |
| `npm run dev` fails with `command not found: vite` | Dependencies were not installed or `node_modules` is corrupted. | Run `npm install` in the frontend directory to install all package dependencies. |
| Page renders with zero styling; all text is unstyled serif font. | `src/index.css` is not imported or Tailwind `content` glob does not match JSX files. | Verify line 1 of `src/main.jsx` contains `import './index.css'`. Verify `tailwind.config.js` has `content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"]`. |
| API calls fail with `CORS policy: No 'Access-Control-Allow-Origin' header` | Vite proxy is not matching the request path or component bypassed proxy with absolute URL. | Verify API calls use relative paths (e.g. `/api/v1/tickets`) and check `vite.config.js` proxy target is set to `http://127.0.0.1:8000`. |
| Browser console shows `Uncaught TypeError: Cannot read properties of undefined (reading 'data')` | A component attempted to access `response.data` after the base client interceptor already unwrapped it. | Remove `.data` in the caller component; the base client's response interceptor returns the data object directly. |
| Clicking navigation links causes the entire browser page to reload. | Component uses traditional HTML `<a>` tags instead of `NavLink` or `Link` from `react-router-dom`. | Replace `<a href="...">` with `<NavLink to="...">` inside `src/components/Navbar.jsx`. |
| Mobile menu does not open when clicking hamburger button. | `isMobileMenuOpen` state is missing or click handler does not toggle state. | Verify `onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}` is attached to the hamburger button in `Navbar.jsx`. |
| Production build fails with `Rollup failed to resolve import` | A component imports a file using an incorrect relative path or case-sensitive typo. | Check the import statement in the referenced file; verify path matches actual filename on disk exactly. |
