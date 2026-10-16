"""
SmartComplaintHandler - Database Engine & Sessionmaker (Supabase PostgreSQL & SQLite)
Blueprint Reference: V1/M1/backend/02_database.md
Role: Production SQLAlchemy 2.0 engine configured for Supabase Transaction/Session Poolers
      on Vercel Serverless (NullPool) and persistent environments (QueuePool with keepalives).
"""
import os
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from app.core.config import settings


def _normalize_database_url(raw_url: str) -> str:
    """
    Normalize Postgres connection strings for SQLAlchemy 2.0 and strip unsupported
    PgBouncer query parameters (`pgbouncer=true`, `connection_limit`) that cause psycopg2 errors.
    """
    url = (raw_url or "sqlite:///./smart_complaints.db").strip()
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    if url.startswith("postgresql"):
        parsed = urlparse(url)
        if parsed.query:
            clean_query = [
                (k, v)
                for k, v in parse_qsl(parsed.query, keep_blank_values=True)
                if k.lower() not in ("pgbouncer", "connection_limit", "schema")
            ]
            url = urlunparse(parsed._replace(query=urlencode(clean_query)))
    return url


db_url = _normalize_database_url(settings.DATABASE_URL)

connect_args = {}
engine_kwargs = {
    "pool_pre_ping": True,
    "echo": False,
}

if "sqlite" in db_url:
    connect_args["check_same_thread"] = False
    connect_args["timeout"] = 30
elif "postgresql" in db_url:
    if "sslmode" not in db_url:
        connect_args["sslmode"] = "require"
    connect_args["connect_timeout"] = getattr(settings, "DB_CONNECT_TIMEOUT_SECONDS", 10)
    connect_args["keepalives"] = 1
    connect_args["keepalives_idle"] = 30
    connect_args["keepalives_interval"] = 10
    connect_args["keepalives_count"] = 5

    # On Vercel Serverless or Supabase Transaction Pooler (:6543), use NullPool so frozen
    # serverless containers never exhaust Supabase connection limits.
    is_serverless = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))
    is_transaction_pooler = ":6543" in db_url or "pooler.supabase.com" in db_url

    if is_serverless or is_transaction_pooler:
        engine_kwargs["poolclass"] = NullPool
    else:
        engine_kwargs["pool_size"] = getattr(settings, "DB_POOL_SIZE", 5)
        engine_kwargs["max_overflow"] = getattr(settings, "DB_MAX_OVERFLOW", 10)
        engine_kwargs["pool_recycle"] = getattr(settings, "DB_POOL_RECYCLE_SECONDS", 300)

engine = create_engine(
    db_url,
    connect_args=connect_args,
    **engine_kwargs,
)

if "sqlite" in db_url:
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.execute("PRAGMA synchronous=NORMAL;")
        cursor.execute("PRAGMA busy_timeout=30000;")
        cursor.execute("PRAGMA cache_size=-64000;")
        cursor.close()

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)
