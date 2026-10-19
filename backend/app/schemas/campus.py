"""
SmartComplaintHandler - Campus Digital Twin Infrastructure Schemas
Role: Pydantic schemas validating building, floor, room, and GIS geometry payloads.
"""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


class BuildingBase(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str = Field(..., min_length=2, max_length=100)
    name: str = Field(..., min_length=2, max_length=200)
    shortName: Optional[str] = None
    short_name: Optional[str] = None
    badge: Optional[str] = None
    category: str = Field("ACADEMIC", max_length=50)
    color: Optional[str] = None
    mapPin: Optional[Dict[str, Any]] = None
    map_pin: Optional[Dict[str, Any]] = None
    wings: Optional[List[str]] = None
    floors: Optional[List[Any]] = None
    roomsPerFloor: Optional[int] = None
    rooms_per_floor: Optional[int] = None
    customRooms: Optional[List[str]] = None
    custom_rooms: Optional[List[str]] = None
    description: Optional[str] = None
    polygons: Optional[List[Any]] = None
    entrances: Optional[List[Any]] = None
    trace: Optional[Dict[str, Any]] = None


class RoadBase(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str = Field(..., min_length=2, max_length=100)
    name: str = Field(..., min_length=2, max_length=100)
    type: Optional[str] = "road"
    road_type: Optional[str] = "road"
    width: Optional[int] = 14
    color: Optional[str] = "#944b24"
    latlngs: Optional[List[Any]] = None


class CampusSyncRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    buildings: Optional[List[Dict[str, Any]]] = None
    roads: Optional[List[Dict[str, Any]]] = None
