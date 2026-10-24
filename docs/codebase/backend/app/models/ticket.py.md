# Comprehensive Code Walkthrough & Line-by-Line Guide: `backend/app/models/ticket.py`

> **File Location**: [`backend/app/models/ticket.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/backend/app/models/ticket.py)  
> **Prerequisites**: Basic knowledge of C or Python (classes, database fields, foreign keys, timestamps, indexes). No advanced backend background is assumed.  
> **What this file is**: The core complaint ticket model. It stores every filed grievance, its unique tracking code, priority, status lifecycle, SLA deadlines, assigned maintenance squad, technician resolution notes, and student feedback ratings.

---

## Block 1: Imports and Model Definition (Lines 1–36)

```python
"""
SmartComplaintHandler - Ticket ORM Model
Blueprint Reference: V1/M1/backend/06_ticket_model.md
Role: Core closed-loop complaint entity holding tracking codes, priority, SLA deadlines, and audit notes.
"""
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    tracking_code: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str] = mapped_column(String(150), nullable=False)
    priority: Mapped[str] = mapped_column(String(20), default="MEDIUM", nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="SUBMITTED", index=True, nullable=False)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"), index=True, nullable=True)
    assigned_team_id: Mapped[int] = mapped_column(ForeignKey("maintenance_teams.id"), index=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True, nullable=False)
    sla_deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    resolution_notes: Mapped[str] = mapped_column(Text, nullable=True)

    student_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True, default=None)
    student_email: Mapped[Optional[str]] = mapped_column(String(150), index=True, nullable=True, default=None)
    feedback_rating: Mapped[int] = mapped_column(Integer, nullable=True)
    feedback_comments: Mapped[str] = mapped_column(Text, nullable=True)
    feedback_submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    department = relationship("Department", back_populates="tickets")
    assigned_team = relationship("MaintenanceTeam", back_populates="tickets")
```

### 1. Plain-English Purpose:
Defines the `tickets` table storing every campus grievance. It tracks the issue description, physical location, priority level, lifecycle state, assigned maintenance squad, resolution SLA timer, technician repair notes, and student post-resolution satisfaction feedback.

### 2. Line-by-Line Breakdown:
- **Lines 1–5**: Docstring referencing Module 1 Blueprint for Ticket ORM Model.
- **Line 6 (`from datetime import datetime, timezone`)**: Utilities for UTC timestamps.
- **Line 7 (`from typing import Optional`)**: Type hint for nullable fields.
- **Line 8 (`from sqlalchemy import String, Text, DateTime, ForeignKey, Integer`)**: Column datatypes.
- **Line 9 (`from sqlalchemy.orm import Mapped, mapped_column, relationship`)**: SQLAlchemy 2.0 ORM tools.
- **Line 10 (`from app.models.base import Base`)**: Imports declarative base.
- **Line 12 (`class Ticket(Base):`)**: Defines `Ticket` entity inheriting from `Base`.
- **Line 13 (`__tablename__ = "tickets"`)**: Table name in the database.
- **Line 15 (`id: Mapped[int] = mapped_column(primary_key=True, index=True)`)**: Internal auto-incrementing integer primary key.
- **Line 16 (`tracking_code: Mapped[str] = ...`)**: Public institutional reference code (e.g. `IIITNR-ELE-2026-0042`). Unique and indexed.
- **Line 17 (`title: Mapped[str] = mapped_column(String(200), nullable=False)`)**: Short headline summary of the issue.
- **Line 18 (`description: Mapped[str] = mapped_column(Text, nullable=False)`)**: Detailed explanation of the breakdown. Uses unbound `Text`.
- **Line 19 (`location: Mapped[str] = mapped_column(String(150), nullable=False)`)**: Campus location (Hostel, room, lab, or wing).
- **Line 20 (`priority: Mapped[str] = mapped_column(String(20), default="MEDIUM", nullable=False)`)**: Urgency tier (`P1`, `P2`, `P3`, `P4`).
- **Line 21 (`status: Mapped[str] = mapped_column(String(30), default="SUBMITTED", index=True, nullable=False)`)**: Current state (`SUBMITTED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`). Indexed for fast queue filtering.
- **Line 22 (`department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"), index=True, nullable=True)`)**: Foreign key referencing responsible department.
- **Line 23 (`assigned_team_id: Mapped[int] = mapped_column(ForeignKey("maintenance_teams.id"), index=True, nullable=True)`)**: Foreign key referencing assigned repair squad.
- **Line 24 (`created_at`)**: Submission timestamp in UTC with B-Tree index.
- **Line 25 (`sla_deadline`)**: Target resolution deadline calculated by the SLA engine.
- **Line 26 (`resolved_at`)**: Timestamp when technician finished repair.
- **Line 27 (`resolution_notes`)**: Technician's explanation of parts replaced or repairs conducted.
- **Lines 29–30 (`student_name`, `student_email`)**: Student submitter identity (nullable for anonymous complaints).
- **Lines 31–33 (`feedback_rating`, `feedback_comments`, `feedback_submitted_at`)**: Closed-loop satisfaction metrics (1 to 5 stars, remarks, submission timestamp).
- **Lines 35–36 (`department`, `assigned_team`)**: Bidirectional ORM relationship pointers.

### 3. Deep Term & Concept Expansion (For C / Basic Python Readers):
- **Why use `tracking_code` instead of the database `id`? (Preventing IDOR Attacks)**:
  If tickets were identified publicly by sequential integers (`/tickets/1`, `/tickets/2`):
  1. An attacker can write a loop `for i in range(1, 1000)` to harvest private grievances across the entire college.
  2. Sequential numbers reveal total campus complaint volumes to competitors or journalists.
  Generating a structured, non-sequential tracking code (e.g. `IIITNR-ELE-2026-0042` or `TKT-9B4F1A`) makes URLs unguessable, defeating Insecure Direct Object Reference (IDOR) attacks.
- **`String(200)` vs `Text`**:
  - `String(200)` maps to SQL `VARCHAR(200)`: Fixed maximum character limit suitable for concise titles and room numbers.
  - `Text` maps to an unbounded `TEXT` column: Accommodates multi-paragraph student grievance descriptions and comprehensive technician repair notes without arbitrary length truncations.
- **Why are `department_id` and `assigned_team_id` Nullable? (`nullable=True`)**:
  When a student clicks "Submit Complaint" at 02:00 AM, the ticket enters the system in the raw `SUBMITTED` state. At that exact millisecond, the automated AI classifier and workload dispatch engine have not yet evaluated the text. Making foreign keys nullable allows the row to be persisted immediately, followed milliseconds later by automated department and team assignments.
- **What is `sla_deadline`?**:
  Service Level Agreements (SLAs) represent the university's institutional turnaround commitment. When priority is computed:
  - **`P1` (Critical / Hazard)**: Deadline is `created_at + 2 hours`.
  - **`P2` (High Urgency)**: Deadline is `created_at + 6 hours`.
  - **`P3` (Medium)**: Deadline is `created_at + 24 hours`.
  - **`P4` (Low / Cosmetic)**: Deadline is `created_at + 72 hours`.
  If the ticket is not marked `RESOLVED` before `sla_deadline`, it is flagged as **BREACHED** on supervisor dashboards.

### 4. Runtime Mechanics & Closed-Loop Lifecycle:
- **Generated SQL DDL**:
  ```sql
  CREATE TABLE tickets (
      id SERIAL PRIMARY KEY,
      tracking_code VARCHAR(20) NOT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT NOT NULL,
      location VARCHAR(150) NOT NULL,
      priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
      status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
      department_id INTEGER,
      assigned_team_id INTEGER,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL,
      sla_deadline TIMESTAMP WITH TIME ZONE,
      resolved_at TIMESTAMP WITH TIME ZONE,
      resolution_notes TEXT,
      student_name VARCHAR(150),
      student_email VARCHAR(150),
      feedback_rating INTEGER,
      feedback_comments TEXT,
      feedback_submitted_at TIMESTAMP WITH TIME ZONE,
      CONSTRAINT uq_tickets_tracking_code UNIQUE (tracking_code),
      CONSTRAINT fk_tickets_department_id FOREIGN KEY (department_id) REFERENCES departments (id),
      CONSTRAINT fk_tickets_assigned_team_id FOREIGN KEY (assigned_team_id) REFERENCES maintenance_teams (id)
  );
  CREATE INDEX ix_tickets_id ON tickets (id);
  CREATE INDEX ix_tickets_tracking_code ON tickets (tracking_code);
  CREATE INDEX ix_tickets_status ON tickets (status);
  CREATE INDEX ix_tickets_created_at ON tickets (created_at);
  CREATE INDEX ix_tickets_student_email ON tickets (student_email);
  ```
- **Closed-Loop Feedback Integration**:
  A complaint is not finalized when the technician clicks "Resolve". The closed-loop engine updates `status = "RESOLVED"` and records `resolved_at`. The student receives an invitation to rate the repair from 1 to 5 stars (`feedback_rating`). Once feedback is submitted, the ticket transitions to `CLOSED`, completing the operational loop.

---

## Overall File Viva & Technical Defense Guide

### Top 10 Viva Questions on `backend/app/models/ticket.py`:

#### Q1: What is the purpose of the `Ticket` model in the system?
> **Model Answer**:  
> *"Sir, the `Ticket` model is the core operational entity representing student grievances. It captures the entire lifecycle of a problem—from intake and automated classification to squad dispatching, SLA tracking, technician resolution, and post-repair student feedback."*

#### Q2: Why is `tracking_code` unique and indexed?
> **Model Answer**:  
> *"Sir, students use `tracking_code` to check their complaint status publicly without authenticating. We make it unique to avoid collisions and index it (`index=True`) so that tracking queries execute in $O(\log N)$ logarithmic time rather than full table scans."*

#### Q3: How does using a non-sequential `tracking_code` improve security over integer `id`?
> **Model Answer**:  
> *"Sir, using sequential integer IDs exposes the system to Insecure Direct Object Reference (IDOR) attacks, where malicious actors iterate through numbers to read other students' grievances. A structured tracking code like `IIITNR-ELE-2026-0042` makes ticket URLs unguessable."*

#### Q4: Why are `department_id` and `assigned_team_id` nullable?
> **Model Answer**:  
> *"Sir, when a ticket is first submitted by a student, it is unassigned. The automated AI triage and dispatch engines analyze and assign the department and squad immediately following intake. Making these fields nullable allows the raw ticket to be created before asynchronous triage executes."*

#### Q5: What is an SLA, and how is `sla_deadline` calculated?
> **Model Answer**:  
> *"Sir, SLA stands for Service Level Agreement. It is the time limit within which the university commits to resolving an issue. `sla_deadline` is calculated dynamically based on priority: 2 hours for `P1` (Critical), 6 hours for `P2` (High), 24 hours for `P3` (Medium), and 72 hours for `P4` (Low)."*

#### Q6: What does the `status` column represent, and why is it indexed?
> **Model Answer**:  
> *"Sir, `status` represents the complaint's lifecycle stage (`SUBMITTED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`). It is indexed because dashboard views frequently filter tickets by status (e.g. showing technicians only `ASSIGNED` or `IN_PROGRESS` tasks)."*

#### Q7: What is the purpose of `resolution_notes`?
> **Model Answer**:  
> *"Sir, when a technician marks a ticket as resolved, they are required to document the physical actions taken (e.g. replaced burnt capacitor, re-clamped pipe). These notes are permanently recorded in `resolution_notes` for administrative audits and student visibility."*

#### Q8: What makes this a "Closed-Loop" complaint system?
> **Model Answer**:  
> *"Sir, in open-loop systems, a ticket ends when staff mark it done. In our closed-loop architecture, marking a ticket resolved prompts the student for satisfaction feedback (`feedback_rating` and `feedback_comments`). A ticket only reaches `CLOSED` status once student verification or timeout occurs."*

#### Q9: Why is `description` defined as `Text` instead of `String(255)`?
> **Model Answer**:  
> *"Sir, `String(255)` truncates input at 255 characters. Maintenance problems often require detailed explanations, error codes, and instructions. Using `Text` allocates an unbounded column capable of storing comprehensive problem descriptions."*

#### Q10: How does `created_at` index benefit SLA breach monitoring?
> **Model Answer**:  
> *"Sir, the SLA engine periodically queries for active tickets nearing their deadlines. Indexing `created_at` and `status` allows background jobs to scan open tickets in chronological order efficiently without disk I/O bottlenecks."*

---

## Quick Viva Summary Table

| Column Name | Datatype | Constraints | Purpose |
| :--- | :--- | :--- | :--- |
| **`id`** | `Mapped[int]` | Primary Key, Indexed | Internal auto-increment database ID |
| **`tracking_code`** | `Mapped[str]` | Unique, Indexed, Non-Nullable | Public tracking code (e.g. `IIITNR-ELE-2026-0042`) |
| **`title` & `description`**| `String(200)` / `Text` | Non-Nullable | Problem summary and detailed description |
| **`location`** | `Mapped[str]` | Max 150 chars | Physical campus location (Hostel/Room/Lab) |
| **`priority`** | `Mapped[str]` | Default `"MEDIUM"` | Urgency level (`P1`, `P2`, `P3`, `P4`) |
| **`status`** | `Mapped[str]` | Indexed, Default `"SUBMITTED"`| Lifecycle stage (`SUBMITTED` to `CLOSED`) |
| **`department_id`** | `Mapped[int]` | `ForeignKey("departments.id")`| Assigned service department |
| **`assigned_team_id`** | `Mapped[int]` | `ForeignKey("maintenance_teams.id")`| Assigned field maintenance squad |
| **`sla_deadline`** | `Mapped[datetime]` | Nullable, Timezone-aware | Target resolution deadline |
| **`feedback_rating`** | `Mapped[int]` | 1 to 5 Stars | Closed-loop student satisfaction rating |
