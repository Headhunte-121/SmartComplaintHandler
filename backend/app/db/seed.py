"""
SmartComplaintHandler - Database Bootstrap & Starter Data Seeder
Blueprint Reference: V1/M1/backend/08_seed_data.md
Role: Idempotently seeds authentic IIIT Naya Raipur campus departments, maintenance squads,
      official administrative staff, and production User schema columns upon boot or manual CLI invocation.
"""
from datetime import datetime, timedelta, timezone
import json
import logging
import os
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.db.base import Base
from app.models.department import Department
from app.models.team import MaintenanceTeam, Team  # noqa: F401
from app.models.ticket import Ticket
from app.models.user import User
from app.models.campus import CampusBuilding, CampusRoad

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

SEED_DEPARTMENTS = [
    {"id": 1, "name": "Electrical", "description": "Power grids, lighting, wiring, AC units, and 33/11kV substation maintenance"},
    {"id": 2, "name": "Plumbing", "description": "RO water coolers, supply pipelines, fixtures, drainage, sewage, and pumps"},
    {"id": 3, "name": "Sanitation", "description": "Hostel and academic block hygiene, waste disposal, cleaning, and pest control"},
    {"id": 4, "name": "Carpentry", "description": "Doors, locks, windows, hostel cot/table furniture, desks, and civil fixtures"},
    {"id": 5, "name": "IT Support", "description": "Campus Wi-Fi access points, LAN ports, Data Centre NOC (131C/131E), and lab systems"},
    {"id": 6, "name": "General Administration", "description": "Estate Office, hostel wardens, mess administration, and campus civil facilities"},
]

SEED_TEAMS = [
    {"id": 1, "name": "Substation High-Voltage Team", "department_id": 1, "active_ticket_count": 0, "is_active": True},
    {"id": 2, "name": "Water Supply Emergency Team", "department_id": 2, "active_ticket_count": 0, "is_active": True},
    {"id": 3, "name": "Sanitation Rapid Response", "department_id": 3, "active_ticket_count": 0, "is_active": True},
    {"id": 4, "name": "Structural Fixtures Crew", "department_id": 4, "active_ticket_count": 0, "is_active": True},
    {"id": 5, "name": "Network & Wi-Fi Squad", "department_id": 5, "active_ticket_count": 0, "is_active": True},
    {"id": 6, "name": "Hostel Electrical Squad 1", "department_id": 1, "active_ticket_count": 0, "is_active": True},
    {"id": 7, "name": "Hostel Plumbing Squad 2", "department_id": 2, "active_ticket_count": 0, "is_active": True},
]

SEED_ADMINS = [
    {
        "name": "Prof. (Dr.) Om Prakash Vyas (Director)",
        "email": "superadmin@iiitnr.edu.in",
        "role": "SUPER_ADMIN",
        "department_name": "Office of the Director",
        "phone": "+91-771-2474001",
    },
    {
        "name": "Rakesh Kumar Mishra (Estate Officer)",
        "email": "admin@iiitnr.edu.in",
        "role": "ADMIN",
        "department_name": "General Administration",
        "department_id": 6,
        "phone": "+91-771-2474104",
    },
    {
        "name": "Ranjeet Singh Thakur (JE Electrical)",
        "email": "electrical.admin@iiitnr.edu.in",
        "role": "ADMIN",
        "department_name": "Electrical",
        "department_id": 1,
        "phone": "+91-771-2474109",
    },
    {
        "name": "Er. Manoj Verma (Hostel & Water Works)",
        "email": "plumbing.admin@iiitnr.edu.in",
        "role": "ADMIN",
        "department_name": "Plumbing",
        "department_id": 2,
        "phone": "+91-771-2474104",
    },
    {
        "name": "Abir Bhattacharya (Sr. Network Engineer)",
        "email": "abir@iiitnr.edu.in",
        "role": "ADMIN",
        "department_name": "IT Support",
        "department_id": 5,
        "phone": "+91-771-2474131",
    },
    {
        "name": "Parvinder Singh (Network Engineer, Room 131E)",
        "email": "parvinder@iiitnr.edu.in",
        "role": "TECHNICIAN",
        "department_name": "IT Support",
        "department_id": 5,
        "phone": "+91-771-2474132",
    },
    {
        "name": "Ramesh Kumar (Electrical Tech Lead)",
        "email": "tech.ramesh@iiitnr.edu.in",
        "role": "TECHNICIAN",
        "department_name": "Electrical",
        "department_id": 1,
        "phone": "+91-771-2474105",
    },
]

CAMPUS_CATALOG = [
    {"name": "Electrical", "description": "Power grids, lighting, wiring, and substation maintenance", "squads": ["Hostel Wiring Squad", "Academic Power Crew"]},
    {"name": "Plumbing", "description": "Water supply pipelines, fixtures, drainage, sewage, and pumps", "squads": ["Hostel Plumbing Squad", "Campus Waterline Crew"]},
    {"name": "IT Support", "description": "Campus networks, Wi-Fi access points, lab computers, and portals", "squads": ["Network Infrastructure Squad", "Hardware Repair Crew"]},
    {"name": "Carpentry", "description": "Doors, windows, wooden furniture, desks, and civil fixtures", "squads": ["Furniture Repair Squad", "General Carpentry Crew"]},
    {"name": "Sanitation", "description": "Waste disposal, restroom hygiene, cleaning, and pest control", "squads": ["Hostel Sanitation Squad", "Campus Cleanliness Crew"]},
    {"name": "General Administration", "description": "Miscellaneous campus facilities, civil repairs, and general inquiries", "squads": ["Campus Infrastructure Desk"]},
]


def ensure_schema() -> None:
    """Ensure all newly added tables and columns exist across SQLite and Supabase PostgreSQL."""
    Base.metadata.create_all(bind=engine)
    try:
        with engine.begin() as conn:
            if "sqlite" not in str(engine.url):
                # Ensure users table columns exist in PostgreSQL / Supabase
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS hashed_password VARCHAR(255);"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS hostel_name VARCHAR(120);"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS room_number VARCHAR(60);"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS department_name VARCHAR(100);"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id INTEGER;"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'password';"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub VARCHAR(255);"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT TRUE;"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'STUDENT';"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;"))

                # Ensure tickets table columns exist in PostgreSQL / Supabase
                conn.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS student_name VARCHAR(150);"))
                conn.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS student_email VARCHAR(150);"))
                conn.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS feedback_rating INTEGER;"))
                conn.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS feedback_comments TEXT;"))
                conn.execute(text("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS feedback_submitted_at TIMESTAMP WITH TIME ZONE;"))
                return

            res = conn.execute(text("PRAGMA table_info(tickets);"))
            existing = {row[1] for row in res.fetchall()}
            cols = [
                ("student_name", "VARCHAR(150)"),
                ("student_email", "VARCHAR(150)"),
                ("feedback_rating", "INTEGER"),
                ("feedback_comments", "TEXT"),
                ("feedback_submitted_at", "DATETIME"),
            ]
            for name, col_type in cols:
                if name not in existing:
                    conn.execute(text(f"ALTER TABLE tickets ADD COLUMN {name} {col_type};"))

            res_user = conn.execute(text("PRAGMA table_info(users);"))
            existing_user = {row[1] for row in res_user.fetchall()}
            user_cols = [
                ("hashed_password", "VARCHAR(255)"),
                ("department_name", "VARCHAR(100)"),
                ("department_id", "INTEGER"),
                ("phone", "VARCHAR(50)"),
                ("hostel_name", "VARCHAR(120)"),
                ("room_number", "VARCHAR(60)"),
                ("auth_provider", "VARCHAR(50) DEFAULT 'password'"),
                ("google_sub", "VARCHAR(255)"),
                ("avatar_url", "VARCHAR(500)"),
                ("email_verified", "BOOLEAN DEFAULT 1"),
                ("is_active", "BOOLEAN DEFAULT 1"),
                ("role", "VARCHAR(50) DEFAULT 'STUDENT'"),
                ("failed_login_attempts", "INTEGER DEFAULT 0"),
                ("locked_until", "DATETIME"),
                ("last_login_at", "DATETIME"),
            ]
            for name, col_type in user_cols:
                if name not in existing_user:
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {name} {col_type};"))
    except Exception as e:
        logger.warning(f"Schema update notice: {e}")


def seed_database(db: Session) -> None:
    """
    Seed initial departments, maintenance teams, and IIIT-NR administrative accounts.
    Leaves ticket complaints empty for authentic student-driven intake.
    """
    ensure_schema()

    existing_depts_by_name = {d.name.lower(): d for d in db.query(Department).all()}
    existing_depts_by_id = {d.id: d for d in db.query(Department).all()}

    for d_data in SEED_DEPARTMENTS:
        d_id = d_data.get("id")
        d_name = d_data["name"]

        if (d_id is not None and d_id in existing_depts_by_id) or d_name.lower() in existing_depts_by_name:
            continue

        dept = Department(
            id=d_id,
            name=d_name,
            description=d_data["description"],
        )
        db.add(dept)
        db.flush()
        existing_depts_by_name[d_name.lower()] = dept
        if dept.id:
            existing_depts_by_id[dept.id] = dept
    db.commit()

    existing_teams_by_name = {t.name.lower(): t for t in db.query(MaintenanceTeam).all()}
    existing_teams_by_id = {t.id: t for t in db.query(MaintenanceTeam).all()}

    for t_data in SEED_TEAMS:
        t_id = t_data.get("id")
        t_name = t_data["name"]

        if (t_id is not None and t_id in existing_teams_by_id) or t_name.lower() in existing_teams_by_name:
            continue

        team = MaintenanceTeam(
            id=t_id,
            name=t_name,
            department_id=t_data["department_id"],
            active_ticket_count=t_data.get("active_ticket_count", 0),
            is_active=t_data.get("is_active", True),
        )
        db.add(team)
        db.flush()
        existing_teams_by_name[t_name.lower()] = team
        if team.id:
            existing_teams_by_id[team.id] = team
    db.commit()

    existing_users = {u.email.lower(): u for u in db.query(User).all()}
    for a_data in SEED_ADMINS:
        a_email = a_data["email"].lower()
        if a_email in existing_users:
            continue
        admin_user = User(
            name=a_data["name"],
            email=a_email,
            role=a_data["role"],
            department_name=a_data.get("department_name"),
            department_id=a_data.get("department_id"),
            phone=a_data.get("phone"),
            auth_provider="password",
            email_verified=True,
            is_active=True,
            failed_login_attempts=0,
        )
        db.add(admin_user)
        existing_users[a_email] = admin_user
    db.commit()

    teams = db.query(MaintenanceTeam).all()
    for team in teams:
        team.active_ticket_count = (
            db.query(Ticket)
            .filter(
                Ticket.assigned_team_id == team.id,
                Ticket.status.in_(["SUBMITTED", "IN_PROGRESS", "ESCALATED"]),
            )
            .count()
        )
    db.commit()

    # Seed authentic campus buildings and roads from GIS Studio ground truth
    seed_campus_infrastructure(db)


def seed_campus_infrastructure(db: Session) -> None:
    """
    Populates campus_buildings and campus_roads tables in database with authentic
    ground-truth GIS entities from frontend/public/iiitnr_gis_studio.html.
    """
    json_path = os.path.join(os.path.dirname(__file__), "canonical_gis_data.json")
    if not os.path.exists(json_path):
        return

    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        logger.warning(f"Could not load canonical GIS data: {e}")
        return

    buildings_data = data.get("buildings", [])
    for idx, b in enumerate(buildings_data):
        b_id = b.get("id")
        if not b_id:
            continue
        existing = db.query(CampusBuilding).filter(CampusBuilding.id == b_id).first()
        if not existing:
            building = CampusBuilding(
                id=b_id,
                name=b.get("name", "Unnamed Building"),
                short_name=b.get("shortName") or b.get("name"),
                badge=b.get("badge") or "",
                category=b.get("category", "ACADEMIC"),
                color=b.get("color") or "#4f46e5",
                map_pin=b.get("mapPin"),
                wings=b.get("wings") or [],
                floors=b.get("floors") or ["G", "1", "2", "3"],
                rooms_per_floor=b.get("roomsPerFloor") or 24,
                custom_rooms=b.get("customRooms") or [],
                description=b.get("description") or "",
                polygons=b.get("polygons") or [],
                entrances=b.get("entrances") or [],
                display_order=idx,
            )
            db.add(building)
        else:
            existing.name = b.get("name", existing.name)
            existing.short_name = b.get("shortName") or b.get("name") or existing.short_name
            existing.badge = b.get("badge") or existing.badge
            existing.category = b.get("category", existing.category)
            existing.color = b.get("color") or existing.color
            existing.map_pin = b.get("mapPin") or existing.map_pin
            existing.wings = b.get("wings") or existing.wings
            existing.floors = b.get("floors") or existing.floors
            existing.rooms_per_floor = b.get("roomsPerFloor") or existing.rooms_per_floor
            existing.custom_rooms = b.get("customRooms") or existing.custom_rooms
            existing.description = b.get("description") or existing.description
            existing.polygons = b.get("polygons") or existing.polygons
            existing.entrances = b.get("entrances") or existing.entrances
            existing.display_order = idx

    roads_data = data.get("roads", [])
    for r in roads_data:
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

    db.commit()
    logger.info(f"Campus infrastructure seeded: {len(buildings_data)} buildings, {len(roads_data)} roads.")


def seed_data() -> None:
    """Populates database with starter campus departments, maintenance squads, and admins."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
        logger.info("Database seeding completed successfully! Zero fake tickets populated.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error during database seeding: {e}", exc_info=True)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
