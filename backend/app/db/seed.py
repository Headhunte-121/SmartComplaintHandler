"""
SmartComplaintHandler - Database Bootstrap Seeder
Blueprint Reference: V1/M1/backend/08_seed_data.md
Role: Seeds standard campus departments and maintenance squads upon first boot.
"""
from sqlalchemy.orm import Session
from app.models.department import Department
from app.models.team import MaintenanceTeam

SEED_DEPARTMENTS = [
    {"id": 1, "name": "Electrical", "description": "Power, electrical fixtures, lighting, and substation maintenance"},
    {"id": 2, "name": "Plumbing", "description": "Water pipelines, fixtures, drainage, sewage, and pumps"},
    {"id": 3, "name": "Sanitation", "description": "Waste disposal, cleaning, hygiene, and pest control"},
    {"id": 4, "name": "Carpentry", "description": "Doors, windows, furniture, desks, and civil fixtures"},
    {"id": 5, "name": "IT Support", "description": "Campus networks, Wi-Fi, lab computers, projectors, and portals"},
    {"id": 6, "name": "General Administration", "description": "Miscellaneous campus facilities, lost items, and inquiries"},
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


def seed_database(db: Session) -> None:
    """
    Seed initial departments and maintenance teams if tables are unpopulated.
    """
    # 1. Seed departments
    existing_depts = {d.id: d for d in db.query(Department).all()}
    for d_data in SEED_DEPARTMENTS:
        if d_data["id"] not in existing_depts:
            dept = Department(
                id=d_data["id"],
                name=d_data["name"],
                description=d_data["description"],
            )
            db.add(dept)
    db.commit()

    # 2. Seed teams
    existing_teams = {t.id: t for t in db.query(MaintenanceTeam).all()}
    for t_data in SEED_TEAMS:
        if t_data["id"] not in existing_teams:
            team = MaintenanceTeam(
                id=t_data["id"],
                name=t_data["name"],
                department_id=t_data["department_id"],
                active_ticket_count=t_data["active_ticket_count"],
                is_active=t_data["is_active"],
            )
            db.add(team)
    db.commit()
