# Comprehensive Code Walkthrough & Line-by-Line Guide: `frontend/src/api/campus.js`

> **File Location**: [`frontend/src/api/campus.js`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/frontend/src/api/campus.js)  
> **Prerequisites**: Basic knowledge of C or Python (functions, HTTP CRUD endpoints, JSON serialization). No specialized GIS mapping background is assumed.  
> **What this file is**: The campus digital twin API client. It bridges frontend 2D/3D map components (Leaflet, Mapbox, Three.js) with backend geospatial endpoints: fetching official building coordinates and floor lists (`fetchCampusBuildings`), enabling facility administrators to create, update, or delete physical buildings, querying the vehicular road and pedestrian network (`fetchCampusRoads`), and synchronizing bulk CAD/GIS drawings (`syncCampusData`).

---

## Block 1: Imports & Building Querying: `fetchCampusBuildings` (Lines 1–15)

```javascript
/**
 * SmartComplaintHandler - Campus Digital Twin Infrastructure API Transport
 * Role: Communicates with backend /campus endpoints to synchronize persistent buildings,
 *       floors, and room entities.
 */
import apiClient from './client';

/**
 * Fetch list of campus buildings from backend server.
 */
export async function fetchCampusBuildings() {
  const response = await apiClient.get('/campus/buildings');
  return response.data;
}
```

### 1. Plain-English Purpose
Imports the pre-configured Axios client and defines `fetchCampusBuildings`. It queries `GET /campus/buildings` to retrieve all persistent campus buildings (including wings, room capacities, and GPS polygons) stored in the database.

### 2. Line-by-Line Breakdown
- **Line 6 (`import apiClient from './client';`)**: Shared Axios instance.
- **Lines 11–14 (`export async function fetchCampusBuildings() { ... }`)**:
  - Issues `GET /campus/buildings`.
  - The backend returns an array of buildings with automatic self-healing database seeding if the database was uninitialized.
  - Returns `response.data`.

---

## Block 2: Building Creation, Update & Deletion (Lines 17–38)

```javascript
/**
 * Create a new campus building entity.
 */
export async function createCampusBuilding(buildingData) {
  const response = await apiClient.post('/campus/buildings', buildingData);
  return response.data;
}

/**
 * Update an existing campus building entity.
 */
export async function updateCampusBuilding(buildingId, buildingData) {
  const response = await apiClient.put(`/campus/buildings/${buildingId}`, buildingData);
  return response.data;
}

/**
 * Delete a campus building entity (SuperAdmin only).
 */
export async function deleteCampusBuilding(buildingId) {
  const response = await apiClient.delete(`/campus/buildings/${buildingId}`);
  return response.data;
}
```

### 1. Plain-English Purpose
Provides full CRUD (Create, Read, Update, Delete) capabilities for campus facilities:
- `createCampusBuilding`: Posts new building specifications to `POST /campus/buildings`.
- `updateCampusBuilding`: Updates boundary coordinates, floor numbers, or room counts via `PUT /campus/buildings/{buildingId}`.
- `deleteCampusBuilding`: Dispatches a destructive delete request to `DELETE /campus/buildings/{buildingId}` (strictly restricted to SuperAdmin).

### 2. Line-by-Line Breakdown
- **Lines 19–22 (`createCampusBuilding`)**: Posts JSON payload to `/campus/buildings`.
- **Lines 27–30 (`updateCampusBuilding`)**: Sends updated building attributes via `PUT /campus/buildings/${buildingId}`.
- **Lines 35–38 (`deleteCampusBuilding`)**: Deletes the target facility using `DELETE /campus/buildings/${buildingId}`.

---

## Block 3: Road Network & Bulk GIS Synchronization (Lines 40–63)

```javascript
/**
 * Fetch campus road and footpath network from database.
 */
export async function fetchCampusRoads() {
  const response = await apiClient.get('/campus/roads');
  return response.data;
}

/**
 * Bulk synchronize GIS Studio entities directly into database.
 */
export async function syncCampusData(payload) {
  const response = await apiClient.post('/campus/sync', payload);
  return response.data;
}

/**
 * Reset campus buildings catalog to institutional defaults in database.
 */
export async function resetCampusBuildings() {
  const response = await apiClient.post('/campus/reset');
  return response.data;
}
```

### 1. Plain-English Purpose
- `fetchCampusRoads`: Retrieves vehicular asphalt avenues and paved walkways for realistic 2D map navigation.
- `syncCampusData`: Posts an entire batch of buildings and roads drawn in the GIS Studio tool to `POST /campus/sync`, executing an atomic database upsert.
- `resetCampusBuildings`: Calls `POST /campus/reset` to restore the certified IIIT Naya Raipur campus layout if test coordinates corrupted the database.

### 2. Line-by-Line Breakdown
- **Lines 43–46 (`fetchCampusRoads`)**: Calls `GET /campus/roads`.
- **Lines 51–54 (`syncCampusData`)**: Sends `{ buildings: [...], roads: [...] }` to `/campus/sync`.
- **Lines 59–62 (`resetCampusBuildings`)**: Calls `/campus/reset` to restore canonical seed data.

---

## 4. Viva & Technical Defense Guide

> [!TIP]
> **Q1: Why is `syncCampusData` used instead of calling `createCampusBuilding` multiple times in a loop?**  
> **Answer**: Calling `createCampusBuilding` in a loop would make 25 separate HTTP requests to the backend, opening and closing 25 separate database transactions. This causes network congestion and can leave the map in a half-synchronized state if request #10 fails. `syncCampusData` dispatches a single batch payload to `POST /campus/sync`, allowing the backend to upsert all 25 buildings and roads within a single atomic database transaction.

> [!TIP]
> **Q2: How does `fetchCampusBuildings` support offline or fresh database deployments?**  
> **Answer**: On the backend, `GET /campus/buildings` includes an automated self-healing fallback: if the database is blank, the backend seeds canonical IIIT Naya Raipur facilities automatically before returning the response. `fetchCampusBuildings` receives the authoritative list seamlessly without requiring manual migration scripts.

---

## 5. Quick-Reference Viva Summary Table

| Concept / Keyword | Meaning in Basic C / Python | Role in `campus.js` |
| :--- | :--- | :--- |
| `fetchCampusBuildings` | Entity query function | Fetches all campus buildings, floors, and GPS polygons. |
| `createCampusBuilding` | Insertion caller | Adds a new campus facility via `POST /campus/buildings`. |
| `updateCampusBuilding` | Update caller | Modifies wings, floors, or room numbers via `PUT /campus/buildings/{id}`. |
| `deleteCampusBuilding` | Removal caller | Permanently deletes a facility (SuperAdmin only). |
| `fetchCampusRoads` | Road query function | Queries vehicular roads and pedestrian footpaths. |
| `syncCampusData` | Batch upsert caller | Synchronizes CAD/GIS drawings directly into SQL storage. |
| `resetCampusBuildings` | Restore defaults caller | Wipes test anomalies and restores certified IIIT-NR campus layout. |
