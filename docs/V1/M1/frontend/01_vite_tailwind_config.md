# Module M1 Frontend: Vite Build Engine & Tailwind CSS Design Tokens Specification

Authoritative Engineering Blueprint for `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, and `src/index.css`.

---

## Section 1: Standard Purpose & Industry Role

### Standard Industry Role & Real-World Use Cases
In modern production frontend engineering, an application requires a deterministic module bundling pipeline, a standardized design token registry, and a CSS normalization layer. 

A module bundler (a tool that resolves file imports, bundles source code, and processes assets into browser-executable JavaScript) serves as the developer's execution server during local authoring and compiles optimized static assets for production deployment. Vite (a modern frontend build tool leveraging native ES modules in development and Rollup in production) delivers sub-second Hot Module Replacement (HMR, an engine capability that injects updated JavaScript and CSS into a running browser session without requiring a full page refresh).

A utility-first CSS framework like Tailwind CSS (a utility-first CSS framework that generates style rules on demand by scanning class names in source code) replaces arbitrary CSS rule authoring with an enforced design token system. In enterprise teams, design tokens (named values representing foundational visual design choices such as colors, typography scales, spacing units, and elevation shadows) ensure visual consistency across independent developers working on disparate modules. PostCSS (a tool for transforming styles with JS plugins) operates as the CSS pre-processing compiler that injects vendor prefixes and integrates Tailwind directives into standard CSS stylesheets.

### What WE Are Specifically Using It For in Smart Complaint Handler
In `SmartComplaintHandler`, this configuration suite establishes the visual identity, styling boundaries, and developer environment for our 5-student engineering team:
1. It binds Vite to run on port `5173` locally and configures an automated API reverse proxy forwarding all `/api/v1` requests directly to our FastAPI backend running on port `8000`. This completely eliminates Cross-Origin Resource Sharing (CORS, a browser security mechanism that restricts HTTP requests initiated from scripts to a different origin domain, protocol, or port) friction during local development.
2. It establishes our institution's visual identity tokens: Campus Slate (`#0F172A`), Primary Institutional Indigo (`#4F46E5`), and strict semantic severity tokens:
   - Critical Hazard: Pulsing Red (`#DC2626` / `bg-red-600`)
   - High Priority: Warning Amber (`#D97706` / `bg-amber-600`)
   - Medium Workload: Info Sky (`#0284C7` / `bg-sky-600`)
   - Low Maintenance: Muted Slate (`#64748B` / `bg-slate-500`)
3. It compiles global typography resets and interactive utility layers in `src/index.css`, standardizing font smoothing, root layout constraints, and accessible focus outlines.

### Future AI Integration & Roadmap Hooks
In Version 2 (V2), when our platform integrates automated AI grievance categorization and multimodal complaint analysis, this configuration suite provides:
1. AI Confidence Highlight Utilities: Semantic color tokens (`bg-purple-500/10`, `text-purple-600`, `border-purple-300`) dedicated to visual indicators that render Gemini AI prediction badges, confidence score progress bars, and model explainability callouts.
2. Shimmer & Skeleton Animation Keyframes: Custom CSS keyframe animations configured in `tailwind.config.js` (`@keyframes shimmer`) to power pulsing skeleton placeholder screens while asynchronous AI inference calls resolve over the network.
3. Micro-Interaction Tokens: Transition duration curves (`duration-200 ease-in-out`) pre-configured to ensure AI suggestion popups and automatic keyword chip highlights render with 60 FPS hardware-accelerated animations.

### How Other Components Standardly Interact with This File
1. `src/main.jsx` imports `src/index.css` at the root entry point of the React application, ensuring all Tailwind utility classes and CSS reset rules are injected before any component mounts.
2. Every presentational component in Modules M1 through M4 (`Navbar.jsx`, `SubmitComplaint.jsx`, `PriorityBadge.jsx`, `TeamWorkloadView.jsx`, `AdminDashboard.jsx`) relies exclusively on the utility class names defined by `tailwind.config.js` (such as `p-4`, `rounded-xl`, `font-semibold`, `shadow-sm`, and semantic color utilities).
3. The Vite development server (`vite.config.js`) serves as the host runtime for all development commands executed in terminal (`npm run dev`) and production compilation (`npm run build`).

### The Core Problem It Solves & Why It Exists
Without this blueprint:
- Each developer writes custom, conflicting CSS files with disparate hex codes, resulting in inconsistent button styles, mismatched margins, and chaotic font sizes.
- Every API call made by developers during local testing triggers browser CORS blocking errors because the frontend origin (`http://localhost:5173`) differs from the backend origin (`http://localhost:8000`).
- Asset bundling requires slow, complex Webpack configurations that take 30+ seconds to start up and break under modern React 18 syntax.

---

## Section 2: What Must Be in This File & Why Each Item Is Needed

### 1. `vite.config.js` (The Bundler Engine Configuration)
* React Plugin Integration: Configured with `@vitejs/plugin-react` to parse JSX (JavaScript XML, a syntax extension allowing developers to write HTML-like markup inside JavaScript code) and enable Fast Refresh.
* Local Development Server Port: Explicitly configured to bind to port `5173` with `strictPort: true` so the frontend fails immediately with a clear error if another process has captured the port, rather than silently switching to port `5174` and breaking bookmark references.
* Development Proxy Configuration: A proxy block routing all requests starting with `/api` to the backend target `http://127.0.0.1:8000` with `changeOrigin: true` and `secure: false`. This allows the React app to execute `fetch('/api/v1/tickets')` seamlessly without hardcoding server hostnames in frontend code.
* Path Alias Resolver: Configured alias `@` mapping directly to the `src/` directory, allowing clean imports like `import { client } from '@/api/client'` instead of brittle relative paths like `../../../api/client`.

### 2. `tailwind.config.js` (The Design Token Registry)
* Content Scan Array: An array of glob patterns (`./index.html`, `./src/**/*.{js,ts,jsx,tsx}`) instructing Tailwind's Just-In-Time (JIT) compiler to scan every React file for class names and purge unused CSS from the production build bundle.
* Color Palette Extension: An explicit `theme.extend.colors` object defining our semantic platform tokens:
  - `brand.dark`: Deep slate `#0F172A` (primary text, dark headers).
  - `brand.primary`: Clean indigo `#4F46E5` (action buttons, active navigation indicators).
  - `brand.light`: Off-white canvas `#F8FAFC` (application background).
  - `priority.critical`: High-contrast red `#DC2626` (hazardous complaints).
  - `priority.high`: Vivid amber `#D97706` (urgent infrastructure repairs).
  - `priority.medium`: Informative sky `#0284C7` (routine maintenance).
  - `priority.low`: Subdued slate `#64748B` (cosmetic adjustments).
* Typography Font Family: Modern sans-serif stack prioritized for readability: `Inter`, `system-ui`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `sans-serif`.
* Elevation Shadows: Custom soft shadows `shadow-card` configured as `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)` to provide crisp, modern card elevation without muddy borders.

### 3. `postcss.config.js` (The CSS Transformation Pipeline)
* PostCSS Plugin Declarations: An exports object declaring `plugins: { tailwindcss: {}, autoprefixer: {} }`.
* Autoprefixer Plugin: A CSS tool that inspects the browserslist target and automatically injects required vendor prefixes (such as `-webkit-` and `-moz-`) into compiled CSS output, ensuring uniform rendering across Google Chrome, Mozilla Firefox, Apple Safari, and Microsoft Edge.

### 4. `src/index.css` (The Global Style Sheet & CSS Directives)
* Three Core Tailwind Directives:
  - `@tailwind base;` (injects Preflight, an opinionated reset stylesheet based on modern-normalize that removes default browser margins, sets uniform box-sizing to `border-box`, and removes unstyled list decorations).
  - `@tailwind components;` (injects reusable component utility classes).
  - `@tailwind utilities;` (injects individual utility classes like `flex`, `text-center`, `bg-white`).
* Root Canvas Base Rules: Custom `@layer base` rule applying `bg-slate-50 text-slate-900 min-h-screen antialiased selection:bg-indigo-500 selection:text-white` to the `body` tag, guaranteeing that every page opens with crisp typography and subtle contrast.

---

## Section 3: Component Life-Cycle: Input, Process, Output (IPO Table)

| Life-Cycle Phase | Primary Input | Internal Transformation & Compilation | Final Output |
| :--- | :--- | :--- | :--- |
| **1. Dev Startup (`npm run dev`)** | `vite.config.js` & package dependencies | Vite initializes native ES module development server on `http://localhost:5173`, mounts React Fast Refresh plugin, and establishes proxy bridge to `http://127.0.0.1:8000`. | Active local web server responding in <300ms with HMR websocket bridge. |
| **2. CSS Processing** | `src/index.css`, `tailwind.config.js`, `postcss.config.js` | PostCSS runs Tailwind JIT compiler; scans all JSX files; computes used utility classes; applies Autoprefixer vendor prefixes; injects compiled CSS into virtual DOM `<style>` tag. | Instant rendering of Tailwind utility styling in the browser with zero custom stylesheet lag. |
| **3. API Proxy Request** | Browser script issues `GET /api/v1/health` | Vite dev proxy intercepts request matching `/api`, rewires origin header, and forwards payload over local TCP socket to `http://127.0.0.1:8000/api/v1/health`. | Browser receives backend response with zero CORS preflight failures and zero port conflicts. |
| **4. Production Build (`npm run build`)** | Entire `src/` tree, assets, and styling configs | Rollup bundles JavaScript modules into code-split chunks with content hashes; PostCSS purges all unused Tailwind classes, compressing raw CSS to <15 KB gzipped. | Production-ready `dist/` directory containing optimized HTML, hashed JS, and minified CSS assets. |

---

## Section 4: Flexibility & Modification Guide

### 🟢 Safe to Modify & Customize
* **Semantic Theme Palette**: You may modify the hex codes assigned to `brand.primary`, `brand.light`, or `brand.dark` inside `tailwind.config.js` to align with specific university or campus branding requirements without altering any component structure.
* **Vite Dev Server Port**: If port `5173` is occupied by another local service on your machine, you can safely modify `server.port` in `vite.config.js` (e.g. to `3000`). Make sure to notify team members.
* **Additional Font Stacks**: You can add Google Web Fonts (e.g. `Plus Jakarta Sans` or `Outfit`) by adding the stylesheet link to `index.html` and updating the `fontFamily.sans` array in `tailwind.config.js`.
* **Custom Shadow Tokens**: You may adjust the blur, spread, or opacity values in `theme.extend.boxShadow` to make cards flatter or more elevated.

### 🔴 Strict Non-Negotiables (Do NOT Alter)
* **Tailwind Content Scan Globs**: Do NOT remove `./src/**/*.{js,ts,jsx,tsx}` from `tailwind.config.js`. Removing this causes Tailwind to fail to detect classes in nested component folders, stripping all styling from the page.
* **Proxy Target URL Pattern**: Do NOT alter the `/api` prefix in `vite.config.js` unless all API client files across Modules M1 through M4 are simultaneously refactored. Changing the target URL to an incorrect port will sever communication with FastAPI.
* **Tailwind Directives Order**: In `src/index.css`, `@tailwind base;` must precede `@tailwind components;`, which must precede `@tailwind utilities;`. Inverting this order breaks CSS cascade precedence, preventing utility classes from overriding base styles.
* **Autoprefixer Plugin in PostCSS**: Do NOT remove `autoprefixer` from `postcss.config.js`. Doing so breaks flexbox and grid layouts on Safari and older Chrome mobile browsers.

---

## Section 5: Architectural & Theoretical References

This specification operates strictly as an **implementation and integration blueprint**. For the exhaustive computer science fundamentals, language runtime mechanics, and protocol specifications governing this component, consult the following authoritative manuals in the **Developer Guide Suite**:

* [**Guide 10: Vite Build Engine & Module Bundling**](../../../developer_guide/10_VITE_AND_MODERN_BUILD_TOOLCHAINS.md)  
  Native ES Modules (ESM) in modern browsers, Esbuild pre-bundling, Rollup production bundling, and HMR WebSocket invalidation.

* [**Guide 08: Tailwind CSS & PostCSS Architecture**](../../../developer_guide/08_TAILWIND_CSS_AND_POSTCSS_ENGINEERING.md)  
  Utility-first CSS compilation, Just-In-Time (JIT) class purging, and PostCSS AST transformations.

* [**Unit 09B: Package Management, Dependency Graphs & SemVer**](../../../developer_guide/09B_PACKAGE_MANAGEMENT_DEPENDENCY_GRAPHS_AND_SEMVER.md)  
  NPM dependency tree resolution, lockfile subresource integrity, and module resolution.

* [**Unit 14B: Web Browser Security & Origin Policies**](../../../developer_guide/14B_WEB_BROWSER_SECURITY_AND_ORIGIN_POLICIES.md)  
  Development reverse proxy forwarding and browser Same-Origin Policy (SOP) bypass mechanics.

---

## Section 6: Definition of Done & Verification Protocol

### Observable Verification Checklist
* [ ] `vite.config.js` exists in the project root with React plugin, port `5173`, strict port setting, and `/api` proxy bridge configured.
* [ ] `tailwind.config.js` exists with correct `content` scanning globs, semantic brand colors, priority colors, and sans-serif font stack.
* [ ] `postcss.config.js` exists and exports `tailwindcss` and `autoprefixer` plugins.
* [ ] `src/index.css` contains the 3 `@tailwind` directives and base canvas body styling rules.
* [ ] Executing `npm run dev` starts the Vite server on `http://localhost:5173` in under 1 second.
* [ ] Editing a component's Tailwind class updates the browser view instantly via Hot Module Replacement without a full page reload.
* [ ] Executing `npm run build` compiles the production bundle into `dist/` with a minified CSS file smaller than 25 KB.

### Verification Commands & Troubleshooting Matrix

1. **Verify Vite Development Server Startup:**
   Run in frontend directory: `npm run dev`
   Expected terminal output: `VITE v5.x.x ready in xxx ms` and `Local: http://localhost:5173/`.

2. **Verify Production Bundle Compilation & Tailwind Purging:**
   Run in frontend directory: `npm run build`
   Expected terminal output: `dist/index.html`, `dist/assets/index-xxxx.css` (verify size is < 25 KB), and `dist/assets/index-xxxx.js`.

3. **Troubleshooting Matrix:**
   * *Problem:* Tailwind classes do not appear in the browser; plain unstyled HTML renders.
     * *Cause:* `src/index.css` is not imported inside `src/main.jsx`, or `tailwind.config.js` has an incorrect `content` glob path.
     * *Fix:* Ensure `import './index.css'` is present on line 1 of `src/main.jsx` and confirm `content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"]`.
   * *Problem:* Terminal shows `Port 5173 is in use`.
     * *Cause:* A previous Vite instance or another application is holding port 5173 open.
     * *Fix:* Terminate the zombie process with `npx kill-port 5173` or temporarily change `server.port` to `5174` in `vite.config.js`.
   * *Problem:* API calls return `404 Not Found` with HTML payload instead of JSON.
     * *Cause:* The Vite proxy rewrite rule is stripping `/api` incorrectly or FastAPI backend is not running on port `8000`.
     * *Fix:* Confirm FastAPI is running via `curl http://127.0.0.1:8000/docs` and verify `target: 'http://127.0.0.1:8000'` in `vite.config.js`.
