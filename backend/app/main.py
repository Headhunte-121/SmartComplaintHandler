"""
SmartComplaintHandler - FastAPI Application Entry Point
Blueprint Reference: V1/M1/backend/09_fastapi_app.md
Role: Mounts hardened CORS middleware, security headers, sanitized global exception handler
      (preventing SQL/credential leaks in production), schema initialization, and master API router.
"""
from contextlib import asynccontextmanager
import logging
import os
import re
import sys
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from app.core.config import settings
from app.core.database import engine, SessionLocal
from app.db.base import Base  # noqa: F401
from app.api.v1.router import api_router
from app.db.seed import ensure_schema, seed_database

logger = logging.getLogger(__name__)

# Allow localhost dev origins and Vercel deployment origins (*.vercel.app) without wildcard reflection of arbitrary external domains
SAFE_ORIGIN_PATTERN = re.compile(
    r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$|^https://[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.vercel\.app$"
)


def _is_allowed_origin(origin: str) -> bool:
    if not origin:
        return False
    normalized = origin.strip().rstrip("/")
    configured = settings.parsed_cors_origins
    if "*" in configured or normalized in configured:
        return True
    return bool(SAFE_ORIGIN_PATTERN.match(normalized))


def _initialize_database() -> None:
    """
    Run DDL schema checks only on local SQLite, pytest, or when RUN_SCHEMA_MIGRATION=true.
    """
    try:
        is_pytest = "pytest" in sys.modules
        is_sqlite = "sqlite" in str(engine.url)
        run_migration = os.getenv("RUN_SCHEMA_MIGRATION", "false").lower() in ("true", "1", "yes")

        if is_sqlite or is_pytest or run_migration:
            ensure_schema()

        auto_seed = getattr(
            settings,
            "AUTO_SEED_ON_STARTUP",
            os.getenv("AUTO_SEED_ON_STARTUP", "false").lower() in ("true", "1", "yes"),
        )
        if auto_seed or is_pytest:
            db = SessionLocal()
            try:
                seed_database(db)
            finally:
                db.close()
    except Exception as e:
        logger.warning(f"Database initialization notice: {e}")





@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        _initialize_database()
    except Exception as exc:
        logger.error(f"Lifespan database startup exception caught: {exc}", exc_info=True)
    yield


# Disable public Swagger/OpenAPI docs in production unless DEBUG is explicitly enabled
docs_enabled = getattr(settings, "DEBUG", False) or getattr(settings, "ENVIRONMENT", "development") != "production"

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Automated Closed-Loop Smart Complaint Routing & Workflow Automation Platform (IIIT Naya Raipur)",
    lifespan=lifespan,
    docs_url="/docs" if docs_enabled else None,
    redoc_url="/redoc" if docs_enabled else None,
    openapi_url="/openapi.json" if docs_enabled else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.parsed_cors_origins if "*" not in settings.parsed_cors_origins else [],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$|^https://[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    """Attach standard production HTTP security headers to all API responses."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    if getattr(settings, "ENVIRONMENT", "development") == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch unhandled exceptions, log full details internally, and return a sanitized JSON 500
    response so raw SQL statements, table names, or Supabase credentials are never leaked to clients.
    """
    logger.error(f"Unhandled exception on {request.url.path}: {exc}", exc_info=True)
    origin = request.headers.get("origin", "")
    headers = {
        "X-Content-Type-Options": "nosniff",
    }
    if _is_allowed_origin(origin):
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"

    is_debug = getattr(settings, "DEBUG", False) and getattr(settings, "ENVIRONMENT", "development") != "production"
    safe_detail = (
        f"Internal server error: {str(exc)}"
        if is_debug
        else "An unexpected internal server error occurred. Please try again later."
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": safe_detail},
        headers=headers,
    )


app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to Smart Complaint Handler API",
        "health_check": "/health",
        "version": "1.0.0",
    }


@app.get("/health", tags=["Health"])
def health_check(check_db: bool = False):
    """Verify system health. Database ping is deferred unless explicitly requested with ?check_db=true."""
    db_status = "connected"
    http_status = status.HTTP_200_OK
    if check_db:
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
        except Exception as e:
            logger.warning(f"Database health check ping failed: {e}")
            db_status = "disconnected"
            http_status = status.HTTP_503_SERVICE_UNAVAILABLE
        finally:
            db.close()

    return JSONResponse(
        status_code=http_status,
        content={
            "status": "healthy" if db_status == "connected" else "degraded",
            "project": settings.PROJECT_NAME,
            "database": db_status,
        },
    )
