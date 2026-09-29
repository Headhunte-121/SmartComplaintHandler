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

---

## Section 6: Definition of Done & Live Website Verification

### What This File Is Responsible For
This document is responsible for **governing the complete frontend verification and quality certification protocol for Module M1**. It provides the operational checkpoints required to verify that the build engine, Tailwind styling, base API client, persistent layout, and router hierarchy function cohesively together.

### What It Should Perform
When executing verification across the frontend, this protocol ensures:
1. **Production Bundle Compilation:** Validates that `npm run build` generates a production-ready, minified bundle without syntax or asset resolution errors.
2. **CORS & Network Proxy Integrity:** Verifies that HTTP requests from port 5173 route through Vite's proxy to port 8000 with zero origin blocking.
3. **Responsive Visual Rendering:** Confirms that application shell components render cleanly across desktop, tablet, and mobile viewports.

### How to See It Performing Its Job on the Live Website
1. In `frontend/`, run the production build:
   `npm run build`
   * Confirm the build succeeds with 0 errors and generates minified assets in `dist/`.
2. Start the development server: `npm run dev`.
3. Open **`http://localhost:5173/`** in Google Chrome or Microsoft Edge.
4. **Complete Live Verification:**
   * Check console logs (`F12`): verify 0 JavaScript runtime errors.
   * Navigate through all top-level routes (`/`, `/submit`, `/track`, `/admin`).
   * Verify header, footer, navigation highlights, and responsive layouts behave smoothly on all screen sizes.
