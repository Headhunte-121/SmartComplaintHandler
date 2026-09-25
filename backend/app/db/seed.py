"""
SmartComplaintHandler - Database Bootstrap & Starter Data Seeder
Blueprint Reference: V1/M1/backend/08_seed_data.md
Role: Idempotently seeds the standard campus departments and maintenance squads upon first boot.
"""
import logging
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.db.base import Base
from app.models.department import Department
from app.models.team import MaintenanceTeam, Team

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Standard institutional facilities taxonomy
SEED_DEPARTMENTS = [
    {"id": 1, "name": "Electrical", "description": "Power grids, lighting, wiring, and substation maintenance"},
    {"id": 2, "name": "Plumbing", "description": "Water supply pipelines, fixtures, drainage, sewage, and pumps"},
    {"id": 3, "name": "Sanitation", "description": "Waste disposal, restroom hygiene, cleaning, and pest control"},
    {"id": 4, "name": "Carpentry", "description": "Doors, windows, wooden furniture, desks, and civil fixtures"},
    {"id": 5, "name": "IT Support", "description": "Campus networks, Wi-Fi access points, lab computers, and portals"},
    {"id": 6, "name": "General Administration", "description": "Miscellaneous campus facilities, civil repairs, and general inquiries"},
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

# Extended catalog for team member compatibility
CAMPUS_CATALOG = [
    {"name": "Electrical", "description": "Power grids, lighting, wiring, and substation maintenance", "squads": ["Hostel Wiring Squad", "Academic Power Crew"]},
    {"name": "Plumbing", "description": "Water supply pipelines, fixtures, drainage, sewage, and pumps", "squads": ["Hostel Plumbing Squad", "Campus Waterline Crew"]},
    {"name": "IT Support", "description": "Campus networks, Wi-Fi access points, lab computers, and portals", "squads": ["Network Infrastructure Squad", "Hardware Repair Crew"]},
    {"name": "Carpentry", "description": "Doors, windows, wooden furniture, desks, and civil fixtures", "squads": ["Furniture Repair Squad", "General Carpentry Crew"]},
    {"name": "Sanitation", "description": "Waste disposal, restroom hygiene, cleaning, and pest control", "squads": ["Hostel Sanitation Squad", "Campus Cleanliness Crew"]},
    {"name": "General Administration", "description": "Miscellaneous campus facilities, civil repairs, and general inquiries", "squads": ["Campus Infrastructure Desk"]},
]


def seed_database(db: Session) -> None:
    """
    Seed initial departments and maintenance teams if tables are unpopulated.
    Used by FastAPI lifespan in app.main.
    """
    # 1. Seed standard departments
    existing_depts = {d.name: d for d in db.query(Department).all()}
    for d_data in SEED_DEPARTMENTS:
        if d_data["name"] not in existing_depts:
            dept = Department(
                id=d_data.get("id"),
                name=d_data["name"],
                description=d_data["description"],
            )
            db.add(dept)
            db.flush()
            existing_depts[d_data["name"]] = dept
    db.commit()

    # Refresh map
    existing_depts = {d.name: d for d in db.query(Department).all()}

    # 2. Seed standard teams
    existing_teams = {t.name: t for t in db.query(MaintenanceTeam).all()}
    for t_data in SEED_TEAMS:
        if t_data["name"] not in existing_teams:
            team = MaintenanceTeam(
                id=t_data.get("id"),
                name=t_data["name"],
                department_id=t_data["department_id"],
                active_ticket_count=t_data.get("active_ticket_count", 0),
                is_active=t_data.get("is_active", True),
            )
            db.add(team)
            db.flush()
            existing_teams[t_data["name"]] = team
    db.commit()


def seed_data() -> None:
    """
    Populates database with starter campus departments and maintenance squads.
    Guarantees idempotency via pre-insert existence checks.
    Standalone CLI runner compatible with M1 blueprint.
    """
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
        logger.info("Database seeding completed successfully!")
    except Exception as e:
        db.rollback()
        logger.error(f"Error during database seeding: {e}", exc_info=True)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
