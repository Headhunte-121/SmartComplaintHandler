# DigitalTwinCanvas.jsx — Exhaustive Sequential Technical Documentation

> **File Path**: `frontend/src/components/campusTwin/DigitalTwinCanvas.jsx`  
> **Target Audience**: College Viva Examiners, Project Review Committee, Academic Evaluators, and Engineers grounded in foundational C and Python programming.  
> **Module Classification**: Frontend Campus Digital Twin Rendering Engine / High-Performance 2D Vector Cartographic Viewport.

---

## 1. Module Overview & Architectural Purpose

In traditional web applications, campus maps are often embedded as static image files (`.png`, `.jpg`) or via third-party raster tile services like Google Maps or Leaflet. While functional, raster approaches suffer from severe limitations in college management portals:
1. **Resolution Degradation**: Zooming into specific laboratory rooms pixelates raster images.
2. **Lack of Semantic Interactivity**: Static images cannot dynamically respond to database states, such as highlighting where an active water leakage ticket is situated or pulsing a radar beacon on a specific classroom.
3. **Heavy External Dependencies**: Third-party map SDKs require external API keys, continuous internet access to tile CDNs, and carry heavy JavaScript bundle footprints (often $200\text{ KB} - 1\text{ MB}$).

`DigitalTwinCanvas.jsx` solves this by implementing a **pure vector SVG (Scalable Vector Graphics) 2D Digital Twin Canvas** for the International Institute of Information Technology, Naya Raipur (IIITNR). 

### Foundational Programming Analogy (C & Python)
- In **C graphics programming** (such as Turbo C's `graphics.h` or SDL2), you define a virtual screen canvas with fixed logical coordinates (e.g., $1080 \times 800$), draw primitives (`line()`, `polygon()`, `circle()`), and apply mathematical matrix transformations $(\Delta x, \Delta y, s)$ to pan and zoom the camera without altering the underlying coordinate data.
- In **Python (`matplotlib` or `Pygame`)**, you define an array of polygon vertices and call an update loop that repaints the elements inside a viewport based on user mouse offsets.
- `DigitalTwinCanvas.jsx` operates exactly like this C/Python graphics pipeline: it consumes pure geometric vertex data from `campusGeometry.js`, applies real-time 2D affine transformations (`translate(pan.x, pan.y) scale(zoom)`), and utilizes the SVG Document Object Model (DOM) to render buildings, roads, footpaths, dynamic hover tooltips, and radar focus rings at native 60+ FPS display refresh rates.

---

## 2. Integrated Sequential Code Walkthrough & Inline Technical Breakdown

Below is the exhaustive, sequential, line-by-line examination of `DigitalTwinCanvas.jsx`. Every import, function, hook, conditional branch, and SVG tag is analyzed in depth.

---

### Snippet 1: Module Header & Geometric Asset Imports

```javascript
/**
 * frontend/src/components/campusTwin/DigitalTwinCanvas.jsx
 * Highly Interactive, Fluid GIS Digital Twin Renderer for IIIT Naya Raipur.
 * Supports smooth drag-to-pan, cursor-centered wheel zoom, double-click focus,
 * entrance inspection, and active plinth glow effects.
 */
import React, { useState, useEffect } from 'react';
import {
  IIITNR_CAMPUS_PERIMETER_POINTS,
  INNER_CAMPUS_CLIP_POINTS,
  IIITNR_CAMPUS_BOUNDARY_CORNERS,
  LABEL_POSITIONS,
  EXACT_BUILDING_POLYGONS,
  CAMPUS_ROAD_POLYLINES,
  CAMPUS_FOOTPATH_POLYLINES,
} from '../../data/campusTwin/campusGeometry';
```

#### Plain-English Purpose & C/Python Analogy
This block imports React's fundamental lifecycle primitives (`useState`, `useEffect`) and cartographic constant datasets from `campusGeometry.js`. 
- In **C**, this is equivalent to `#include <stdio.h>` followed by `#include "campus_geometry.h"`, where the header defines constant global coordinate lookup arrays (`const Point PERIMETER[]`, `const Building EXACT_BUILDINGS[]`).
- In **Python**, this is equivalent to importing stateful engine tools (`import tkinter as tk`) and importing geometry dictionaries (`from campus_geometry import IIITNR_CAMPUS_PERIMETER_POINTS, ...`).

#### Line-by-Line Breakdown
- **Lines 1–6**: Docstring identifying the component's role as the interactive GIS (Geographic Information System) Digital Twin viewport.
- **Line 7**: Imports `React`, `useState` (for managing local hover states such as entrance tooltips), and `useEffect` (for attaching native non-passive event listeners to the DOM).
- **Lines 8–16**: Imports seven geometric datasets:
  - `IIITNR_CAMPUS_PERIMETER_POINTS`: Polygon coordinate string defining the outer property fence of the campus.
  - `INNER_CAMPUS_CLIP_POINTS`: Boundary string defining the green turf and developed internal campus grounds used for SVG clipping.
  - `IIITNR_CAMPUS_BOUNDARY_CORNERS`: Coordinate array for surveying markers.
  - `LABEL_POSITIONS`: Normalized $(x, y)$ coordinate offsets for floating text badge anchors.
  - `EXACT_BUILDING_POLYGONS`: Master dictionary of structural polygons, wings, courtyards, centroids, and entrance coordinates.
  - `CAMPUS_ROAD_POLYLINES`: Polyline paths and asphalt stroke widths representing paved vehicular roads.
  - `CAMPUS_FOOTPATH_POLYLINES`: Polyline paths representing pedestrian walkways and jogging tracks.

---

### Snippet 2: Component Signature & Props Interface

```javascript
export default function DigitalTwinCanvas({
  svgRef,
  buildings = [],
  activeBuildingObj,
  hoveredId,
  setHoveredId = () => {},
  onSelectBuilding,
  setEditingBuildingId = () => {},
  setDraggingId = () => {},
  isSuperAdmin = false,
  isEditMode = false,
  twinTheme = 'light',
  showLabels = true,
  showPathsAndCourts = true,
  showBoundary = true,
  zoom = 1,
  pan = { x: 0, y: 0 },
  isPanning = false,
  radarTarget,
  handleSvgClick = () => {},
  handleMouseDown = () => {},
  handleMouseMove = () => {},
  handleMouseUp = () => {},
  handleWheel = () => {},
  handleDoubleClick = () => {},
  handleTouchStart = () => {},
  handleTouchMove = () => {},
  handleTouchEnd = () => {},
  handleKeyDown = () => {},
}) {
  const [hoveredEntrance, setHoveredEntrance] = useState(null);
  const isLight = twinTheme === 'light';
  const isBlueprint = twinTheme === 'blueprint';
```

#### Plain-English Purpose & C/Python Analogy
This function defines the `DigitalTwinCanvas` component and destructures its input configuration parameters (props). 
- In **C**, this is equivalent to defining a renderer function taking a pointer to a canvas configuration struct: `void RenderDigitalTwin(const CanvasConfig* cfg)`.
- In **Python**, it resembles `def render_digital_twin(**kwargs):`, where each parameter controls viewport coordinates, operational modes, and interaction callbacks.

#### Line-by-Line Breakdown
- **Line 18**: Declares and exports the default functional component `DigitalTwinCanvas`.
- **Line 19**: `svgRef`: A React ref (pointer to the underlying `<svg>` DOM node created via `useRef`), enabling direct native event attachment and bounding box measurements (`getBoundingClientRect()`).
- **Line 20**: `buildings = []`: Array of building entities fetched from backend or local data structures. Defaulted to an empty array to prevent `null.map()` crashes.
- **Line 21**: `activeBuildingObj`: The currently selected building object (or `null` if none selected).
- **Line 22–23**: `hoveredId`, `setHoveredId`: Identifier and state-setter for the building currently under the user's mouse cursor.
- **Line 24**: `onSelectBuilding`: Callback invoked when a user clicks on a building geometry or label.
- **Lines 25–26**: `setEditingBuildingId`, `setDraggingId`: Callbacks for Super Admin spatial editing features.
- **Lines 27–28**: `isSuperAdmin`, `isEditMode`: Boolean authorization and mode flags enabling administrative geometric alterations.
- **Line 29**: `twinTheme = 'light'`: Color palette selector (`'light'`, `'dark'`, or `'blueprint'`).
- **Lines 30–32**: `showLabels`, `showPathsAndCourts`, `showBoundary`: Layer visibility toggles (similar to GIS layer filters).
- **Lines 33–35**: `zoom = 1`, `pan = { x: 0, y: 0 }`, `isPanning = false`: Real-time camera state controlled by the physics hook (`useMapCamera`).
- **Line 36**: `radarTarget`: Coordinate object `{ cx, cy }` indicating an active ticket beacon location requiring visual pulsing focus.
- **Lines 37–46**: Event handler callbacks passed from the camera physics hook for mouse, touch, and keyboard interactions. Defaulted to no-op functions `() => {}` to guard against `undefined` execution crashes.
- **Line 48**: `const [hoveredEntrance, setHoveredEntrance] = useState(null)`: Local state storing metadata `{ name, x, y, bId }` for a building entrance hovered by the mouse.
- **Lines 49–50**: `isLight`, `isBlueprint`: Derived boolean flags for rapid theme styling checks.

---

### Snippet 3: Non-Passive Wheel Event Interception Hook

```javascript
  // Attach non-passive wheel event listener strictly to the SVG canvas.
  // When cursor is over the selection tab or UI overlays, wheel events are never intercepted,
  // allowing free scrolling of the selection card and webpage.
  useEffect(() => {
    const svgEl = svgRef?.current;
    if (!svgEl) return;

    const onWheelNative = (e) => {
      // Only intercept if the event target is directly inside the SVG canvas
      const isTargetOnSvg = e.target && (e.target === svgEl || svgEl.contains(e.target));
      if (!isTargetOnSvg) {
        return;
      }

      // Zoom the map and prevent browser window scroll while cursor is over the campus canvas
      e.preventDefault();
      e.stopPropagation();
      if (handleWheel) {
        handleWheel(e);
      }
    };

    svgEl.addEventListener('wheel', onWheelNative, { passive: false });
    return () => {
      svgEl.removeEventListener('wheel', onWheelNative);
    };
  }, [svgRef, handleWheel]);
```

#### Plain-English Purpose & C/Python Analogy
In modern web browsers, mouse wheel scrolling defaults to **passive event listening** for performance: the browser assumes wheel events will simply scroll the web page, so calling `e.preventDefault()` inside a standard React `onWheel` prop is disallowed and ignored. This causes a jarring UX bug: zooming the campus map simultaneously scrolls the entire browser page up and down!
- In **C/Win32 programming**, this is equivalent to capturing window message `WM_MOUSEWHEEL` in your custom graphics window procedure and returning `0` to signal the operating system that the event was handled and must not bubble up to the parent window scrollbar.
- In this React hook, we bypass React's synthetic event system and bind directly to the raw SVG DOM node using `{ passive: false }`. This permits `e.preventDefault()`, locking the page scroll while the user zooms into campus facilities.

#### Line-by-Line Breakdown
- **Lines 55–57**: `useEffect` runs once on mount and whenever `svgRef` or `handleWheel` changes. Reads `svgRef.current` (the raw SVG element). If null, exits immediately.
- **Line 59**: Defines `onWheelNative(e)`: The low-level DOM event handler.
- **Lines 61–64**: Evaluates `isTargetOnSvg`: Verifies that the event target is either the SVG itself or a child element inside it. If false (e.g. over a floating search bar or side drawer), it returns early, allowing normal HTML card scrolling.
- **Lines 67–68**: `e.preventDefault()` stops browser page scrolling. `e.stopPropagation()` stops parent DOM event bubbling.
- **Lines 69–71**: Dispatches the event to `handleWheel(e)` (the invariant focal-point zooming physics engine in `useMapCamera`).
- **Line 74**: Attaches the listener with `{ passive: false }` explicitly configured.
- **Lines 75–77**: **Cleanup Function**: When the component unmounts, `removeEventListener` removes the hook to prevent memory leaks and dangling pointer references.

---

### Snippet 4: Building Vector Geometry Sub-Renderer (`renderBuildingGeometry`)

```javascript
  const renderBuildingGeometry = (b) => {
    const isSelected = activeBuildingObj?.id === b.id;
    const isHovered = hoveredId === b.id;
    const P = EXACT_BUILDING_POLYGONS[b.id];
    const cx = b.trace?.cx ?? P?.cx ?? 606;
    const cy = b.trace?.cy ?? P?.cy ?? 524;
    const w = b.trace?.w || P?.w || 54;
    const h = b.trace?.h || P?.h || 46;
    const baseColor = b.color || b.trace?.color || b.mapPin?.color || P?.color || '#0284c7';

    const fillOpacity = isBlueprint ? 0.35 : isSelected ? 0.98 : isLight ? 0.92 : 0.88;
    const strokeColor = isSelected
      ? '#22c55e'
      : isHovered
      ? (isLight ? '#334155' : '#94a3b8')
      : (isLight ? '#cbd5e1' : '#27272a');
    const strokeWidth = isSelected ? 2.8 : isHovered ? 2.2 : 1.4;

    const wings = P?.wings || [];
    const courtyards = P?.courtyards || [];
    const entrances = b.entrances || P?.entrances || [];

    const filterUrl = isSelected ? 'url(#activeShadow)' : isHovered ? 'url(#hoverShadow)' : undefined;
```

#### Plain-English Purpose & C/Python Analogy
This function converts a building data model `b` into SVG graphical elements. It computes dynamic styling attributes (fill color, opacity, stroke outline, shadow filters) based on selection and hover states.
- In **C/C++ game development**, this is the "Render Entity" subroutine. It checks `if (entity->is_selected) set_color(GREEN); else set_color(BASE);` before issuing draw calls.
- In **Python**, it acts like a styling factory that returns a dictionary of SVG properties.

#### Line-by-Line Breakdown
- **Line 80**: Declares `renderBuildingGeometry(b)` receiving building object `b`.
- **Lines 81–82**: Evaluates `isSelected` and `isHovered` by comparing IDs.
- **Line 83**: Retrieves polygon configuration `P` from `EXACT_BUILDING_POLYGONS` dictionary.
- **Lines 84–87**: Nullish coalescing fallbacks (`??` and `||`) extracting center coordinates `(cx, cy)` and dimensions `(w, h)`, ensuring fallback coordinates (`606, 524`) if data is missing.
- **Line 88**: Resolves building theme color through a cascade: database color &rarr; trace color &rarr; map pin color &rarr; polygon default &rarr; fallback sky blue (`#0284c7`).
- **Line 90**: Computes `fillOpacity`: 35% in blueprint mode, 98% when selected, 92% in light mode, 88% in dark mode.
- **Lines 91–96**: Sets dynamic `strokeColor` (vivid emerald `#22c55e` when selected, slate when hovered/default) and `strokeWidth` (2.8px active, 2.2px hover, 1.4px resting).
- **Lines 98–100**: Extracts architectural subdivisions: `wings` (structural blocks), `courtyards` (open-air atriums), and `entrances` (doors/gates).
- **Line 102**: Assigns SVG drop shadow filter URLs: `#activeShadow` or `#hoverShadow`.

---

### Snippet 5: Building Geometry SVG Output (Wings, Courtyards, Fallback Rectangles & Entrances)

```javascript
    return (
      <g
        key={`geom-${b.id}`}
        data-bldg-id={b.id}
        filter={filterUrl}
        onMouseEnter={() => setHoveredId(b.id)}
        onMouseLeave={() => setHoveredId(null)}
        onClick={(e) => {
          e.stopPropagation();
          setEditingBuildingId(b.id);
          if (onSelectBuilding) onSelectBuilding(b.name, b.id);
        }}
        className="cursor-pointer transition-all duration-150"
      >
        {courtyards.map((cyard, idx) => (
          <polygon
            key={`cyard-${idx}`}
            points={cyard.points}
            fill={baseColor}
            fillOpacity={0.85}
            stroke={isLight ? '#cbd5e1' : '#27272a'}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        ))}

        {wings.map((wing, idx) => (
          <g key={`wing-${idx}`}>
            <polygon
              points={wing.points}
              transform="translate(2.5, 3.5)"
              fill={isLight ? 'rgba(15, 23, 42, 0.15)' : 'rgba(0, 0, 0, 0.45)'}
            />
            <polygon
              points={wing.points}
              fill={baseColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          </g>
        ))}

        {wings.length === 0 && courtyards.length === 0 && (
          <g transform={`translate(${cx}, ${cy})`}>
            <rect
              x={-w / 2}
              y={-h / 2}
              width={w}
              height={h}
              rx="6"
              fill={baseColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </g>
        )}

        {showPathsAndCourts &&
          entrances.map((ent, idx) => {
            const isEntHovered = hoveredEntrance?.name === ent.name && hoveredEntrance?.bId === b.id;
            return (
              <circle
                key={`ent-${idx}`}
                cx={ent.x}
                cy={ent.y}
                r={isEntHovered ? 7.5 : 4.5}
                fill="#10b981"
                stroke={isLight ? '#ffffff' : '#161b22'}
                strokeWidth="1.5"
                className="transition-all duration-150 cursor-pointer"
                onMouseEnter={(e) => {
                  e.stopPropagation();
                  setHoveredEntrance({ ...ent, bId: b.id });
                }}
                onMouseLeave={(e) => {
                  e.stopPropagation();
                  setHoveredEntrance(null);
                }}
              />
            );
          })}
      </g>
    );
  };
```

#### Plain-English Purpose & C/Python Analogy
This JSX structure renders the actual SVG DOM tree for each building. 
- In **C graphics**, drawing a 3D-like isometric building involves drawing a ground-level shadow polygon offset by $(+2.5, +3.5)$, then drawing the main building polygon over it, followed by doorway circles.
- In **Python (`turtle` or SVG builders)**, it corresponds to iterating through polygon coordinate lists and stamping shapes into the vector canvas.

#### Line-by-Line Breakdown
- **Lines 105–117**: Encapsulates the building in an SVG group `<g>`:
  - `data-bldg-id`: Custom DOM attribute enabling automated Cypress/Jest testing hooks.
  - `filter`: Applies the drop shadow filter.
  - `onMouseEnter` / `onMouseLeave`: Updates `hoveredId` in parent state.
  - `onClick`: Calls `e.stopPropagation()` so clicking a building selects it rather than resetting camera pan on the root canvas. Calls `onSelectBuilding(b.name, b.id)`.
- **Lines 118–128**: Maps through `courtyards`, drawing inner atriums with `strokeLinejoin="round"` to eliminate sharp polygon artifacts.
- **Lines 130–146**: Maps through `wings`:
  - First `<polygon>`: Renders an architectural shadow with `transform="translate(2.5, 3.5)"` and translucent dark fill.
  - Second `<polygon>`: Renders the building's physical roof plinth with `fillOpacity`, `strokeColor`, and `strokeWidth`.
- **Lines 148–162**: Fallback renderer: If a building has no bespoke wing coordinates, renders a centered rounded rectangle `<rect rx="6">` centered at `(-w/2, -h/2)` relative to `(cx, cy)`.
- **Lines 164–188**: Maps through `entrances`:
  - Renders an emerald circular portal (`#10b981`) at `(ent.x, ent.y)`.
  - Radius expands dynamically from $4.5\text{px}$ to $7.5\text{px}$ when hovered (`isEntHovered`).
  - Sets `hoveredEntrance` state to trigger the floating door tooltip.

---

### Snippet 6: Dynamic Floating Label & Indicator Pill Sub-Renderer (`renderBuildingLabel`)

```javascript
  const renderBuildingLabel = (b) => {
    const isSelected = activeBuildingObj?.id === b.id;
    const isHovered = hoveredId === b.id;
    if (!showLabels && !isSelected && !isHovered) return null;

    const P = EXACT_BUILDING_POLYGONS[b.id];
    const cx = b.trace?.cx ?? P?.cx ?? 606;
    const cy = b.trace?.cy ?? P?.cy ?? 524;
    const baseColor = b.color || b.trace?.color || b.mapPin?.color || P?.color || '#0284c7';
    const labelPos = LABEL_POSITIONS[b.id] || { x: cx, y: cy - 32 };

    const badgeText = b.trace?.badge || b.mapPin?.badge || P?.badge || 'ZONE';
    const shortText = b.shortName || b.name || 'Building';

    const badgeWidth = Math.max(24, badgeText.length * 6.4 + 10);
    const textWidth = shortText.length * 6.5;
    const pillWidth = Math.max(108, Math.round(badgeWidth + textWidth + 22));
    const pillHeight = 22;

    const pillBg = isSelected
      ? '#15803d'
      : isLight
      ? 'rgba(255, 255, 255, 0.98)'
      : 'rgba(22, 27, 34, 0.96)';
    const pillTextFill = isSelected ? '#ffffff' : isLight ? '#0f172a' : '#f4f4f5';
    const pillBorderColor = isSelected
      ? '#166534'
      : isLight
      ? '#cbd5e1'
      : '#27272a';

    return (
      <g
        key={`lbl-${b.id}`}
        data-bldg-id={b.id}
        onMouseEnter={() => setHoveredId(b.id)}
        onMouseLeave={() => setHoveredId(null)}
        onClick={(e) => {
          e.stopPropagation();
          setEditingBuildingId(b.id);
          if (onSelectBuilding) onSelectBuilding(b.name, b.id);
        }}
        className="cursor-pointer transition-transform duration-150"
      >
        <line
          x1={cx}
          y1={cy}
          x2={labelPos.x}
          y2={labelPos.y}
          stroke={isSelected ? '#22c55e' : isLight ? '#94a3b8' : '#3f4b5c'}
          strokeWidth={isSelected ? '2' : '1.2'}
          strokeDasharray={isSelected ? 'none' : '3 2'}
          opacity="0.85"
          pointerEvents="none"
        />
        <g transform={`translate(${labelPos.x}, ${labelPos.y})`}>
          <rect
            x={-pillWidth / 2}
            y={-pillHeight / 2}
            width={pillWidth}
            height={pillHeight}
            rx="6.5"
            fill={pillBg}
            stroke={pillBorderColor}
            strokeWidth={isSelected ? '1.8' : '1.2'}
            filter={isSelected ? 'url(#activeShadow)' : undefined}
          />
          <rect
            x={-pillWidth / 2 + 3.5}
            y={-pillHeight / 2 + 3.5}
            width={badgeWidth}
            height={pillHeight - 7}
            rx="4"
            fill={isSelected ? '#14532d' : baseColor}
          />
          <text
            x={-pillWidth / 2 + 3.5 + badgeWidth / 2}
            y="3.5"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="8.5"
            fontWeight="800"
          >
            {badgeText}
          </text>
          <text
            x={-pillWidth / 2 + badgeWidth + 9}
            y="3.5"
            textAnchor="start"
            fill={pillTextFill}
            fontSize="9.8"
            fontWeight="800"
          >
            {shortText}
          </text>
        </g>
      </g>
    );
  };
```

#### Plain-English Purpose & C/Python Analogy
In CAD and GIS software, buildings require annotations (callout labels). If text is stamped directly inside the building geometry, it often collides with inner courtyards or overlaps with other buildings. This function creates an **anchor line callout**: a dashed line leads from the building's physical center `(cx, cy)` to a floating "pill badge" positioned at `labelPos`.
- In **C/Python graphics**, this is equivalent to drawing an indicator line `draw_line(cx, cy, lx, ly)` followed by a text bounding box `draw_rounded_box(lx, ly, text)`.

#### Line-by-Line Breakdown
- **Lines 193–195**: If labels are hidden globally (`showLabels === false`), labels only appear for the selected or hovered building.
- **Lines 197–201**: Looks up centroid and label coordinates from `LABEL_POSITIONS`.
- **Lines 203–209**: Dynamic typography dimensioning:
  - Calculates `badgeWidth = max(24, length * 6.4 + 10)`.
  - Calculates `textWidth = length * 6.5`.
  - Computes total `pillWidth` ensuring minimum length of $108\text{px}$ and fixed height of $22\text{px}$.
- **Lines 211–222**: Theming colors: When selected, the pill turns forest green (`#15803d`) with crisp white text. In resting mode, it adapts to slate/white based on dark/light theme.
- **Lines 236–246**: Renders SVG `<line>`: Connects `(cx, cy)` to `(labelPos.x, labelPos.y)`. Solid $2\text{px}$ green when selected, dashed $1.2\text{px}$ (`strokeDasharray="3 2"`) when resting. `pointerEvents="none"` prevents the line from blocking mouse hover events.
- **Lines 247–288**: Renders the composite pill:
  - Outer container `<rect rx="6.5">` with border and active shadow filter.
  - Left badge badge `<rect rx="4">` colored with the department's base color.
  - Centered acronym `<text>` (e.g., `"ACAD"`, `"B1"`, `"KRC"`).
  - Main building name `<text>` (e.g., `"Academic Block"`).

---

### Snippet 7: Z-Index Depth Sorting & Root SVG Architecture

```javascript
  const sortedBuildings = [...buildings].sort((a, b) => {
    const aPri = activeBuildingObj?.id === a.id ? 2 : hoveredId === a.id ? 1 : 0;
    const bPri = activeBuildingObj?.id === b.id ? 2 : hoveredId === b.id ? 1 : 0;
    return aPri - bPri;
  });

  return (
    <div
      className={`relative w-full overflow-hidden flex justify-center ${
        isLight ? 'border-slate-200 bg-[#f4f7f4]' : 'border-zinc-800 bg-[#0e1117]'
      }`}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 1080 800"
        onClick={handleSvgClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        className={`w-full max-h-[660px] select-none outline-none touch-none overscroll-contain focus:ring-1 focus:ring-emerald-500/30 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <defs>
          <clipPath id="iiitnrCampusClip">
            <polygon points={INNER_CAMPUS_CLIP_POINTS} />
          </clipPath>

          <filter id="activeShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity={isLight ? "0.2" : "0.5"} />
          </filter>

          <filter id="hoverShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#000000" floodOpacity={isLight ? "0.15" : "0.4"} />
          </filter>
        </defs>

        <rect x="0" y="0" width="1080" height="800" fill={isLight ? '#f4f7f4' : '#0e1117'} />
```

#### Plain-English Purpose & C/Python Analogy
In standard HTML/CSS, you control which element appears on top using CSS `z-index`. However, in standard SVG 1.1/2.0 specifications, **`z-index` does not exist**. SVG strictly uses the **Painter's Algorithm**: elements rendered later in the DOM tree are painted directly over elements rendered earlier.
If a selected building's label is rendered first, other non-selected building labels will paint over it, obscuring it!
- In **C graphics**, this is solved by sorting your render queue with `qsort()` using priority weights before calling `draw()`.
- In this code, `sortedBuildings` implements this exact sorting algorithm: resting buildings have priority `0`, hovered buildings have priority `1`, and the active selected building has priority `2`.

#### Line-by-Line Breakdown
- **Lines 292–296**: Clones and sorts `buildings` into `sortedBuildings` based on priority (`aPri - bPri`).
- **Lines 299–303**: Outer `<div>` container with theme-reactive background colors (`#f4f7f4` light, `#0e1117` dark).
- **Lines 304–318**: Root `<svg>` element:
  - `viewBox="0 0 1080 800"`: Defines the logical $1080\times 800$ cartographic coordinate space regardless of the physical screen pixel width.
  - Binds all interaction callbacks (`handleMouseDown`, `onTouchStart`, `onKeyDown`).
  - `tabIndex={0}`: Makes the SVG focusable for keyboard arrow-key navigation.
  - `cursor-grabbing` vs `cursor-grab`: Visual cursor cue indicating whether the user is actively dragging the map.
- **Lines 319–331**: `<defs>` block defining reusable SVG resources:
  - `<clipPath id="iiitnrCampusClip">`: Clips interior grass/turf to match survey boundaries.
  - `<feDropShadow>`: Hardware-accelerated GPU Gaussian drop shadows for hover and selection states.
- **Line 333**: Base canvas `<rect>` filling the entire $1080\times 800$ virtual canvas.

---

### Snippet 8: Camera Transformation Matrix & Geometric Layer Hierarchy

```javascript
        <g
          transform={`translate(${pan.x.toFixed(2)}, ${pan.y.toFixed(2)}) scale(${zoom.toFixed(4)})`}
          style={{
            transformOrigin: '0 0',
            willChange: 'transform',
          }}
        >
          <g clipPath="url(#iiitnrCampusClip)">
            <polygon points={INNER_CAMPUS_CLIP_POINTS} fill={isLight ? '#e4f0e7' : '#161b22'} />

            {/* Roads */}
            <g fill="none" strokeLinecap="round" strokeLinejoin="round">
              {CAMPUS_ROAD_POLYLINES.map((r, i) => (
                <polyline
                  key={`asphalt-${i}`}
                  points={r.points}
                  stroke={isLight ? '#94a3b8' : '#272e3b'}
                  strokeWidth={r.width}
                />
              ))}
            </g>

            {/* Footpaths */}
            {showPathsAndCourts && (
              <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                {CAMPUS_FOOTPATH_POLYLINES.map((p, idx) => (
                  <polyline
                    key={`fp-${idx}`}
                    points={p.points}
                    stroke={isLight ? '#94a3b8' : '#3f4b5c'}
                    strokeWidth="1.8"
                    strokeDasharray="3 3"
                  />
                ))}
              </g>
            )}
          </g>

          {/* Highway */}
          <polyline
            points="165,622 562,762 795,844"
            fill="none"
            stroke={isLight ? '#15803d' : '#2e7d32'}
            strokeWidth="2.4"
            pointerEvents="none"
          />

          {/* Boundary */}
          {showBoundary && (
            <polygon
              points={IIITNR_CAMPUS_PERIMETER_POINTS}
              fill="none"
              stroke={isLight ? '#15803d' : '#475569'}
              strokeWidth="1.8"
              strokeDasharray="8 5"
            />
          )}

          {/* Buildings */}
          {buildings.map((b) => renderBuildingGeometry(b))}
          {sortedBuildings.map((b) => renderBuildingLabel(b))}
```

#### Plain-English Purpose & C/Python Analogy
This block applies the master **Camera Transformation Matrix**. Rather than recalculating thousands of polygon $(x, y)$ vertices individually during every frame of a pan or zoom gesture (which would burn CPU cycles), the entire campus is wrapped inside a single top-level SVG group `<g>` that receives an affine transformation:
$$\begin{bmatrix} x' \\ y' \end{bmatrix} = \begin{bmatrix} \text{zoom} & 0 \\ 0 & \text{zoom} \end{bmatrix} \begin{bmatrix} x \\ y \end{bmatrix} + \begin{bmatrix} \text{pan.x} \\ \text{pan.y} \end{bmatrix}$$
- In **C graphics / OpenGL**, this is equivalent to calling `glTranslatef(pan.x, pan.y, 0)` followed by `glScalef(zoom, zoom, 1)`.
- In **Python (Pygame)**, this is setting a viewport offset on a master surface.

#### Line-by-Line Breakdown
- **Lines 335–341**: Master camera transformation group `<g>`. `toFixed(2)` and `toFixed(4)` prevent string float bloat. `willChange: 'transform'` signals the browser compositor to promote this SVG subtree to a dedicated GPU texture layer.
- **Lines 342–344**: Clipped campus grounds: Uses `clipPath="url(#iiitnrCampusClip)"` so internal green turf (`#e4f0e7` / `#161b22`) conforms exactly to surveyed campus limits.
- **Lines 346–355**: Renders vehicular roads: Iterates through `CAMPUS_ROAD_POLYLINES`, drawing asphalt polylines with `strokeLinecap="round"` and custom widths ($6\text{px} - 12\text{px}$).
- **Lines 357–370**: Renders pedestrian walkways: Iterates through `CAMPUS_FOOTPATH_POLYLINES` with dashed stroke (`strokeDasharray="3 3"`).
- **Lines 373–380**: Renders the state highway corridor passing along the campus perimeter with `pointerEvents="none"`.
- **Lines 382–391**: Renders the outer survey boundary fence with dashed pattern (`strokeDasharray="8 5"`).
- **Line 394**: Renders all building physical geometries via `buildings.map((b) => renderBuildingGeometry(b))`.
- **Line 395**: Renders all building labels using `sortedBuildings` so active and hovered labels paint on top.

---

### Snippet 9: Entrance Tooltip & Radar Target Beacon

```javascript
          {/* Entrance Tooltip */}
          {hoveredEntrance && (
            <g transform={`translate(${hoveredEntrance.x}, ${hoveredEntrance.y - 12})`} pointerEvents="none">
              <rect
                x="-65"
                y="-18"
                width="130"
                height="20"
                rx="6"
                fill={isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(22, 27, 34, 0.98)'}
                stroke={isLight ? '#cbd5e1' : '#27272a'}
                strokeWidth="1.2"
              />
              <text x="0" y="-4.5" textAnchor="middle" fill={isLight ? '#0f172a' : '#f4f4f5'} fontSize="9" fontWeight="bold">
                🚪 {hoveredEntrance.name}
              </text>
            </g>
          )}

          {/* Radar Target Focus Ring */}
          {radarTarget && (
            <g transform={`translate(${radarTarget.cx}, ${radarTarget.cy})`} pointerEvents="none">
              <circle cx="0" cy="0" r="32" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="4 4" className="animate-spin" />
              <circle cx="0" cy="0" r="5" fill="#22c55e" stroke={isLight ? '#ffffff' : '#0e1117'} strokeWidth="1.5" />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
```

#### Plain-English Purpose & C/Python Analogy
This final block renders contextual overlays inside the transformed coordinate space:
1. **Entrance Tooltip**: When a user hovers over an entrance dot, an annotation box displays the entrance name (e.g., `"🚪 Main Gate 1"`, `"🚪 West Service Entry"`).
2. **Radar Target Focus Ring**: When a complaint ticket or search result is located, a pulsing, spinning radar crosshair illuminates the exact target location.
- In **video game HUDs (Heads-Up Displays)**, this is the dynamic target lock reticle drawn at the target's world coordinates.

#### Line-by-Line Breakdown
- **Lines 398–414**: Evaluates `hoveredEntrance`. If non-null, translates to `(hoveredEntrance.x, hoveredEntrance.y - 12)`:
  - Renders tooltip background `<rect>` of size $130 \times 20\text{px}$ with rounded corners (`rx="6"`).
  - Renders centered `<text>` with doorway icon and entrance label.
  - `pointerEvents="none"` guarantees the tooltip never intercepts mouse moves, preventing cursor flickering.
- **Lines 416–422**: Evaluates `radarTarget`. If provided:
  - Outer `<circle r="32">`: Dashed stroke (`strokeDasharray="4 4"`) with CSS class `animate-spin` producing continuous rotational motion around the coordinate origin.
  - Inner `<circle r="5">`: Solid center dot highlighting the focal center.
- **Lines 423–427**: Closes master transformation `<g>`, root `<svg>`, and container `<div>`.

---

## 3. High-Frequency Viva & Technical Defense Guide

### Q1: Why did you build the Campus Digital Twin using pure SVG instead of Leaflet or Google Maps?
**Examiner Answer**:
"We selected pure SVG for three distinct technical and architectural reasons:
1. **Zero External Latency & Air-Gapped Reliability**: Third-party map SDKs rely on remote raster tile CDNs. Our SVG digital twin compiles directly into the frontend bundle with zero external network requests, functioning perfectly offline or within an intranet.
2. **Sub-Millimeter Resolution**: As a mathematical vector format, SVG coordinates scale infinitely without pixelation or compression artifacts, which is critical when zooming into interior labs and rooms.
3. **Seamless State Reactivity**: Because SVG elements exist directly in the browser DOM, we can bind React state and props directly to SVG attributes (fill colors, drop shadows, radar rotations) without an intermediary bridge API or canvas synchronization loop."

### Q2: What is the Painter's Algorithm in SVG and how did you resolve z-index overlap?
**Examiner Answer**:
"SVG 1.1/2.0 does not support the CSS `z-index` property. Instead, SVG rendering is strictly governed by the **Painter's Algorithm**: shapes that appear later in the markup are painted on top of earlier shapes. 
To prevent non-selected building labels from obscuring an actively selected or hovered building label, we implement an array priority sort in JavaScript:
```javascript
const sortedBuildings = [...buildings].sort((a, b) => {
  const aPri = activeBuildingObj?.id === a.id ? 2 : hoveredId === a.id ? 1 : 0;
  const bPri = activeBuildingObj?.id === b.id ? 2 : hoveredId === b.id ? 1 : 0;
  return aPri - bPri;
});
```
This guarantees that hovered elements (priority 1) and active elements (priority 2) are always rendered at the very end of the SVG child list, visually floating on top of all other campus elements."

### Q3: Why did you attach the wheel event listener using a native `useEffect` with `{ passive: false }` instead of using React's `onWheel` prop?
**Examiner Answer**:
"Modern browsers treat wheel listeners as `passive: true` by default to improve scrolling smoothness. Under passive listening, calls to `event.preventDefault()` are ignored. 
If we used standard React `onWheel`, zooming the campus map would also scroll the outer browser page. By attaching a native listener directly to the SVG node using `svgEl.addEventListener('wheel', onWheelNative, { passive: false })`, we can explicitly call `e.preventDefault()`, locking the page scroll while zooming the map. Crucially, our handler checks `isTargetOnSvg` so that if the user moves their cursor over the sidebar UI drawer, the event is ignored, allowing normal web page scrolling."

### Q4: How is GPU hardware acceleration enabled for smooth panning and zooming?
**Examiner Answer**:
"We isolate all panning and zooming transformations to a single top-level SVG group `<g>`:
```javascript
<g transform={`translate(${pan.x.toFixed(2)}, ${pan.y.toFixed(2)}) scale(${zoom.toFixed(4)})`}
   style={{ transformOrigin: '0 0', willChange: 'transform' }}>
```
The CSS property `willChange: 'transform'` instructs the browser's rendering engine (Blink/Gecko) to promote this entire SVG subtree to an independent GPU compositor layer. Rather than recalculating coordinates on the CPU during drag and wheel events, the GPU translates and scales the pre-rasterized texture buffer, sustaining fluid 60+ FPS performance."

---

## 4. Quick-Reference Architecture & Property Table

| Feature / Element | Implementation Mechanism | Technical Purpose / Viva Defense |
| :--- | :--- | :--- |
| **Virtual Viewport** | `<svg viewBox="0 0 1080 800">` | Normalizes logical coordinate space across all screen sizes and mobile aspect ratios. |
| **Camera Affine Matrix** | `translate(pan.x, pan.y) scale(zoom)` | Transforms entire campus coordinate space in a single GPU-accelerated group node. |
| **Page Scroll Lock** | Native `wheel` with `{ passive: false }` | Enables map zooming without triggering outer HTML document scrolling. |
| **Z-Order Management** | Painter's Algorithm (`sortedBuildings`) | Re-orders DOM nodes so selected and hovered building labels render on top. |
| **Spatial Clipping** | `<clipPath id="iiitnrCampusClip">` | Masks inner turf and roads to exact surveyed campus property boundaries. |
| **Isometric Shadows** | `translate(2.5, 3.5)` + `#activeShadow` | Simulates architectural depth and visual plinth elevation. |
| **Event Bubble Isolation**| `e.stopPropagation()` on clicks | Prevents building selection clicks from bubbling up to reset canvas camera coordinates. |
| **Radar Target Reticle** | `className="animate-spin"` + `<circle>` | Provides visual navigational focus onto active complaint ticket locations. |

---
*Documentation compiled and verified against commit codebase standards. Strictly non-destructive: no application source files modified.*
