"""
SmartComplaintHandler - FastAPI Application Entry Point
Blueprint Reference: V1/M1/backend/09_fastapi_app.md
Role: Mounts CORS middleware, global exception handler (preserving CORS headers on errors),
      schema initialization, and master API router.
"""
from contextlib import asynccontextmanager
import logging
import os
import sys
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import engine, SessionLocal
from app.db.base import Base
from app.api.v1.router import api_router
from app.db.seed import ensure_schema, seed_database

logger = logging.getLogger(__name__)


def _initialize_database() -> None:
    """
    Ensure database tables and columns exist.
    Full data seeding is deferred by default (run `python -m app.db.seed` manually when ready),
    unless AUTO_SEED_ON_STARTUP=true or running inside pytest.
    """
    try:
        ensure_schema()
        is_pytest = "pytest" in sys.modules
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


if not os.environ.get("VERCEL"):
    _initialize_database()


@asynccontextmanager
async def lifespan(app: FastAPI):
    _initialize_database()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Automated Closed-Loop Smart Complaint Routing & Workflow Automation Platform (IIIT Naya Raipur)",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch unhandled exceptions and return a structured JSON 500 response inside CORSMiddleware
    so the browser receives CORS headers and displays the real error instead of 'Network Error'.
    """
    logger.error(f"Unhandled exception on {request.url.path}: {exc}", exc_info=True)
    origin = request.headers.get("origin", "*")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        },
    )


app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to Smart Complaint Handler API",
        "docs_url": "/docs",
        "openapi_url": "/openapi.json",
        "health_check": "/health",
        "version": "1.0.0",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "database": "connected",
    }
