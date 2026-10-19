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
from app.db.seed import seed_campus_infrastructure

router = APIRouter()


@router.get("/buildings", summary="Get Campus Infrastructure Buildings from Database")
def get_buildings(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """
    Returns the authoritative list of campus buildings, floors, rooms, and GIS polygons
    persisted in the database.
    """
    buildings = db.query(CampusBuilding).order_by(CampusBuilding.display_order, CampusBuilding.name).all()
    if not buildings:
        # If DB is empty, automatically seed with canonical GIS studio entities
        seed_campus_infrastructure(db)
        buildings = db.query(CampusBuilding).order_by(CampusBuilding.display_order, CampusBuilding.name).all()

    return [b.to_dict() for b in buildings]


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


@router.get("/roads", summary="Get Campus Road Network from Database")
def get_roads(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Returns vehicular roads and pedestrian footpaths stored in the database."""
    roads = db.query(CampusRoad).all()
    if not roads:
        seed_campus_infrastructure(db)
        roads = db.query(CampusRoad).all()
    return [r.to_dict() for r in roads]


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


@router.post("/reset", summary="Reset Campus Database to Institutional GIS Defaults")
def reset_buildings(
    db: Session = Depends(get_db),
    current_user: Optional[UserResponse] = Depends(require_roles(["SUPER_ADMIN"])),
) -> List[Dict[str, Any]]:
    """SuperAdmin action to restore official IIIT Naya Raipur campus directory in database."""
    seed_campus_infrastructure(db)
    buildings = db.query(CampusBuilding).order_by(CampusBuilding.display_order, CampusBuilding.name).all()
    return [b.to_dict() for b in buildings]
