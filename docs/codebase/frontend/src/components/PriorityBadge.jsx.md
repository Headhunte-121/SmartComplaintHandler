# Frontend Source Documentation: `frontend/src/components/PriorityBadge.jsx`

> **File Path**: `frontend/src/components/PriorityBadge.jsx`  
> **Role**: Atomic Visual Indicator for Incident Priority Tiers, Target SLA Windows, and Accessibility Status.  
> **Target Audience**: College Viva Examiners, Evaluation Committees, Frontend Engineers, Students grounded in basic C/Python.

---

## 1. High-Level Architectural Purpose

In emergency dispatch and service management systems, operators and technicians must be able to assess incident severity in a split second. A text string saying `"CRITICAL"` buried inside a table can easily be overlooked. 

`PriorityBadge.jsx` is an **Atomic Design UI Component** that encapsulates color psychology, animated SVG iconography, accessibility semantics, and SLA target durations into a reusable pill badge.

It fulfills four key engineering goals:
1. **Visual Triaging via Color Psychology**:
   - `CRITICAL` (2-Hour SLA): Pulsing rose red badge with an active fire icon (`animate-pulse`).
   - `HIGH` (8-Hour SLA): Vivid amber badge with an exclamation warning triangle.
   - `MEDIUM` (24-Hour SLA): Sky blue badge with a clock icon.
   - `LOW` (72-Hour SLA): Emerald green badge with a completion checkmark.
2. **Defensive Normalization**: Automatically normalizes mixed-case or malformed strings (e.g. `'critical'`, `' High '`, `null`) to valid uppercase dictionary keys, preventing UI crashes.
3. **Accessibility (a11y)**: Implements WAI-ARIA standards (`role="status"`, `aria-label`) so screen readers announce priority levels to visually impaired staff.
4. **Theme Support & Size Scalability**: Supports `sm`, `md`, and `lg` sizing and adapts dynamically to dark or light container backgrounds.

---

## 2. Sequential Code Breakdown & Deep Analysis

```javascript
/**
 * SmartComplaintHandler - Atomic Priority Badge Component
 * High-Contrast Dark Command Twin & Adaptive Theme Support
 */
import React from 'react';

const PRIORITY_CONFIG = {
  CRITICAL: {
    classes: 'bg-rose-950/90 text-rose-300 border-rose-800/90 shadow-2xs font-bold ring-1 ring-rose-900/50',
    lightClasses: 'bg-rose-50 text-rose-900 border-rose-300 shadow-2xs font-bold ring-1 ring-rose-200/50',
    sla: '2 Hours',
    icon: (
      <svg className="w-3.5 h-3.5 mr-1 text-rose-400 shrink-0 animate-pulse" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.316.492-.63 1.056-.99 1.693C8.01 6.67 6.442 9.24 5.38 12.062a8.03 8.03 0 00-.38 2.438c0 4.142 3.358 7.5 7.5 7.5s7.5-3.358 7.5-7.5c0-1.89-.705-3.626-1.875-4.945-.482-.544-.925-1.043-1.34-1.503-.974-1.077-1.782-1.97-2.39-2.999a8.966 8.966 0 01-.9-2.5zM12 16a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
      </svg>
    ),
  },
```

### Plain-English Purpose
Defines the visual and metadata configuration dictionary for the `CRITICAL` tier. It specifies dark and light CSS class strings, the official 2-hour Service Level Agreement target, and an inline SVG flame icon that pulses continuously to signal urgency.

### Line-by-Line Breakdown
- `const PRIORITY_CONFIG = { ... }`: In C, this is identical to a static lookup table or an array of structs `struct PriorityConfig configs[]`.
- `CRITICAL`: Configuration key for highest severity.
- `classes`: Tailwind CSS classes for dark theme (rose-950 background, rose-300 text, rose-800 border, outer ring glow).
- `lightClasses`: Tailwind classes for light theme (rose-50 background, rose-900 text, rose-300 border).
- `sla: '2 Hours'`: Standard institutional resolution deadline for critical hazards.
- `animate-pulse`: CSS animation class that pulses opacity continuously between 100% and 50%.
- `aria-hidden="true"`: Hides the decorative SVG icon from screen readers to prevent redundant audio announcements.

---

```javascript
  HIGH: {
    classes: 'bg-amber-950/90 text-amber-300 border-amber-800/90 shadow-2xs font-bold ring-1 ring-amber-900/50',
    lightClasses: 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs font-bold ring-1 ring-amber-200/50',
    sla: '8 Hours',
    icon: (
      <svg className="w-3.5 h-3.5 mr-1 text-amber-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  MEDIUM: {
    classes: 'bg-sky-950/90 text-sky-300 border-sky-800/90 shadow-2xs font-bold ring-1 ring-sky-900/50',
    lightClasses: 'bg-sky-50 text-sky-900 border-sky-300 shadow-2xs font-bold ring-1 ring-sky-200/50',
    sla: '24 Hours',
    icon: (
      <svg className="w-3.5 h-3.5 mr-1 text-sky-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
      </svg>
    ),
  },
  LOW: {
    classes: 'bg-emerald-950/90 text-emerald-300 border-emerald-800/90 shadow-2xs font-bold ring-1 ring-emerald-900/50',
    lightClasses: 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs font-bold ring-1 ring-emerald-200/50',
    sla: '72 Hours',
    icon: (
      <svg className="w-3.5 h-3.5 mr-1 text-emerald-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
};
```

### Plain-English Purpose
Configures the remaining three priority tiers:
- `HIGH`: Amber styling, 8-hour SLA deadline, and an exclamation warning triangle icon.
- `MEDIUM`: Sky blue styling, 24-hour SLA deadline, and a clock icon.
- `LOW`: Emerald green styling, 72-hour SLA deadline, and a checkmark icon.

---

```javascript
const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

export default function PriorityBadge({
  priority = 'MEDIUM',
  size = 'md',
  showIcon = true,
  showSlaTooltip = false,
  dark = true,
}) {
  const normalized = (priority || 'MEDIUM').toString().trim().toUpperCase();
  const config = PRIORITY_CONFIG[normalized] || PRIORITY_CONFIG.MEDIUM;
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const tooltipText = showSlaTooltip ? `Target SLA: ${config.sla}` : undefined;
  const colorClasses = dark ? config.classes : (config.lightClasses || config.classes);
```

### Plain-English Purpose
Defines size variants (`sm`, `md`, `lg`) and the `PriorityBadge` component. It cleans and normalizes the input priority, retrieves the corresponding tier configuration (falling back to `MEDIUM` if unknown), selects the appropriate padding/font size, formats the optional hover tooltip, and resolves dark vs. light styling classes.

### Line-by-Line Breakdown
- `size = 'md'`: Default size is medium.
- `showIcon = true`: By default, renders the SVG icon alongside the text.
- `showSlaTooltip = false`: If set to `true`, hovering over the badge shows a native browser tooltip with the SLA target (e.g. *"Target SLA: 2 Hours"*).
- `dark = true`: Defaults to Matte Dark styling.
- `const normalized = (priority || 'MEDIUM').toString().trim().toUpperCase()`:
  - `(priority || 'MEDIUM')`: Handles `null` or `undefined`.
  - `.toString()`: Protects against numeric inputs.
  - `.trim()`: Strips whitespace.
  - `.toUpperCase()`: Normalizes `'high'` to `'HIGH'`.
- `const config = PRIORITY_CONFIG[normalized] || PRIORITY_CONFIG.MEDIUM`: Safe dictionary lookup. If someone passes an invalid priority like `'SUPER_URGENT'`, it gracefully defaults to `MEDIUM` without crashing.

---

```javascript
  return (
    <span
      role="status"
      aria-label={`Priority: ${normalized}`}
      title={tooltipText}
      className={`inline-flex items-center rounded-full border tracking-wide transition-colors ${sizeClass} ${colorClasses}`}
    >
      {showIcon && config.icon}
      <span>{normalized}</span>
    </span>
  );
}
```

### Plain-English Purpose
Renders the badge as an inline flex container (`inline-flex items-center rounded-full border`). It embeds the icon (if enabled) and the uppercase priority string inside an accessible `<span>` element.

### Line-by-Line Breakdown
- `role="status"`: WAI-ARIA attribute informing assistive technologies that this element presents status information.
- `aria-label={`Priority: ${normalized}`}`: Provides a clear text label for screen readers.
- `title={tooltipText}`: Native browser tooltip attribute displayed on mouse hover.
- `rounded-full`: Applies circular pill pill styling (`border-radius: 9999px`).
- `{showIcon && config.icon}`: Conditional JSX rendering the SVG icon only when `showIcon` is `true`.
- `<span>{normalized}</span>`: Displays the text label (e.g. `CRITICAL`).

---

## 3. High-Frequency Viva & Technical Defense Questions

### Q1: What is the purpose of normalising the priority prop with `(priority || 'MEDIUM').toString().trim().toUpperCase()`?
**Model Answer:**  
In real-world applications, data from backend APIs, URL query parameters, or user inputs may not always match the exact expected format. A backend might return `"high"`, `" High "`, or `null`. If we used `PRIORITY_CONFIG[priority]` directly with `"high"`, JavaScript would return `undefined`, causing a runtime `TypeError` when accessing `config.classes`. The normalization chain cleans whitespace, converts to uppercase, and provides a default fallback, guaranteeing that the component **never throws an unhandled error**.

### Q2: Why does the `CRITICAL` badge icon have the `animate-pulse` CSS class?
**Model Answer:**  
In user interface design for emergency systems, motion draws the eye faster than static color alone. Applying Tailwind's `animate-pulse` class to the critical flame icon creates a gentle pulsing effect that immediately alerts campus facility supervisors to severe hazards (like power outages or gas leaks) without needing noisy audio alarms.

### Q3: Why is `aria-hidden="true"` applied to the SVG icons?
**Model Answer:**  
The SVG icons are purely visual aids. Screen readers would otherwise attempt to parse the path data or announce unhelpful descriptions. By setting `aria-hidden="true"` on the SVG and providing `role="status"` and `aria-label={`Priority: ${normalized}`}` on the parent `<span>`, we ensure screen readers announce clear, concise information (e.g. *"Priority: CRITICAL"*) without audio clutter.

### Q4: What are the SLA resolution targets for each priority tier in the system?
**Model Answer:**  
- **CRITICAL**: **2 Hours** (Emergency campus hazards, severe leaks, total server room power failure).
- **HIGH**: **8 Hours** (Major classroom projector failure, hostel water pump breakdown).
- **MEDIUM**: **24 Hours** (Single ceiling fan malfunction, standard room Wi-Fi issues).
- **LOW**: **72 Hours** (Cosmetic wall paint chipping, minor furniture scratches).

### Q5: Why is `PriorityBadge` implemented as an independent atomic component rather than written inline inside table rows?
**Model Answer:**  
Creating an independent, atomic `PriorityBadge` component follows the DRY (Don't Repeat Yourself) principle. Priority badges appear across many different screens: `StudentDashboard`, `TechnicianWorkstation`, `AdminDashboard`, `TrackTicket`, and `LiveTriageCard`. If the design or color palette ever changes, updating this single file instantly updates all screens across the entire application.

---

## 4. Quick Reference Summary Table

| Priority Level | Accent Color | SLA Target | Icon Graphic | Animation |
| :--- | :--- | :--- | :--- | :--- |
| **`CRITICAL`** | Rose Red | **2 Hours** | Flame / Fire | `animate-pulse` (Pulsing) |
| **`HIGH`** | Vivid Amber | **8 Hours** | Exclamation Triangle | Static |
| **`MEDIUM`** | Sky Blue | **24 Hours** | Analog Clock | Static |
| **`LOW`** | Emerald Green | **72 Hours** | Checkmark | Static |
