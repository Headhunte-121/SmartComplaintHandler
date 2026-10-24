# Frontend Source Documentation: `frontend/src/data/iiitnrCampusData.js`

> **File Path**: `frontend/src/data/iiitnrCampusData.js`  
> **Role**: Authoritative Facade Module, Spatial Data Synchronization Hub, and Room Floor Inference Engine for the IIIT Naya Raipur Digital Twin.  
> **Target Audience**: College Viva Examiners, Evaluation Committees, GIS Specialists, Students grounded in basic C/Python.

---

## 1. High-Level Architectural Purpose

Managing geometric GIS coordinates, boundary polygons, road vector networks, building registries, and multi-story floor layouts across an entire 50-acre university campus requires a clean, modular data architecture. If components like `CampusMapSelector`, `SubmitComplaint`, and `DigitalTwinCanvas` imported fragmented coordinate tables from disparate submodules, any schema change or coordinate update would require edits across dozens of UI files.

`iiitnrCampusData.js` acts as the **Authoritative Clean Facade Module**:
1. **Unified API Gateway (Facade Pattern)**: Consolidates and re-exports spatial geometry (`campusGeometry.js`), search indexing (`campusSearchEngine.js`), and building catalogs (`campusLabsAndRooms.js`) under a single import point.
2. **Hybrid Multi-Tier Storage Synchronization**: Implements a three-tier caching pipeline:
   - **Tier 1 (Memory)**: Fast JavaScript object cache.
   - **Tier 2 (Browser Local Storage)**: Persistent client cache under `iiitnr_canonical_campus_buildings_v14`.
   - **Tier 3 (Backend PostgreSQL / SQLite)**: Remote authoritative truth fetched via `fetchAndCacheCampusBuildings()`.
3. **Event-Driven Map Invalidation (`IIITNR_MAP_UPDATED_EVENT`)**: Broadcasts a browser-wide DOM event when building coordinates or facilities change, ensuring that map canvases update instantly without full-page refreshes.
4. **Heuristic Floor Inference (`inferFloorFromItem`)**: Analyzes room strings (e.g. *"Room 303"*, *"Lab 214"*, *"Ground Floor Office"*) using regular expressions to extract their exact building level (`'G'`, `'1'`, `'2'`, `'3'`).

---

## 2. Sequential Code Breakdown & Deep Analysis

```javascript
/**
 * frontend/src/data/iiitnrCampusData.js
 * Clean Facade Module for IIIT Naya Raipur Interactive Campus Digital Twin.
 * Synchronized with the backend database (Supabase PostgreSQL / SQLite) and
 * authoritative GIS ground-truth from frontend/public/iiitnr_gis_studio.html.
 */

import {
  CAMPUS_VIEWBOX,
  IIITNR_CAMPUS_PERIMETER_POINTS,
  INNER_CAMPUS_CLIP_POINTS,
  IIITNR_CAMPUS_BOUNDARY_CORNERS,
  LABEL_POSITIONS,
  EXACT_BUILDING_POLYGONS,
  CAMPUS_ROAD_POLYLINES,
  CAMPUS_FOOTPATH_POLYLINES,
  FOREST_CLUSTERS,
  BOULEVARD_TREES,
} from './campusTwin/campusGeometry';

import {
  SUB_LOCATION_PIN_OVERRIDES,
  buildCampusSearchIndex,
  queryCampusSearchIndex,
  autoDetectCampusLocation,
} from './campusTwin/campusSearchEngine';

import {
  IIITNR_CAMPUS_METADATA,
  HOSTEL_FLOORS,
  HOSTEL_WINGS,
  HOSTEL_COMMON_ZONES,
  DEFAULT_IIITNR_BUILDINGS,
} from './campusTwin/campusLabsAndRooms';

import { fetchCampusBuildings } from '../api/campus';

export const IIITNR_CAMPUS_STORAGE_KEY = 'iiitnr_canonical_campus_buildings_v14';
export const IIITNR_MAP_UPDATED_EVENT = 'iiitnr-campus-map-updated';
```

### Plain-English Purpose
Imports coordinates, algorithms, and catalogs from specialized submodules and defines global constants:
- `IIITNR_CAMPUS_STORAGE_KEY`: The versioned local storage key used to cache building records.
- `IIITNR_MAP_UPDATED_EVENT`: The name of the custom browser event dispatched whenever building information updates.

### Line-by-Line Breakdown
- `import { ... } from './campusTwin/campusGeometry'`: Imports vector SVG paths (viewbox, perimeters, polylines for roads and walkways, trees).
- `import { ... } from './campusTwin/campusSearchEngine'`: Imports search indexers and location detectors.
- `import { ... } from './campusTwin/campusLabsAndRooms'`: Imports building catalog data and hostel floor structures.
- `export const IIITNR_CAMPUS_STORAGE_KEY = 'iiitnr_canonical_campus_buildings_v14'`: Versioned cache key ensuring schema updates invalidate obsolete browser cache.

---

```javascript
export const IIITNR_BUILDINGS = DEFAULT_IIITNR_BUILDINGS;
export const ALL_IIITNR_BUILDINGS = DEFAULT_IIITNR_BUILDINGS;
export const IIITNR_HOSTELS = DEFAULT_IIITNR_BUILDINGS.filter((b) => b.category === 'HOSTEL');
export const IIITNR_ACADEMIC_BLOCKS = DEFAULT_IIITNR_BUILDINGS.filter((b) => b.category !== 'HOSTEL');

/**
 * Returns current campus buildings, checking localStorage cache first, then falling back to canonical defaults.
 */
export function getCampusBuildings() {
  if (typeof window === 'undefined') return DEFAULT_IIITNR_BUILDINGS;
  try {
    const raw = window.localStorage.getItem(IIITNR_CAMPUS_STORAGE_KEY);
    if (!raw) return DEFAULT_IIITNR_BUILDINGS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (err) {
    console.warn('Failed to parse cached campus map:', err);
  }
  return DEFAULT_IIITNR_BUILDINGS;
}
```

### Plain-English Purpose
Provides static exports for common building subsets (`IIITNR_HOSTELS`, `IIITNR_ACADEMIC_BLOCKS`) and defines `getCampusBuildings()`. 
`getCampusBuildings` reads from `localStorage`. If cached data exists and is valid JSON, it returns the cached array; otherwise, it falls back to the canonical hardcoded dataset (`DEFAULT_IIITNR_BUILDINGS`).

### Line-by-Line Breakdown
- `DEFAULT_IIITNR_BUILDINGS.filter(...)`: Evaluates categories synchronously for immediate module exports.
- `if (typeof window === 'undefined')`: Node.js SSR protection.
- `JSON.parse(raw)`: Deserializes the stored JSON string into JavaScript objects.
- `if (Array.isArray(parsed) && parsed.length > 0)`: Defensive validation ensuring corrupted storage values (like `{}` or `""`) do not break the UI.

---

```javascript
/**
 * Persist custom buildings to localStorage and notify all listeners.
 */
export function saveCustomCampusBuildings(buildings) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(IIITNR_CAMPUS_STORAGE_KEY, JSON.stringify(buildings));
    window.dispatchEvent(new CustomEvent(IIITNR_MAP_UPDATED_EVENT, { detail: buildings }));
  } catch (err) {
    console.warn('Failed to save campus map cache:', err);
  }
}

/**
 * Asynchronously synchronizes campus catalog from the backend database into frontend cache.
 */
export async function fetchAndCacheCampusBuildings() {
  try {
    const remote = await fetchCampusBuildings();
    if (Array.isArray(remote) && remote.length > 0) {
      saveCustomCampusBuildings(remote);
      return remote;
    }
  } catch (err) {
    console.warn('Could not fetch campus buildings from database, using cached/default:', err);
  }
  return getCampusBuildings();
}

/**
 * Reset campus catalog to institutional defaults.
 */
export function resetCampusBuildingsToDefault() {
  if (typeof window === 'undefined') return DEFAULT_IIITNR_BUILDINGS;
  try {
    window.localStorage.removeItem(IIITNR_CAMPUS_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(IIITNR_MAP_UPDATED_EVENT, { detail: DEFAULT_IIITNR_BUILDINGS }));
  } catch (err) {
    console.warn('Failed to reset campus map:', err);
  }
  return DEFAULT_IIITNR_BUILDINGS;
}
```

### Plain-English Purpose
Three administrative lifecycle functions:
- `saveCustomCampusBuildings`: Saves a modified building list to `localStorage` and dispatches `IIITNR_MAP_UPDATED_EVENT` to notify any open map views.
- `fetchAndCacheCampusBuildings`: Queries the backend `/campus/buildings` endpoint and caches remote records locally.
- `resetCampusBuildingsToDefault`: Deletes the cached entry and broadcasts the default catalog, resetting the map to factory defaults.

### Line-by-Line Breakdown
- `window.dispatchEvent(new CustomEvent(IIITNR_MAP_UPDATED_EVENT, { detail: buildings }))`: Emits a custom DOM event with the updated data attached in `e.detail`.
- `window.localStorage.removeItem(...)`: Clears cached browser storage.

---

```javascript
/**
 * Return floors available for a given building.
 */
export function getFloorsForBuilding(buildingNameOrId, customBuildingsList = null) {
  const list = customBuildingsList || getCampusBuildings();
  const target = list.find((b) => b.id === buildingNameOrId || b.name === buildingNameOrId || b.shortName === buildingNameOrId);
  if (!target || !Array.isArray(target.floors) || target.floors.length === 0) {
    return [];
  }

  if (typeof target.floors[0] === 'string') {
    return target.floors.map((fl) => ({
      id: fl,
      label: fl === 'G' ? 'Ground Floor' : `Floor ${fl}`,
    }));
  }
  return target.floors.map((f) => ({ id: f.id, label: f.label || (f.id === 'G' ? 'Ground Floor' : `Floor ${f.id}`) }));
}
```

### Plain-English Purpose
Retrieves the list of floors for a building, normalizing different data representations (arrays of strings like `['G', '1', '2']` vs arrays of objects like `[{ id: 'G', label: 'Ground Floor' }]`) into a standard `{ id, label }` structure.

---

```javascript
/**
 * Infer floor string ('1', '2', '3', '4', 'G') from room/amenity label.
 */
export function inferFloorFromItem(itemStr = '') {
  const clean = String(itemStr || '').trim();
  if (!clean) return null;

  // 1. Explicit "(Floor X)" or "Floor X" or "Level X"
  const explicitMatch = clean.match(/\b(?:floor|level)\s*([G0-9]+)\b/i);
  if (explicitMatch) {
    return explicitMatch[1].toUpperCase();
  }

  // 2. Ground floor mentions
  if (/\bground\b/i.test(clean)) {
    return 'G';
  }

  // 3. Room / Lab numbering with floor digit e.g. "Room 311", "Lab 210", "303", "G05", "G-12"
  const roomNumMatch = clean.match(/\b(?:room|lab|cabin|hall|office)?\s*([G1-9])[-]?(\d{2}[A-Z]?)\b/i);
  if (roomNumMatch) {
    return roomNumMatch[1].toUpperCase();
  }

  return null;
}
```

### Plain-English Purpose
Algorithmic regex engine that deduces which floor a room is located on:
1. **Explicit floor keywords**: Matches patterns like `"Floor 2"`, `"Level 3"`, or `"(Floor G)"`.
2. **Ground floor keywords**: Matches the word `"ground"`.
3. **Room numbering syntax**: Matches 3-digit institutional numbering schemes where the hundreds digit denotes the floor:
   - `"Room 303"` &rarr; `303` starts with `3` &rarr; Returns `'3'`.
   - `"Lab 214"` &rarr; `214` starts with `2` &rarr; Returns `'2'`.
   - `"G05"` or `"G-12"` &rarr; Starts with `G` &rarr; Returns `'G'`.

---

```javascript
/**
 * Retrieves authentic rooms entered by the user in the GIS dataset.
 * When floorId is provided, filters strictly to that floor's rooms and amenities.
 * Zero generic fallback or synthetic generation: either entered by user in GIS data, or returns [] (None).
 */
export function getRoomsForBuilding(buildingNameOrId, floorId = null, wingId = null, customBuildingsList = null) {
  const list = customBuildingsList || getCampusBuildings();
  const target = list.find(
    (b) => b.id === buildingNameOrId || b.name === buildingNameOrId || b.shortName === buildingNameOrId
  );
  if (!target) {
    return [];
  }

  const custom = target.customRooms || target.custom_rooms;
  if (!Array.isArray(custom) || custom.length === 0) {
    return [];
  }

  if (
    !floorId ||
    floorId === 'all' ||
    floorId === 'ALL' ||
    floorId === 'None' ||
    !Array.isArray(target.floors) ||
    target.floors.length <= 1
  ) {
    return custom;
  }

  const normalizedTargetFloor = String(floorId).replace(/^floor\s*/i, '').trim().toUpperCase();

  const hasFloorDistinction = custom.some((rm) => inferFloorFromItem(rm) !== null);
  if (!hasFloorDistinction) {
    return custom;
  }

  return custom.filter((rm) => {
    const itemFloor = inferFloorFromItem(rm);
    return itemFloor === normalizedTargetFloor;
  });
}
```

### Plain-English Purpose
Retrieves real rooms recorded in the GIS dataset for a specific building:
- If a specific `floorId` is requested, it filters the rooms using `inferFloorFromItem(rm) === normalizedTargetFloor`.
- Guarantees **zero synthetic hallucination**: only authentic rooms registered in the database are returned. If a building has no registered rooms, it returns an empty array `[]`.

---

## 3. High-Frequency Viva & Technical Defense Questions

### Q1: What is the Architectural Facade Pattern, and why is `iiitnrCampusData.js` structured this way?
**Model Answer:**  
The Facade Pattern is a software design pattern that provides a simplified, unified interface to a complex subsystem of modules. Instead of having UI components import geometry from `campusGeometry.js`, search utilities from `campusSearchEngine.js`, and room lists from `campusLabsAndRooms.js`, `iiitnrCampusData.js` re-exports everything from one clean facade. This decouples the frontend UI from internal data restructuring.

### Q2: How does `inferFloorFromItem` determine that "Room 312" is on Floor 3?
**Model Answer:**  
It uses the regular expression:
`/\b(?:room|lab|cabin|hall|office)?\s*([G1-9])[-]?(\d{2}[A-Z]?)\b/i`
1. It matches an optional prefix (`room`, `lab`, `cabin`).
2. It captures the first character `([G1-9])` into Capture Group 1.
3. It captures the subsequent two digits `(\d{2})` (e.g. `12`) into Capture Group 2.
For `"Room 312"`, Group 1 captures `'3'`, which is normalized to `'3'` (Floor 3).

### Q3: What is the purpose of `IIITNR_MAP_UPDATED_EVENT`?
**Model Answer:**  
`IIITNR_MAP_UPDATED_EVENT` is a custom DOM event (`new CustomEvent(...)`). When an administrator updates building coordinates or adds a new laboratory in the GIS studio, `saveCustomCampusBuildings` dispatches this event. Any active components (such as `CampusMapSelector`) listening to this event immediately re-render with the latest spatial data without requiring a full browser refresh.

### Q4: Why is `IIITNR_CAMPUS_STORAGE_KEY` versioned with `_v14`?
**Model Answer:**  
When spatial coordinates or polygon schemas are revised during platform updates, old cached data in users' browsers can cause rendering artifacts or alignment mismatches. Versioning the storage key ensures that deploying a new release automatically bypasses obsolete cache entries and loads the latest canonical coordinates.

### Q5: Why does `getRoomsForBuilding` prohibit synthetic room generation?
**Model Answer:**  
In university grievance handling, accuracy is critical. Generating synthetic room numbers (e.g. automatically guessing that a building has rooms 101 to 120) could mislead students into filing complaints for rooms that do not physically exist. Returning strictly the authentic rooms registered in the GIS dataset prevents invalid complaints.

---

## 4. Quick Reference Summary Table

| Function / Constant | Return Type | Primary Purpose | Key Mechanism |
| :--- | :--- | :--- | :--- |
| `getCampusBuildings()` | `Array<Object>` | Retrieves building catalog | Checks `localStorage` cache; falls back to `DEFAULT_IIITNR_BUILDINGS` |
| `saveCustomCampusBuildings(b)` | `void` | Persists catalog & fires event | Writes to `localStorage`; dispatches `IIITNR_MAP_UPDATED_EVENT` |
| `fetchAndCacheCampusBuildings()` | `Promise<Array>` | Async database synchronization | Queries backend `/campus/buildings` and refreshes local cache |
| `getFloorsForBuilding(id)` | `Array<{id, label}>` | Normalizes building floor list | Converts string arrays or object arrays to uniform `{id, label}` format |
| `inferFloorFromItem(str)` | `string \| null` | Heuristic floor extractor | Regex extraction on room strings (`303` &rarr; `'3'`, `G05` &rarr; `'G'`) |
| `getRoomsForBuilding(id, fl)` | `Array<string>` | Floor-filtered room list | Filters building rooms via `inferFloorFromItem(rm) === fl` |
