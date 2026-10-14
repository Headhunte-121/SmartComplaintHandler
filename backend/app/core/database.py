"""
SmartComplaintHandler - SQLite Engine & Database Sessionmaker
Blueprint Reference: V1/M1/backend/02_sqlite_engine.md
Role: SQLAlchemy 2.0 engine configured with SQLite WAL mode and sessionmaker.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    db_url,
    connect_args={"check_same_thread": False} if "sqlite" in db_url else {},
    pool_pre_ping=True,
    echo=False
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)
