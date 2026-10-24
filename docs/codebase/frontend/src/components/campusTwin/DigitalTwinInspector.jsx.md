# DigitalTwinInspector.jsx — Exhaustive Sequential Technical Documentation

> **File Path**: `frontend/src/components/campusTwin/DigitalTwinInspector.jsx`  
> **Target Audience**: College Viva Examiners, Project Review Committee, Academic Evaluators, and Engineers grounded in foundational C and Python programming.  
> **Module Classification**: Frontend Digital Twin Sub-Location Telemetry, Spatial Directory Explorer & Super Admin Zone Inspector.

---

## 1. Module Overview & Architectural Purpose

When interacting with a 2D or 3D campus digital twin, high-level aerial building footprints alone are insufficient for operational facilities management. For instance, when an electrical short circuit or water seepage ticket is logged, the issue is not situated simply in "Academic Block"; it is specifically located on **Floor 3, Room 303 (VLSI Lab)** or **Floor 1, Room 131C (Campus NOC / Server Room)**.

`DigitalTwinInspector.jsx` provides the **tactical inspection drawer and spatial telemetry bridge** for the campus digital twin. It fulfills three critical responsibilities:
1. **Live Zone Telemetry & Cartographic Legend**: Continuously displays real-time surveying coordinates (GPS latitude/longitude), structural categorization, and an architectural color legend for whatever building the user hovers over.
2. **Multi-Floor Room & Laboratory Directory**: Allows users to dynamically switch between structural floors (Ground, First, Second, Third) and select specific classrooms, lecture halls, computer labs, or faculty offices.
3. **Super Admin Spatial Customization Drawer**: Provides authorized administrators with an in-place CAD-like editor to modify building names, short labels, category classifications, and badge codes, or trigger full GeoJSON import/export and database rollbacks.

### Foundational Programming Analogy (C & Python)
- In **C programming**, consider an hierarchical data model of nested structs:
  ```c
  struct Room { char name[64]; int floor; };
  struct Building { char name[64]; char gps[32]; struct Room rooms[50]; int room_count; };
  ```
  `DigitalTwinInspector` acts as a view function `void DisplayBuildingDetails(const struct Building* b, int selected_floor)` that inspects the building struct, filters its `rooms` array by the current floor index, and prints an interactive menu.
- In **Python (`tkinter` or `PyQt`)**, this corresponds to a side-panel notebook widget that binds to the selected campus node, populating dynamic tab buttons for floors and a scrollable grid of clickable room buttons.

---

## 2. Integrated Sequential Code Walkthrough & Inline Technical Breakdown

Below is the exhaustive, sequential, line-by-line examination of `DigitalTwinInspector.jsx`.

---

### Snippet 1: Module Header & Component Signature

```javascript
/**
 * frontend/src/components/campusTwin/DigitalTwinInspector.jsx
 *
 * Interactive Floor, Wing, Room & Lab Inspector Drawer + Super Admin Zone Editor
 * for the IIIT Naya Raipur Campus Digital Twin.
 */
import React from 'react';

export default function DigitalTwinInspector({
  activeBuildingObj,
  hoveredBuildingObj,
  selectedRoom,
  onSelectBuilding,
  onSelectRoom,
  availableFloors,
  inspectorFloor,
  setInspectorFloor,
  inspectorRooms,
  isSuperAdmin,
  isEditMode,
  editingBuilding,
  handleUpdateBuildingField,
  handleDeleteBuilding,
  onResetBuildings,
  onOpenJsonModal,
}) {
  return (
    <div className="space-y-3">
```

#### Plain-English Purpose & C/Python Analogy
Imports React and defines the functional component signature, destructuring sixteen distinct state properties, setters, and callback functions passed down from the parent controller (`CampusMapSelector.jsx`).
- In **C**, this corresponds to passing a composite context pointer `void RenderInspector(const InspectorState* state)`.
- In **Python**, it resembles `def render_inspector(**props):` where each prop exposes state or mutator handlers.

#### Line-by-Line Breakdown
- **Lines 1–6**: Informative file header documenting the component's dual purpose: interactive room explorer and Super Admin zone editor.
- **Line 7**: Imports `React`. Because this component is purely presentational and controlled by its parent, no local hooks (`useState`, `useEffect`) are needed here.
- **Line 9**: Declares and exports the default functional component `DigitalTwinInspector`.
- **Lines 10–26**: Destructures the component's props interface:
  - `activeBuildingObj`: The building currently selected (locked) on the map canvas.
  - `hoveredBuildingObj`: The building currently under the mouse cursor.
  - `selectedRoom`: Name string of the currently chosen room (e.g. `"Room 303 (VLSI Lab)"`).
  - `onSelectBuilding`: Callback to update parent building selection state.
  - `onSelectRoom`: Callback to update parent room selection state.
  - `availableFloors`: Array of floor descriptor objects (e.g., `[{ id: 'G', label: 'Ground' }, { id: '1', label: '1st Floor' }]`).
  - `inspectorFloor`: The active floor filter tab (`'G'`, `'1'`, `'2'`, `'3'`).
  - `setInspectorFloor`: State setter to switch the active floor tab.
  - `inspectorRooms`: Pre-filtered array of room name strings located on `inspectorFloor`.
  - `isSuperAdmin`, `isEditMode`: Authorization and mode flags toggling administrative controls.
  - `editingBuilding`: Building entity currently open in the Super Admin editing form.
  - `handleUpdateBuildingField`: Mutator function updating attributes of the edited building.
  - `handleDeleteBuilding`: Deletion handler to remove a building from the digital twin.
  - `onResetBuildings`: Callback restoring original factory GIS geometry.
  - `onOpenJsonModal`: Callback launching the raw JSON export/import modal dialog.
- **Lines 27–28**: Returns the root JSX container `<div className="space-y-3">`, enforcing uniform vertical rhythm between sub-panels.

---

### Snippet 2: Active Zone Telemetry & Cartographic Legend Bar

```javascript
      {/* Active Zone Telemetry & Legend Bar */}
      <div className="p-3.5 rounded-2xl bg-slate-950/95 border border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-mono text-[10px] font-bold">
              {hoveredBuildingObj?.trace?.badge || hoveredBuildingObj?.mapPin?.badge || 'TWIN'}
            </span>
            <span className="font-black text-white text-sm">{hoveredBuildingObj?.name}</span>
            <span className="text-slate-500">·</span>
            <span className="text-[11px] text-[#A7AD89] font-medium">{hoveredBuildingObj?.type}</span>
            <span className="hidden md:inline-block text-[10px] font-mono text-slate-400">
              [{hoveredBuildingObj?.gps}]
            </span>
          </div>
          <p className="text-[11px] text-slate-400">{hoveredBuildingObj?.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden xl:flex items-center space-x-3 text-[10px] text-slate-400 mr-2">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600 inline-block" /> Hostels
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-sky-600 inline-block" /> Academic/KRC
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-rose-600 inline-block" /> Auditorium
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" /> Canteen/Mess
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#8C906D] inline-block" /> FG/Sports/Amphi
            </span>
          </div>

          {selectedRoom && (
            <div className="px-3 py-1.5 rounded-xl bg-[#8C906D]/20 border border-[#8C906D]/40 text-[#DAD0C6] font-mono text-xs font-bold shrink-0">
              📍 {selectedRoom}
            </div>
          )}
        </div>
      </div>
```

#### Plain-English Purpose & C/Python Analogy
This sub-panel serves as the **Heads-Up Telemetry Display (HUD)**. Whenever the user points their mouse at any building on the map canvas, this bar instantly displays the building's code badge, full institutional name, classification (`"ACADEMIC"`, `"HOSTEL"`, etc.), surveying GPS coordinates, and a brief description. On the right side, it renders an architectural color key (legend) and the active room pin indicator.
- In **C game development**, this is the on-screen diagnostic overlay reading `entity->name` and `entity->gps_coords` every frame.
- In **Python GUI programming**, it acts as a dynamic status bar updating via mouse motion listener callbacks.

#### Line-by-Line Breakdown
- **Line 30**: Container `<div>` styled as a dark card (`bg-slate-950/95`) with subtle border (`border-slate-800`), using flexbox with wrap to ensure responsiveness on mobile and tablet screens.
- **Lines 31–44**: Left-hand telemetry cluster:
  - **Lines 33–35**: Monospace badge chip showing `hoveredBuildingObj?.trace?.badge` (e.g., `"ACAD"`, `"B1"`, `"KRC"`), with a safe fallback to `'TWIN'` if unhovered.
  - **Line 36**: Institutional name in bold white text (`font-black text-white text-sm`).
  - **Line 38**: Building type tag displayed in olive accent text (`text-[#A7AD89]`).
  - **Lines 39–41**: High-precision GPS coordinates string (e.g., `"[21.1285° N, 81.7662° E]"`), hidden on small mobile screens to prevent clutter.
  - **Line 43**: Descriptive text detailing the building's operational function.
- **Lines 46–70**: Right-hand cluster:
  - **Lines 47–63**: Architectural color legend (visible on wide desktop viewports `xl:flex`):
    - Indigo (`#4f46e5`): Student Residences & Hostels.
    - Sky Blue (`#0284c7`): Academic Complex & Knowledge Resource Centre (Library).
    - Rose (`#e11d48`): Institutional Auditorium.
    - Amber (`#f59e0b`): Canteen, Cafeteria & Dining Halls.
    - Sage/Olive (`#8C906D`): Football Ground (FG), Amphitheater & Sports Facilities.
  - **Lines 65–69**: Conditional Selected Room Badge: If `selectedRoom` has a truthy value, renders a glowing pin badge displaying the exact room designation.

---

### Snippet 3: Floor, Room & Lab Directory Header and Tab Switcher

```javascript
      {/* Floor, Room & Lab Explorer Drawer */}
      {activeBuildingObj && (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-white space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2.5">
              <span className="text-base">🏢</span>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-white">
                  {activeBuildingObj.name} — Floor, Room & Lab Directory
                </h4>
                <p className="text-[11px] text-slate-400">
                  Select a floor or wing below, then click any room or laboratory to select it.
                </p>
              </div>
            </div>

            {/* Floor Switcher Tabs */}
            {availableFloors.length > 1 && (
              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 px-2 uppercase font-bold">
                  Floor:
                </span>
                {availableFloors.map((fl) => {
                  const isFlActive = String(inspectorFloor) === String(fl.id);
                  return (
                    <button
                      key={fl.id}
                      type="button"
                      onClick={() => setInspectorFloor(fl.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isFlActive
                          ? 'bg-sky-600 text-white shadow-2xs'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {fl.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
```

#### Plain-English Purpose & C/Python Analogy
When a user selects a building on the map canvas, `activeBuildingObj` becomes truthy, causing this detailed sub-directory to mount. It presents the building title and dynamically generates tab buttons for every structural floor defined in the campus database (`availableFloors`).
- In **C programming**, this is equivalent to iterating over an array of available levels: `for(int i = 0; i < floor_count; i++) { printf("[%s] ", floors[i].label); }`.
- In **Python (Streamlit or Dash)**, this is an interactive radio button or tab group widget whose active value updates the underlying tabular query.

#### Line-by-Line Breakdown
- **Line 74**: Guard condition `{activeBuildingObj && (` ensures this panel is only rendered when a building has been actively selected, keeping the UI clean and uncluttered during initial overview.
- **Line 75**: Drawer container with subtle backdrop blur and dark styling (`bg-slate-900/90 border border-slate-800`).
- **Lines 76–87**: Directory header: Displays institutional building icon, building name, and instructional subtitle.
- **Lines 89–114**: Multi-floor tab switcher:
  - Guard condition `{availableFloors.length > 1 && (` hides the floor switcher if the building is a single-level facility (e.g. Substation or Canteen Rotunda), avoiding redundant single-button UI noise.
  - Maps through `availableFloors`:
    - Evaluates `isFlActive = String(inspectorFloor) === String(fl.id)` using explicit string coercion to guard against type mismatches between numeric `1` and string `'1'`.
    - Active floor button receives prominent sky-blue styling (`bg-sky-600 text-white shadow-2xs`).
    - Inactive floor buttons receive muted styling (`text-slate-400 hover:bg-slate-800`).
    - `onClick={() => setInspectorFloor(fl.id)}` updates parent state, instantly recalculating the list of rooms visible below.

---

### Snippet 4: Clickable Room & Laboratory Grid

```javascript
          {/* Clickable Room / Laboratory Grid */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>
                Mapped Rooms & Labs on{' '}
                {inspectorFloor === 'G' ? 'Ground Floor (1xx / G)' : `Floor ${inspectorFloor}`} (
                {inspectorRooms.length} available)
              </span>
              <span className="text-[#A7AD89]">Click to Select</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
              {inspectorRooms.map((roomName, idx) => {
                const isThisRoomSelected = selectedRoom === roomName;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (onSelectRoom) onSelectRoom(roomName);
                      if (onSelectBuilding) onSelectBuilding(activeBuildingObj.name);
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                      isThisRoomSelected
                        ? 'bg-[#8C906D]/20 border-[#A7AD89] text-[#DAD0C6] shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-sky-500/50 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <span className="truncate" title={roomName}>
                      {roomName}
                    </span>
                    {isThisRoomSelected && (
                      <span className="text-[#A7AD89] font-bold shrink-0">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
```

#### Plain-English Purpose & C/Python Analogy
This section renders an interactive, responsive grid of all rooms, laboratories, and offices situated on the active floor. Clicking any room card automatically selects it and confirms building association in the complaint submission pipeline.
- In **C programming**, this is iterating through an array of strings and recording user selection:
  ```c
  for(int j=0; j<room_count; j++) {
      if (user_clicked(j)) { strcpy(current_ticket.room, rooms[j]); }
  }
  ```
- In **Python (`curses` or Web frameworks)**, it resembles a selectable list-box populated from an API query.

#### Line-by-Line Breakdown
- **Lines 119–127**: Section header displaying the active floor label (translating `'G'` to `"Ground Floor (1xx / G)"` and numeric floors to `"Floor X"`), total room count `inspectorRooms.length`, and user prompt `"Click to Select"`.
- **Line 129**: Responsive CSS Grid container:
  - `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`: Automatically adapts from 1 column on mobile to 4 columns on desktop monitors.
  - `max-h-52 overflow-y-auto`: Enforces a fixed maximum height ($208\text{px}$) with smooth vertical scrolling to contain buildings with dozens of rooms without stretching the viewport.
- **Lines 130–155**: Maps over `inspectorRooms`:
  - `isThisRoomSelected`: Checks if this specific room matches `selectedRoom`.
  - `onClick`: Invokes `onSelectRoom(roomName)` and `onSelectBuilding(activeBuildingObj.name)`.
  - Active styling: Applied with sage-olive tint (`bg-[#8C906D]/20 border-[#A7AD89]`) and a trailing checkmark `✓`.
  - Resting styling: Dark card (`bg-slate-950 border-slate-800`) with hover highlight (`hover:border-sky-500/50 hover:bg-slate-900`).
  - `<span className="truncate" title={roomName}>`: Truncates overflowing room names with an ellipsis while providing full title text on native browser hover.
- **Lines 157–158**: Closes the clickable grid and conditional building check.

---

### Snippet 5: Super Admin Zone Editor Drawer

```javascript
      {/* Super Admin Zone Editor Drawer */}
      {isSuperAdmin && isEditMode && editingBuilding && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 text-white space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <span className="font-bold text-amber-300">
              Editing Digital Twin Zone: {editingBuilding.name}
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onOpenJsonModal}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold cursor-pointer"
              >
                Export / Import JSON
              </button>
              <button
                type="button"
                onClick={onResetBuildings}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold cursor-pointer"
              >
                Reset Twin
              </button>
              <button
                type="button"
                onClick={() => handleDeleteBuilding(editingBuilding.id)}
                className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-400/30 text-[11px] font-bold cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Zone / Building Name</label>
              <input
                type="text"
                value={editingBuilding.name}
                onChange={(e) =>
                  handleUpdateBuildingField(editingBuilding.id, {
                    name: e.target.value,
                    shortName: e.target.value.split(' (')[0],
                  })
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Map Pill Label</label>
              <input
                type="text"
                value={editingBuilding.shortName || ''}
                onChange={(e) =>
                  handleUpdateBuildingField(editingBuilding.id, { shortName: e.target.value })
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Badge Code</label>
              <input
                type="text"
                value={editingBuilding.trace?.badge || editingBuilding.mapPin?.badge || ''}
                onChange={(e) =>
                  handleUpdateBuildingField(editingBuilding.id, { badge: e.target.value })
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Category</label>
              <select
                value={editingBuilding.category || 'HOSTEL'}
                onChange={(e) =>
                  handleUpdateBuildingField(editingBuilding.id, { category: e.target.value })
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
              >
                <option value="HOSTEL">HOSTEL</option>
                <option value="ACADEMIC">ACADEMIC</option>
                <option value="AMENITY">AMENITY</option>
                <option value="INFRASTRUCTURE">INFRASTRUCTURE</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### Plain-English Purpose & C/Python Analogy
This final block implements an in-place **Administrative Spatial Editor**. If a Super Admin logs in and activates "Edit Mode", this drawer renders an administrative management toolbar and form fields to update building taxonomy directly in browser memory.
- In **C/C++ GIS tools**, this is the "Property Inspector" dialog box that updates an entity record when an admin modifies property values.
- In **Python (Django Admin or Flask Admin)**, this is an inline formset bound to the spatial entity model.

#### Line-by-Line Breakdown
- **Line 161**: Triple-guard authorization check: `{isSuperAdmin && isEditMode && editingBuilding && (`. Ensures that non-admin students or technicians can never view or manipulate these administrative mutation controls.
- **Line 162**: Container card with high-visibility amber accent border (`border-amber-500/40`), signaling that the UI is in active administrative edit mode.
- **Lines 163–190**: Action header:
  - Displays currently edited building name in bold amber text.
  - "Export / Import JSON" button: Calls `onOpenJsonModal` to export or import whole-campus GeoJSON spatial datasets.
  - "Reset Twin" button: Calls `onResetBuildings` to discard modifications and restore default geometry.
  - "Delete" button: Calls `handleDeleteBuilding(editingBuilding.id)` with red warning styling (`bg-rose-500/20 text-rose-300`).
- **Lines 192–244**: Four-column responsive editing form:
  - **Zone / Building Name input**: On change, updates both `name` and automatically extracts a cleaned `shortName` by splitting off parenthetical suffixes (`e.g., "Bose Hostel (B1)" -> "Bose Hostel"`).
  - **Map Pill Label input**: Directly modifies the floating callout badge text displayed on the map canvas.
  - **Badge Code input**: Modifies the monospace acronym code (e.g., `"ACAD"`).
  - **Category `<select>` dropdown**: Allows categorizing the zone into `'HOSTEL'`, `'ACADEMIC'`, `'AMENITY'`, or `'INFRASTRUCTURE'`.
- **Lines 247–249**: Closes the conditional editor and the root `DigitalTwinInspector` container.

---

## 3. High-Frequency Viva & Technical Defense Guide

### Q1: How does `DigitalTwinInspector` handle buildings with non-numeric floor layouts (e.g. Ground Floor or Basements)?
**Examiner Answer**:
"In `DigitalTwinInspector`, floors are represented as alphanumeric string identifiers (`'G'`, `'1'`, `'2'`, `'3'`) rather than strict integers. When rendering the floor tabs, we evaluate:
```javascript
const isFlActive = String(inspectorFloor) === String(fl.id);
```
Explicit string casting guarantees that comparisons between numeric `1` and string `'1'` never fail due to JavaScript type coercion bugs. Furthermore, the UI maps `'G'` to human-readable text `'Ground Floor (1xx / G)'`, accommodating Indian collegiate architectural naming standards where ground floor rooms are numbered in the 100s."

### Q2: What security prevents regular students or technicians from modifying building geometry or deleting campus zones?
**Examiner Answer**:
"Security is enforced at two distinct architectural layers:
1. **Frontend Role Guard**: The Super Admin Zone Editor is guarded by a triple logical condition:
   ```javascript
   {isSuperAdmin && isEditMode && editingBuilding && ( ... )}
   ```
   If `isSuperAdmin` (derived securely from the decoded JWT token in `AuthContext`) is false, the DOM elements for editing, deleting, and JSON export/import are never rendered in the virtual DOM.
2. **Backend RBAC Validation**: Even if an unauthorized user attempts to forge an HTTP `PUT` or `DELETE` request to `/api/v1/campus/buildings`, the FastAPI backend dependencies (`require_superadmin`) inspect the cryptographically signed JWT bearer token and abort the request with `HTTP 403 Forbidden`."

### Q3: Why is `DigitalTwinInspector` designed as a pure controlled component rather than maintaining its own local state?
**Examiner Answer**:
"`DigitalTwinInspector` receives its state (`activeBuildingObj`, `inspectorFloor`, `inspectorRooms`, `selectedRoom`) entirely through props from the parent `CampusMapSelector.jsx`. This follows React's **Single Source of Truth** pattern. 
If the inspector maintained its own local state, selecting a building via the SVG canvas or search bar would require complex bidirectional state synchronization. By keeping the inspector stateless and delegating state mutations upward via callbacks (`setInspectorFloor`, `onSelectRoom`), the entire campus twin—the SVG canvas, the search bar, and the inspector drawer—stays strictly synchronized without race conditions."

---

## 4. Quick-Reference Architecture & Property Table

| Feature / UI Element | Props / State Used | Architectural Role / Viva Defense |
| :--- | :--- | :--- |
| **Zone Telemetry HUD** | `hoveredBuildingObj` | Real-time surveying readout displaying badge, name, type, and GPS coordinates. |
| **Campus Theme Legend** | Static tailwind color spans | Color-codes institutional facilities (Hostels, Academic, Auditorium, Canteen, Sports). |
| **Floor Tab Switcher** | `availableFloors`, `inspectorFloor` | Dynamically filters room directory based on selected structural level; hidden for single-floor structures. |
| **Room Directory Grid** | `inspectorRooms`, `selectedRoom` | Responsive $1-4$ column grid of clickable room chips with active checkmark indicators. |
| **Text Truncation** | `truncate` class + `title` prop | Prevents UI overflow on long room names while preserving full tooltip readability. |
| **Administrative Guard**| `isSuperAdmin && isEditMode` | Restricts zone editing, deletion, and JSON export controls exclusively to verified Super Administrators. |
| **JSON Interchange** | `onOpenJsonModal` | Triggers raw GeoJSON export/import dialog for bulk campus GIS updates. |

---
*Documentation compiled and verified against commit codebase standards. Strictly non-destructive: no application source files modified.*
