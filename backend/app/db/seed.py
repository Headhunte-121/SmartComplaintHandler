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

SEED_TICKETS = [
    {
        "tracking_code": "CMP-2026-E101",
        "title": "Main electrical panel sparking in Hostel Block B",
        "description": "The circuit breaker on the ground floor switchgear is emitting loud buzzing sounds and intermittent sparks. Poses immediate fire hazard.",
        "location": "Hostel Block B, Basement Switchgear",
        "priority": "CRITICAL",
        "status": "IN_PROGRESS",
        "department_id": 1,
        "assigned_team_id": 1,
        "hours_ago": 3,
        "sla_hours": 2,
        "student_name": "Aarav Sharma",
        "student_email": "aarav.sharma@campus.edu",
        "resolution_notes": "[DISPATCH] High-voltage emergency squad dispatched immediately.",
    },
    {
        "tracking_code": "CMP-2026-P202",
        "title": "Severe water leakage from ceiling in Room 204",
        "description": "Continuous water stream leaking from the overhead bathroom pipeline damaging study desks and books.",
        "location": "Hostel Block B, Room 204",
        "priority": "HIGH",
        "status": "SUBMITTED",
        "department_id": 2,
        "assigned_team_id": 7,
        "hours_ago": 1,
        "sla_hours": 6,
        "student_name": "Aarav Sharma",
        "student_email": "aarav.sharma@campus.edu",
        "resolution_notes": None,
    },
    {
        "tracking_code": "CMP-2026-IT303",
        "title": "Wi-Fi access point offline in Computer Lab 3",
        "description": "Cisco AP-302 is unpowered and students cannot access online lab repositories.",
        "location": "Academic Block 1, Lab 3",
        "priority": "MEDIUM",
        "status": "IN_PROGRESS",
        "department_id": 5,
        "assigned_team_id": 5,
        "hours_ago": 5,
        "sla_hours": 24,
        "student_name": "Priya Nair",
        "student_email": "priya.nair@campus.edu",
        "resolution_notes": "[INVESTIGATION] PoE switch port reboot initiated by technician.",
    },
    {
        "tracking_code": "CMP-2026-C404",
        "title": "Broken lock and jammed window hinge",
        "description": "Study room door lock mechanism is stuck and the window hinge does not seal properly against monsoon rain.",
        "location": "Library Reading Hall, Desk 14",
        "priority": "LOW",
        "status": "RESOLVED",
        "department_id": 4,
        "assigned_team_id": 4,
        "hours_ago": 48,
        "sla_hours": 72,
        "resolved_hours_ago": 12,
        "student_name": "Aarav Sharma",
        "student_email": "aarav.sharma@campus.edu",
        "resolution_notes": "[CLOSURE REPORT | Technician: M. Verma | SLA Met: True]\nWork Summary: Replaced jammed cylindrical lock barrel and realigned brass window hinge.\nParts Replaced: 1x Cylindrical brass lock, 2x 4-inch hinges",
        "feedback_rating": 5,
        "feedback_comments": "Door locks smoothly now and window stays shut during rain. Great work!",
    },
    {
        "tracking_code": "CMP-2026-E505",
        "title": "Tube light flickering and humming loudly in Room 204",
        "description": "The primary tube light over the bed keeps flashing strobes and produces high-pitch electrical hum.",
        "location": "Hostel Block B, Room 204",
        "priority": "MEDIUM",
        "status": "RESOLVED",
        "department_id": 1,
        "assigned_team_id": 1,
        "hours_ago": 36,
        "sla_hours": 24,
        "resolved_hours_ago": 8,
        "student_name": "Aarav Sharma",
        "student_email": "aarav.sharma@campus.edu",
        "resolution_notes": "[CLOSURE REPORT | Technician: Ramesh Kumar | SLA Met: True]\nWork Summary: Defective ballast swapped out and modern 20W LED tube batten installed.\nParts Replaced: 20W LED Batten, Electronic Choke",
        "feedback_rating": 5,
        "feedback_comments": "Technician Ramesh was courteous and resolved the issue within hours.",
    },
    {
        "tracking_code": "CMP-2026-S606",
        "title": "Overflowing waste bins outside Central Food Court",
        "description": "Food court collection bins are completely full causing litter on pedestrian walkway and stray animal hazard.",
        "location": "Central Food Court Plaza",
        "priority": "HIGH",
        "status": "RESOLVED",
        "department_id": 3,
        "assigned_team_id": 3,
        "hours_ago": 20,
        "sla_hours": 6,
        "resolved_hours_ago": 16,
        "student_name": "Rohan Patel",
        "student_email": "rohan.p@campus.edu",
        "resolution_notes": "[CLOSURE REPORT | Technician: S. Yadav | SLA Met: True]\nWork Summary: Replaced bin liners, disposed refuse in main compactor, and pressure-washed the stone tiles.\nParts Replaced: Heavy-duty bin liners, chemical sanitizer",
        "feedback_rating": 4,
        "feedback_comments": "Prompt response and cleaned up the spills well.",
    },
    {
        "tracking_code": "CMP-2026-E707",
        "title": "AC tripping circuit breaker during lectures",
        "description": "The 5-ton packaged air conditioning unit in LH-101 trips the main feeder whenever compressor engages.",
        "location": "Lecture Hall Complex, Room LH-101",
        "priority": "HIGH",
        "status": "ESCALATED",
        "department_id": 1,
        "assigned_team_id": 1,
        "hours_ago": 10,
        "sla_hours": 6,
        "student_name": "Dr. K. Swaminathan",
        "student_email": "k.swami@campus.edu",
        "resolution_notes": "[ESCALATION | Supervisor: Dr. Sunita Verma | Reason: Compressor motor drawing locked rotor current (LRA); requires external OEM motor rewinding quote.]",
    },
    {
        "tracking_code": "CMP-2026-P808",
        "title": "Low water pressure on 3rd floor washrooms",
        "description": "Water barely trickles from taps and overhead flush cisterns take 40 minutes to refill.",
        "location": "Hostel Block A, 3rd Floor",
        "priority": "MEDIUM",
        "status": "SUBMITTED",
        "department_id": 2,
        "assigned_team_id": 2,
        "hours_ago": 4,
        "sla_hours": 24,
        "student_name": "Vikram Sen",
        "student_email": "vikram.s@campus.edu",
        "resolution_notes": None,
    },
    {
        "tracking_code": "CMP-2026-S909",
        "title": "Sanitization and deep disinfection required in restrooms",
        "description": "Routine monthly chemical scrub and drain descaling needed for ground floor public restrooms.",
        "location": "Admin Block, Ground Floor",
        "priority": "LOW",
        "status": "IN_PROGRESS",
        "department_id": 3,
        "assigned_team_id": 3,
        "hours_ago": 8,
        "sla_hours": 72,
        "student_name": "Staff Desk",
        "student_email": "admin.desk@campus.edu",
        "resolution_notes": "[WORK STARTED] Sanitation crew deployed with steam pressure washers.",
    },
    {
        "tracking_code": "CMP-2026-IT910",
        "title": "Projector HDMI interface damaged in Seminar Hall",
        "description": "Wall-mounted HDMI extender socket has bent pins, causing pink discoloration and intermittent signal loss.",
        "location": "Mechanical Dept Seminar Hall",
        "priority": "HIGH",
        "status": "SUBMITTED",
        "department_id": 5,
        "assigned_team_id": 5,
        "hours_ago": 2,
        "sla_hours": 6,
        "student_name": "Ananya Roy",
        "student_email": "ananya.roy@campus.edu",
        "resolution_notes": None,
    },
]


def ensure_schema() -> None:
    """Ensure all newly added columns exist in SQLite without needing manual migration."""
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
    except Exception as e:
        logger.warning(f"Schema update notice: {e}")


def seed_database(db: Session) -> None:
    """
    Seed initial departments, maintenance teams, and realistic campus tickets.
    Used by FastAPI lifespan in app.main.
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

    # 3. Seed realistic campus tickets idempotently
    existing_codes = {t.tracking_code for t in db.query(Ticket.tracking_code).all()}
    now = datetime.now(timezone.utc)
    
    for t_data in SEED_TICKETS:
        code = t_data["tracking_code"]
        if code in existing_codes:
            continue
            
        created = now - timedelta(hours=t_data["hours_ago"])
        sla_dl = created + timedelta(hours=t_data["sla_hours"])
        resolved_at = None
        if t_data.get("resolved_hours_ago") is not None:
            resolved_at = now - timedelta(hours=t_data["resolved_hours_ago"])
            
        ticket = Ticket(
            tracking_code=code,
            title=t_data["title"],
            description=t_data["description"],
            location=t_data["location"],
            priority=t_data["priority"],
            status=t_data["status"],
            department_id=t_data["department_id"],
            assigned_team_id=t_data.get("assigned_team_id"),
            created_at=created,
            sla_deadline=sla_dl,
            resolved_at=resolved_at,
            resolution_notes=t_data.get("resolution_notes"),
            student_name=t_data.get("student_name", "Aarav Sharma"),
            student_email=t_data.get("student_email", "aarav.sharma@campus.edu"),
            feedback_rating=t_data.get("feedback_rating"),
            feedback_comments=t_data.get("feedback_comments"),
            feedback_submitted_at=(now - timedelta(hours=t_data["resolved_hours_ago"] - 1)) if t_data.get("feedback_rating") and t_data.get("resolved_hours_ago") else None,
        )
        db.add(ticket)
        existing_codes.add(code)
    db.commit()

    # 4. Synchronize live squad active_ticket_count
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
    Populates database with starter campus departments, maintenance squads, and tickets.
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

