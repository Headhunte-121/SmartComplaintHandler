"""
SmartComplaintHandler - Seed Technicians for All Campus Departments
Creates / updates authorized field technician accounts for:
- Electrical
- Plumbing
- Sanitation
- Carpentry
- IT Support
- General Administration
"""
import os
import sys

# Ensure backend directory is in python search path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.core.database import SessionLocal
from app.core.security import hash_password, verify_password
from app.models.department import Department
from app.models.team import MaintenanceTeam
from app.models.user import User

TECHNICIAN_PASSWORD_PLAIN = "Tech@IIITNR2026"

TECHNICIAN_DATA = [
    {
        "dept_name": "Electrical",
        "email": "tech.ramesh@iiitnr.edu.in",
        "name": "Ramesh Kumar (Electrical Tech Lead)",
        "phone": "+91 98765 43210",
        "team_name": "Hostel Electrical Squad 1",
    },
    {
        "dept_name": "Plumbing",
        "email": "tech.suresh@iiitnr.edu.in",
        "name": "Suresh Patel (Plumbing Specialist)",
        "phone": "+91 98765 43211",
        "team_name": "Hostel Plumbing Squad 2",
    },
    {
        "dept_name": "Sanitation",
        "email": "tech.rajesh@iiitnr.edu.in",
        "name": "Rajesh Baghel (Sanitation Supervisor)",
        "phone": "+91 98765 43212",
        "team_name": "Sanitation Rapid Response",
    },
    {
        "dept_name": "Carpentry",
        "email": "tech.vikram@iiitnr.edu.in",
        "name": "Vikram Sahu (Master Carpenter)",
        "phone": "+91 98765 43213",
        "team_name": "Structural Fixtures Crew",
    },
    {
        "dept_name": "IT Support",
        "email": "parvinder@iiitnr.edu.in",
        "name": "Parvinder Singh (Network Engineer)",
        "phone": "+91 98765 43214",
        "team_name": "Network & Wi-Fi Squad",
    },
    {
        "dept_name": "General Administration",
        "email": "tech.amit@iiitnr.edu.in",
        "name": "Amit Sharma (Estate & Facility Tech)",
        "phone": "+91 98765 43215",
        "team_name": "General Facilities & Civil Squad",
    },
]


def sync_sequences(db):
    print("--- Syncing PostgreSQL sequences ---")
    for table in ["departments", "maintenance_teams", "users", "tickets"]:
        try:
            seq = db.execute(text(f"SELECT pg_get_serial_sequence('{table}', 'id')")).scalar()
            if seq:
                max_id = db.execute(text(f"SELECT COALESCE(MAX(id), 0) FROM {table}")).scalar() or 0
                if max_id > 0:
                    db.execute(text(f"SELECT setval('{seq}', {max_id})"))
                    db.commit()
                    print(f"  [+] Reset sequence for {table} to {max_id}")
        except Exception as e:
            db.rollback()
            print(f"  [!] Notice syncing {table}: {e}")


def seed_technicians():
    print("=" * 70)
    print("SEEDING TECHNICIANS FOR ALL CAMPUS DEPARTMENTS")
    print("=" * 70)

    db = SessionLocal()
    try:
        # First ensure all auto-increment sequences are aligned with current max(id)
        sync_sequences(db)

        # Precompute bcrypt password hash
        pw_hash = hash_password(TECHNICIAN_PASSWORD_PLAIN)

        seeded_results = []

        for item in TECHNICIAN_DATA:
            dept_name = item["dept_name"]
            email = item["email"].strip().lower()
            name = item["name"]
            phone = item["phone"]
            team_name = item["team_name"]

            # 1. Resolve or create Department
            dept = db.query(Department).filter(Department.name == dept_name).first()
            if not dept:
                dept = Department(name=dept_name, description=f"{dept_name} campus maintenance department")
                db.add(dept)
                db.commit()
                db.refresh(dept)
                print(f"  [+] Created department: {dept_name} (ID: {dept.id})")

            # 2. Resolve or create Maintenance Team
            team = db.query(MaintenanceTeam).filter(MaintenanceTeam.name == team_name).first()
            if not team:
                # Also check by department
                team = db.query(MaintenanceTeam).filter(MaintenanceTeam.department_id == dept.id).first()
                if not team:
                    team = MaintenanceTeam(name=team_name, department_id=dept.id, active_ticket_count=0)
                    db.add(team)
                    db.commit()
                    db.refresh(team)
                    print(f"  [+] Created maintenance team: {team_name} (ID: {team.id})")
                else:
                    print(f"  [*] Using existing team for {dept_name}: {team.name} (ID: {team.id})")
            else:
                print(f"  [*] Found existing team: {team.name} (ID: {team.id})")

            # 3. Create or update User
            user = db.query(User).filter(User.email == email).first()
            if user:
                user.name = name
                user.role = "TECHNICIAN"
                user.department_id = dept.id
                user.department_name = dept_name
                user.phone = phone
                user.hashed_password = pw_hash
                user.is_active = True
                user.email_verified = True
                user.failed_login_attempts = 0
                user.locked_until = None
                user.auth_provider = "password"
                db.commit()
                db.refresh(user)
                print(f"  [*] Updated existing technician: {email} (ID: {user.id})")
            else:
                user = User(
                    name=name,
                    email=email,
                    role="TECHNICIAN",
                    department_id=dept.id,
                    department_name=dept_name,
                    phone=phone,
                    hashed_password=pw_hash,
                    is_active=True,
                    email_verified=True,
                    failed_login_attempts=0,
                    auth_provider="password",
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                print(f"  [+] Seeded new technician: {email} (ID: {user.id})")

            # Verify password
            is_valid = verify_password(TECHNICIAN_PASSWORD_PLAIN, user.hashed_password)
            if not is_valid:
                raise RuntimeError(f"Password verification failed for {email}!")

            seeded_results.append({
                "dept_name": dept_name,
                "dept_id": dept.id,
                "team_name": team.name if team else "General",
                "name": user.name,
                "email": user.email,
                "phone": user.phone,
                "password": TECHNICIAN_PASSWORD_PLAIN,
                "verified": is_valid,
            })

        print("\n" + "=" * 70)
        print("ALL TECHNICIANS SEEDED & VERIFIED SUCCESSFULLY!")
        print("=" * 70)
        for r in seeded_results:
            print(f"Department : {r['dept_name']} (Dept ID: {r['dept_id']})")
            print(f"Team       : {r['team_name']}")
            print(f"Name       : {r['name']}")
            print(f"Email (ID) : {r['email']}")
            print(f"Password   : {r['password']}")
            print(f"Phone      : {r['phone']}")
            print("-" * 70)

    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_technicians()
