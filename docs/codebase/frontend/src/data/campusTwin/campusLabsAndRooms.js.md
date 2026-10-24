# Frontend Source Documentation: `frontend/src/data/campusTwin/campusLabsAndRooms.js`

> **File Path**: `frontend/src/data/campusTwin/campusLabsAndRooms.js`  
> **Role**: Institutional Campus Metadata Repository, Administrative Helpdesk Directory, and Hostel Structural Presets.  
> **Target Audience**: College Viva Examiners, Evaluation Committees, System Architects, Students grounded in basic C/Python.

---

## 1. High-Level Architectural Purpose

In scalable software engineering, hardcoding thousands of building records, room numbers, and laboratory inventories directly into client JavaScript bundles leads to bundle bloat, slow page load times, and operational rigidity (every time a room changes, developers would have to rebuild and redeploy the frontend).

`campusLabsAndRooms.js` implements a **Database-First Hydration Architecture**:
1. **Zero Frontend Bundle Bloat**: Leaves `DEFAULT_IIITNR_BUILDINGS = []` as an empty array, delegating canonical building and room inventories strictly to the backend database (`/api/v1/campus/buildings`).
2. **Authoritative Campus Metadata**: Houses institutional geographical coordinates, 50-acre boundary perimeter metrics, and the official physical address of Dr. SPM IIIT Naya Raipur.
3. **Institutional Emergency Directory**: Catalogs official facility contact desks (Estate, Electrical, IT NOC, and General Administration) with direct phone numbers, email addresses, and room numbers.
4. **Residential Hostel Structural Templates**: Defines standardized floor enumerations (`HOSTEL_FLOORS` 1 to 6) and communal zone presets (`HOSTEL_COMMON_ZONES`) used across student residences.

---

## 2. Sequential Code Breakdown & Deep Analysis

```javascript
/**
 * frontend/src/data/campusTwin/campusLabsAndRooms.js
 *
 * Lightweight client metadata presets for IIIT Naya Raipur.
 * Canonical campus entities (buildings, polygons, floors, and rooms) are stored
 * and managed strictly in the backend database (API: /api/v1/campus/buildings & /campus/roads).
 * Zero static building dictionaries in frontend bundle.
 */

export const IIITNR_CAMPUS_METADATA = {
  instituteName: 'Dr. SPM IIIT Naya Raipur',
  shortName: 'IIIT Naya Raipur',
  address: 'Plot No. 7, Sector 24, Near Purkhoti Muktangan, Atal Nagar – Nava Raipur, Chhattisgarh 493661',
  latitude: 21.12815,
  longitude: 81.7655,
  campusArea: '50 Acres Residential Digital Twin',
  boundaryPerimeter: '2,328 Meters',
  contacts: [
    {
      role: 'Estate & Civil Maintenance',
      name: 'Campus Facilities Service Desk',
      email: 'facilities@iiitnr.edu.in',
      phone: '0771-2474104',
      office: 'Academic Block, Estate Office (Room 104)',
    },
    {
      role: 'Electrical & Power Supply',
      name: 'Power & Utilities Helpdesk',
      email: 'electrical@iiitnr.edu.in',
      phone: '0771-2474109',
      office: 'Electrical Substation Service Desk',
    },
    {
      role: 'Campus IT & Wi-Fi NOC',
      name: 'Information Technology Desk',
      email: 'it-support@iiitnr.edu.in',
      phone: '0771-2474010',
      office: 'Data Centre & Network Lab (Room 131C)',
    },
    {
      role: 'General Administration',
      name: 'Institutional Administration Desk',
      email: 'admin@iiitnr.edu.in',
      phone: '0771-2474034',
      office: 'Administration Wing (Room 105)',
    },
  ],
};
```

### Plain-English Purpose
Defines the institutional metadata record `IIITNR_CAMPUS_METADATA`. It specifies the official institution name, physical postal address, global geographic coordinates ($21.12815^\circ\text{N}, 81.7655^\circ\text{E}$), perimeter length ($2,328\text{ meters}$), and an array of official departmental contact desks.

### Line-by-Line Breakdown
- `instituteName`: Official name of the university.
- `latitude`, `longitude`: WGS-84 decimal degree coordinates of the campus center.
- `campusArea`: Total acreage of the campus ($50\text{ acres}$).
- `contacts`: Array of contact structs specifying maintenance roles, email inboxes, direct-dial phone lines, and physical office rooms.

---

```javascript
export const HOSTEL_FLOORS = [
  { id: '1', label: 'Floor 1 (1xx)' },
  { id: '2', label: 'Floor 2 (2xx)' },
  { id: '3', label: 'Floor 3 (3xx)' },
  { id: '4', label: 'Floor 4 (4xx)' },
  { id: '5', label: 'Floor 5 (5xx)' },
  { id: '6', label: 'Floor 6 (6xx)' },
];

export const HOSTEL_WINGS = [];

export const HOSTEL_COMMON_ZONES = [
  'Corridor RO Water Cooler',
  'Washroom & Shower Block',
  'Common Room / TV Lounge',
  'Inner Courtyard Badminton / Sports Court',
  'Staircase & Corridor Lighting',
  'Wi-Fi Ceiling Access Point',
];

// Zero static building details in frontend bundle.
// All campus buildings and rooms are loaded dynamically from the backend database via /api/v1/campus/buildings.
export const DEFAULT_IIITNR_BUILDINGS = [];
```

### Plain-English Purpose
- `HOSTEL_FLOORS`: Standard structural template mapping floor IDs (`'1'` to `'6'`) to room numbering conventions (`1xx` through `6xx`).
- `HOSTEL_COMMON_ZONES`: Whitelist of shared communal areas in student residences where common facilities complaints originate.
- `DEFAULT_IIITNR_BUILDINGS`: Exported as an empty array (`[]`) to reinforce the architectural principle that building entities must be loaded dynamically from the PostgreSQL database via `/api/v1/campus/buildings`.

---

## 3. High-Frequency Viva & Technical Defense Questions

### Q1: Why is `DEFAULT_IIITNR_BUILDINGS` an empty array instead of containing hardcoded building data?
**Model Answer:**  
Hardcoding buildings in frontend bundles creates a synchronization bottleneck: if a new laboratory is constructed or a room is repurposed, developers would have to update the JavaScript codebase and rebuild the application. Setting `DEFAULT_IIITNR_BUILDINGS = []` enforces a **Database-First Architecture**, where building records, floor layouts, and room directories are managed centrally in PostgreSQL and fetched via the `/campus/buildings` REST API.

### Q2: What is the purpose of `HOSTEL_COMMON_ZONES`?
**Model Answer:**  
In student hostels, complaints often occur in shared communal spaces rather than individual dorm rooms (e.g., a broken water cooler in the corridor or a failed Wi-Fi access point in the lounge). `HOSTEL_COMMON_ZONES` provides a standardized list of communal areas that students can select when reporting shared residential issues.

### Q3: How are the geographic coordinates in `IIITNR_CAMPUS_METADATA` utilized?
**Model Answer:**  
The coordinates (`latitude: 21.12815, longitude: 81.7655`) pinpoint the geographic center of the campus in Atal Nagar. They are used to initialize external GPS mapping integrations, anchor satellite imagery overlays, and calculate distances from local municipal service stations.

### Q4: Why are contact numbers and room numbers included in this metadata module?
**Model Answer:**  
In enterprise systems, emergency contacts must be accessible even during partial network outages. Storing departmental contact numbers and physical office rooms (e.g. IT NOC in Room 131C) within this client preset guarantees that students and staff can find emergency phone lines even if the primary database is momentarily unreachable.

---

## 4. Quick Reference Summary Table

| Constant / Array | Structure | Primary Role | Key Mechanism |
| :--- | :--- | :--- | :--- |
| `IIITNR_CAMPUS_METADATA` | Object with nested `contacts` | Institutional identity & phone directory | Stores address, GPS center, & facility helpdesks |
| `HOSTEL_FLOORS` | Array of `{id, label}` | Residential vertical floor template | Maps floors $1\text{–}6$ to room number bands ($1\text{xx}\text{–}6\text{xx}$) |
| `HOSTEL_COMMON_ZONES` | Array of strings | Shared facility reporting presets | Standardizes common room, cooler, & Wi-Fi zones |
| `DEFAULT_IIITNR_BUILDINGS` | Empty Array (`[]`) | Dynamic database hydration gate | Enforces loading from `/api/v1/campus/buildings` |
