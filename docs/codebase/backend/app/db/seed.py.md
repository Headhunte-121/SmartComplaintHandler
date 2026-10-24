# Comprehensive Code Walkthrough & Line-by-Line Guide: `backend/app/db/seed.py`

> **File Location**: [`backend/app/db/seed.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/backend/app/db/seed.py)  
> **Prerequisites**: Basic knowledge of C or Python (loops, functions, dictionaries, SQL tables, file operations). No advanced DevOps background is assumed.  
> **What this file is**: The starter data loader and schema migration utility. When deployed to a fresh Supabase PostgreSQL database or local SQLite file, this file automatically creates missing columns and populates authentic IIIT Naya Raipur campus departments, maintenance squads, official administrative staff profiles, and 3D campus digital twin GIS structures.

---

## Block 1: Imports and Logging Configuration (Lines 1–23)

```python
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
```

### 1. Plain-English Purpose:
Imports system modules, date tools, JSON parsers, and all database entity models needed to bootstrap the database. Configures formatted logging to output timestamped status updates to the terminal.

### 2. Line-by-Line Breakdown:
- **Lines 1–6**: Docstring detailing the bootstrapping role (departments, teams, admins, schema columns).
- **Line 7 (`from datetime import datetime, timedelta, timezone`)**: Utilities for timezone-aware date math.
- **Line 8 (`import json`)**: Standard library tool to parse the `canonical_gis_data.json` file.
- **Line 9 (`import logging`)**: Python's logging module.
- **Line 10 (`import os`)**: Used to construct relative file paths to local JSON assets.
- **Line 11 (`from sqlalchemy import text`)**: Allows issuing direct SQL migration queries (`ALTER TABLE`).
- **Line 12 (`from sqlalchemy.orm import Session`)**: Type annotation representing an open database session.
- **Line 13 (`from app.core.database import SessionLocal, engine`)**: Master database engine and session factory.
- **Line 14 (`from app.db.base import Base`)**: Declarative Base containing table metadata.
- **Lines 15–19**: Imports all database entity models (`Department`, `MaintenanceTeam`, `Ticket`, `User`, `CampusBuilding`, `CampusRoad`).
- **Lines 21–22**: Configures log formatting (`timestamp - level - message`) and instantiates `logger`.

### 3. Deep Term & Concept Expansion (For C / Basic Python Readers):
- **What is "Database Seeding"?**:
  When a program runs for the very first time on a fresh server, the database is completely empty. Without baseline data (departments like Electrical/Plumbing, or an admin account to log in), the system cannot function. "Seeding" is the automated process of inserting this foundational seed data into the database tables so the application is ready for immediate use.

---

## Block 2: Authentic IIIT-NR Predefined Seed Datasets (Lines 24–108)

```python
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
```

### 1. Plain-English Purpose:
Prepares the authentic foundational records representing the actual campus hierarchy of IIIT Naya Raipur:
- 6 official service departments.
- 7 specialized frontline maintenance teams.
- Real institutional administrative accounts (Director, Estate Officer, Junior Engineers, Network Leads) with institutional email addresses (`@iiitnr.edu.in`) and campus extensions.

### 2. Line-by-Line Breakdown:
- **Lines 24–31 (`SEED_DEPARTMENTS`)**: List of dictionaries defining each department with fixed IDs (`1` to `6`), official names, and scope descriptions.
- **Lines 33–41 (`SEED_TEAMS`)**: List of dictionaries defining maintenance squads, linking each squad to its respective `department_id`.
- **Lines 43–99 (`SEED_ADMINS`)**: Institutional accounts spanning `SUPER_ADMIN`, `ADMIN`, and `TECHNICIAN` roles, complete with official university telephone contact extensions (`+91-771-2474...`).

### 3. Deep Term & Concept Expansion:
- **Why are complaints (tickets) NOT in the seed data?**:
  In a real college deployment, fake student complaints should never be automatically injected into the database. Complaints must originate from authentic student submissions. The seeder populates only the infrastructure and staff; the ticket queue remains 100% clean for live production intake.

---

## Block 3: Dynamic Schema Migration Function `ensure_schema()` (Lines 111–191)

```python
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

                # Ensure timestamp columns are timezone-aware in Supabase PostgreSQL
                for col in ("created_at", "sla_deadline", "resolved_at", "feedback_submitted_at"):
                    try:
                        conn.execute(text(f"ALTER TABLE tickets ALTER COLUMN {col} TYPE TIMESTAMP WITH TIME ZONE;"))
                    except Exception:
                        pass
                for col in ("created_at", "last_login_at", "locked_until"):
                    try:
                        conn.execute(text(f"ALTER TABLE users ALTER COLUMN {col} TYPE TIMESTAMP WITH TIME ZONE;"))
                    except Exception:
                        pass
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
```

### 1. Plain-English Purpose:
A database self-healing and migration engine. `Base.metadata.create_all()` creates tables that do not exist yet. However, if a table *already* exists but you added new columns to your code (like `feedback_rating` or `google_sub`), `create_all()` silently does nothing! This function inspects the live database and executes `ALTER TABLE ADD COLUMN` commands for any newly introduced columns across both PostgreSQL and SQLite.

### 2. Line-by-Line Breakdown:
- **Line 113 (`Base.metadata.create_all(bind=engine)`)**: Creates any completely missing database tables.
- **Line 115 (`with engine.begin() as conn:`)**: Opens an atomic database transaction context. If any query inside fails, the entire block is rolled back.
- **Line 116 (`if "sqlite" not in str(engine.url):`)**: Branch for PostgreSQL / Supabase:
  - **Lines 118–139**: Emits `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for all authentication and feedback columns.
  - **Lines 142–151**: Ensures timestamp columns use PostgreSQL's `TIMESTAMP WITH TIME ZONE` (UTC) to prevent timezone drift.
  - **Line 152 (`return`)**: Returns upon completing PostgreSQL migration.
- **Lines 154–189 (SQLite Branch)**:
  - SQLite does not support `ADD COLUMN IF NOT EXISTS`.
  - Runs `PRAGMA table_info(tickets);` and `PRAGMA table_info(users);` to discover existing columns.
  - Iterates through required columns: if `name not in existing`, executes `ALTER TABLE ... ADD COLUMN`.

### 3. Deep Term & Concept Expansion:
- **Why doesn't `Base.metadata.create_all()` add new columns?**:
  In SQLAlchemy, `create_all()` only checks: *"Does a table named `tickets` exist?"* If yes, it skips the table entirely! It never checks whether individual columns inside the table match your Python class. Without `ensure_schema()`, adding a new feature (like student feedback ratings) would crash the server with `no such column: feedback_rating`.
- **What is `PRAGMA table_info` in SQLite?**:
  SQLite stores table schemas in an internal database catalog. Executing `PRAGMA table_info(table_name)` returns a table describing each column (`cid`, `name`, `type`, `notnull`, `dflt_value`, `pk`). Extracting `row[1]` gives the exact column name in memory.

---

## Block 4: Database Seeder Function `seed_database(db: Session)` (Lines 193–281)

```python
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
```

### 1. Plain-English Purpose:
Inserts departments, maintenance squads, and staff accounts into the database. Before inserting each record, it checks whether that record already exists (by ID or by name/email). If it exists, it skips it. This guarantees idempotency: you can run this function 100 times without creating duplicate records or crashing.

### 2. Line-by-Line Breakdown:
- **Line 198 (`ensure_schema()`)**: Guarantees all columns exist before inserting data.
- **Lines 200–220 (Department Seeding)**:
  - Fetches all existing departments into RAM dictionaries (`existing_depts_by_name` and `existing_depts_by_id`).
  - Iterates through `SEED_DEPARTMENTS`: if ID or name is already in the dictionary, skips via `continue`.
  - Otherwise, instantiates `Department`, stages with `db.add()`, and issues `db.flush()` to generate its primary key.
  - Commits the department transaction with `db.commit()`.
- **Lines 222–245 (Maintenance Team Seeding)**:
  - Checks existing teams using dictionaries; inserts missing teams linked to `department_id`.
- **Lines 246–265 (Admin Account Seeding)**:
  - Checks existing users by lowercase email; inserts missing admin profiles with `email_verified=True`.
- **Lines 267–277 (Workload Recalculation)**:
  - Recalculates `active_ticket_count` for each squad based on active tickets in the `tickets` table.
- **Line 280 (`seed_campus_infrastructure(db)`)**: Triggers GIS map seeding.

### 3. Deep Term & Concept Expansion:
- **What is `db.flush()` vs `db.commit()`?**:
  - `db.flush()` sends SQL `INSERT` statements to the database engine so auto-incrementing primary IDs (like `dept.id`) are assigned, but does not finalize the transaction on disk.
  - `db.commit()` permanently writes all staged transactions to disk and closes the transaction block.

---

## Block 5: Campus GIS Digital Twin Seeder `seed_campus_infrastructure()` (Lines 283–365)

```python
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
```

### 1. Plain-English Purpose:
Reads the authentic ground-truth campus map coordinates from `canonical_gis_data.json` and populates the `campus_buildings` and `campus_roads` tables. If a building or road already exists, it updates its geometry and properties (an "upsert" operation).

### 2. Line-by-Line Breakdown:
- **Lines 288–298**: Finds `canonical_gis_data.json` on disk and parses it into Python dictionaries using `json.load()`.
- **Lines 299–339 (Buildings Upsert)**:
  - Iterates through building definitions (Hostels, Academic Blocks, Lab Complexes).
  - Queries `CampusBuilding` by ID: if not present, inserts new `CampusBuilding` with wing names, floor counts, map pins, and polygon coordinates; if present, updates its attributes in-place.
- **Lines 340–363 (Roads Upsert)**:
  - Iterates through campus road networks; inserts or updates road coordinates (`latlngs`) and widths.
- **Line 364 (`db.commit()`)**: Finalizes all GIS inserts and updates in a single commit.

---

## Block 6: CLI Runner & Error Safety Block (Lines 367–383)

```python
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
```

### 1. Plain-English Purpose:
Provides a command-line interface (CLI) entry point allowing developers to manually run `python -m app.db.seed`. Wraps execution in atomic transaction safeguards (`db.rollback()` on failure, `db.close()` in finally).

### 2. Line-by-Line Breakdown:
- **Line 367 (`def seed_data() -> None:`)**: Top-level execution wrapper.
- **Line 370 (`db = SessionLocal()`)**: Acquires database connection session.
- **Line 372 (`seed_database(db)`)**: Runs master seeder.
- **Line 375 (`except Exception as e: db.rollback()`)**: If an unexpected crash occurs, rolls back all uncommitted SQL operations to prevent database corruption.
- **Line 379 (`finally: db.close()`)**: Guarantees the database session is closed immediately.
- **Line 382–383 (`if __name__ == "__main__": seed_data()`)**: Standard Python idiom that runs `seed_data()` only when the file is executed directly from the terminal.

---

## Overall File Viva & Technical Defense Guide

### Top 10 Viva Questions on `backend/app/db/seed.py`:

#### Q1: What is the primary role of `seed.py`?
> **Model Answer**:  
> *"Sir, `seed.py` bootstraps the database. It idempotently creates missing database tables and columns via `ensure_schema()` and inserts authentic IIIT Naya Raipur departments, maintenance teams, official staff accounts, and 3D campus GIS digital twin coordinates without inserting any fake complaint tickets."*

#### Q2: What does "Idempotency" mean in the context of database seeding?
> **Model Answer**:  
> *"Sir, an operation is idempotent if running it multiple times produces the exact same state without errors or duplications. In `seed.py`, before inserting any department, team, or user, the code queries the database to check if the record exists. If already present, it skips insertion, guaranteeing that server reboots never create duplicate entries."*

#### Q3: Why is `ensure_schema()` necessary if SQLAlchemy already has `create_all()`?
> **Model Answer**:  
> *"Sir, `Base.metadata.create_all()` only creates tables if the entire table does not exist. If a table already exists in the database, `create_all()` will not add newly introduced columns (such as `feedback_rating` or `google_sub`). `ensure_schema()` inspects the existing table columns and issues `ALTER TABLE ADD COLUMN` commands so existing databases are seamlessly migrated without data loss."*

#### Q4: Why does `seed_database` deliberately omit seeding complaint tickets?
> **Model Answer**:  
> *"Sir, seeding fake complaints into a production database corrupts analytics, skews SLA metrics, and clutters technician workstations. Complaints must originate purely from authentic student submissions. `seed.py` configures the foundational actors and departments while leaving the ticket queue completely clean."*

#### Q5: How does `seed_campus_infrastructure` populate the digital twin?
> **Model Answer**:  
> *"Sir, it reads `canonical_gis_data.json` containing ground-truth coordinates surveyed for the IIIT-NR campus. It iterates through buildings and roads, inserting or updating (`upsert`) polygon coordinates, entrance pins, wings, and floor layouts into `campus_buildings` and `campus_roads` tables."*

#### Q6: What is the difference between `db.flush()` and `db.commit()` in `seed.py`?
> **Model Answer**:  
> *"Sir, `db.flush()` sends pending SQL statements to the database to populate auto-generated primary keys without permanently finalizing the transaction. `db.commit()` writes the entire batch of transactions to disk permanently and closes the transaction block."*

#### Q7: What happens if an error occurs during seeding?
> **Model Answer**:  
> *"Sir, line 375 catches the exception and executes `db.rollback()`. This reverts all pending uncommitted changes, ensuring the database is never left in a corrupted or half-seeded state."*

#### Q8: How does `ensure_schema()` handle PostgreSQL vs SQLite differences?
> **Model Answer**:  
> *"Sir, PostgreSQL supports `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, which can be executed directly. SQLite does not support `IF NOT EXISTS` on columns; therefore, `ensure_schema()` executes `PRAGMA table_info(table)` to inspect existing column names in Python before running `ALTER TABLE ADD COLUMN` only for missing columns."*

#### Q9: Why are admin accounts seeded with `auth_provider="password"` and `email_verified=True`?
> **Model Answer**:  
> *"Sir, official administrative staff members (like the Director and Estate Officer) are pre-authorized institutional accounts. Marking `email_verified=True` ensures they can immediately log in or initiate self-service password resets without being blocked by student email verification gates."*

#### Q10: How are team active ticket counts synchronized in `seed_database()`?
> **Model Answer**:  
> *"Sir, lines 267–277 iterate through all maintenance squads and query `Ticket` filtered by `assigned_team_id` and active statuses (`SUBMITTED`, `IN_PROGRESS`, `ESCALATED`). This guarantees that each squad's `active_ticket_count` is 100% accurate against live database tickets."*

---

## Quick Viva Summary Table

| Function / Dataset | Entity Target | Primary Mechanism | Idempotency / Safety Guarantee |
| :--- | :--- | :--- | :--- |
| **`SEED_DEPARTMENTS`** | `departments` | 6 official service branches | Checked by name and ID before insert |
| **`SEED_TEAMS`** | `maintenance_teams` | 7 frontline repair squads | Linked to `department_id`, checked by name |
| **`SEED_ADMINS`** | `users` | IIIT-NR staff profiles | Checked by lowercase email before insert |
| **`ensure_schema()`** | Database schema | DDL `ALTER TABLE ADD COLUMN` | Discovers missing columns across PG/SQLite |
| **`seed_database()`** | Core DB tables | Orchestrates master seeding | Leaves complaints empty for clean production |
| **`seed_campus_infrastructure()`**| GIS tables | Reads JSON & performs upsert | Matches building IDs to prevent duplicate map tiles |
| **`seed_data()` (CLI)** | Full bootstrap | Wraps in `try...except...finally` | `db.rollback()` on error, `db.close()` in finally |
