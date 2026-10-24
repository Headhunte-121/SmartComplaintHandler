# Comprehensive Code Walkthrough & Line-by-Line Guide: `backend/app/api/v1/endpoints/campus.py`

> **File Location**: [`backend/app/api/v1/endpoints/campus.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/backend/app/api/v1/endpoints/campus.py)  
> **Prerequisites**: Basic knowledge of C or Python (functions, HTTP CRUD endpoints, database queries, dictionaries, loops). No specialized GIS or geospatial database background is assumed.  
> **What this file is**: The campus digital twin infrastructure controller. It manages geospatial entities (buildings, wings, floors, rooms, GPS coordinates, boundary polygons, roads, and pedestrian footpaths) stored in the database. It allows interactive 2D/3D map clients to load official campus layout data, enables facility administrators to add or edit buildings, and supports bulk synchronizing CAD/GIS coordinates from the visual GIS Studio tool.

---

## Block 1: Imports & Framework Tools (Lines 1–18)

```python
"""
SmartComplaintHandler - Campus Digital Twin Infrastructure Endpoints
Role: Manages persistent campus buildings, floors, rooms, and geospatial coordinates
      directly in the database (Supabase PostgreSQL / SQLite).
Data Source: Authoritative ground-truth GIS entities from frontend/public/iiitnr_gis_studio.html.
"""
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_roles
from app.models.campus import CampusBuilding, CampusRoad
from app.schemas.campus import BuildingBase, RoadBase, CampusSyncRequest
from app.schemas.user import UserResponse
from app.db.seed import ensure_schema, seed_campus_infrastructure

router = APIRouter()
```

### 1. Plain-English Purpose
Loads data structure types, web routing mechanisms, error handling classes, database session injectors, security gatekeepers, database ORM models for buildings and roads, Pydantic validation contracts, and initial database seeding functions. Then, it initializes the `APIRouter()` instance for campus infrastructure.

### 2. Line-by-Line Breakdown
- **Lines 1–6 (`""" ... """`)**: Module docstring explaining the purpose: managing persistent campus digital twin assets (buildings, floors, rooms, roads, GPS pins) backed by PostgreSQL/SQLite.
- **Line 7 (`from typing import Any, Dict, List, Optional`)**: Imports standard Python typing definitions for arbitrary values, dictionaries, dynamic lists, and optional fields.
- **Line 8 (`from fastapi import APIRouter, Depends, HTTPException, status`)**:
  - `APIRouter`: Groups related campus endpoints under one sub-router.
  - `Depends`: Dependency injection tool used for database sessions and RBAC guards.
  - `HTTPException`: Used to return HTTP 400 (Bad Request) or 404 (Not Found) errors.
  - `status`: Standard HTTP status code constants (`200 OK`, `400 BAD REQUEST`, `404 NOT FOUND`).
- **Line 9 (`from sqlalchemy.orm import Session`)**: Live database transaction session.
- **Line 11 (`from app.api.deps import get_db, require_roles`)**:
  - `get_db`: Yields an active SQL database session.
  - `require_roles`: Security filter enforcing administrative permissions.
- **Line 12 (`from app.models.campus import CampusBuilding, CampusRoad`)**:
  - `CampusBuilding`: Database model representing a university building with wings, floors, room capacity, and GIS polygons.
  - `CampusRoad`: Database model representing campus roads and footpaths with GPS coordinates.
- **Line 13 (`from app.schemas.campus import BuildingBase, RoadBase, CampusSyncRequest`)**:
  - Pydantic models validating data when creating, updating, or synchronizing campus assets.
- **Line 14 (`from app.schemas.user import UserResponse`)**: Representation of the authenticated user.
- **Line 15 (`from app.db.seed import ensure_schema, seed_campus_infrastructure`)**:
  - `ensure_schema`: Verifies that tables exist in the database.
  - `seed_campus_infrastructure`: Inserts the canonical ground-truth IIIT Naya Raipur campus directory into an empty database.
- **Line 17 (`router = APIRouter()`)**: Instantiates the router instance.

### 3. Deep Term & Concept Expansion
- **Digital Twin**: A virtual software representation of physical physical assets and environments. In this application, every hostel room, lecture hall, lab, and generator room has a corresponding digital twin record in the database with GPS coordinates, floor numbers, and incident histories.
- **GIS (Geographic Information System)**: A framework for gathering, managing, and analyzing spatial and geographic data. Here, GIS data consists of latitude/longitude coordinates (`latlngs`) defining building footprints and road paths.

### 4. Runtime Mechanics & Security
- **Self-Healing Database Schema**: Notice that `ensure_schema` and `seed_campus_infrastructure` are imported. If a newly deployed backend starts with a blank database, this endpoint detects it and automatically seeds official campus layout data on first call without crashing.

---

## Block 2: Fetch Campus Buildings: `GET /buildings` (Lines 20–39)

```python
@router.get("/buildings", summary="Get Campus Infrastructure Buildings from Database")
def get_buildings(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """
    Returns the authoritative list of campus buildings, floors, rooms, and GIS polygons
    persisted in the database.
    """
    try:
        buildings = db.query(CampusBuilding).order_by(CampusBuilding.display_order, CampusBuilding.name).all()
    except Exception:
        db.rollback()
        ensure_schema()
        buildings = []

    if not buildings:
        # If DB is empty, automatically seed with canonical GIS studio entities
        seed_campus_infrastructure(db)
        buildings = db.query(CampusBuilding).order_by(CampusBuilding.display_order, CampusBuilding.name).all()

    return [b.to_dict() for b in buildings]
```

### 1. Plain-English Purpose
Supplies the 2D interactive campus map and complaint submission dropdowns with the complete list of university buildings. If the database is completely empty or the table was just dropped, it automatically seeds official campus buildings into the database so the user never sees a blank screen.

### 2. Line-by-Line Breakdown
- **Line 20 (`@router.get("/buildings", ...)`)**: Registers `GET /api/v1/campus/buildings`. Publicly accessible so students and visitors can view the map without logging in.
- **Line 21 (`def get_buildings(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:`)**: Accepts the injected database session `db`.
- **Lines 26–31 (`try...except Exception: ...`)**:
  - Attempts to query `CampusBuilding` ordered by `display_order` and `name`.
  - If the database table does not exist (e.g. fresh installation), it rolls back the transaction, calls `ensure_schema()` to create the missing tables, and sets `buildings = []`.
- **Lines 33–36 (`if not buildings: seed_campus_infrastructure(db) ...`)**:
  - Self-healing trigger: If the table was empty, calls `seed_campus_infrastructure(db)` to populate all canonical IIITNR buildings (Academic Block, Ramanujan Hostel, Bose Hostel, Dining Hall, Admin Block, etc.) and re-queries them.
- **Line 38 (`return [b.to_dict() for b in buildings]`)**:
  - Calls `.to_dict()` on each ORM building model, converting JSON columns (`polygons`, `map_pin`, `wings`, `entrances`) into a clean dictionary list.

### 3. Deep Term & Concept Expansion
- **List Comprehension in Python (`[b.to_dict() for b in buildings]`)**: A concise way to transform a list. In C, you would allocate an array with `malloc`, run a `for (int i=0; i<n; i++)` loop, and copy each converted element into the new array. In Python, this single line builds and returns the converted list.

### 4. Runtime Mechanics & Security
- **Transaction Rollback (`db.rollback()`)**: If an SQL query encounters an error (like a missing table), PostgreSQL marks the transaction as "aborted". Any further SQL commands on that session will fail immediately. Executing `db.rollback()` resets the session to a clean state so subsequent operations can succeed.

---

## Block 3: Fetch Building by ID: `GET /buildings/{building_id}` (Lines 41–51)

```python
@router.get("/buildings/{building_id}", summary="Get Campus Building by ID")
def get_building_by_id(building_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Returns a specific campus building record from the database."""
    building = db.query(CampusBuilding).filter(CampusBuilding.id == building_id).first()
    if not building:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Building with ID '{building_id}' was not found in campus database.",
        )
    return building.to_dict()
```

### 1. Plain-English Purpose
Fetches full details for a single specific building (e.g. `"hostel-ramanujan"`), including its floor lists, wings, and exact polygon boundaries. Used when a student clicks on a building in the interactive campus map.

### 2. Line-by-Line Breakdown
- **Line 41 (`@router.get("/buildings/{building_id}", ...)`)**: Binds to URL path `/api/v1/campus/buildings/{building_id}`.
- **Line 42 (`def get_building_by_id(building_id: str, ...)`)**: Receives the string identifier from the URL.
- **Line 44 (`building = db.query(CampusBuilding).filter(CampusBuilding.id == building_id).first()`)**:
  - Executes: `SELECT * FROM campus_buildings WHERE id = :building_id LIMIT 1;`.
- **Lines 45–49 (`if not building: raise HTTPException(...)`)**:
  - If no record exists with that ID, returns `HTTP 404 Not Found`.
- **Line 50 (`return building.to_dict()`)**:
  - Returns the building dictionary.

---

## Block 4: Create Campus Building: `POST /buildings` (Lines 53–93)

```python
@router.post("/buildings", summary="Add Campus Building Entity to Database")
def create_building(
    building_data: BuildingBase,
    db: Session = Depends(get_db),
    current_user: Optional[UserResponse] = Depends(require_roles(["SUPER_ADMIN", "ADMIN"])),
) -> Dict[str, Any]:
    """SuperAdmin / Admin endpoint to create a new campus building in the database."""
    existing = db.query(CampusBuilding).filter(CampusBuilding.id == building_data.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Building with ID '{building_data.id}' already exists in database.",
        )

    pin = building_data.mapPin or building_data.map_pin
    if not pin and building_data.trace:
        pin = {"lat": building_data.trace.get("lat"), "lng": building_data.trace.get("lng")}

    max_order = db.query(CampusBuilding).count()
    new_b = CampusBuilding(
        id=building_data.id,
        name=building_data.name,
        short_name=building_data.shortName or building_data.short_name or building_data.name,
        badge=building_data.badge or (building_data.trace.get("badge") if building_data.trace else ""),
        category=building_data.category or "ACADEMIC",
        color=building_data.color or (building_data.trace.get("color") if building_data.trace else "#4f46e5"),
        map_pin=pin,
        wings=building_data.wings or [],
        floors=building_data.floors or ["1", "2", "3", "4"],
        rooms_per_floor=building_data.roomsPerFloor or building_data.rooms_per_floor or 24,
        custom_rooms=building_data.customRooms or building_data.custom_rooms or [],
        description=building_data.description or "",
        polygons=building_data.polygons or [],
        entrances=building_data.entrances or [],
        display_order=max_order,
    )
    db.add(new_b)
    db.commit()
    db.refresh(new_b)
    return new_b.to_dict()
```

### 1. Plain-English Purpose
Allows an administrator to add a brand-new facility (e.g. a newly constructed Sports Complex or Research Block) to the university digital twin. Enforces unique building IDs, resolves camelCase vs snake_case naming conventions, sets sensible defaults, and stores the new building in the database.

### 2. Line-by-Line Breakdown
- **Lines 53–58 (Decorator & Parameters)**:
  - `POST /api/v1/campus/buildings`.
  - `building_data: BuildingBase`: Validates the incoming JSON schema.
  - `require_roles(["SUPER_ADMIN", "ADMIN"])`: Restricts access strictly to facility managers.
- **Lines 60–65 (Duplicate ID Prevention)**:
  - Queries if a building with `building_data.id` already exists. If yes, raises `HTTP 400 Bad Request`.
- **Lines 67–69 (Map Pin Normalization)**:
  - Supports both JavaScript frontend camelCase (`mapPin`) and Python snake_case (`map_pin`). If neither is present, attempts to extract latitude and longitude from the GIS tracing metadata (`building_data.trace`).
- **Line 71 (`max_order = db.query(CampusBuilding).count()`)**:
  - Assigns the new building to the end of the UI display list.
- **Lines 72–88 (`new_b = CampusBuilding(...)`)**:
  - Instantiates the ORM model, providing fallback defaults for floors (`["1", "2", "3", "4"]`), room counts (`24`), category (`"ACADEMIC"`), and theme color (`"#4f46e5"`).
- **Lines 89–92 (`db.add(new_b); db.commit(); db.refresh(new_b)`)**:
  - Inserts the row, commits the SQL transaction, and reloads the model from the database.
- **Line 92 (`return new_b.to_dict()`)**:
  - Returns the newly created building record.

### 3. Deep Term & Concept Expansion
- **CamelCase vs. SnakeCase Interoperability**:
  - JavaScript frontends typically send JSON with camelCase keys (e.g. `shortName`, `roomsPerFloor`).
  - Python backends use snake_case (e.g. `short_name`, `rooms_per_floor`).
  - By writing `building_data.shortName or building_data.short_name or building_data.name`, this endpoint accommodates both styles without crashing.

### 4. Runtime Mechanics & Security
- **Primary Key Uniqueness**: `CampusBuilding.id` is a primary key string (e.g., `"acad-block"`). Checking for existing records before inserting avoids raw database driver integrity crashes (`IntegrityError`).

---

## Block 5: Update Building: `PUT /buildings/{building_id}` (Lines 95–139)

```python
@router.put("/buildings/{building_id}", summary="Update Campus Building in Database")
def update_building(
    building_id: str,
    building_data: BuildingBase,
    db: Session = Depends(get_db),
    current_user: Optional[UserResponse] = Depends(require_roles(["SUPER_ADMIN", "ADMIN"])),
) -> Dict[str, Any]:
    """Updates an existing building record in the database."""
    building = db.query(CampusBuilding).filter(CampusBuilding.id == building_id).first()
    if not building:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Building '{building_id}' not found in database.",
        )

    pin = building_data.mapPin or building_data.map_pin
    if not pin and building_data.trace:
        pin = {"lat": building_data.trace.get("lat"), "lng": building_data.trace.get("lng")}

    building.name = building_data.name
    building.short_name = building_data.shortName or building_data.short_name or building.short_name
    building.badge = building_data.badge or building.badge
    building.category = building_data.category or building.category
    building.color = building_data.color or building.color
    if pin:
        building.map_pin = pin
    if building_data.wings is not None:
        building.wings = building_data.wings
    if building_data.floors is not None:
        building.floors = building_data.floors
    if building_data.roomsPerFloor or building_data.rooms_per_floor:
        building.rooms_per_floor = building_data.roomsPerFloor or building_data.rooms_per_floor
    if building_data.customRooms is not None or building_data.custom_rooms is not None:
        building.custom_rooms = building_data.customRooms or building_data.custom_rooms
    if building_data.description is not None:
        building.description = building_data.description
    if building_data.polygons is not None:
        building.polygons = building_data.polygons
    if building_data.entrances is not None:
        building.entrances = building_data.entrances

    db.commit()
    db.refresh(building)
    return building.to_dict()
```

### 1. Plain-English Purpose
Allows administrators to update an existing building's attributes (e.g. updating boundary coordinates, adding a new floor, renaming a wing, or changing its color). Preserves existing values if optional fields are not provided in the update payload.

### 2. Line-by-Line Breakdown
- **Lines 95–101 (Route & Access Guard)**:
  - Binds to `PUT /api/v1/campus/buildings/{building_id}`.
  - Requires `"SUPER_ADMIN"` or `"ADMIN"` role.
- **Lines 103–108 (Target Verification)**:
  - Looks up the building by `building_id`. Returns `HTTP 404` if not found.
- **Lines 110–135 (Selective Attribute Updates)**:
  - Selectively applies provided fields while leaving unchanged fields intact. For example, `if building_data.wings is not None:` prevents accidentally erasing existing wings if the client omitted that field.
- **Lines 136–138 (`db.commit(); db.refresh(building); return building.to_dict()`)**:
  - Commits the updates to SQL storage and returns the updated entity dictionary.

---

## Block 6: Delete Building: `DELETE /buildings/{building_id}` (Lines 141–157)

```python
@router.delete("/buildings/{building_id}", summary="Delete Campus Building from Database")
def delete_building(
    building_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[UserResponse] = Depends(require_roles(["SUPER_ADMIN"])),
) -> Dict[str, str]:
    """SuperAdmin action to delete a building from the database."""
    building = db.query(CampusBuilding).filter(CampusBuilding.id == building_id).first()
    if not building:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Building '{building_id}' not found in database.",
        )
    db.delete(building)
    db.commit()
    return {"message": f"Building '{building_id}' deleted successfully from database."}
```

### 1. Plain-English Purpose
Permanently removes a building record from the database. Because deleting a campus facility is an irreversible, high-risk action, it is strictly restricted to the highest privilege level: `"SUPER_ADMIN"`.

### 2. Line-by-Line Breakdown
- **Line 141 (`@router.delete("/buildings/{building_id}", ...)`)**: Binds to `DELETE /api/v1/campus/buildings/{building_id}`.
- **Line 145 (`require_roles(["SUPER_ADMIN"])`)**: Notice that regular `"ADMIN"` is **not** included! Only the Super Admin (Directorate level) can delete buildings.
- **Lines 148–153 (Existence Check)**: Ensures building exists before attempting deletion.
- **Lines 154–156 (`db.delete(building); db.commit()`)**: Deletes the row and commits the transaction. Returns a confirmation message.

---

## Block 7: Fetch Road Network: `GET /roads` (Lines 159–167)

```python
@router.get("/roads", summary="Get Campus Road Network from Database")
def get_roads(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Returns vehicular roads and pedestrian footpaths stored in the database."""
    roads = db.query(CampusRoad).all()
    if not roads:
        seed_campus_infrastructure(db)
        roads = db.query(CampusRoad).all()
    return [r.to_dict() for r in roads]
```

### 1. Plain-English Purpose
Returns the campus transportation pathways (asphalt vehicular roads, perimeter avenues, and paved pedestrian walkways). Used by the 2D map to render realistic navigation paths between campus buildings. If empty, automatically seeds official roads.

### 2. Line-by-Line Breakdown
- **Line 159 (`@router.get("/roads", ...)`)**: Public endpoint.
- **Line 162 (`roads = db.query(CampusRoad).all()`)**: Queries all records from `campus_roads`.
- **Lines 163–165 (`if not roads: seed_campus_infrastructure(db) ...`)**: Self-healing auto-seed fallback.
- **Line 166 (`return [r.to_dict() for r in roads]`)**: Serializes road models into dictionaries containing `latlngs` coordinate arrays and road widths.

---

## Block 8: Bulk GIS Studio Synchronization: `POST /sync` (Lines 169–256)

```python
@router.post("/sync", summary="Bulk Synchronize GIS Studio Data to Database")
def sync_campus_data(
    payload: CampusSyncRequest,
    db: Session = Depends(get_db),
    current_user: Optional[UserResponse] = Depends(require_roles(["SUPER_ADMIN", "ADMIN"])),
) -> Dict[str, Any]:
    """
    Directly persists buildings and roads drawn in frontend/public/iiitnr_gis_studio.html
    into the database.
    """
    synced_b = 0
    synced_r = 0

    if payload.buildings:
        for idx, b in enumerate(payload.buildings):
            b_id = b.get("id")
            if not b_id:
                continue
            existing = db.query(CampusBuilding).filter(CampusBuilding.id == b_id).first()
            pin = b.get("mapPin") or b.get("map_pin")
            if not existing:
                nb = CampusBuilding(
                    id=b_id,
                    name=b.get("name", "Unnamed Building"),
                    short_name=b.get("shortName") or b.get("name"),
                    badge=b.get("badge") or "",
                    category=b.get("category", "ACADEMIC"),
                    color=b.get("color") or "#4f46e5",
                    map_pin=pin,
                    wings=b.get("wings") or [],
                    floors=b.get("floors") or ["1", "2", "3", "4"],
                    rooms_per_floor=b.get("roomsPerFloor") or 24,
                    custom_rooms=b.get("customRooms") or [],
                    description=b.get("description") or "",
                    polygons=b.get("polygons") or [],
                    entrances=b.get("entrances") or [],
                    display_order=idx,
                )
                db.add(nb)
            else:
                existing.name = b.get("name", existing.name)
                existing.short_name = b.get("shortName") or b.get("name") or existing.short_name
                existing.badge = b.get("badge") or existing.badge
                existing.category = b.get("category", existing.category)
                existing.color = b.get("color") or existing.color
                if pin:
                    existing.map_pin = pin
                existing.wings = b.get("wings") or existing.wings
                existing.floors = b.get("floors") or existing.floors
                existing.rooms_per_floor = b.get("roomsPerFloor") or existing.rooms_per_floor
                existing.custom_rooms = b.get("customRooms") or existing.custom_rooms
                existing.description = b.get("description") or existing.description
                existing.polygons = b.get("polygons") or existing.polygons
                existing.entrances = b.get("entrances") or existing.entrances
                existing.display_order = idx
            synced_b += 1

    if payload.roads:
        for r in payload.roads:
            r_id = r.get("id")
            if not r_id:
                continue
            existing_road = db.query(CampusRoad).filter(CampusRoad.id == r_id).first()
            if not existing_road:
                road = CampusRoad(
                    id=r_id,
                    name=r.get("name", "Road"),
                    road_type=r.get("type", "road"),
                    width=r.get("width", 14),
                    color=r.get("color", "#944b24"),
                    latlngs=r.get("latlngs") or [],
                )
                db.add(road)
            else:
                existing_road.name = r.get("name", existing_road.name)
                existing_road.road_type = r.get("type", existing_road.road_type)
                existing_road.width = r.get("width", existing_road.width)
                existing_road.color = r.get("color", existing_road.color)
                existing_road.latlngs = r.get("latlngs") or existing_road.latlngs
            synced_r += 1

    db.commit()
    return {
        "status": "success",
        "message": f"Successfully synchronized {synced_b} buildings and {synced_r} roads into database.",
        "buildings_count": db.query(CampusBuilding).count(),
        "roads_count": db.query(CampusRoad).count(),
    }
```

### 1. Plain-English Purpose
The project includes a visual map drafting tool (`frontend/public/iiitnr_gis_studio.html`) where campus cartographers can draw building outlines and roads directly on satellite maps. When they click "Save Changes to Database", this endpoint performs an **Upsert** (Update if existing, Insert if new) for dozens of buildings and road polylines in a single batch transaction.

### 2. Line-by-Line Breakdown
- **Lines 169–174 (Decorator & Signature)**:
  - Binds to `POST /api/v1/campus/sync`.
  - Protected by `require_roles(["SUPER_ADMIN", "ADMIN"])`.
- **Lines 179–180 (`synced_b = 0; synced_r = 0`)**: Counters tracking how many buildings and roads were processed.
- **Lines 182–224 (Building Upsert Loop)**:
  - Loops through each building in `payload.buildings`.
  - Checks if `CampusBuilding` exists with that ID.
  - **If not found**: Instantiates a new `CampusBuilding` and stages it with `db.add(nb)`.
  - **If found**: Updates all attributes with the incoming values, keeping previous values if fields are missing.
- **Lines 226–249 (Road Upsert Loop)**:
  - Loops through `payload.roads`.
  - Checks if `CampusRoad` exists with that ID.
  - Inserts new road or updates existing road properties (`name`, `road_type`, `width`, `color`, `latlngs`).
- **Line 250 (`db.commit()`)**:
  - Commits the entire batch of additions and updates atomically in a single SQL transaction.
- **Lines 251–256 (Return Response)**:
  - Returns a summary confirming the number of synchronized buildings and roads.

### 3. Deep Term & Concept Expansion
- **What is an "Upsert"?**: A portmanteau of "Update" and "Insert". Instead of forcing the client to figure out which items are new and which already exist, the backend checks each item: if it exists, update it; if it doesn't, insert it.

### 4. Runtime Mechanics & Security
- **Batch Transaction Atomicity**: Notice that `db.commit()` is called **only once at Line 250**, after all loops finish. If a fatal database error occurs on building #12, the entire batch transaction rolls back cleanly, leaving no half-synchronized or corrupted campus maps.

---

## Block 9: Reset Campus Directory: `POST /reset` (Lines 259–267)

```python
@router.post("/reset", summary="Reset Campus Database to Institutional GIS Defaults")
def reset_buildings(
    db: Session = Depends(get_db),
    current_user: Optional[UserResponse] = Depends(require_roles(["SUPER_ADMIN"])),
) -> List[Dict[str, Any]]:
    """SuperAdmin action to restore official IIIT Naya Raipur campus directory in database."""
    seed_campus_infrastructure(db)
    buildings = db.query(CampusBuilding).order_by(CampusBuilding.display_order, CampusBuilding.name).all()
    return [b.to_dict() for b in buildings]
```

### 1. Plain-English Purpose
If test data or incorrect coordinates corrupt the campus map, the Super Administrator can click "Restore Institutional Defaults". This wipes any stray test buildings and restores the certified IIIT Naya Raipur campus layout directly from the master seed file.

### 2. Line-by-Line Breakdown
- **Line 259 (`@router.post("/reset", ...)`)**: Binds to `POST /api/v1/campus/reset`.
- **Line 262 (`require_roles(["SUPER_ADMIN"])`)**: Strictly restricted to Super Admin.
- **Line 265 (`seed_campus_infrastructure(db)`)**: Runs the master seed function to repopulate certified buildings and roads.
- **Line 266–267 (`buildings = db.query(...).all(); return [b.to_dict() for b in buildings]`)**: Re-queries and returns the restored campus buildings.

---

## 10. Viva & Technical Defense Guide

> [!TIP]
> **Q1: Why did we store campus buildings and roads in the SQL database instead of just hardcoding a static JSON file on the frontend?**  
> **Answer**: Storing campus infrastructure in the database provides three crucial real-world advantages:
> 1. **Dynamic Expansion**: Campus administrators can add newly constructed buildings, labs, or temporary tents directly via the UI without modifying frontend code or rebuilding the web application.
> 2. **Relational Integrity**: Tickets can maintain foreign keys referencing valid building IDs and room numbers, preventing students from submitting complaints for non-existent locations.
> 3. **Single Source of Truth**: The same authoritative building coordinates and floor layouts are shared seamlessly across the student complaint form, the technician dispatch engine, and executive telemetry dashboards.

> [!TIP]
> **Q2: What is "Self-Healing Seeding" and how is it implemented in `get_buildings`?**  
> **Answer**: In `get_buildings`, if the database table is empty or uninitialized, the endpoint catches the condition, automatically invokes `seed_campus_infrastructure(db)`, and populates the certified IIIT Naya Raipur campus data. This ensures zero downtime during fresh container deployments or test environment resets.

> [!TIP]
> **Q3: What is an "Upsert" operation, and why is it used in the `/sync` endpoint?**  
> **Answer**: An Upsert (Update + Insert) checks whether each record exists in the database. If it exists, its fields are updated; if it does not exist, a new row is inserted. In `/sync`, the GIS Studio sends the entire campus dataset at once. Upserting ensures that newly traced buildings are added while existing buildings have their revised coordinates saved, all committed in a single atomic SQL transaction.

> [!TIP]
> **Q4: Why does `delete_building` require `SUPER_ADMIN` while `create_building` allows `ADMIN`?**  
> **Answer**: Privilege separation based on risk severity. Adding a new building or updating room numbers is a standard administrative task. Deleting a building is a destructive operation that could orphan historical complaint records associated with that building ID. Therefore, deletion is restricted exclusively to the highest institutional authority (`SUPER_ADMIN`).

---

## 11. Quick-Reference Viva Summary Table

| Concept / Keyword | Meaning in Basic C / Python | Role in `campus.py` |
| :--- | :--- | :--- |
| `router.get("/buildings")` | Array reader function | Serves all campus buildings with auto-seeding fallback. |
| `router.post("/buildings")` | Entity creation function | Adds a new campus building, validating against duplicate IDs. |
| `router.put("/buildings/{id}")` | Record update function | Updates an existing building's wings, floors, or coordinates. |
| `router.delete("/buildings/{id}")` | Destructive removal | Deletes a building; restricted strictly to `SUPER_ADMIN`. |
| `router.get("/roads")` | Road query function | Returns vehicular roads and pedestrian walkways. |
| `router.post("/sync")` | Bulk batch upsert | Synchronizes CAD/GIS polygons drawn in the visual map studio. |
| `router.post("/reset")` | Factory reset function | Restores canonical IIITNR campus directory from seed data. |
| Self-Healing Auto-Seed | Fallback initializer | Populates certified campus data if the table is empty on startup. |
| Batch Transaction | Single `db.commit()` | Ensures all synchronized buildings either save together or roll back. |
| `CampusBuilding.to_dict()` | Model serializer | Transforms SQLAlchemy ORM instance and JSON fields into Python dictionary. |
