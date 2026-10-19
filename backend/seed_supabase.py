"""
SmartComplaintHandler - Supabase Production Seeder Script
Role: Connects directly to Supabase PostgreSQL, creates all tables,
      applies column migrations, and idempotently seeds departments,
      teams, official administrators, and all 17 authentic campus buildings and 22 roads.
"""
import os
import sys
import json
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("seed_supabase")

# Read DATABASE_URL from command line argument or environment variable
target_url = sys.argv[1] if len(sys.argv) > 1 else os.getenv("DATABASE_URL")
if not target_url:
    logger.error("DATABASE_URL is required. Pass as argument or set in .env")
    print("\nUsage: python seed_supabase.py \"postgresql://postgres:password@host:port/postgres?sslmode=require\"\n")
    sys.exit(1)

if not target_url.endswith("sslmode=require") and "sslmode" not in target_url and "sqlite" not in target_url:
    target_url = target_url + ("&" if "?" in target_url else "?") + "sslmode=require"

logger.info(f"Targeting Database URL (sanitized): {target_url.split('@')[-1] if '@' in target_url else target_url}")

# Create engine & session
engine = create_engine(target_url, pool_pre_ping=True)
Session = sessionmaker(bind=engine)

# Import models
from app.db.base import Base
from app.models.department import Department
from app.models.team import MaintenanceTeam
from app.models.user import User
from app.models.ticket import Ticket
from app.models.campus import CampusBuilding, CampusRoad
from app.db.seed import SEED_DEPARTMENTS, SEED_TEAMS, SEED_ADMINS


def ensure_postgres_schema(engine):
    logger.info("Step 1: Creating database tables if they do not exist...")
    Base.metadata.create_all(bind=engine)

    logger.info("Step 2: Ensuring all newer schema columns exist via ALTER TABLE...")
    with engine.begin() as conn:
        # Users columns
        user_alters = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS hashed_password VARCHAR(255);",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS hostel_name VARCHAR(120);",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS room_number VARCHAR(60);",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS department_name VARCHAR(100);",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id INTEGER;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'password';",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub VARCHAR(255);",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT TRUE;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'STUDENT';",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;",
        ]
        for sql in user_alters:
            conn.execute(text(sql))

        # Tickets columns
        ticket_alters = [
            "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS student_name VARCHAR(150);",
            "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS student_email VARCHAR(150);",
            "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS building VARCHAR(120);",
            "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS wing VARCHAR(100);",
            "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS floor VARCHAR(50);",
            "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS room VARCHAR(60);",
            "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS custom_location VARCHAR(200);",
            "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS feedback_rating INTEGER;",
            "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS feedback_comments TEXT;",
            "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS feedback_submitted_at TIMESTAMP WITH TIME ZONE;",
        ]
        for sql in ticket_alters:
            conn.execute(text(sql))


def seed_all(session):
    logger.info("Step 3: Seeding Departments...")
    existing_depts = {d.name.lower(): d for d in session.query(Department).all()}
    dept_added = 0
    for d in SEED_DEPARTMENTS:
        if d["name"].lower() not in existing_depts:
            dept = Department(
                id=d["id"],
                name=d["name"],
                description=d["description"],
            )
            session.add(dept)
            session.flush()
            existing_depts[d["name"].lower()] = dept
            dept_added += 1
    session.commit()
    logger.info(f"Departments: {dept_added} added, {len(existing_depts)} total.")

    logger.info("Step 4: Seeding Maintenance Teams...")
    existing_teams = {t.name.lower(): t for t in session.query(MaintenanceTeam).all()}
    teams_added = 0
    for t in SEED_TEAMS:
        if t["name"].lower() not in existing_teams:
            team = MaintenanceTeam(
                id=t["id"],
                name=t["name"],
                department_id=t["department_id"],
                active_ticket_count=0,
                is_active=True,
            )
            session.add(team)
            session.flush()
            existing_teams[t["name"].lower()] = team
            teams_added += 1
    session.commit()
    logger.info(f"Teams: {teams_added} added, {len(existing_teams)} total.")

    logger.info("Step 5: Seeding Admin & Staff Accounts...")
    existing_users = {u.email.lower(): u for u in session.query(User).all()}
    users_added = 0
    for a in SEED_ADMINS:
        email = a["email"].lower()
        if email not in existing_users:
            u = User(
                name=a["name"],
                email=email,
                role=a["role"],
                department_name=a.get("department_name"),
                department_id=a.get("department_id"),
                phone=a.get("phone"),
                auth_provider="password",
                email_verified=True,
                is_active=True,
            )
            session.add(u)
            existing_users[email] = u
            users_added += 1
    session.commit()
    logger.info(f"Users: {users_added} added, {len(existing_users)} total.")

    logger.info("Step 6: Seeding Campus Digital Twin Buildings and Roads from canonical GIS dataset...")
    json_path = os.path.join(os.path.dirname(__file__), "app", "db", "canonical_gis_data.json")
    with open(json_path, "r", encoding="utf-8") as f:
        gis_data = json.load(f)

    bldgs_data = gis_data.get("buildings", [])
    bldg_upserted = 0
    for idx, b in enumerate(bldgs_data):
        b_id = b.get("id")
        if not b_id:
            continue
        existing = session.query(CampusBuilding).filter(CampusBuilding.id == b_id).first()
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
                rooms_per_floor=b.get("roomsPerFloor") or 20,
                custom_rooms=b.get("customRooms") or [],
                description=b.get("description") or "",
                polygons=b.get("polygons") or [],
                entrances=b.get("entrances") or [],
                display_order=idx,
            )
            session.add(building)
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
        bldg_upserted += 1

    roads_data = gis_data.get("roads", [])
    road_upserted = 0
    for r in roads_data:
        r_id = r.get("id")
        if not r_id:
            continue
        existing_road = session.query(CampusRoad).filter(CampusRoad.id == r_id).first()
        if not existing_road:
            road = CampusRoad(
                id=r_id,
                name=r.get("name", "Road"),
                road_type=r.get("type", "road"),
                width=r.get("width", 14),
                color=r.get("color", "#944b24"),
                latlngs=r.get("latlngs") or [],
            )
            session.add(road)
        else:
            existing_road.name = r.get("name", existing_road.name)
            existing_road.road_type = r.get("type", existing_road.road_type)
            existing_road.width = r.get("width", existing_road.width)
            existing_road.color = r.get("color", existing_road.color)
            existing_road.latlngs = r.get("latlngs") or existing_road.latlngs
        road_upserted += 1

    session.commit()
    logger.info(f"Campus Infrastructure: {bldg_upserted} buildings and {road_upserted} roads upserted.")


def verify_counts(session):
    logger.info("=== SUPABASE DATABASE AUDIT & VERIFICATION ===")
    d_count = session.query(Department).count()
    t_count = session.query(MaintenanceTeam).count()
    u_count = session.query(User).count()
    b_count = session.query(CampusBuilding).count()
    r_count = session.query(CampusRoad).count()

    print(f"\n[OK] Departments in Supabase:      {d_count}")
    print(f"[OK] Maintenance Teams in Supabase: {t_count}")
    print(f"[OK] User Accounts in Supabase:     {u_count}")
    print(f"[OK] Campus Buildings in Supabase:  {b_count}")
    print(f"[OK] Campus Roads in Supabase:      {r_count}")

    # Print buildings list
    print("\nVerified Buildings:")
    buildings = session.query(CampusBuilding).order_by(CampusBuilding.display_order).all()
    for b in buildings:
        print(f"  - [{b.badge or 'ZONE':<5}] {b.name} ({len(b.floors or [])} floors, cat: {b.category})")

    print("\n[SUCCESS] Supabase database is completely seeded and ready for production!\n")


if __name__ == "__main__":
    ensure_postgres_schema(engine)
    session = Session()
    try:
        seed_all(session)
        verify_counts(session)
    except Exception as e:
        session.rollback()
        logger.error(f"Error seeding Supabase: {e}", exc_info=True)
        sys.exit(1)
    finally:
        session.close()
