# Frontend Source Documentation: `frontend/src/components/CampusMapSelector.jsx`

> **File Path**: `frontend/src/components/CampusMapSelector.jsx`  
> **Role**: Immersive Interactive Campus Digital Twin Explorer, Vector SVG GIS Canvas, Omni-Search Locator, and Spatial Incident Dispatch Portal.  
> **Target Audience**: College Viva Examiners, Evaluation Committees, GIS/Computer Graphics Specialists, Students grounded in basic C/Python.

---

## 1. High-Level Architectural Purpose

In traditional university complaint management portals, users specify incident locations by picking from long, ambiguous text dropdowns (e.g. *"Hostel 2 Wing B"* vs *"Ramanujan Block"*). This leads to frequent misidentifications: students pick the wrong wing, technicians waste hours wandering unfamiliar corridors, and facility administrators lack geographic visibility into campus-wide infrastructure clusters.

`CampusMapSelector.jsx` replaces static dropdowns with a **Spatial Digital Twin Explorer** of IIIT Naya Raipur:
1. **Interactive Vector GIS Engine**: Renders high-fidelity Scalable Vector Graphics (SVG) polygons for every campus building, walkway, sports complex, and courtyard.
2. **Physics-Driven Camera Navigation (`useMapCamera`)**:
   - Drag-to-pan with inertial momentum.
   - Cursor-centered scroll-wheel zoom ($0.75\times$ to $4.0\times$).
   - Double-click cinematic fly-to animation with an expanding radar locator beam.
   - Multi-touch pinch-to-zoom support for mobile smartphones and tablets.
3. **Omni-Search Engine with Auto-Locate**: A unified search bar that indexes both building names and internal rooms/laboratories (e.g. searching *"VLSI"*, *"AIDL"*, or *"303"* surfaces the exact room, infers the floor level, and flies the camera straight to that building).
4. **Floating Glassmorphic Building Place Card**: Displays building metadata, a floor switcher (Ground, Floor 1, Floor 2, Floor 3), and an interactive list of all rooms and labs.
5. **Layer & Theme Controls**: Toggles building labels, walkways, property boundaries, and flips between Matte Dark ("architectural") and Crisp Light rendering modes.

---

## 2. Sequential Code Breakdown & Deep Analysis

```javascript
/**
 * frontend/src/components/CampusMapSelector.jsx
 *
 * Immersive, Intuitive Interactive Campus Digital Twin Explorer.
 * Replaces static selection boxes with a living, fluid map navigation system:
 * - Fluid drag-to-pan & cursor-centered scroll-wheel zoom
 * - Double-click fly-to focus & smooth cinematic transitions
 * - Smart omni-search with auto-flyto & radar locator beam
 * - Floating glassmorphic Building Place Card with floor & room explorer
 * - Quick Explore zone filters & layer toggles (Labels, Entrances, Themes)
 */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  IIITNR_MAP_UPDATED_EVENT,
  getCampusBuildings,
  fetchAndCacheCampusBuildings,
  resetCampusBuildingsToDefault,
  getFloorsForBuilding,
  getRoomsForBuilding,
  inferFloorFromItem,
  EXACT_BUILDING_POLYGONS,
} from '../data/iiitnrCampusData';
import DigitalTwinCanvas from './campusTwin/DigitalTwinCanvas';
import { useMapCamera } from './campusTwin/useMapCamera';

const QUICK_EXPLORE_CHIPS = [
  { id: 'all', label: '🌐 All Campus', filter: 'ALL' },
  { id: 'academic_block', label: '🏛️ Academic Block', filter: 'ACADEMIC' },
  { id: 'canteen_block', label: '🍽️ Canteen', filter: 'AMENITY' },
  { id: 'auditorium_hall', label: '🎭 Auditorium', filter: 'AMENITY' },
  { id: 'hostels', label: '🛏️ Hostels', filter: 'HOSTEL' },
  { id: 'bldg_1792074173914', label: '⚽ Sports & Grounds', filter: 'INFRASTRUCTURE' },
];
```

### Plain-English Purpose
Imports React hooks, authentication and theme contexts, campus geometric datasets from `iiitnrCampusData.js`, the SVG rendering canvas (`DigitalTwinCanvas`), and the camera physics hook (`useMapCamera`). It defines `QUICK_EXPLORE_CHIPS`, providing one-click shortcut buttons to jump the camera to major campus zones.

### Line-by-Line Breakdown
- `import { EXACT_BUILDING_POLYGONS, ... } from '../data/iiitnrCampusData'`: Imports the coordinate database containing polygon coordinates and GPS centroids.
- `const QUICK_EXPLORE_CHIPS = [ ... ]`: An array of filter objects mapping zone IDs to emoji labels and category classifications.

---

```javascript
export default function CampusMapSelector({
  selectedBuilding,
  onSelectBuilding,
  selectedRoom = '',
  onSelectRoom,
  studentSavedHostel = '',
  studentSavedRoom = '',
  flush = false,
}) {
  const { isSuperAdmin } = useAuth();
  const { isDark } = useTheme();
  const [buildings, setBuildings] = useState(() => getCampusBuildings());
  const [twinThemeOverride, setTwinThemeOverride] = useState(null);
  const twinTheme = twinThemeOverride !== null ? twinThemeOverride : (isDark ? 'architectural' : 'light');
  const [showLabels, setShowLabels] = useState(true);
  const [showPathsAndCourts, setShowPathsAndCourts] = useState(true);
  const [showBoundary, setShowBoundary] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);
```

### Plain-English Purpose
Declares the component and its props: `selectedBuilding`, `onSelectBuilding`, `selectedRoom`, `onSelectRoom`, and a `flush` layout boolean. It initializes reactive states for buildings data, theme overrides, layer visibility toggles (`showLabels`, `showPathsAndCourts`, `showBoundary`), and cursor hover tracking (`hoveredId`).

### Line-by-Line Breakdown
- `flush = false`: If true, strips outer padding and borders so the map expands edge-to-edge across the screen (used on dedicated full-screen `/map` routes).
- `twinTheme`: Resolves the active SVG aesthetic: `'architectural'` (dark blueprints with glowing green accents) or `'light'` (crisp satellite styled pastel tones).
- `hoveredId`: Tracks the ID of the building currently under the user's mouse cursor.

---

```javascript
  // Active Building Selection
  const [activeBuildingId, setActiveBuildingId] = useState(() => {
    const found = buildings.find(
      (b) => b.name === selectedBuilding || b.id === selectedBuilding || b.shortName === selectedBuilding
    );
    return found ? found.id : null;
  });

  // Selected Room
  const [activeRoom, setActiveRoom] = useState(selectedRoom || '');

  // Floating Place Card Visibility
  const [showPlaceCard, setShowPlaceCard] = useState(Boolean(activeBuildingId));

  // Inspector Floor State
  const [inspectorFloor, setInspectorFloor] = useState('G');

  // Search Bar State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Radar Target Beacon for Cinematic Focus
  const [radarTarget, setRadarTarget] = useState(null);

  const svgRef = useRef(null);
  const radarTimerRef = useRef(null);
```

### Plain-English Purpose
Initializes selection and UI interaction states:
- `activeBuildingId`: Currently selected building ID.
- `activeRoom`: Currently selected room name.
- `showPlaceCard`: Controls the slide-in visibility of the building details panel.
- `inspectorFloor`: Selected floor level (`'G'`, `'1'`, `'2'`, `'3'`).
- `radarTarget`: `{ cx, cy }` coordinates for the expanding radar beacon animation.
- `svgRef`: Direct pointer reference to the SVG element in the DOM.

---

```javascript
  useEffect(() => {
    // Proactively fetch campus buildings from backend database on mount
    fetchAndCacheCampusBuildings().then((remote) => {
      if (Array.isArray(remote) && remote.length > 0) {
        setBuildings(remote);
      }
    });

    const handleUpdate = (e) => {
      if (e?.detail && Array.isArray(e.detail) && e.detail.length > 0) {
        setBuildings(e.detail);
      } else {
        setBuildings(getCampusBuildings());
      }
    };
    window.addEventListener(IIITNR_MAP_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(IIITNR_MAP_UPDATED_EVENT, handleUpdate);
  }, []);
```

### Plain-English Purpose
On initial mount, queries the backend database for any newly registered or updated buildings via `fetchAndCacheCampusBuildings()`. It also registers an event listener for `IIITNR_MAP_UPDATED_EVENT` so that if an administrator adds a new research lab or updates building boundaries, the map updates live in real-time.

---

```javascript
  // High-precision physics camera engine hook
  const {
    zoom,
    pan,
    isPanning,
    flyTo: cameraFlyTo,
    resetView: cameraResetView,
    zoomBy,
    handleWheel,
    handleDoubleClick,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleKeyDown,
  } = useMapCamera({
    svgRef,
    isPlaceCardOpen: showPlaceCard,
    minZoom: 0.75,
    maxZoom: 4.0,
  });

  // Smooth Cinematic Fly-To Camera Navigation with Locator Ring
  const flyTo = useCallback(
    (targetX, targetY, targetZoom = 1.85, options = {}) => {
      setRadarTarget({ cx: targetX, cy: targetY });
      if (radarTimerRef.current) clearTimeout(radarTimerRef.current);
      radarTimerRef.current = setTimeout(() => {
        setRadarTarget(null);
      }, 3000);

      cameraFlyTo(targetX, targetY, targetZoom, options);
    },
    [cameraFlyTo]
  );
```

### Plain-English Purpose
Integrates `useMapCamera`, delegating complex 2D affine transformation physics (pan offsets, scale factors, velocity friction, drag thresholds, wheel zooming). It wraps `cameraFlyTo` in a local `flyTo` function that sets `radarTarget` to pulse an animated SVG target ring at the destination coordinates for 3 seconds before automatically fading away.

---

```javascript
  // Handle Building Selection & Focus
  const handleSelectBuildingInternal = useCallback(
    (nameOrId, explicitId = null) => {
      const target = buildings.find(
        (b) => b.name === nameOrId || b.id === nameOrId || b.id === explicitId || b.shortName === nameOrId
      );
      if (!target) return;

      setActiveBuildingId(target.id);
      setShowPlaceCard(true);
      if (onSelectBuilding) onSelectBuilding(target.name);

      // Reset floor to G or first available
      const floors = getFloorsForBuilding(target.id, buildings);
      if (floors.length > 0) {
        setInspectorFloor(floors[0].id);
      }

      // Fly camera to building
      const P = EXACT_BUILDING_POLYGONS[target.id];
      const cx = target.trace?.cx ?? P?.cx ?? 540;
      const cy = target.trace?.cy ?? P?.cy ?? 400;
      flyTo(cx, cy, 1.85);
    },
    [buildings, onSelectBuilding, flyTo]
  );
```

### Plain-English Purpose
Central building selection handler:
1. Locates the building in the dataset by name, ID, or short name.
2. Updates `activeBuildingId` and opens the place card (`setShowPlaceCard(true)`).
3. Resets the floor selector to Ground (`'G'`).
4. Extracts the building's geometric centroid (`cx, cy`) from `EXACT_BUILDING_POLYGONS`.
5. Calls `flyTo(cx, cy, 1.85)` to smoothly pan and zoom the camera directly over the building.

---

```javascript
  // Quick Search & Auto-Locate Matches
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const matches = [];
    buildings.forEach((b) => {
      const bName = b.name.toLowerCase();
      const bShort = (b.shortName || '').toLowerCase();
      const bBadge = (b.trace?.badge || '').toLowerCase();

      if (bName.includes(q) || bShort.includes(q) || bBadge.includes(q)) {
        matches.push({
          type: 'BUILDING',
          title: b.name,
          subtitle: `${b.category} · ${b.gps || 'Campus Sector'}`,
          building: b,
        });
      }

      // Check rooms inside building
      const customList = b.customRooms || b.custom_rooms;
      if (Array.isArray(customList) && customList.length > 0) {
        customList.forEach((rm) => {
          if (rm.toLowerCase().includes(q)) {
            const inferredFloor = inferFloorFromItem(rm) || (b.floors && b.floors[0]) || '1';
            const floorLabel = inferredFloor === 'G' ? 'Ground Floor' : `Floor ${inferredFloor}`;
            matches.push({
              type: 'ROOM',
              title: rm,
              subtitle: `${b.name} (${floorLabel})`,
              building: b,
              floorId: inferredFloor,
              roomName: rm,
            });
          }
        });
      }
    });

    return matches.slice(0, 7);
  }, [searchQuery, buildings]);
```

### Plain-English Purpose
Fast, in-memory omni-search engine:
- As the user types, it searches across building names, acronyms, and every internal room and laboratory.
- When matching a room (e.g. *"Room 204"*), it infers the floor level (`inferFloorFromItem`), binds it to the parent building, and returns the top 7 ranked matches.

---

```javascript
  return (
    <div
      className={`relative select-none overflow-hidden transition-all ${
        flush
          ? isDark ? 'w-full rounded-none border-y border-zinc-800 bg-[#0e1117]' : 'w-full rounded-none border-y border-slate-200 bg-white'
          : isDark ? 'rounded-2xl border border-zinc-800 bg-[#161b22]' : 'rounded-2xl border border-slate-200 bg-white shadow-xs'
      }`}
    >
      {/* Top Floating Search & Quick Filter Bar */}
      <div className={`p-3.5 ${flush ? 'px-4 sm:px-8 lg:px-12' : ''} border-b transition-colors space-y-2.5 ${
        isDark ? 'bg-[#161b22] text-zinc-100 border-zinc-800' : 'bg-slate-50 text-slate-800 border-slate-200'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Omni Search Input */}
          <div className="relative flex-1 min-w-[260px]">
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search any building, lab (VLSI, AIDL), room (303, 131C), or facility..."
              className={`w-full px-4 py-2 pl-9 rounded-xl border text-xs sm:text-sm transition-colors font-sans focus:outline-none ${
                isDark
                  ? 'bg-[#0e1117] border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 shadow-2xs'
              }`}
            />
```

### Plain-English Purpose
Renders the top control header containing the omni-search input field with a lightning emoji icon and instant clear button (`✕`).

---

```javascript
          {/* Quick Zone Exploration Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {QUICK_EXPLORE_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => {
                  if (chip.id === 'all') {
                    resetView();
                    setActiveBuildingId(null);
                    setShowPlaceCard(false);
                  } else if (chip.id === 'hostels') {
                    const firstHostel = buildings.find((b) => b.category === 'HOSTEL');
                    if (firstHostel) handleSelectBuildingInternal(firstHostel.name, firstHostel.id);
                  } else {
                    handleSelectBuildingInternal(chip.id, chip.id);
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 cursor-pointer border ${
                  activeBuildingId === chip.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : isDark
                    ? 'bg-[#0e1117] text-zinc-300 border-zinc-700 hover:border-zinc-500 hover:text-white'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 shadow-2xs'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>
```

### Plain-English Purpose
Renders horizontal zone shortcut chips (*All Campus*, *Academic Block*, *Canteen*, *Auditorium*, *Hostels*, *Sports & Grounds*). Clicking a chip automatically selects the building and centers the camera.

---

```javascript
      {/* Main Interactive Map Viewport Container */}
      <div className={`relative w-full overflow-hidden ${isDark ? 'bg-[#0e1117]' : 'bg-[#f4f7f4]'}`}>
        <DigitalTwinCanvas
          svgRef={svgRef}
          buildings={buildings}
          activeBuildingObj={activeBuildingObj}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          onSelectBuilding={(name, id) => handleSelectBuildingInternal(name, id)}
          twinTheme={twinTheme}
          showLabels={showLabels}
          showPathsAndCourts={showPathsAndCourts}
          showBoundary={showBoundary}
          zoom={zoom}
          pan={pan}
          isPanning={isPanning}
          radarTarget={radarTarget}
          handleMouseDown={handleMouseDown}
          handleMouseMove={handleMouseMove}
          handleMouseUp={handleMouseUp}
          handleWheel={handleWheel}
          handleDoubleClick={handleDoubleClick}
          handleTouchStart={handleTouchStart}
          handleTouchMove={handleTouchMove}
          handleTouchEnd={handleTouchEnd}
          handleKeyDown={handleKeyDown}
        />
```

### Plain-English Purpose
Mounts the `DigitalTwinCanvas` component, passing all viewport camera vectors (`zoom`, `pan`), mouse/touch interaction handlers, and layer visibility settings.

---

```javascript
        {/* Floating Camera & Layer Controls Toolbar */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
          {/* Zoom Buttons */}
          <div className={`p-1 rounded-2xl border shadow-xl flex flex-col items-center backdrop-blur-md ${
            isDark ? 'bg-[#161b22]/90 border-zinc-800' : 'bg-[#f1f5f9]/95 border-slate-300'
          }`}>
            <button type="button" onClick={() => zoomBy(0.25)} ... >+</button>
            <div className="text-[10px] font-mono py-1">{Math.round(zoom * 100)}%</div>
            <button type="button" onClick={() => zoomBy(-0.25)} ... >−</button>
            <button type="button" onClick={resetView} ... >⟲</button>
          </div>

          {/* Quick Layer & Theme Toggles */}
          <div className="p-1 rounded-2xl border shadow-xl flex flex-col items-center gap-1 backdrop-blur-md ...">
            <button onClick={() => setTwinThemeOverride(t => t === 'light' ? 'architectural' : 'light')}>☀️/🌙</button>
            <button onClick={() => setShowLabels(v => !v)}>🏷️</button>
            <button onClick={() => setShowPathsAndCourts(v => !v)}>🛣️</button>
          </div>
        </div>
```

### Plain-English Purpose
Renders floating glassmorphic toolbar pills in the top-left corner:
- Zoom controls: Zoom In (`+`), Zoom Out (`-`), Zoom % read-out, and Reset (`⟲`).
- Layer toggles: Dark/Light blueprint switch, Labels toggle (`🏷️`), and Walkways toggle (`🛣️`).

---

```javascript
        {/* Interactive Floating Building Place Card */}
        {showPlaceCard && activeBuildingObj && (
          <div className={`absolute top-4 right-4 bottom-4 w-80 sm:w-96 max-w-[92vw] z-30 flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-right-4 backdrop-blur-md ${
            isDark ? 'bg-[#161b22]/95 border-zinc-800 text-zinc-100' : 'bg-[#f1f5f9]/98 border-slate-300 text-slate-900'
          }`}>
            {/* Card Header */}
            <div className="p-4 border-b flex items-start justify-between gap-3 ...">
              ...
            </div>

            {/* Floor Switcher */}
            {availableFloors.length > 0 && (
              <div className="space-y-1.5 p-4 pb-0">
                ...
              </div>
            )}

            {/* Rooms & Laboratories List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {inspectorRooms.map((roomName, idx) => ( ... ))}
            </div>

            {/* Card Action Footer */}
            <div className="p-3.5 border-t flex items-center justify-between gap-2 ...">
              <button onClick={() => flyTo(cx, cy, 2.0)}>🎯 Center</button>
              <button onClick={() => { onSelectBuilding(activeBuildingObj.name); onSelectRoom(activeRoom); setShowPlaceCard(false); }}>📍 Confirm Location</button>
            </div>
          </div>
        )}
```

### Plain-English Purpose
Renders the slide-in "Building Place Card":
- Header: Building badge, category, name, and GPS coordinates.
- Floor switcher: Displays buttons for each available level (Ground, Floor 1, etc.).
- Rooms list: Lists all rooms and labs on that floor. Clicking a room marks it as selected.
- Footer: "Center" re-centers the camera over the building; "Confirm Location" binds the selection to the parent form and closes the drawer.

---

## 3. High-Frequency Viva & Technical Defense Questions

### Q1: How does the map calculate zoom centered on the mouse cursor rather than the top-left corner?
**Model Answer:**  
Standard CSS zooming scales around the origin `(0, 0)`. In `useMapCamera.js`, cursor-centered zoom computes the mouse's offset coordinates inside the SVG viewport before and after the scale change:
`newPanX = mouseX - (mouseX - oldPanX) * (newZoom / oldZoom)`.
Adjusting the pan offset proportionally to the zoom delta keeps the SVG point directly under the user's cursor stationary during zoom, providing an intuitive Google Maps-style navigation experience.

### Q2: What is the purpose of `EXACT_BUILDING_POLYGONS` and building centroids?
**Model Answer:**  
Every building on campus has a distinct physical boundary represented as an SVG `<polygon>` with polygon points: `points="x1,y1 x2,y2 ..."`. `EXACT_BUILDING_POLYGONS` stores precomputed center coordinates (`cx, cy`) for each polygon. When a user clicks a building or selects a search result, `flyTo(cx, cy)` animates the camera to that exact centroid.

### Q3: How does the Omni-Search feature find rooms and automatically switch floors?
**Model Answer:**  
The `searchResults` memo iterates through the nested room arrays of every building. When the query matches a room (e.g. *"Lab 303"*), `inferFloorFromItem("Lab 303")` inspects the leading digit (`3`) to infer that the room is on the 3rd floor. Selecting that result passes the building to the camera, sets `inspectorFloor = '3'`, and pre-selects the room in the place card list automatically.

### Q4: Why is SVG used for the Digital Twin instead of an HTML5 Canvas or WebGL?
**Model Answer:**  
1. **DOM Accessibility & Crisp Resolution**: SVG elements are vector-based, maintaining infinite sharpness across Retina displays without pixelation.
2. **Individual Element Interactivity**: Each building is an independent `<polygon>` DOM element that natively supports CSS hover effects, class toggling, and standard mouse/touch events (`onMouseEnter`, `onClick`) without requiring complex canvas pixel picking or raycasting math.

### Q5: How does the radar locator ring work?
**Model Answer:**  
When `flyTo(cx, cy)` executes, it sets `radarTarget = { cx, cy }`. `DigitalTwinCanvas` renders two concentric SVG circles at those coordinates styled with SVG animation classes that expand their radius and fade opacity from 1 to 0 over 3 seconds. A JavaScript `setTimeout` clears `radarTarget` after 3,000ms, creating a smooth visual radar beacon that highlights the destination.

---

## 4. Quick Reference Summary Table

| Feature / Control | Input / Trigger | Output / Animation | Key Purpose |
| :--- | :--- | :--- | :--- |
| **Pan & Zoom** | Mouse drag / Wheel scroll | Matrix transform (`scale`, `translate`) | Fluid map navigation |
| **Omni Search** | Text input (`searchQuery`) | Filtered dropdown of buildings & rooms | Instant lookup with direct fly-to |
| **Radar Target** | Building selection / Search click | Expanding pulsing concentric rings | Visual locator beacon at building centroid |
| **Place Card** | Click building / select chip | Slide-in drawer with floor & room list | Interactive location inspector |
| **Floor Switcher** | Level button (`'G'`, `'1'`, `'2'`) | Updates `inspectorFloor` and rooms list | Multi-story building navigation |
| **Layer Toggles** | Toolbar icons (`🏷️`, `🛣️`) | Toggles labels & pathways on SVG | Reduces visual clutter on dense maps |
