"""
SmartComplaintHandler - SQLite Engine & Database Sessionmaker
Blueprint Reference: V1/M1/backend/02_sqlite_engine.md
Role: SQLAlchemy 2.0 engine configured with SQLite WAL mode and sessionmaker.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    echo=False
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)
