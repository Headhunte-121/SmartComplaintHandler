# Comprehensive Code Walkthrough & Line-by-Line Guide: `backend/app/models/user.py`

> **File Location**: [`backend/app/models/user.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/backend/app/models/user.py)  
> **Prerequisites**: Basic knowledge of C or Python (classes, database fields, authentication, timestamps). No advanced security or OAuth background is assumed.  
> **What this file is**: The user account model. It stores user profiles for students, technicians, department administrators, and the directorate (Super Admin). It handles credentials, student hostel allocations (Ramanujan, Bhabha, Bose, etc.), Google Workspace SSO identifiers, and brute-force lockout counters.

---

## Block 1: Imports and Model Definition (Lines 1–43)

```python
"""
SmartComplaintHandler - User ORM Model
Role: Manages campus accounts for Students, Facility Admins, Technicians, and Super Admins
      stored in Supabase PostgreSQL (or local SQLite).
Domain: Enforces official @iiitnr.edu.in institutional identity, tracks Google OAuth2/OIDC metadata,
        persists student hostel & room assignments (Ramanujan, Bhabha, Bose, Raman, Shabhari Houses),
        and persists brute-force lockout counters across Vercel Serverless instances.
"""
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(String(50), default="STUDENT", nullable=False)  # STUDENT, ADMIN, SUPER_ADMIN, TECHNICIAN
    department_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    department_id: Mapped[Optional[int]] = mapped_column(ForeignKey("departments.id"), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    hostel_name: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    room_number: Mapped[Optional[str]] = mapped_column(String(60), nullable=True)
    auth_provider: Mapped[Optional[str]] = mapped_column(String(50), default="password", nullable=True)  # password, google, both
    google_sub: Mapped[Optional[str]] = mapped_column(String(255), index=True, nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    locked_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    department = relationship("Department")
```

### 1. Plain-English Purpose:
Defines the `users` table representing all authenticated users in the system. It tracks student identity, hostel residence, roles, authentication credentials (both local passwords and Google SSO tokens), account verification status, and brute-force lockout timers.

### 2. Line-by-Line Breakdown:
- **Lines 1–8**: Docstring detailing institutional `@iiitnr.edu.in` identity, hostel allocations, and brute-force tracking.
- **Line 9 (`from datetime import datetime, timezone`)**: Utilities for UTC timestamps.
- **Line 10 (`from typing import Optional`)**: Type hint for nullable fields.
- **Line 11 (`from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String`)**: SQL column types.
- **Line 12 (`from sqlalchemy.orm import Mapped, mapped_column, relationship`)**: SQLAlchemy 2.0 ORM tools.
- **Line 13 (`from app.models.base import Base`)**: Imports declarative base.
- **Line 16 (`class User(Base):`)**: Defines `User` model inheriting from `Base`.
- **Line 17 (`__tablename__ = "users"`)**: SQL table name in the database.
- **Line 19 (`id: Mapped[int] = mapped_column(primary_key=True, index=True)`)**: Unique integer primary key.
- **Line 20 (`name: Mapped[str] = mapped_column(String(150), nullable=False)`)**: Full legal student/staff name.
- **Line 21 (`email: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)`)**: Unique institutional email. Indexed for $O(\log N)$ authentication lookups.
- **Line 22 (`hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)`)**: Bcrypt password hash. Nullable to support Google Workspace SSO users.
- **Line 23 (`role: Mapped[str] = ...`)**: Role-based access control tier (`STUDENT`, `ADMIN`, `SUPER_ADMIN`, `TECHNICIAN`).
- **Lines 24–25 (`department_name`, `department_id`)**: Links staff and technicians to their parent department.
- **Line 26 (`phone`)**: Campus extension or mobile phone number.
- **Lines 27–28 (`hostel_name`, `room_number`)**: Student campus residence (e.g. "Bose House", "Room 204").
- **Line 29 (`auth_provider`)**: Login mechanism (`"password"`, `"google"`, or `"both"`).
- **Line 30 (`google_sub`)**: Google's immutable OpenID Connect subject ID. Indexed for fast SSO login matching.
- **Line 31 (`avatar_url`)**: Google profile picture or campus directory photo URL.
- **Line 32 (`email_verified`)**: Boolean flag verifying possession of official `@iiitnr.edu.in` email.
- **Line 33 (`is_active`)**: Account status toggle. If `False`, blocks all logins.
- **Line 34 (`failed_login_attempts`)**: Consecutive failed password attempts counter.
- **Line 35 (`locked_until`)**: Expiration timestamp for temporary brute-force lockout.
- **Line 36 (`last_login_at`)**: Audit timestamp tracking the user's most recent login.
- **Lines 37–41 (`created_at`)**: UTC timestamp recording when the account was registered. Uses `default=lambda: datetime.now(timezone.utc)`.
- **Line 43 (`department = relationship("Department")`)**: ORM relationship object pointing to parent `Department`.

### 3. Deep Term & Concept Expansion (For C / Basic Python Readers):
- **Why is `hashed_password` Nullable? (`Optional[str]`)**:
  When a student signs in using **Google Workspace Single Sign-On (SSO)**, authentication is completed by Google's secure servers. The student never sets a local password on our server. Making `hashed_password` nullable permits Google-authenticated users to exist in the database without violating SQL `NOT NULL` constraints.
- **What is `google_sub`?**:
  In the OpenID Connect (OIDC) specification, `sub` stands for **Subject**. It is an immutable unique string identifier assigned by Google (e.g. `"104829104820194820192"`). Even if a student changes their name or updates their display email, Google's `sub` never changes, allowing our server to recognize returning users reliably.
- **The Classic Python Default Timestamp Trap (`lambda`)**:
  Notice line 40: `default=lambda: datetime.now(timezone.utc)`.  
  If written as `default=datetime.now(timezone.utc)` (without `lambda`), Python would evaluate `datetime.now()` **once when the server boots**. If the server booted on Monday morning, every student registered on Tuesday, Wednesday, and Friday would receive Monday's boot timestamp! Passing a `lambda` ensures `datetime.now()` is executed freshly at the exact millisecond each user is created.
- **Brute-Force Protection (`failed_login_attempts` & `locked_until`)**:
  When an incorrect password is submitted, `failed_login_attempts` increments by $+1$. Upon reaching 5 failed attempts, `locked_until` is set 15 minutes into the future. For the next 15 minutes, the login endpoint rejects requests immediately before executing bcrypt, defeating automated brute-force attacks and conserving server CPU.

### 4. Runtime Mechanics & Account Linking Deep Dive:
- **Dual-Provider Account Linking**:
  When a student first registers with email and password (`auth_provider="password"`), and later clicks "Sign in with Google", the backend matches their `@iiitnr.edu.in` email, attaches `google_sub` and `avatar_url`, and updates `auth_provider="both"`. The student can subsequently log in using either method without creating duplicate accounts.
- **Generated SQL DDL**:
  ```sql
  CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(150) NOT NULL,
      hashed_password VARCHAR(255),
      role VARCHAR(50) NOT NULL DEFAULT 'STUDENT',
      department_name VARCHAR(100),
      department_id INTEGER,
      phone VARCHAR(50),
      hostel_name VARCHAR(120),
      room_number VARCHAR(60),
      auth_provider VARCHAR(50) DEFAULT 'password',
      google_sub VARCHAR(255),
      avatar_url VARCHAR(500),
      email_verified BOOLEAN NOT NULL DEFAULT TRUE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      failed_login_attempts INTEGER NOT NULL DEFAULT 0,
      locked_until TIMESTAMP WITH TIME ZONE,
      last_login_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL,
      CONSTRAINT uq_users_email UNIQUE (email),
      CONSTRAINT fk_users_department_id FOREIGN KEY (department_id) REFERENCES departments (id)
  );
  CREATE INDEX ix_users_id ON users (id);
  CREATE INDEX ix_users_email ON users (email);
  CREATE INDEX ix_users_google_sub ON users (google_sub);
  ```

---

## Overall File Viva & Technical Defense Guide

### Top 10 Viva Questions on `backend/app/models/user.py`:

#### Q1: What is the purpose of the `User` model?
> **Model Answer**:  
> *"Sir, the `User` model manages authentication, authorization, and institutional identity across the portal. It stores accounts for students, technicians, department administrators, and the directorate (Super Admin), maintaining hostel room allocations, Google SSO tokens, and brute-force defense counters."*

#### Q2: Why is `hashed_password` marked as nullable?
> **Model Answer**:  
> *"Sir, the portal supports Google Workspace Single Sign-On (SSO). When students log in via Google OIDC, authentication is handled by Google without requiring a local password on our server. Making `hashed_password` nullable allows Google SSO users to be stored without violating database constraints."*

#### Q3: What is `google_sub` and why is it indexed?
> **Model Answer**:  
> *"Sir, `google_sub` is the OpenID Connect Subject identifier—a unique, immutable ID assigned by Google to each user account. We index it (`index=True`) so that when a student clicks 'Sign in with Google', the backend resolves their account in $O(\log N)$ logarithmic time directly from the token claim."*

#### Q4: Why is `default=lambda: datetime.now(timezone.utc)` used on `created_at`?
> **Model Answer**:  
> *"Sir, in Python, default function arguments are evaluated once at class import time. Using a `lambda` callable ensures that `datetime.now()` executes dynamically at the exact moment a new user record is inserted, preventing all users from receiving the server's boot timestamp."*

#### Q5: How do `failed_login_attempts` and `locked_until` defend against brute-force attacks?
> **Model Answer**:  
> *"Sir, when a user enters an incorrect password, `failed_login_attempts` increments. If it reaches 5, `locked_until` is set to 15 minutes in the future. Subsequent login attempts are rejected immediately before executing expensive bcrypt hashing operations, neutralizing automated dictionary attacks and protecting server CPU."*

#### Q6: What happens when an existing password user signs in with Google SSO?
> **Model Answer**:  
> *"Sir, the system performs account linking. It matches the verified Google email to the existing user row, populates `google_sub` and `avatar_url`, and sets `auth_provider='both'`, allowing the student to log in seamlessly with either credentials or Google SSO."*

#### Q7: What are the valid values for the `role` column?
> **Model Answer**:  
> *"Sir, the system defines 4 distinct role tiers:  
> - `STUDENT`: Normal student lodging campus complaints.  
> - `TECHNICIAN`: Maintenance workers viewing assigned work queues.  
> - `ADMIN`: Department supervisors managing squad reassignments.  
> - `SUPER_ADMIN`: Institute directorate holding global system permissions."*

#### Q8: What does `is_active` do?
> **Model Answer**:  
> *"Sir, `is_active` provides soft account deactivation. If a student graduates or a staff member leaves the university, an administrator sets `is_active = False`. The user is immediately blocked from logging in, while all historical complaints submitted by them are preserved."*

#### Q9: Why is `DateTime(timezone=True)` specified for timestamp columns?
> **Model Answer**:  
> *"Sir, specifying `timezone=True` tells PostgreSQL to store timestamps with UTC timezone offsets (`TIMESTAMP WITH TIME ZONE`). This prevents clock skew errors across clients connecting from different timezones or cloud serverless environments."*

#### Q10: How does `User` relate to `Department`?
> **Model Answer**:  
> *"Sir, staff and technicians have a foreign key `department_id` linking to `departments.id`. Students have `department_id = None`. The ORM relationship `department = relationship('Department')` allows accessing a technician's department via `user.department.name`."*

---

## Quick Viva Summary Table

| Column Name | Datatype | Constraints | Purpose |
| :--- | :--- | :--- | :--- |
| **`id`** | `Mapped[int]` | Primary Key, Indexed | Unique account identifier |
| **`email`** | `Mapped[str]` | Unique, Indexed, Non-Nullable | University email (`@iiitnr.edu.in`) |
| **`hashed_password`** | `Mapped[Optional[str]]`| Nullable, Max 255 chars | Bcrypt password hash (null for Google SSO) |
| **`role`** | `Mapped[str]` | Default `"STUDENT"` | Authorization tier (`STUDENT`/`ADMIN`/etc.) |
| **`hostel_name`** | `Mapped[Optional[str]]`| Nullable, Max 120 chars | Residence house (Ramanujan, Bhabha, etc.) |
| **`google_sub`** | `Mapped[Optional[str]]`| Indexed, Max 255 chars | Google OIDC unique user ID |
| **`failed_login_attempts`**| `Mapped[int]` | Default `0` | Brute-force threshold counter |
| **`locked_until`** | `Mapped[Optional[datetime]]`| Nullable, Timezone-aware | 15-minute lockout expiration |
| **`created_at`** | `Mapped[datetime]` | Dynamic UTC Lambda | Account registration timestamp |
