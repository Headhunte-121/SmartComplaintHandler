# Enterprise UI/UX Design System & Page Upgrade Guide (`SmartComplaintHandler`)

## 1. Industry Design Patterns Applied (Linear, Vercel, Stripe & Clerk)

| Design Principle | Industry Reference | Implementation in `SmartComplaintHandler` |
| :--- | :--- | :--- |
| **Split-Screen Enterprise SSO Portal** | Clerk, Stripe, Linear, Supabase | `Login.jsx` and `Register.jsx` use a 12-column split layout (`lg:grid-cols-12`): a dark architectural showcase panel (`bg-slate-950 bg-dark-architectural-grid`) on the left highlighting institutional SLA & OAuth telemetry, paired with a high-contrast authentication card on the right. |
| **Real-Time Identity & Password Feedback** | Vercel, GitHub, Auth0 | Typing an `@iiitnr.edu.in` email in `Login.jsx` or `Register.jsx` previews the resolved student roll number, academic branch (`CSE`, `DSAI`, `ECE`), or staff authority in real time. `Register.jsx` includes a live 4-bar password entropy meter. |
| **Bento Grid KPI Cards with Left Accent Borders** | Linear, Datadog, Jira Service Management | `StudentDashboard.jsx`, `AdminDashboard.jsx`, and `TechnicianWorkstation.jsx` use `.bento-card` surfaces (`shadow-bento`) with semantic `border-l-4` accents (`amber-500`, `rose-600`, `emerald-500`, `indigo-600`) for immediate visual hierarchy. |
| **Dual-Font Typographic Hierarchy (`Inter` + `JetBrains Mono`)** | Vercel, Linear | Configured `Inter` (with OpenType `cv02/cv03/cv04/cv11` features) for UI copy and `JetBrains Mono` for tracking codes (`SCH-...`), SLA countdown clocks, roll numbers, and telemetry badges in `index.html` and `tailwind.config.js`. |
| **Glassmorphism Command Header** | Vercel, Raycast | `Navbar.jsx` uses `bg-white/85 backdrop-blur-xl` with a segmented command pill bar (`bg-slate-100/70`), live `/health` status indicator, Google avatar image support, and 1-click role switcher access. |
| **Critical Tailwind v3/v4 Gradient Bug Fix** | Tailwind CSS v3.4 Compatibility | Fixed invisible white-on-white hero banners in `StudentDashboard.jsx` and `TechnicianWorkstation.jsx` caused by Tailwind v4 `bg-linear-to-r` classes being used inside a Tailwind v3.4 project (`bg-gradient-to-r` + CSS shim in `globals.css`). |
| **Zero Native Browser `prompt()` / `alert()` Dialogs** | Modern SaaS UX Standard | Replaced the raw browser `window.prompt()` escalation popup in `AdminDashboard.jsx` with a styled inline Supervisory Escalation Modal and auto-dismissing toast notifications. |

## 2. File-by-File UI/UX Changes

* **`frontend/index.html`**: Added Google Fonts (`Inter` 400–900 and `JetBrains Mono` 500–700), IIIT-NR favicon, and smooth scrolling.
* **`frontend/tailwind.config.js`**: Added `fontFamily.sans` (`Inter`), `fontFamily.mono` (`JetBrains Mono`), `boxShadow` (`2xs`, `xs`, `bento`, `bento-hover`, `glow-indigo`), and `@keyframes fadeIn` (`animate-fade-in`).
* **`frontend/src/styles/globals.css`**: Added `.bg-architectural-grid`, `.bg-dark-architectural-grid`, `.bento-card`, `.bento-card-interactive`, `.enterprise-input`, and compatibility shims for `.bg-linear-to-r`, `.focus:outline-hidden`, and `.backdrop-blur-xs`.
* **`frontend/src/pages/Login.jsx` & `frontend/src/pages/Register.jsx`**: Redesigned into split-screen enterprise portals with prominent Google Workspace SSO, real-time `@iiitnr.edu.in` roll/branch preview pills, and a 4-bar password strength indicator while preserving `GOOGLE_CLIENT_ID_PATTERN` and `IS_PROD_BUILD` security guards.
* **`frontend/src/components/Navbar.jsx`, `Layout.jsx`, & `Footer.jsx`**: Upgraded to a translucent glassmorphism header with segmented navigation pills, live backend connectivity badge, mounted `PersonaSwitcherModal`, and official IIIT Naya Raipur emergency directory.
* **`frontend/src/pages/SubmitComplaint.jsx`**: Added dark architectural hero header, 1-click demo scenario templates (*Sparking Switchboard*, *RO Water Cooler Leak*, *Hostel Wi-Fi Outage*), interactive 6-card domain category selector, and sticky SLA reference matrix.
* **`frontend/src/pages/StudentDashboard.jsx`, `TrackTicket.jsx`, `AdminDashboard.jsx`, & `TechnicianWorkstation.jsx`**: Upgraded with dark architectural hero headers, Bento KPI cards, instant search/filter bars, 1-click tracking code copy, and inline escalation modal.
