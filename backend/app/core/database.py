"""
SmartComplaintHandler - SQLite Engine & Database Sessionmaker
Blueprint Reference: V1/M1/backend/02_sqlite_engine.md
Role: SQLAlchemy 2.0 engine configured with SQLite WAL mode and sessionmaker.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Create the central SQLAlchemy 2.0 database engine
# connect_args={"check_same_thread": False} is required for SQLite because FastAPI handles requests across multiple async worker threads
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    echo=settings.DEBUG  # Prints all executed SQL statements to the terminal when DEBUG=True
)

# Define SessionLocal: a factory that produces new independent transactional database sessions for each HTTP request
# autocommit=False: guarantees that all changes are explicitly committed via db.commit()
# autoflush=False: prevents premature writes to disk before validation completes
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)
