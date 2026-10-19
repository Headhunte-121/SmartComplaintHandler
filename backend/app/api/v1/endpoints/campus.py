"""
SmartComplaintHandler - Campus Digital Twin Infrastructure Endpoints
Role: Manages persistent campus buildings, floors, rooms, and geospatial coordinates
      for IIIT Naya Raipur campus.
"""
import json
import os
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.api.deps import require_roles
from app.schemas.user import UserResponse

router = APIRouter()

CAMPUS_DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "campus_buildings.json")

# Default IIIT Naya Raipur institutional campus buildings
DEFAULT_CAMPUS_BUILDINGS = [
    {
        "id": "academic_block",
        "name": "Main Academic & Administrative Building",
        "shortName": "Academic Block",
        "category": "ACADEMIC",
        "floors": [
            {
                "id": "G",
                "label": "Ground Floor (G)",
                "rooms": [
                    "Classroom 101",
                    "Classroom 102",
                    "Classroom 103",
                    "Computer Lab 1",
                    "Admin Office",
                    "Conference Hall",
                ],
            },
            {
                "id": "1",
                "label": "First Floor (1)",
                "rooms": [
                    "Classroom 201",
                    "Classroom 202",
                    "Faculty Cubicles 1-12",
                    "Library Reading Hall",
                ],
            },
            {
                "id": "2",
                "label": "Second Floor (2)",
                "rooms": [
                    "Classroom 301",
                    "IoT & Embedded Lab",
                    "Data Science Lab",
                    "Faculty Offices",
                ],
            },
            {
                "id": "3",
                "label": "Third Floor (3)",
                "rooms": [
                    "Server Room NOC",
                    "Research Scholar Lab",
                    "Seminar Hall 3",
                ],
            },
        ],
        "trace": {
            "badge": "ACADEMIC CORE",
            "color": "#10b981",
            "shape": "circle",
            "lat": 21.1278,
            "lng": 81.7661,
        },
    },
    {
        "id": "canteen",
        "name": "Student Activity Centre & Dining Canteen",
        "shortName": "Canteen & SAC",
        "category": "AMENITY",
        "floors": [
            {
                "id": "G",
                "label": "Ground Floor",
                "rooms": ["Main Dining Hall", "Food Counters 1-4", "Kitchen", "Juice Bar"],
            },
            {
                "id": "1",
                "label": "First Floor",
                "rooms": ["Music Room", "Dance Studio", "Student Council Room"],
            },
        ],
        "trace": {
            "badge": "DINING & CLUBS",
            "color": "#f59e0b",
            "shape": "circle",
            "lat": 21.1272,
            "lng": 81.7656,
        },
    },
    {
        "id": "auditorium",
        "name": "Central Campus Auditorium & Amphitheatre",
        "shortName": "Auditorium",
        "category": "AMENITY",
        "floors": [
            {
                "id": "G",
                "label": "Main Hall",
                "rooms": ["Main Auditorium Hall", "Green Room A", "Green Room B", "Control Booth"],
            }
        ],
        "trace": {
            "badge": "AUDITORIUM",
            "color": "#8b5cf6",
            "shape": "circle",
            "lat": 21.1285,
            "lng": 81.7654,
        },
    },
    {
        "id": "ramanujan_house",
        "name": "Ramanujan House (Boys Hostel 1)",
        "shortName": "Ramanujan House",
        "category": "HOSTEL",
        "floors": ["G", "1", "2", "3"],
        "trace": {
            "badge": "BH-1",
            "color": "#3b82f6",
            "shape": "poly",
            "lat": 21.1292,
            "lng": 81.7675,
        },
    },
    {
        "id": "bhabha_house",
        "name": "Bhabha House (Boys Hostel 2)",
        "shortName": "Bhabha House",
        "category": "HOSTEL",
        "floors": ["G", "1", "2", "3"],
        "trace": {
            "badge": "BH-2",
            "color": "#3b82f6",
            "shape": "poly",
            "lat": 21.1283,
            "lng": 81.7682,
        },
    },
    {
        "id": "bose_house",
        "name": "Bose House (Boys Hostel 3)",
        "shortName": "Bose House",
        "category": "HOSTEL",
        "floors": ["G", "1", "2", "3"],
        "trace": {
            "badge": "BH-3",
            "color": "#3b82f6",
            "shape": "poly",
            "lat": 21.1273,
            "lng": 81.7688,
        },
    },
    {
        "id": "raman_house",
        "name": "Raman House (Girls Hostel 1)",
        "shortName": "Raman House",
        "category": "HOSTEL",
        "floors": ["G", "1", "2", "3"],
        "trace": {
            "badge": "GH-1",
            "color": "#ec4899",
            "shape": "poly",
            "lat": 21.1264,
            "lng": 81.7645,
        },
    },
    {
        "id": "shabri_house",
        "name": "Shabri House (Girls Hostel 2)",
        "shortName": "Shabri House",
        "category": "HOSTEL",
        "floors": ["G", "1", "2", "3"],
        "trace": {
            "badge": "GH-2",
            "color": "#ec4899",
            "shape": "poly",
            "lat": 21.1257,
            "lng": 81.7652,
        },
    },
    {
        "id": "sports_complex",
        "name": "Athletics Ground, Courts & Gymnasium",
        "shortName": "Sports Ground",
        "category": "SPORTS",
        "floors": [
            {
                "id": "G",
                "label": "Ground Level",
                "rooms": [
                    "Football Turf",
                    "Cricket Pitch",
                    "Basketball Court",
                    "Badminton Indoor Court",
                    "Gymnasium Hall",
                ],
            }
        ],
        "trace": {
            "badge": "SPORTS",
            "color": "#06b6d4",
            "shape": "poly",
            "lat": 21.1305,
            "lng": 81.7660,
        },
    },
]


def _read_campus_data() -> List[Dict[str, Any]]:
    try:
        if os.path.exists(CAMPUS_DATA_FILE):
            with open(CAMPUS_DATA_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list) and len(data) > 0:
                    return data
    except Exception:
        pass
    return list(DEFAULT_CAMPUS_BUILDINGS)


def _write_campus_data(data: List[Dict[str, Any]]) -> None:
    try:
        os.makedirs(os.path.dirname(CAMPUS_DATA_FILE), exist_ok=True)
        with open(CAMPUS_DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to persist campus data: {str(e)}",
        )


class BuildingSchema(BaseModel):
    id: str = Field(..., min_length=2, max_length=100)
    name: str = Field(..., min_length=2, max_length=200)
    shortName: Optional[str] = None
    category: str = Field("ACADEMIC", max_length=50)
    floors: Optional[Any] = None
    trace: Optional[Dict[str, Any]] = None


@router.get("/buildings", summary="Get Campus Infrastructure Buildings")
def get_buildings() -> List[Dict[str, Any]]:
    """Returns persistent list of campus buildings, floors, and rooms."""
    return _read_campus_data()


@router.post("/buildings", summary="Add Campus Building Entity")
def create_building(
    building: BuildingSchema,
    current_user: Optional[UserResponse] = Depends(require_roles(["SUPER_ADMIN", "ADMIN"])),
) -> Dict[str, Any]:
    """Adds a new building to the campus digital twin."""
    buildings = _read_campus_data()
    if any(b["id"] == building.id for b in buildings):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Building with ID '{building.id}' already exists.",
        )
    b_dict = building.model_dump() if hasattr(building, "model_dump") else building.dict()
    buildings.append(b_dict)
    _write_campus_data(buildings)
    return b_dict


@router.put("/buildings/{building_id}", summary="Update Campus Building Entity")
def update_building(
    building_id: str,
    building: BuildingSchema,
    current_user: Optional[UserResponse] = Depends(require_roles(["SUPER_ADMIN", "ADMIN"])),
) -> Dict[str, Any]:
    """Updates an existing campus building."""
    buildings = _read_campus_data()
    found = False
    updated_b = None
    for idx, b in enumerate(buildings):
        if b["id"] == building_id:
            b_dict = building.model_dump() if hasattr(building, "model_dump") else building.dict()
            b_dict["id"] = building_id
            buildings[idx] = b_dict
            updated_b = b_dict
            found = True
            break
    if not found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Building '{building_id}' not found.",
        )
    _write_campus_data(buildings)
    return updated_b


@router.delete("/buildings/{building_id}", summary="Delete Campus Building Entity")
def delete_building(
    building_id: str,
    current_user: Optional[UserResponse] = Depends(require_roles(["SUPER_ADMIN"])),
) -> Dict[str, str]:
    """SuperAdmin action to delete a building entity."""
    buildings = _read_campus_data()
    initial_len = len(buildings)
    buildings = [b for b in buildings if b["id"] != building_id]
    if len(buildings) == initial_len:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Building '{building_id}' not found.",
        )
    _write_campus_data(buildings)
    return {"message": f"Building '{building_id}' deleted successfully."}


@router.post("/reset", summary="Reset Campus Catalog to Institutional Defaults")
def reset_buildings(
    current_user: Optional[UserResponse] = Depends(require_roles(["SUPER_ADMIN"])),
) -> List[Dict[str, Any]]:
    """SuperAdmin action to restore official IIIT Naya Raipur campus directory."""
    _write_campus_data(DEFAULT_CAMPUS_BUILDINGS)
    return DEFAULT_CAMPUS_BUILDINGS
