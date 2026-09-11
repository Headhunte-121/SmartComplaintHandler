# Module M3 - Frontend File 02: Reusable Priority Badge Component
## Target File: `frontend/src/components/PriorityBadge.jsx`
### Execution Track: Phase 1 (Can be built in parallel with other components)

---

# 1. Standard Purpose & Industry Role: What This File Is Standardly Used For

In enterprise design systems and component-driven web frameworks (such as Tailwind UI, Radix UI, and Ant Design), `components/PriorityBadge.jsx` defines the **Atomic Visual Severity Indicator Component**. It is a reusable, self-contained UI badge that standardizes how incident urgency, life-safety risk, and operational priority tiers are visually rendered across an entire software ecosystem.

### Standard Industry Role & Real-World Use Cases
In professional production systems (such as PagerDuty incident lists, Jira issue cards, and AWS health boards), atomic severity badges standardly fulfill four core architectural duties:

1. **Instantaneous Visual Triage (Color Semantics):**
   * Translates abstract string data (`"CRITICAL"`, `"HIGH"`, `"MEDIUM"`, `"LOW"`) into internationally recognized color semantics (Red for danger, Orange for high urgency, Blue for standard maintenance, Gray for low priority).
   * Allows facility technicians and supervisors to scan through hundreds of records and spot high-risk emergencies in under 50 milliseconds.
2. **Design System Consistency & Single Source of Truth:**
   * Centralizes all color styles, border radii, typography sizes, and iconography into a single reusable component.
   * If the engineering team decides to adjust the shade of red used for emergencies, modifying this single component automatically updates the badge across the Student Ticket Tracker, Staff Admin Desk, and Reassignment Modals.
3. **Accessibility Compliance (WCAG 2.1 Contrast & ARIA):**
   * Enforces strict Web Content Accessibility Guidelines (WCAG) contrast ratios (at least 4.5:1 between text and background), ensuring readability for visually impaired technicians.
   * Includes assistive accessibility attributes (`aria-label="Priority: Critical"`) so screen readers announce severity clearly.
4. **Attention Anchoring via Micro-Animations:**
   * Applies subtle pulse animations (`animate-pulse`) to life-threatening `CRITICAL` badges, drawing immediate human focus to active safety hazards.

### What WE Are Specifically Using It For in Smart Complaint Handler
In our campus complaint automation platform, our 5-student engineering team specifically uses `frontend/src/components/PriorityBadge.jsx` for four concrete operational functions:

1. **Highlighting Campus Safety Hazards (`CRITICAL`):**
   * Renders `CRITICAL` complaints (such as sparking wires, chemical spills, or hostel floods) with an attention-grabbing, pulsing red badge (`bg-rose-100 text-rose-800 border border-rose-300 animate-pulse font-bold`).
2. **Differentiating Operational Severity Tiers:**
   * Renders `HIGH` complaints (power blackouts, major waterline bursts) in amber (`bg-amber-100 text-amber-800 border-amber-300`).
   * Renders `MEDIUM` complaints (standard routine repairs) in blue (`bg-blue-100 text-blue-800 border-blue-300`).
   * Renders `LOW` complaints (minor cosmetic touchups) in slate gray (`bg-slate-100 text-slate-700 border-slate-300`).
3. **Displaying Target SLA Response Tooltips:**
   * Displays the target institutional response deadline when hovered (e.g. hovering over `CRITICAL` reveals `"Target SLA: 4 Hours"`).
4. **Cross-Page Reusability Across the Platform:**
   * Rendered in the Student Submission Live Preview (`LiveTriageCard.jsx`), the Student Public Tracker (`TrackTicket.jsx`), the Staff Admin Desk (`AdminDashboard.jsx`), and the Supervisor Reassignment Dialog (`ReassignTeamModal.jsx`).

### Future AI Integration & Badge Stability (V2 Roadmap)
While Version 1 displays deterministic priority tiers, this badge component is designed as the permanent presentation shell for future AI triage:
* **AI Confidence Indicator Tooltip:** In V2, when an AI model calculates the priority tier, this badge can accept an optional prop `confidence={0.95}` to display an AI confidence percentage inside its tooltip (e.g. `"AI Assigned: 95% Confidence"`).
* **Stable Presentation Contract:** Upgrading backend services to AI requires zero modifications to this component's DOM structure or styling rules.

### How Other Components Standardly Interact with This File
Across the frontend architecture, this component is consumed cleanly:
* **The Live Triage Card (`frontend/src/components/LiveTriageCard.jsx`):** Renders this badge dynamically as preview results arrive from `/triage-preview`.
* **The Staff Admin Desk (`frontend/src/pages/AdminDashboard.jsx`):** Renders this badge in every table row in the Priority column.
* **The Student Ticket Tracker (`frontend/src/pages/TrackTicket.jsx`):** Renders this badge prominently next to the complaint tracking code.

### The Core Problem It Solves & Why It Exists
* **Inconsistent Color Coding:** Without a centralized badge component, one developer might style critical issues in pink, another in dark red, and a third in orange, creating visual chaos and user confusion.
* **Accessibility Failures:** Prevents low-contrast text combinations (such as yellow text on white backgrounds) that fail campus accessibility audits.

---

# 2. What Must Be in This File & Why Each Item Is Needed

To be complete, accessible, and production-grade, `frontend/src/components/PriorityBadge.jsx` must define and render the following structural elements:

---

### Item 1: Component Props Specification
* **What it is:** Accepted properties passed from parent views.
* **Props:**
  * `priority: string` (The priority tier string: `"CRITICAL"`, `"HIGH"`, `"MEDIUM"`, `"LOW"`, or fallback).
  * `size: string` (Optional size variant: `"sm"`, `"md"`, or `"lg"`, defaulting to `"md"`).
  * `showIcon: boolean` (Optional boolean to display a visual SVG indicator icon, defaulting to `true`).
  * `showSlaTooltip: boolean` (Optional boolean to display target SLA hours on hover, defaulting to `false`).
* **Why it is needed:**
  * Provides flexible styling suitable for compact table rows (`size="sm"`) and prominent hero banners (`size="lg"`).

---

### Item 2: Severity Configuration Registry (`PRIORITY_STYLES`)
* **What it is:** An internal mapping dictionary defining Tailwind styling classes, icons, and SLA text for each tier.
* **Specification:**
  * `CRITICAL`: Background `bg-rose-100`, text `text-rose-800`, border `border-rose-300`, animation `animate-pulse`, SLA `"4 Hours"`.
  * `HIGH`: Background `bg-amber-100`, text `text-amber-800`, border `border-amber-300`, SLA `"12 Hours"`.
  * `MEDIUM`: Background `bg-blue-100`, text `text-blue-800`, border `border-blue-300`, SLA `"24 Hours"`.
  * `LOW`: Background `bg-slate-100`, text `text-slate-700`, border `border-slate-300`, SLA `"72 Hours"`.
* **Why it is needed:**
  * Centralizes design tokens into a lookup table, eliminating nested `if-else` chains.

---

### Item 3: Inline SVG Icons
* **What it is:** Scalable Vector Graphic icons representing each severity level.
* **Icons:**
  * `CRITICAL`: Alert triangle / flame icon.
  * `HIGH`: Exclamation circle icon.
  * `MEDIUM`: Clock / wrench maintenance icon.
  * `LOW`: Minus / cosmetic leaf icon.
* **Why it is needed:**
  * Reinforces color coding with visual shapes for colorblind users.

---

### Item 4: Accessible ARIA Attributes
* **What it is:** Accessibility attributes embedded on the container element.
* **Attributes:** `role="status"` and `aria-label={`Priority: ${priorityText}`}`.
* **Why it is needed:**
  * Guarantees that screen readers announce the priority level to visually impaired students and staff.

---

# 3. Component Life-Cycle: Input, Process, Output (IPO Table)

The following table documents the component life-cycle for `frontend/src/components/PriorityBadge.jsx`:

| Life-Cycle Stage | Input Data Received | Internal Style Resolution | Rendered Visual Output |
| :--- | :--- | :--- | :--- |
| **Normal Render** | `priority="CRITICAL"` | Resolves `PRIORITY_STYLES["CRITICAL"]`. Combines Tailwind classes. | Pulsing red pill badge with flame icon and bold text: `CRITICAL`. |
| **Routine Render** | `priority="MEDIUM"` | Resolves `PRIORITY_STYLES["MEDIUM"]`. Applies blue classes. | Soft blue pill badge with wrench icon: `MEDIUM`. |
| **Case Normalization**| `priority="critical"` | Converts input to uppercase: `priority.toUpperCase()`. | Resolves critical styling cleanly despite lowercase input. |
| **Unknown Input** | `priority="UNKNOWN"` | Falls back to default gray slate styling. | Neutral slate pill badge: `UNKNOWN`. |

---

# 4. Flexibility & Modification Guide: What Can Be Changed vs. Strict Non-Negotiables

To preserve design system harmony, follow these operational rules:

### 🟢 Safe to Modify (Configurable Parameters)
* **Custom Color Shades:** You can adjust Tailwind color tokens (e.g. using `bg-red-100` instead of `bg-rose-100`, or `text-orange-800` instead of `text-amber-800`).
* **Badge Typography:** You can adjust font weight (`font-semibold` vs `font-bold`) and tracking (`tracking-wide`).
* **SLA Tooltip Wording:** You can customize the tooltip phrasing (e.g. changing `"Target SLA: 4 Hours"` to `"Resolution Goal: Within 4h"`).

### 🔴 Strict Non-Negotiables (System Breaking Changes)
* **DO NOT Use Low-Contrast Color Combinations:** Ensure text remains dark and readable against its background badge color to maintain WCAG compliance.
* **DO NOT Remove Case Normalization:** Always normalize inputs via `.toUpperCase()`. Removing normalization causes `"Critical"` to fail lookup and render as an unknown fallback.
* **DO NOT Hardcode Fixed Pixel Dimensions:** Use responsive Tailwind utility classes (`px-2.5 py-0.5 text-xs`) rather than hardcoded inline pixel styles (`style={{ width: '80px' }}`).

---

# 5. Advanced Frontend Concepts Explained: State & React Architecture

### 1. Atomic Component Design in Modern Web Architectures
* **The Concept:** In Brad Frost's **Atomic Design** methodology, components are categorized hierarchically: Atoms, Molecules, Organisms, Templates, and Pages.
* **Why `PriorityBadge` Is an Atom:**
  * An atom is a fundamental UI building block that cannot be broken down further without losing its meaning.
  * Because `PriorityBadge` is a pure atom with zero external dependencies, it can be embedded anywhere across the frontend architecture without creating dependency conflicts.

### 2. Pure Functional Components & Memoization
* **The Concept:** A React component is **pure** if it contains no internal state and always returns the exact same JSX for the same input props.
* **Why Pure Components Perform Better:**
  * `PriorityBadge` is a pure functional component. When rendered 500 times inside a large complaints table, React can evaluate it with sub-microsecond speed.
  * If performance optimization is needed in large tables, wrapping it in `React.memo(PriorityBadge)` guarantees that React only re-renders badges whose `priority` prop has actually changed.

---

# 6. Definition of Done: Observable Verification Checklist

Before considering `frontend/src/components/PriorityBadge.jsx` complete, verify each of the following operational checkpoints:

### Implementation Checklist
- [ ] File exists at `frontend/src/components/PriorityBadge.jsx`.
- [ ] Accepts props: `priority`, `size`, `showIcon`, and `showSlaTooltip`.
- [ ] Defines `PRIORITY_STYLES` for `CRITICAL`, `HIGH`, `MEDIUM`, and `LOW`.
- [ ] Normalizes input strings via `.toUpperCase()`.
- [ ] `CRITICAL` badge renders with red styling and an active pulse animation.
- [ ] Embeds accessible `aria-label` attribute.
- [ ] Includes fallback styling for unrecognized priority strings.
- [ ] Contains zero triple-backtick code blocks.

### Browser Verification Procedure

1. **Verify Badge Rendering in Isolation or Storybook:**
   * Render `<PriorityBadge priority="CRITICAL" />` and `<PriorityBadge priority="MEDIUM" />`.
   * Observe that `CRITICAL` renders in red with an active pulse animation.
   * Observe that `MEDIUM` renders in clean blue.
2. **Verify Case Insensitivity:**
   * Render `<PriorityBadge priority="high" />` (lowercase).
   * Observe that it normalizes to uppercase and renders in amber with the high-urgency icon.
