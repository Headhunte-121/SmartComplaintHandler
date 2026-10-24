# Vite Bundler & Reverse Proxy Configuration (`frontend/vite.config.js`)

Comprehensive architectural and line-by-line documentation for `frontend/vite.config.js`. This document provides collegiate viva committees, code reviewers, and build engineers with an exhaustive dissection of modern build tooling, reverse proxy configuration for development, production console stripping via esbuild, and Rollup vendor chunking strategies.

---

## 1. Module Overview & Source Code

```javascript
/**
 * SmartComplaintHandler - Vite Configuration
 * Blueprint Reference: V1/M1/frontend/01_vite_tailwind_config.md
 * Role: Vite bundler with reverse proxy routing /api requests to FastAPI :8000.
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  return {
    plugins: [react()],
    esbuild: {
      drop: isProd ? ['console', 'debugger'] : [],
      legalComments: 'none',
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/health': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
    },
    build: {
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-icons': ['lucide-react'],
            'vendor-api': ['axios'],
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
  };
});
```

### Plain-English Purpose (Analogy in C/Python)
In compiled languages like C, a `Makefile` or `CMakeLists.txt` instructs the compiler (`gcc` or `clang`) on how to compile source files into object files, which libraries to link (`-lpthread`, `-lm`), and what optimization flags to apply (`-O3`, `-DNDEBUG` to strip assertions in release mode).

In modern web development, `vite.config.js` is the master build recipe for the frontend. It orchestrates:
1. **Babel/JSX Compilation**: Transforming modern React JSX code into standard browser JavaScript via `@vitejs/plugin-react`.
2. **Reverse Proxying**: Forwarding backend API calls from `http://localhost:5173/api` to FastAPI running on `http://127.0.0.1:8000`, eliminating Cross-Origin Resource Sharing (CORS) errors during local development.
3. **Release Optimization**: Stripping out `console.log` statements and debuggers in production builds using esbuild.
4. **Code Splitting (Chunking)**: Dividing vendor libraries (`react`, `axios`, `lucide-react`) into separate downloadable files so users can cache them permanently.

---

## 2. Line-by-Line Breakdown

- **Lines 1–5**: Comment header documenting lineage and primary role as reverse proxy and bundler.
- **Line 6**: `import { defineConfig } from 'vite';`: Imports Vite's configuration helper, providing IDE autocomplete and type-checking.
- **Line 7**: `import react from '@vitejs/plugin-react';`: Imports the official Vite plugin for Fast Refresh (HMR) and JSX compilation.
- **Line 9**: `export default defineConfig(({ mode }) => {`: Config callback accepting build parameters (`mode` is `'development'` or `'production'`).
- **Line 10**: `const isProd = mode === 'production';`: Boolean flag used to toggle production-only minification rules.
- **Line 12**: `plugins: [react()]`: Enables React JSX parsing and hot-reload hooks.
- **Lines 13–16**: `esbuild` Compiler Options:
  - `drop: isProd ? ['console', 'debugger'] : []`: In production mode, the ultra-fast Go-based compiler `esbuild` strips every `console.log()` and `debugger;` statement from the bundle, preventing sensitive debug output or tokens from leaking in browser devtools.
  - `legalComments: 'none'`: Strips licensing comments from the bundled output to save bytes.
- **Lines 17–29**: `server` Development Server Configuration:
  - `port: 5173`: Default local development port.
  - `proxy`: Reverse proxy configuration table:
    - `'/api'`: Requests to `http://localhost:5173/api/*` are intercepted and forwarded to `http://127.0.0.1:8000/api/*`.
    - `'/health'`: Proxies health-check endpoints to FastAPI.
    - `changeOrigin: true`: Rewrites the HTTP `Host` header to match the target host, preventing backend domain rejection.
- **Lines 30–43**: `build` Production Bundling Rules:
  - `sourcemap: false`: Disables source map generation in production, protecting proprietary source code from being reconstructed and reducing build output size.
  - `minify: 'esbuild'`: Uses esbuild for minification (up to $20\times$ faster than legacy Terser).
  - `rollupOptions.output.manualChunks`: Vendor code splitting dictionary:
    - `'vendor-react'`: Packages `react`, `react-dom`, and `react-router-dom` into a single shared chunk.
    - `'vendor-icons'`: Packages UI icons into a dedicated chunk.
    - `'vendor-api'`: Packages `axios` into a standalone chunk.
  - `chunkSizeWarningLimit: 600`: Increases Rollup's chunk warning threshold from $500\text{ KB}$ to $600\text{ KB}$ to accommodate SVG cartographic datasets without generating build warnings.

---

## 3. Deep Term & Concept Expansion

- **Reverse Proxy vs Direct CORS Access**: In local development, the frontend runs on port 5173 while FastAPI runs on port 8000. If the browser makes a direct request to `http://127.0.0.1:8000/api`, the browser's **Same-Origin Policy** sends an `OPTIONS` preflight request and may reject the call unless CORS headers are configured. Vite's reverse proxy intercepts `/api` calls directly on the Node.js server level (port 5173), making requests appear to originate from the same domain and port, completely bypassing CORS constraints during development.
- **Manual Chunks (Code Splitting)**: If all code were bundled into a single massive `index.js` file ($1.5\text{ MB}$), users on mobile devices would experience slow initial load times. Moreover, every minor bugfix would force clients to re-download the entire file. By isolating unchanging vendor libraries into `vendor-react.js` and `vendor-api.js`, browser caches can persist those chunks for months, downloading only the tiny application logic chunk ($<150\text{ KB}$) on subsequent updates.

---

## 4. Runtime Mechanics & Security

- **Information Leakage Prevention**: In development, developers frequently write `console.log({ userToken, debugData })`. The `esbuild.drop = ['console', 'debugger']` rule ensures that zero debugging statements survive into the production bundle, preventing credential exfiltration via browser devtools.
- **Build Performance**: Vite uses **esbuild** (written in Go) for pre-bundling dependencies and transpilation, and **Rollup** for production chunking. This delivers sub-second Hot Module Replacement (HMR) and production builds under 10 seconds.

---

## 5. High-Frequency Viva & Technical Defense Guide

### Q1: Why is Vite preferred over Webpack or Create-React-App in modern web architectures?
**Viva Answer**: Webpack builds an entire dependency graph and bundles all files before serving, resulting in slow startup times ($30\text{–}60\text{ seconds}$ on large apps). Vite serves code over native browser ES modules during development (`<script type="module">`). It only transpiles files on demand when requested by the browser, providing instant startup ($<300\text{ ms}$) and instantaneous Hot Module Replacement (HMR).

### Q2: How does the development reverse proxy in `vite.config.js` resolve CORS issues?
**Viva Answer**: The frontend client makes requests to relative paths like `/api/v1/auth/login`. Vite's internal development server intercepts `/api` requests and forwards them to the backend at `http://127.0.0.1:8000`. Because the browser is talking to port 5173 (its own origin), the browser's Same-Origin Policy is satisfied, avoiding CORS preflight failures.

### Q3: What is the architectural purpose of `manualChunks` in Rollup?
**Viva Answer**: `manualChunks` defines explicit vendor code splitting boundaries. By separating external dependencies (like React and Axios) from internal application code, we reduce initial page load times and improve browser caching efficiency. When application code changes, users re-download only our app bundle while reusing the cached vendor chunk.

---

## 6. Quick Reference Summary Table

| Configuration Field | Target Tool | Operational Definition |
| :--- | :--- | :--- |
| `plugins: [react()]` | Vite / Babel | Enables JSX parsing and React Fast Refresh hot-reloading |
| `esbuild.drop` | esbuild | Strips `console` and `debugger` statements from production bundles |
| `server.proxy` | Vite Dev Server| Forwards `/api` calls to FastAPI (:8000), eliminating local CORS issues |
| `sourcemap: false` | Rollup / esbuild| Disables source maps in production to protect source code and save bandwidth |
| `manualChunks` | Rollup | Splits `react`, `icons`, and `axios` into isolated cached vendor bundles |
