# IIIT Naya Raipur Campus Facilities — Frontend Rehaul

This package is a **source-level frontend redesign** of the supplied React/Vite application. It replaces the previous styling overlay approach with a shared visual system applied across the application shell, role dashboards, ticket workflows, campus pages, staff/squad views, and authentication screens.

## Design direction

- Light-first, modern institutional SaaS interface with a cool neutral canvas, white surfaces, indigo primary actions, mint/green success states, and clearer typography.
- Updated navigation height, surface treatment, borders, spacing, focus states, tables, inputs, buttons, status chips, and responsive behavior.
- New `ui-theme-v2` preference key ensures an old saved dark-theme setting from the previous UI does not silently bring the old design back. Users can still toggle to dark mode using the existing theme control.
- Existing page components, API modules, role-based routes, data flows, and ticket workflows are retained; no backend/API contract was intentionally changed.

## Run locally

```bash
npm ci
npm run dev
```

Production build:

```bash
npm run build
```

## Deployment notes

- Keep your real environment variables in your deployment environment; `.env.example` is only a template.
- Deploy from this source tree so Vite rebuilds the app. The old prebuilt `dist/` directory is intentionally not included because it would contain the old interface.
- The build could not be executed in the authoring environment because the npm dependency cache was incomplete and package installation could not finish. Please run the build in your project environment before deploying.
