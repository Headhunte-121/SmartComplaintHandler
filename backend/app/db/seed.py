"""
SmartComplaintHandler - Database Bootstrap & Starter Data Seeder
Blueprint Reference: V1/M1/backend/08_seed_data.md
Role: Idempotently seeds the standard campus departments and maintenance squads upon first boot.
"""
import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.db.base import Base
from app.models.department import Department
from app.models.team import MaintenanceTeam, Team
from app.models.ticket import Ticket
from app.models.user import User

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

# Official IIIT-NR default administrative accounts
SEED_ADMINS = [
    {
        "name": "Chief Campus Administrator",
        "email": "superadmin@iiitnr.edu.in",
        "role": "SUPER_ADMIN",
        "department_name": "Office of the Director",
        "phone": "+91-771-2474001",
    },
    {
        "name": "Dr. Sunita Verma (Estate Lead)",
        "email": "admin@iiitnr.edu.in",
        "role": "ADMIN",
        "department_name": "Central Facilities Management",
        "department_id": 6,
        "phone": "+91-771-2474102",
    },
    {
        "name": "Er. Rajesh Sharma",
        "email": "electrical.admin@iiitnr.edu.in",
        "role": "ADMIN",
        "department_name": "Electrical",
        "department_id": 1,
        "phone": "+91-771-2474103",
    },
    {
        "name": "Er. Manoj Verma",
        "email": "plumbing.admin@iiitnr.edu.in",
        "role": "ADMIN",
        "department_name": "Plumbing",
        "department_id": 2,
        "phone": "+91-771-2474104",
    },
    {
        "name": "Ramesh Kumar (Tech Lead)",
        "email": "tech.ramesh@iiitnr.edu.in",
        "role": "TECHNICIAN",
        "department_name": "Electrical",
        "department_id": 1,
        "phone": "+91-771-2474105",
    },
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


def ensure_schema() -> None:
    """Ensure all newly added tables and columns exist in SQLite."""
    Base.metadata.create_all(bind=engine)
    try:
        with engine.begin() as conn:
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
                ("department_name", "VARCHAR(100)"),
                ("department_id", "INTEGER"),
                ("phone", "VARCHAR(50)"),
                ("is_active", "BOOLEAN DEFAULT 1"),
                ("role", "VARCHAR(50) DEFAULT 'STUDENT'"),
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

    # 1. Seed standard departments idempotently
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

    # 2. Seed standard teams idempotently
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

    # 3. Seed initial IIIT-NR administrators idempotently
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
            is_active=True,
        )
        db.add(admin_user)
        existing_users[a_email] = admin_user
    db.commit()

    # 4. Synchronize live squad active_ticket_count (0 if tickets are empty)
    teams = db.query(MaintenanceTeam).all()
    for team in teams:
        team.active_ticket_count = (
            db.query(Ticket)
            .filter(
                Ticket.assigned_team_id == team.id,
                Ticket.status.in_(["SUBMITTED", "IN_PROGRESS", "ESCALATED"])
            )
            .count()
        )
    db.commit()


def seed_data() -> None:
    """
    Populates database with starter campus departments, maintenance squads, and admins.
    Guarantees idempotency via pre-insert existence checks.
    Standalone CLI runner compatible with M1 blueprint.
    """
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


