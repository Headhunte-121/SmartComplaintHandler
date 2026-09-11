"""
SmartComplaintHandler - Database Session Dependency
Blueprint Reference: V1/M1/backend/08_database_session_dep.md
Role: FastAPI dependency injector yielding SQLAlchemy sessions with guaranteed cleanup.
"""
from typing import Generator
from app.core.database import SessionLocal

def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
