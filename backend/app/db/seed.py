"""
SmartComplaintHandler - Database Bootstrap & Starter Data Seeder
Blueprint Reference: V1/M1/backend/08_seed_data.md
Role: Idempotently seeds the 6 standard campus departments and 12 maintenance squads.
"""
import logging
from app.core.database import SessionLocal, engine
from app.db.base import Base
from app.models.department import Department
from app.models.team import Team

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Standard institutional facilities taxonomy
CAMPUS_CATALOG = [
    {
        "name": "Electrical",
        "description": "Manages campus power grids, hostel wiring, ceiling fans, and lab power outlets.",
        "squads": ["Hostel Wiring Squad", "Academic Power Crew"]
    },
    {
        "name": "Plumbing",
        "description": "Manages restrooms, water coolers, hostel taps, and drainage pipes.",
        "squads": ["Hostel Plumbing Squad", "Campus Waterline Crew"]
    },
    {
        "name": "IT Support",
        "description": "Manages student lab computers, campus Wi-Fi access points, and network hardware.",
        "squads": ["Network Infrastructure Squad", "Hardware Repair Crew"]
    },
    {
        "name": "Carpentry",
        "description": "Manages classroom desks, hostel wooden furniture, doors, and whiteboards.",
        "squads": ["Furniture Repair Squad", "General Carpentry Crew"]
    },
    {
        "name": "Sanitation",
        "description": "Manages waste disposal, restroom hygiene, and campus cleanliness.",
        "squads": ["Hostel Sanitation Squad", "Campus Cleanliness Crew"]
    },
    {
        "name": "Hostel Maintenance",
        "description": "Manages civil repairs, window panes, locks, and room fixtures.",
        "squads": ["Hostel Civil Squad", "Lock & Key Rapid Crew"]
    }
]


def seed_data() -> None:
    """
    Populates database with starter campus departments and maintenance squads.
    Guarantees idempotency via pre-insert existence checks.
    """
    # Ensure physical tables exist on disk before seeding
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        departments_created = 0
        teams_created = 0

        for dept_data in CAMPUS_CATALOG:
            # 1. Department existence check (Idempotency)
            department = db.query(Department).filter_by(name=dept_data["name"]).first()
            if not department:
                department = Department(
                    name=dept_data["name"],
                    description=dept_data["description"],
                    is_active=True
                )
                db.add(department)
                db.flush()  # Populate department.id for child squads
                departments_created += 1
                logger.info(f"Staged new department: {department.name} (id={department.id})")
            else:
                logger.debug(f"Department already exists: {department.name}")

            # 2. Squad existence checks (Idempotency)
            for squad_name in dept_data["squads"]:
                team = db.query(Team).filter_by(
                    name=squad_name,
                    department_id=department.id
                ).first()
                if not team:
                    team = Team(
                        name=squad_name,
                        department_id=department.id,
                        is_active=True
                    )
                    db.add(team)
                    teams_created += 1
                    logger.info(f"  Staged squad: {squad_name} for dept {department.name}")
                else:
                    logger.debug(f"  Squad already exists: {squad_name}")

        db.commit()
        logger.info(
            f"Database seeding completed successfully! "
            f"Created {departments_created} departments and {teams_created} teams."
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error during database seeding: {e}", exc_info=True)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
