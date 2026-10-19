"""
SmartComplaintHandler - Campus Building and Road ORM Models
Role: Persistent geospatial digital twin infrastructure stored in database
      (Supabase PostgreSQL in production, SQLite locally).
Data Source: Ground-truth GIS entities from frontend/public/iiitnr_gis_studio.html.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import String, Text, DateTime, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base


class CampusBuilding(Base):
    __tablename__ = "campus_buildings"

    id: Mapped[str] = mapped_column(String(100), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    short_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    badge: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False, default="ACADEMIC", index=True)
    color: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    map_pin: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    wings: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    floors: Mapped[Optional[List[Any]]] = mapped_column(JSON, nullable=True)
    rooms_per_floor: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    custom_rooms: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    polygons: Mapped[Optional[List[Any]]] = mapped_column(JSON, nullable=True)
    entrances: Mapped[Optional[List[Any]]] = mapped_column(JSON, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def to_dict(self) -> Dict[str, Any]:
        """Serialize model into standardized dictionary with dual camelCase / snake_case support."""
        pin = self.map_pin or {}
        return {
            "id": self.id,
            "name": self.name,
            "shortName": self.short_name or self.name,
            "short_name": self.short_name or self.name,
            "badge": self.badge or "",
            "category": self.category,
            "color": self.color or "#4f46e5",
            "mapPin": pin,
            "map_pin": pin,
            "wings": self.wings or [],
            "floors": self.floors or ["1", "2", "3", "4"],
            "roomsPerFloor": self.rooms_per_floor or 24,
            "rooms_per_floor": self.rooms_per_floor or 24,
            "customRooms": self.custom_rooms or [],
            "custom_rooms": self.custom_rooms or [],
            "description": self.description or "",
            "polygons": self.polygons or [],
            "entrances": self.entrances or [],
            "trace": {
                "badge": self.badge or "ZONE",
                "color": self.color or "#4f46e5",
                "lat": pin.get("lat"),
                "lng": pin.get("lng"),
            },
        }


class CampusRoad(Base):
    __tablename__ = "campus_roads"

    id: Mapped[str] = mapped_column(String(100), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    road_type: Mapped[str] = mapped_column(String(50), default="road", nullable=False)
    width: Mapped[int] = mapped_column(Integer, default=14, nullable=False)
    color: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    latlngs: Mapped[Optional[List[Any]]] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "type": self.road_type,
            "road_type": self.road_type,
            "width": self.width,
            "color": self.color or "#944b24",
            "latlngs": self.latlngs or [],
        }
