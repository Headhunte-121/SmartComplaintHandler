# Section 1: Database Architecture & Full-Stack Shell (Module 1 Guide)

This guide documents the persistent data layer, connection pooling, concurrency controls, FastAPI dependency injection, and React single-page application routing.

---

## 1. Database Architecture: SQLite Write-Ahead Logging (WAL Mode)

### The Concurrency Problem in Standard SQLite
By default, SQLite uses a **Rollback Journal**. When any process writes to the database, SQLite locks the entire database file exclusively. If an incoming read query arrives during a write, the read fails immediately with:
```
sqlite3.OperationalError: database is locked
```
In a web application where students submit complaints while administrators view dashboards, the default journal mode causes random request crashes under concurrency.

### The Solution: Write-Ahead Logging (WAL)
In WAL mode, SQLite writes new changes to an auxiliary `-wal` file (Write-Ahead Log) rather than directly modifying the main `.db` file:
* **Readers do not block writers.**
* **Writers do not block readers.**
* Readers continue reading committed database snapshots while a writer appends to the WAL log.

### Implementation: Connection Hook & PRAGMA Injection
In [`backend/app/core/database.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/backend/app/core/database.py), we register a listener on SQLAlchemy's `connect` event to automatically execute SQLite PRAGMA statements for every connection checked out from the pool:

```python
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Multi-threaded worker access requires check_same_thread=False in SQLite
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args, echo=False)

if settings.DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        # Enable WAL mode for non-blocking concurrent reads and writes
        cursor.execute("PRAGMA journal_mode=WAL;")
        # Set synchronous mode to NORMAL for high write throughput with crash durability
        cursor.execute("PRAGMA synchronous=NORMAL;")
        # Enforce foreign key constraints (disabled by default in SQLite!)
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
```

---

## 2. Declarative ORM Models & Relational Integrity

### Entity-Relationship Architecture
Three core models establish the relational baseline:

```
┌────────────────────────┐         1:N         ┌────────────────────────┐
│      Department        │ ───────────────────▶│    MaintenanceTeam     │
├────────────────────────┤                     ├────────────────────────┤
│ id: int (PK)           │                     │ id: int (PK)           │
│ name: str (Unique)     │                     │ name: str              │
│ description: str       │                     │ department_id: int(FK) │
└──────────┬─────────────┘                     │ active_ticket_count:int│
           │                                   └───────────┬────────────┘
           │ 1:N                                           │ 1:N
           ▼                                               ▼
┌───────────────────────────────────────────────────────────────────────┐
│                                Ticket                                 │
├───────────────────────────────────────────────────────────────────────┤
│ id: int (PK)                tracking_code: str (Unique)               │
│ title: str                  description: text                         │
│ location: str               priority: str (P1-P4)                     │
│ status: str                 department_id: int (FK)                   │
│ assigned_team_id: int (FK)  created_at: datetime                      │
│ sla_deadline: datetime      resolution_notes: text                    │
└───────────────────────────────────────────────────────────────────────┘
```

### Key SQLAlchemy 2.0 Patterns:
1. **Bi-Directional Relationships:** `relationship("MaintenanceTeam", back_populates="department")` enables querying both directions (`dept.teams` and `team.department`) without manual join statements.
2. **Cascade Deletes:** `cascade="all, delete-orphan"` ensures that if an administrative department is deleted, associated teams are cleaned up cleanly.
3. **Foreign Key Enforcement:** Foreign keys require `ForeignKey("departments.id")` in model definitions and `PRAGMA foreign_keys=ON` at the connection level.

---

## 3. Database Session Dependency Injection: The Generator Pattern

### Why Global Database Sessions Are Dangerous
Never instantiate a global database session variable (`db = SessionLocal()`) across route handlers. If multiple HTTP requests share a single session:
1. Thread A commits while Thread B is preparing a transaction, corrupting data.
2. If an exception occurs, the session enters a broken state and fails for all subsequent requests.

### The `yield` Lifecycle Pattern
In [`backend/app/api/deps.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/backend/app/api/deps.py), we use a Python generator function:

```python
from typing import Generator
from app.core.database import SessionLocal

def get_db() -> Generator:
    """
    FastAPI dependency that provides an isolated SQLAlchemy session per request.
    Guarantees session cleanup upon completion or exception.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

1. **Request arrives:** FastAPI calls `get_db()`.
2. **Session created:** `db = SessionLocal()` opens a dedicated connection.
3. **Execution yields:** FastAPI passes `db` into the endpoint function via `Depends(get_db)`.
4. **Response returned or exception raised:** Execution resumes in the `finally:` block.
5. **Connection returned:** `db.close()` releases the connection back to the pool.

---

## 4. Application Lifespan Context Manager

In [`backend/app/main.py`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/backend/app/main.py), modern FastAPI uses an `@asynccontextmanager` lifespan handler:

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.core.database import engine
from app.db.base import Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup phase: Automatically generate SQLite tables if they do not exist
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown phase: Clean up connection pools or background tasks here

app = FastAPI(title="Smart Complaint Handler", lifespan=lifespan)
```

---

## 5. Frontend Architecture: Axios Interceptors & React Router v6

### Axios Base Client & Response Interceptor
In [`frontend/src/api/client.js`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/frontend/src/api/client.js), we configure an Axios instance with standard timeouts and automatic unwrapping:

```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Interceptor unwraps response data and formats error messages
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'Network request failed';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
```

### Client-Side SPA Navigation with `<Outlet />`
In [`frontend/src/router/AppRouter.jsx`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/frontend/src/router/AppRouter.jsx), React Router DOM v6 manages view transitions without triggering full page reloads:

```jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import SubmitComplaint from '../pages/SubmitComplaint';
import TrackTicket from '../pages/TrackTicket';
import AdminDashboard from '../pages/AdminDashboard';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/submit" replace />} />
          <Route path="submit" element={<SubmitComplaint />} />
          <Route path="track" element={<TrackTicket />} />
          <Route path="admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

The `Layout` component defines the persistent header and navigation bar. Child pages are rendered dynamically inside `<Outlet />`.
