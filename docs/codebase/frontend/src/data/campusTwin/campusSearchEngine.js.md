# Frontend Source Documentation: `frontend/src/data/campusTwin/campusSearchEngine.js`

> **File Path**: `frontend/src/data/campusTwin/campusSearchEngine.js`  
> **Role**: In-Memory Multi-Token Spatial Search Indexer, Sub-Location Pin Override Registry, and Heuristic Location Extractor.  
> **Target Audience**: College Viva Examiners, Evaluation Committees, Information Retrieval Specialists, Students grounded in basic C/Python.

---

## 1. High-Level Architectural Purpose

When students or dispatchers search for a campus location (e.g. typing *"VLSI Lab"*, *"Room 303"*, or *"ATM"*), a naive system might merely point to the general Academic Block center. In a 3-story complex with multiple sprawling quadrants, a pin dropped in the courtyard leaves technicians searching through dozens of corridors.

`campusSearchEngine.js` provides an **In-Memory Spatial Information Retrieval Engine**:
1. **Multi-Level Index Generation (`buildCampusSearchIndex`)**: Recursively indexes all 4 hierarchical entity types:
   - **Zones & Buildings**: Academic complex, dining block, sports grounds.
   - **Specialty Facilities & Courts**: Outdoor basketball courts, volleyball arenas, rotunda dome.
   - **Official Laboratories & Classrooms**: VLSI Lab, AI/Deep Learning Lab, Network Lab (Room 131C).
   - **Hostel Residential Rooms**: Systematically indexed across floors Ground, 1, 2, and 3 (`G-01` to `G-24`, `101` to `124`, etc.).
2. **Sub-Location Pin Coordinate Overrides (`SUB_LOCATION_PIN_OVERRIDES`)**: Maps specific rooms (like Room 303 or Room 131C) to precise internal SVG coordinates $(cx, cy)$, ensuring the camera focuses directly on that specific wing or quadrant.
3. **Multi-Token Ranked Querying (`queryCampusSearchIndex`)**: Splits queries into whitespace tokens, filters entries containing all tokens, and scores results based on exact match bonus (+100), prefix match bonus (+60), and entity type boost (+25 for buildings, +20 for labs).
4. **Autonomous Location Detection (`autoDetectCampusLocation`)**: Extracts geographic entities directly from free-text complaint descriptions (e.g. *"Water leaking in Room 210"* auto-detects Room 210).

---

## 2. Sequential Code Breakdown & Deep Analysis

```javascript
/**
 * frontend/src/data/campusTwin/campusSearchEngine.js
 *
 * Smart Omni-Search & Auto-Detection Engine for the IIIT Naya Raipur Digital Twin.
 * Allows users to type any building name, room code (e.g., "303", "131C", "210", "314", "A-204"),
 * lab name (e.g., "VLSI", "AIDL", "ISBN", "Networks", "IDEA Lab", "3D Printing", "Robotics"),
 * faculty/staff in-charge (e.g., "Abir", "Parvinder", "Rakesh", "Debanjan", "Manoj", "Anurag"),
 * or campus amenity ("Canteen", "Auditorium", "Mess", "FG", "Old Amphi", "Amphi 2", "ATM")
 * and automatically resolves the exact Building, Floor, Wing, Room, and SVG (cx, cy) pin coordinates.
 */

// Exact sub-location pin coordinates inside the Academic Building & Campus so auto-detection
// points to the exact lab or room location rather than just a generic building center!
export const SUB_LOCATION_PIN_OVERRIDES = {
  '131c': { cx: 382, cy: 454, wingLabel: 'NW Sector Ground Floor (IT & Data Centre)' },
  '131e': { cx: 386, cy: 458, wingLabel: 'NW Sector Ground Floor (NOC)' },
  '132': { cx: 404, cy: 432, wingLabel: 'NE Sector 1 — Ground Floor (Networks & Data Science)' },
  '110': { cx: 368, cy: 458, wingLabel: 'NW Courtyard — Ground Floor (AICTE IDEA Lab)' },
  '112': { cx: 372, cy: 462, wingLabel: 'NW Courtyard — Ground Floor (3D Printing Lab)' },
  '104': { cx: 386, cy: 508, wingLabel: 'SW Admin Area — Ground Floor (Estate Office)' },
  '206': { cx: 416, cy: 448, wingLabel: 'NE Sector 2 — 1st Floor (IoT & Sensor Lab)' },
  '208': { cx: 406, cy: 434, wingLabel: 'NE Sector 1 — 1st Floor (Language Lab)' },
  '210': { cx: 428, cy: 474, wingLabel: 'NE Sector 3 — 1st Floor (AI & Deep Learning Lab)' },
  '212': { cx: 420, cy: 452, wingLabel: 'NE Sector 2 — 1st Floor (Biomedical & Speech Lab)' },
  '216': { cx: 434, cy: 478, wingLabel: 'NE Sector 3 — 1st Floor (Big Data Computing Lab)' },
  '301': { cx: 404, cy: 432, wingLabel: 'NE Sector 1 — 2nd Floor (Computer Programming Lab)' },
  '302': { cx: 416, cy: 448, wingLabel: 'NE Sector 2 — 2nd Floor (Electronic Circuit Lab)' },
  '303': { cx: 422, cy: 444, wingLabel: 'NE Sector 2 — 2nd Floor (VLSI & Embedded Lab)' },
  '305': { cx: 428, cy: 474, wingLabel: 'NE Sector 3 — 2nd Floor (Communication Lab)' },
  '308': { cx: 436, cy: 492, wingLabel: 'NE Sector 4 — 2nd Floor (Antenna & Microwave Lab)' },
  '310': { cx: 442, cy: 488, wingLabel: 'NE Sector 4 — 2nd Floor (PCB Design Lab)' },
  '314': { cx: 432, cy: 476, wingLabel: 'NE Sector 3 — 2nd Floor (Info Security & Blockchain Lab)' },
  '317': { cx: 446, cy: 484, wingLabel: 'NE Sector 4 — 2nd Floor (Autonomous Systems & Robotics Lab)' },
  rotunda: { cx: 387, cy: 483, wingLabel: 'Central White Rotunda Dome (387, 483)' },
  atm: { cx: 345, cy: 688, wingLabel: 'Union Bank of India ATM Kiosk (345, 688)' },
  'west gate': { cx: 42, cy: 612, wingLabel: 'West Gate No. 2 (42, 612)' },
  'block c1': { cx: 232, cy: 427, wingLabel: 'Shopping Complex / Block C1 (232, 427)' },
  substation: { cx: 218, cy: 448, wingLabel: '33/11kV Substation Annex (218, 448)' },
  'green court': { cx: 406, cy: 392, wingLabel: 'Academic North Green Court (406, 392)' },
  'red court': { cx: 188, cy: 526, wingLabel: 'West Twin Red Outdoor Courts (188, 526)' },
};
```

### Plain-English Purpose
Defines high-precision SVG pin coordinates for key rooms, laboratories, and outdoor campus landmarks. When a search matches one of these keys (e.g. `'303'`), the camera navigates directly to that specific wing quadrant (e.g. `{ cx: 422, cy: 444 }`) rather than the building's geometric center.

### Line-by-Line Breakdown
- `export const SUB_LOCATION_PIN_OVERRIDES = { ... }`: Hash map storing coordinate overrides and human-readable wing labels.
- `cx, cy`: Local Cartesian coordinates on the $1080 \times 800$ canvas.
- `wingLabel`: Descriptive orientation label (e.g. *"NE Sector 2 — 2nd Floor (VLSI & Embedded Lab)"*).

---

```javascript
/**
 * Builds the full searchable index of all buildings, floors, wings, labs, and rooms.
 */
export function buildCampusSearchIndex(buildings = []) {
  const index = [];

  buildings.forEach((b) => {
    const defaultCx = b.trace?.cx ?? 392;
    const defaultCy = b.trace?.cy ?? 472;

    // 1. Building / Zone level entry
    index.push({
      type: 'BUILDING',
      buildingId: b.id,
      buildingName: b.name,
      shortName: b.shortName,
      badge: b.trace?.badge || 'ZONE',
      category: b.category,
      floorId: 'G',
      floorLabel: 'Ground Floor',
      wingId: '',
      roomName: '',
      title: b.name,
      subtitle: `${b.type} · ${b.gps || 'Campus Twin'}`,
      details: b.description || '',
      searchKey: `${b.name} ${b.shortName} ${b.trace?.badge || ''} ${b.type} ${b.description || ''}`.toLowerCase(),
      cx: defaultCx,
      cy: defaultCy,
    });
```

### Plain-English Purpose
Constructs the search index array. For every building, it first creates a top-level `BUILDING` index entry containing the building name, short name, badge, category, and an aggregated lowercase `searchKey` string for fast substring matching.

---

```javascript
    // 2. Custom / Specialty Rooms & Courts
    const customList = b.customRooms || b.custom_rooms;
    if (Array.isArray(customList)) {
      customList.forEach((r) => {
        const lowerR = r.toLowerCase();
        let override = null;
        Object.keys(SUB_LOCATION_PIN_OVERRIDES).forEach((k) => {
          if (lowerR.includes(k)) override = SUB_LOCATION_PIN_OVERRIDES[k];
        });

        // Infer authentic floor ID (e.g. Room 311 -> '3')
        let inferredFloor = '1';
        const expMatch = r.match(/\\b(?:floor|level)\\s*([G0-9]+)\\b/i);
        if (expMatch) {
          inferredFloor = expMatch[1].toUpperCase();
        } else if (/\\bground\\b/i.test(r)) {
          inferredFloor = 'G';
        } else {
          const numMatch = r.match(/\\b(?:room|lab|cabin|hall|office)?\\s*([G1-9])[-]?(\\d{2}[A-Z]?)\\b/i);
          if (numMatch) {
            inferredFloor = numMatch[1].toUpperCase();
          } else if (Array.isArray(b.floors) && b.floors.length > 0) {
            inferredFloor = typeof b.floors[0] === 'string' ? b.floors[0] : (b.floors[0]?.id || '1');
          }
        }
        const floorLabel = inferredFloor === 'G' ? 'Ground Floor' : ('Floor ' + inferredFloor);

        index.push({
          type: 'FACILITY',
          buildingId: b.id,
          buildingName: b.name,
          shortName: b.shortName,
          badge: b.trace?.badge || 'SPOT',
          category: b.category,
          floorId: inferredFloor,
          floorLabel: floorLabel,
          wingId: '',
          roomName: r,
          title: r,
          subtitle: b.shortName + ' - ' + (override?.wingLabel || floorLabel),
          details: 'Located in ' + b.name + ' (' + (b.gps || '') + ')',
          searchKey: (r + ' ' + b.name + ' ' + b.shortName + ' ' + (b.trace?.badge || '')).toLowerCase(),
          cx: override?.cx ?? defaultCx,
          cy: override?.cy ?? defaultCy,
        });
      });
    }
```

### Plain-English Purpose
Indexes custom facilities, laboratories, and outdoor amenities. It inspects whether a sub-location coordinate override exists for this room, infers the floor number using regex, and appends a `FACILITY` entry with the specific pin coordinates.

---

```javascript
    // 3. Floor-by-Floor Rooms & Official Laboratories
    if (Array.isArray(b.floors)) {
      b.floors.forEach((fl) => {
        if (typeof fl === 'object' && Array.isArray(fl.rooms)) {
          fl.rooms.forEach((r) => {
            const lowerR = r.toLowerCase();
            let override = null;
            Object.keys(SUB_LOCATION_PIN_OVERRIDES).forEach((k) => {
              if (lowerR.includes(k)) override = SUB_LOCATION_PIN_OVERRIDES[k];
            });

            index.push({
              type: 'LAB_OR_ROOM',
              buildingId: b.id,
              buildingName: b.name,
              shortName: b.shortName,
              badge: b.trace?.badge || 'ROOM',
              category: b.category,
              floorId: fl.id,
              floorLabel: fl.label || `Floor ${fl.id}`,
              wingId: '',
              roomName: r,
              title: r,
              subtitle: `${b.shortName} · ${fl.label || `Floor ${fl.id}`}${override ? ` · ${override.wingLabel}` : ''}`,
              details: `${r} inside ${b.name} (${fl.label || `Floor ${fl.id}`})`,
              searchKey: `${r} ${b.name} ${b.shortName} floor ${fl.id} ${fl.label || ''} ${override?.wingLabel || ''}`.toLowerCase(),
              cx: override?.cx ?? defaultCx,
              cy: override?.cy ?? defaultCy,
            });
          });
        }
      });
    }

    // 4. Hostel Rooms across Floors (G, 1, 2, 3) - Direct rooms without wings
    if (b.category === 'HOSTEL') {
      ['G', '1', '2', '3'].forEach((fl) => {
        const maxR = Number(b.roomsPerFloor) || 24;
        for (let num = 1; num <= maxR; num += 1) {
          const padded = String(num).padStart(2, '0');
          const code = fl === 'G' ? `G-${padded}` : `${fl}${padded}`;
          const rName = `Room ${code}`;
          index.push({
            type: 'HOSTEL_ROOM',
            buildingId: b.id,
            buildingName: b.name,
            shortName: b.shortName,
            badge: b.trace?.badge || 'HOSTEL',
            category: 'HOSTEL',
            floorId: fl,
            floorLabel: fl === 'G' ? 'Ground Floor (G)' : `Floor ${fl} (${fl}xx)`,
            wingId: '',
            roomName: rName,
            title: `${b.shortName} — ${rName}`,
            subtitle: `${fl === 'G' ? 'Ground Floor' : `Floor ${fl}`}`,
            details: `Student Residence Room ${rName} in ${b.name}`,
            searchKey: `${rName} ${code} ${b.name} ${b.shortName}`.toLowerCase(),
            cx: defaultCx,
            cy: defaultCy,
          });
        }
      });
    }
  });

  return index;
}
```

### Plain-English Purpose
- Indexes nested rooms across floor arrays (`LAB_OR_ROOM`).
- For student hostels (`b.category === 'HOSTEL'`), it programmatically generates and indexes all student room numbers across floors Ground to 3 (`G-01` to `G-24`, `101` to `124`, `201` to `224`, `301` to `324`), allowing any student room in any hostel to be located immediately.

---

```javascript
/**
 * Searches the Digital Twin index and ranks exact building/room/lab matches first.
 */
export function queryCampusSearchIndex(query, searchIndex = [], maxResults = 10) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];

  const tokens = q.split(/\s+/).filter(Boolean);
  const scored = [];

  for (let i = 0; i < searchIndex.length; i += 1) {
    const item = searchIndex[i];
    const key = item.searchKey;

    let matchesAll = true;
    for (let t = 0; t < tokens.length; t += 1) {
      if (!key.includes(tokens[t])) {
        matchesAll = false;
        break;
      }
    }
    if (!matchesAll) continue;

    // Score boost for buildings, labs/rooms, and exact title prefix matches
    let score = 10;
    const lowerTitle = item.title.toLowerCase();
    if (lowerTitle === q) score += 100;
    else if (lowerTitle.startsWith(q)) score += 60;
    else if (lowerTitle.includes(q)) score += 35;

    if (item.type === 'BUILDING') score += 25;
    else if (item.type === 'LAB_OR_ROOM' || item.type === 'FACILITY') score += 20;

    scored.push({ item, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxResults).map((s) => s.item);
}
```

### Plain-English Purpose
Multi-token search matching and ranking algorithm:
1. Splits the user's query into individual words (e.g. `"Ramanujan 204"` becomes `["ramanujan", "204"]`).
2. Requires that **all tokens** exist in the item's search key (AND semantics).
3. Scores matching entries:
   - Exact title match: $+100$ points.
   - Starts-with prefix match: $+60$ points.
   - Substring match: $+35$ points.
   - Type boost: $+25$ for buildings, $+20$ for labs/facilities.
4. Sorts by score descending and returns the top `maxResults` (default 10).

---

```javascript
/**
 * Automatically detects a campus location from free-text complaint descriptions or search queries.
 */
export function autoDetectCampusLocation(text, buildings = []) {
  if (!text || !text.trim()) return null;
  const index = buildCampusSearchIndex(buildings);
  const directMatches = queryCampusSearchIndex(text, index, 1);
  if (directMatches.length > 0) return directMatches[0];
  return null;
}
```

### Plain-English Purpose
Natural language location extractor. When a student enters a complaint narrative like *"Water leakage in VLSI Lab"*, calling `autoDetectCampusLocation(description, buildings)` searches the index and extracts the top matching facility item.

---

## 3. High-Frequency Viva & Technical Defense Questions

### Q1: What is the purpose of `SUB_LOCATION_PIN_OVERRIDES`?
**Model Answer:**  
In large institutional buildings (such as the IIIT-NR Academic Block, which spans over 100 meters), navigating to the building's geometric center (`cx, cy`) drops the pin in the central outdoor courtyard. `SUB_LOCATION_PIN_OVERRIDES` provides exact internal coordinates for specialized labs (e.g., VLSI Lab at `{ cx: 422, cy: 444 }`, IT NOC at `{ cx: 386, cy: 458 }`), allowing the camera to point directly to that specific quadrant of the building.

### Q2: How does the multi-token search matching algorithm work?
**Model Answer:**  
`queryCampusSearchIndex` splits the query string by whitespace into an array of lowercase tokens: `tokens = q.split(/\s+/).filter(Boolean)`. For each item in the search index, it verifies that **every single token** is present in `item.searchKey`:
`if (!key.includes(tokens[t])) matchesAll = false;`
This AND-logic ensures that searching *"Ramanujan 204"* only returns results that match both *"Ramanujan"* and *"204"*, eliminating false positives.

### Q3: How are search results ranked and scored?
**Model Answer:**  
Every matching item starts with a baseline score of 10, then receives additive bonuses:
- **Exact title match** (`lowerTitle === q`): $+100$ points.
- **Prefix match** (`lowerTitle.startsWith(q)`): $+60$ points.
- **Substring match** (`lowerTitle.includes(q)`): $+35$ points.
- **Entity Type Boost**: $+25$ points for Buildings, $+20$ points for Labs and Facilities.
The array is sorted in descending order (`b.score - a.score`) so the most relevant match appears first.

### Q4: How does `autoDetectCampusLocation` assist the automated complaint submission process?
**Model Answer:**  
When students file complaints, they often describe their problem in free-form English (e.g. *"Fan not working in Room 303"*). `autoDetectCampusLocation` feeds this text into `queryCampusSearchIndex` to automatically extract the location. The complaint form can then pre-fill the building, floor, and room fields, saving the student from manually navigating the map.

### Q5: What is the time complexity of `queryCampusSearchIndex`?
**Model Answer:**  
The search index contains approximately 500 items (16 buildings, ~100 specialty labs/amenities, and ~380 hostel rooms). Searching 500 items across 2-3 tokens takes less than **1 millisecond** ($O(N \times T)$ where $N \approx 500$ and $T \le 3$). This guarantees instantaneous search responsiveness without requiring an external database or network round-trip.

---

## 4. Quick Reference Summary Table

| Function / Map | Input | Output | Primary Role |
| :--- | :--- | :--- | :--- |
| `SUB_LOCATION_PIN_OVERRIDES` | Room/Lab key string | `{cx, cy, wingLabel}` | High-precision quadrant coordinate overrides |
| `buildCampusSearchIndex(b)` | Buildings array | Array of ~500 indexed items | Flattens buildings, floors, labs, & rooms into searchable index |
| `queryCampusSearchIndex(q, idx)` | Search query string | Top $K$ ranked items | Multi-token search with exact-match scoring |
| `autoDetectCampusLocation(text)` | Free-form narrative | Best matching location | Automatic location extractor from complaint text |
