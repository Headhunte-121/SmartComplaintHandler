# Design System & Tailwind Utility Architecture (`frontend/tailwind.config.js`)

Comprehensive architectural and line-by-line documentation for `frontend/tailwind.config.js`. This document provides collegiate viva committees, code reviewers, and design engineers with an exhaustive dissection of class-based dark mode activation, tree-shaking content scanners, semantic color token systems, and custom micro-interaction keyframe animations.

---

## 1. Module Overview & Source Code

```javascript
/**
 * SmartComplaintHandler - Tailwind CSS Configuration
 * Clean Light Theme: Primary White & Secondary Light Green Design System
 * - Primary Canvas: #FFFFFF / #F8FAF9 (Crisp, modern, high-contrast white base)
 * - Secondary Accent: #16A34A / #22C55E (Fresh Light Green)
 * - Secondary Tints: #F0FDF4 (50), #DCFCE7 (100), #BBF7D0 (200), #86EFAC (300)
 * - Typography: #0F172A (Slate 900 Charcoal), #475569 (Slate 600 Muted)
 */
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        // Semantic primary white and secondary green palette
        brand: {
          primary: '#FFFFFF',
          secondary: '#16A34A',
          accent: '#22C55E',
          canvas: '#F8FAF9',
          surface: '#FFFFFF',
          border: '#E2E8F0',
          charcoal: '#0F172A',
          muted: '#475569',
        },
        lightgreen: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
        },
        hazard: {
          critical: '#EF4444',
          high: '#F97316',
          medium: '#EAB308',
          low: '#22C55E',
        },
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'xs': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'bento': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
        'bento-hover': '0 10px 25px -5px rgba(22, 163, 74, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
        'glow-green': '0 0 20px -3px rgba(34, 197, 94, 0.35)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.65' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-subtle': 'pulseSubtle 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
```

### Plain-English Purpose (Analogy in C/Python)
In standard software design, you never hardcode magic hex values like `#16A34A` or `#EF4444` directly inside 50 different source files. In C, you define header constants or enums (`#define COLOR_CRITICAL 0xEF4444`). 

In modern web design, `tailwind.config.js` is the **Design System Specification**. It defines the unified color palette, typography font stacks, shadow depths, and animation curves for the entire web client. Furthermore, Tailwind uses this file to configure its **Just-in-Time (JIT) Purge Engine**: it scans your code for used class names and purges unused CSS rules, shrinking the compiled stylesheet from $3\text{ MB}$ down to less than $25\text{ KB}$!

---

## 2. Line-by-Line Breakdown

- **Lines 1–8**: Comment header defining the high-contrast light and dark design system tokens.
- **Line 10**: `export default { ... }`: Exports Tailwind's root configuration object.
- **Line 11**: `darkMode: 'class'`: Configures class-based dark mode. Instead of relying purely on OS-level media queries (`media`), dark styling is triggered whenever the `.dark` CSS class is present on `<html>`. This allows users to manually toggle dark mode via the application header.
- **Lines 12–15**: `content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"]`: Specifies the glob pattern for files Tailwind must scan. The JIT engine inspects these files to generate only the CSS rules actually utilized in the application.
- **Lines 16–17**: `theme.extend`: Extends Tailwind's default design system without overwriting standard utilities.
- **Lines 18–21**: `fontFamily`:
  - `sans`: Prioritizes `Inter` followed by system fallbacks (`-apple-system`, `Segoe UI`, `Roboto`).
  - `mono`: Prioritizes `JetBrains Mono` for ticket codes and telemetry numbers.
- **Lines 22–65**: `colors`:
  - `brand`: Semantic UI colors (canvas, surface, borders, charcoal typography).
  - `lightgreen`: 10-shade green spectrum (`50` to `900`) representing institutional branding.
  - `hazard`: Standardized status alert colors (`critical: #EF4444`, `high: #F97316`, `medium: #EAB308`, `low: #22C55E`).
- **Lines 66–72**: `boxShadow`: Custom elevation curves:
  - `'bento'` & `'bento-hover'`: Soft, modern shadows with green tint for dashboard cards.
  - `'glow-green'`: Accent glow effect for active telemetry indicators.
- **Lines 73–82**: `keyframes`:
  - `fadeIn`: Micro-transition shifting an element up by $6\text{ px}$ while fading opacity from 0 to 1.
  - `pulseSubtle`: Gentle breathing opacity pulse between 1.0 and 0.65.
- **Lines 83–86**: `animation`: Declares reusable class names (`animate-fade-in`, `animate-pulse-subtle`) using smooth cubic-bezier easing curves (`cubic-bezier(0.16, 1, 0.3, 1)`).

---

## 3. Deep Term & Concept Expansion

- **Class-Based Dark Mode (`darkMode: 'class'`)**: In standard CSS, `@media (prefers-color-scheme: dark)` only listens to the user's operating system settings. By specifying `darkMode: 'class'`, Tailwind generates CSS rules prefixed with `.dark` (e.g., `.dark .dark\:bg-zinc-900`). This gives the React application full state-driven control: users can switch between Dark and Light mode via a single button click, which adds or removes the class on `document.documentElement`.
- **Tailwind JIT (*Just-in-Time*) Compiler**: Legacy CSS frameworks included thousands of pre-compiled rules in massive stylesheets ($1\text{–}3\text{ MB}$). Tailwind's JIT compiler parses source files in real-time, finds tokens matching regular expressions, and emits only the exact CSS declarations present in the codebase. In production, this drops CSS bundle size to $<25\text{ KB}$, speeding up initial render times dramatically.

---

## 4. Runtime Mechanics & Security

- **CSS Sanitization**: Because Tailwind generates atomic CSS classes at build time and does not interpret arbitrary string concatenation at runtime (e.g., `text-${color}` is prohibited unless safelisted), it prevents CSS injection and styling corruption.
- **Micro-Interaction Performance**: The custom animations (`fadeIn`) only animate CSS properties (`opacity` and `transform`) that run directly on the browser's **GPU compositor thread**. They never trigger CPU-heavy layout recalculations or repaints, guaranteeing smooth $60\text{ FPS}$ transitions even on low-end mobile devices.

---

## 5. High-Frequency Viva & Technical Defense Guide

### Q1: What is the difference between `darkMode: 'media'` and `darkMode: 'class'`?
**Viva Answer**: `darkMode: 'media'` strictly follows the host operating system's dark mode preference via CSS media queries. `darkMode: 'class'` allows manual programmatic control: Tailwind looks for a `.dark` class on the root `<html>` element. This enables our `ThemeContext` to toggle and persist user preferences in `localStorage` regardless of OS settings.

### Q2: How does Tailwind CSS maintain such small bundle sizes in production?
**Viva Answer**: Through its **JIT Content Scanner** (`content: [...]`). During build time, Tailwind scans all specified template files, extracts the exact utility classes used, and discards all unused styles. The resulting production CSS file contains only active rules and typically measures under $25\text{ KB}$ gzipped.

### Q3: Why are animations restricted to `transform` and `opacity`?
**Viva Answer**: Modifying properties like `width`, `height`, or `top` forces the browser to recalculate element geometry (the **Layout / Reflow** stage) and repaint pixels, causing lag. Animating `transform` (e.g., `translateY(6px)`) and `opacity` runs on the GPU compositor thread without triggering layout reflows, ensuring buttery $60\text{ FPS}$ performance.

---

## 6. Quick Reference Summary Table

| Key / Section | Type / Value | Operational Definition |
| :--- | :--- | :--- |
| `darkMode` | `'class'` | Activates dark styles via `.dark` class on `<html>` element |
| `content` | Array of Globs | File paths scanned by JIT engine to generate utility rules |
| `fontFamily` | Font Stacks | Defines `sans` (`Inter`) and `mono` (`JetBrains Mono`) typography |
| `colors.brand` | Color Palette | Institutional high-contrast canvas, surface, and charcoal tokens |
| `colors.hazard`| Color Palette | Standardized alert tiers for CRITICAL, HIGH, MEDIUM, and LOW issues |
| `fadeIn` | CSS Keyframe | Smooth upward fade transition for modals and view changes |
