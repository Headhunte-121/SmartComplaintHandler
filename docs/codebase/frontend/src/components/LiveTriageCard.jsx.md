# Frontend Source Documentation: `frontend/src/components/LiveTriageCard.jsx`

> **File Path**: `frontend/src/components/LiveTriageCard.jsx`  
> **Role**: Client-Side Standby Guide, Campus Maintenance Service Directory, SLA Reference Card, and Pre-Submission Input Validator.  
> **Target Audience**: College Viva Examiners, Evaluation Committees, AI/NLP Specialists, Students grounded in basic C/Python.

---

## 1. High-Level Architectural Purpose

In many naive AI-integrated applications, client frontends fire API requests to machine learning or LLM services on every keystroke or short pause while a student types. This anti-pattern leads to excessive cloud API token burn, high server CPU consumption, rate-limiting errors, and poor battery life on mobile devices.

`LiveTriageCard.jsx` serves as an intelligent, **100% Client-Side Standby Guide**. It fulfills four strategic objectives:
1. **Zero Keystroke Network Overhead & Zero Token Burn**: Operates entirely in browser memory while the student types. Real-time classification is deferred strictly until the student clicks "Submit Complaint".
2. **Pre-Submission Character Threshold Feedback**: Inspects `title` (minimum 5 characters) and `description` (minimum 10 characters). When both conditions are met, it flips an animated radar indicator from cyan (*"Awaiting Input"*) to pulsing emerald (*"Ready to Submit"*).
3. **Comprehensive Maintenance Service Catalog**: Visually displays the 6 official campus maintenance categories (Electrical, Plumbing, Sanitation, Carpentry, IT Support, Facilities) and their respective operational scopes so students know what campus services are covered.
4. **Transparent SLA Target Standards**: Clarifies the four institutional resolution targets (`CRITICAL` = 2h, `HIGH` = 8h, `MEDIUM` = 24h, `LOW` = 72h), managing student expectations and setting clear accountability.

---

## 2. Sequential Code Breakdown & Deep Analysis

```javascript
/**
 * SmartComplaintHandler - Campus Facility Triage & SLA Guide
 * 100% Client-Side Standby Guide — 0 Background Network Calls & 0 Token Burn While Typing.
 * Classification & Dynamic SLA are executed strictly once upon submission.
 */
import React from 'react';
import { useTheme } from '../context/ThemeContext';

const DEPARTMENTS = [
  { name: 'Electrical', icon: '⚡', scope: 'Power, lights, fans, AC, MCB, geysers' },
  { name: 'Plumbing', icon: '💧', scope: 'Pipes, leaks, taps, RO, flush, drains' },
  { name: 'Sanitation', icon: '🧹', scope: 'Garbage, cleaning, hygiene, pests' },
  { name: 'Carpentry', icon: '🪚', scope: 'Doors, windows, furniture, locks, hinges' },
  { name: 'IT Support', icon: '📶', scope: 'Wi-Fi, LAN, internet, smart displays' },
  { name: 'Facilities', icon: '🏢', scope: 'Roads, gates, signage, civil campus infra' },
];
```

### Plain-English Purpose
Imports React and the theme context. It defines a static constant array `DEPARTMENTS` enumerating the six campus maintenance divisions, each equipped with an illustrative emoji and a concise scope description.

### Line-by-Line Breakdown
- `const DEPARTMENTS = [ ... ]`: An immutable array of JavaScript dictionary objects. In C, this is identical to a constant array of structs: `const DepartmentInfo DEPARTMENTS[6] = { ... };`.
- `name`: Human-readable department name.
- `icon`: Unicode emoji glyph.
- `scope`: Comma-separated list of common infrastructure components managed by this department.

---

```javascript
const SLA_TIERS = [
  { level: 'CRITICAL', time: '2h SLA', desc: 'Severe facility failure (pipe burst, full power cut)', colorDark: 'text-rose-400 border-rose-800/80 bg-rose-950/40', colorLight: 'text-rose-700 border-rose-300 bg-rose-50' },
  { level: 'HIGH', time: '8h SLA', desc: 'Major room/lab disruption or locked out', colorDark: 'text-amber-400 border-amber-800/80 bg-amber-950/40', colorLight: 'text-amber-700 border-amber-300 bg-amber-50' },
  { level: 'MEDIUM', time: '24h SLA', desc: 'Routine functional maintenance (fans, taps)', colorDark: 'text-blue-400 border-blue-800/80 bg-blue-950/40', colorLight: 'text-blue-700 border-blue-300 bg-blue-50' },
  { level: 'LOW', time: '72h SLA', desc: 'Minor cosmetic & non-urgent repairs', colorDark: 'text-zinc-400 border-zinc-700 bg-zinc-800/50', colorLight: 'text-slate-700 border-slate-300 bg-slate-100' },
];
```

### Plain-English Purpose
Defines the institutional Service Level Agreement (SLA) reference tiers. It couples priority levels (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) with guaranteed turnaround times, real-world campus incident examples, and dedicated Tailwind CSS color classes for dark and light modes.

---

```javascript
export default function LiveTriageCard({ title = '', description = '' }) {
  const { isDark } = useTheme();

  const cleanTitle = (title || '').trim();
  const cleanDesc = (description || '').trim();
  const isReady = cleanTitle.length >= 5 && cleanDesc.length >= 10;
```

### Plain-English Purpose
Component entry point. Receives live form values `title` and `description` as props. It trims whitespace and calculates the boolean flag `isReady`, which evaluates to `true` only when the title has at least 5 characters and the description has at least 10 characters.

### Line-by-Line Breakdown
- `export default function LiveTriageCard({ title = '', description = '' })`: Default parameter destructuring preventing undefined reference errors.
- `const cleanTitle = (title || '').trim()`: Trims leading and trailing whitespace.
- `const cleanDesc = (description || '').trim()`: Trims description whitespace.
- `const isReady = cleanTitle.length >= 5 && cleanDesc.length >= 10`: Boolean condition reflecting backend Pydantic schema validation minimums.

### Deep Term & Concept Expansion
- **Synchronous Client Validation vs Network Debouncing**: Rather than sending partial text across the internet to an AI model while typing, evaluating character lengths synchronously in the client browser takes less than 1 microsecond and uses 0 KB of network bandwidth.

---

```javascript
  return (
    <div
      className={`p-5 sm:p-6 space-y-4 rounded-2xl border transition-colors ${
        isDark
          ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-xl'
          : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-sm'
      }`}
    >
      {/* Header bar */}
      <div
        className={`flex items-center justify-between border-b pb-3 ${
          isDark ? 'border-zinc-800' : 'border-slate-300'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isReady ? 'bg-emerald-400' : 'bg-cyan-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isReady ? 'bg-emerald-500' : 'bg-cyan-500'
              }`}
            />
          </span>
          <span
            className={`text-xs font-bold tracking-tight ${
              isDark ? 'text-zinc-100' : 'text-slate-900'
            }`}
          >
            Automated Facility Triage
          </span>
        </div>
        <span
          className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
            isReady
              ? isDark
                ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                : 'text-emerald-800 bg-emerald-100 border-emerald-300'
              : isDark
              ? 'text-zinc-400 bg-zinc-800 border-zinc-700'
              : 'text-slate-600 bg-slate-200 border-slate-300'
          }`}
        >
          {isReady ? 'Ready to Submit' : 'Awaiting Input'}
        </span>
      </div>
```

### Plain-English Purpose
Renders the card wrapper and header bar. The header features an animated radar beacon:
- When the student hasn't typed enough text, the beacon pulses in calm **cyan** and the badge reads *"Awaiting Input"*.
- As soon as both fields exceed the length thresholds, the beacon transitions to **emerald green** and the badge reads *"Ready to Submit"*.

### Line-by-Line Breakdown
- `animate-ping`: Tailwind CSS keyframe animation causing a semi-transparent ring to expand and fade outwards like a radar ping.
- `isReady ? 'bg-emerald-400' : 'bg-cyan-400'`: Dynamic color switching based on input readiness.

---

```javascript
      {/* Explanatory text */}
      <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
        When you submit your complaint, it is automatically categorized to the right maintenance
        department, assigned a resolution timeline, and sent to the campus squad.
      </p>

      {/* Campus Service Domains */}
      <div className="space-y-1.5">
        <span
          className={`text-[10px] font-mono uppercase tracking-wider block font-bold ${
            isDark ? 'text-zinc-500' : 'text-slate-500'
          }`}
        >
          6 Maintenance Categories
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DEPARTMENTS.map((dept) => (
            <div
              key={dept.name}
              className={`p-2.5 rounded-xl border flex flex-col justify-between transition-colors ${
                isDark
                  ? 'bg-[#0e1117] border-zinc-800 hover:border-zinc-700'
                  : 'bg-[#e2e8f0] border-slate-300 hover:border-slate-400 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-base">{dept.icon}</span>
                <span
                  className={`text-xs font-bold truncate ${
                    isDark ? 'text-zinc-200' : 'text-slate-800'
                  }`}
                >
                  {dept.name}
                </span>
              </div>
              <span
                className={`text-[10px] mt-1 line-clamp-1 ${
                  isDark ? 'text-zinc-400' : 'text-slate-600'
                }`}
              >
                {dept.scope}
              </span>
            </div>
          ))}
        </div>
      </div>
```

### Plain-English Purpose
Renders an explanatory description and a responsive grid (2 columns on mobile, 3 columns on tablet/desktop) listing all six maintenance categories. Each card presents the emoji icon, category title, and a one-line overview of items handled by that department.

---

```javascript
      {/* Dynamic SLA Commitments */}
      <div className="space-y-1.5 pt-1">
        <span
          className={`text-[10px] font-mono uppercase tracking-wider block font-bold ${
            isDark ? 'text-zinc-500' : 'text-slate-500'
          }`}
        >
          Resolution Timeline Standards
        </span>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {SLA_TIERS.map((tier) => (
            <div
              key={tier.level}
              className={`p-2.5 rounded-xl border flex items-center justify-between ${
                isDark ? tier.colorDark : tier.colorLight
              }`}
            >
              <div>
                <span className="block font-black text-xs">{tier.level}</span>
                <span className="block text-[10px] opacity-80">{tier.desc}</span>
              </div>
              <span className="font-mono font-black text-xs shrink-0 ml-1">{tier.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Routine Complaint Assurance */}
      <div
        className={`p-2.5 rounded-xl border flex items-center gap-2 text-[11px] ${
          isDark
            ? 'bg-[#0e1117] border-zinc-800 text-zinc-400'
            : 'bg-[#e2e8f0] border-slate-300 text-slate-700 shadow-2xs'
        }`}
      >
        <span className="text-emerald-500 font-bold">✓ Direct Routing:</span>
        <span className="leading-tight">
          No manual department selection needed. Type naturally and submit.
        </span>
      </div>
    </div>
  );
}
```

### Plain-English Purpose
Renders the SLA commitments grid and the bottom reassurance callout. The SLA grid lays out the 4 severity tiers with bold time allocations (`2h SLA`, `8h SLA`, `24h SLA`, `72h SLA`). The footer callout reminds students that they do not need to guess which department manages their issue—they simply write in natural English, and the system routes it automatically upon submission.

---

## 3. High-Frequency Viva & Technical Defense Questions

### Q1: Why does this component not execute background API requests while the user is typing?
**Model Answer:**  
Triggering live AI inference on every keystroke or after short debounced delays leads to **unnecessary server load and API cost**. In an institution with thousands of students, continuous background querying would burn CPU cycles and rate limits on incomplete sentences. Instead, `LiveTriageCard` functions as an instantaneous, client-side visual guide that confirms input readiness and educates the user on service standards, deferring backend classification until the student clicks "Submit Complaint".

### Q2: What criteria determine when the status switches to "Ready to Submit"?
**Model Answer:**  
The status is governed by:
`const isReady = cleanTitle.length >= 5 && cleanDesc.length >= 10;`
The backend Pydantic schema (`ComplaintCreate`) enforces a minimum title length of 5 characters and description length of 10 characters. Evaluating this locally ensures the submit button is only highlighted when inputs are guaranteed to pass schema validation.

### Q3: What are the 6 campus maintenance categories supported by the platform?
**Model Answer:**  
1. **Electrical**: Power, lights, fans, AC units, circuit breakers, geysers.
2. **Plumbing**: Pipes, leaks, taps, drinking water RO units, flush tanks, drainage.
3. **Sanitation**: Waste disposal, cleaning, hygiene maintenance, pest control.
4. **Carpentry**: Wooden doors, window frames, desks, chairs, locks, hinges.
5. **IT Support**: Campus Wi-Fi access points, Ethernet ports, internet, smart displays.
6. **Facilities**: Campus roads, security gates, streetlights, directional signage.

### Q4: How does the animated beacon in the header work in CSS?
**Model Answer:**  
It uses two layered HTML `<span>` elements:
1. An outer `<span>` styled with Tailwind's `animate-ping absolute inline-flex h-full w-full rounded-full opacity-75`. The `animate-ping` utility scales the circle to double its size while fading opacity to zero, mimicking a sonar pulse.
2. An inner stationary `<span>` with `relative inline-flex rounded-full h-2.5 w-2.5` that renders the solid core dot.

### Q5: Why is this guide helpful for student user experience (UX)?
**Model Answer:**  
Traditional campus grievance portals require students to select dropdowns with confusing technical categories (e.g. *"HVAC Substation B"* vs *"Estate Distribution"*). If a student picks the wrong category, their ticket sits unread for days. `LiveTriageCard` reassures the student that they only need to describe their problem in plain words, setting clear expectations for turnaround times.

---

## 4. Quick Reference Summary Table

| UI Section | Data Source | Visual Representation | Key UX Benefit |
| :--- | :--- | :--- | :--- |
| **Status Beacon** | `isReady` calculation | Cyan (Awaiting) &rarr; Emerald (Ready) with `animate-ping` | Live feedback on character minimums |
| **Maintenance Grid** | `DEPARTMENTS` array | 6 cards with emojis and scope descriptions | Informs user which campus services exist |
| **SLA Standards** | `SLA_TIERS` array | 4 color-coded cards with time allocations | Sets clear resolution expectations |
| **Direct Routing Banner** | Static JSX | Emerald checkmark and reassurance copy | Eliminates anxiety over category selection |
