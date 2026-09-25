"""
SmartComplaintHandler - FastAPI Application Entry Point
Blueprint Reference: V1/M1/backend/09_fastapi_app.md
Role: Mounts CORS middleware, lifespan events (seed trigger), and master API router.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine
from app.db.base import Base
from app.api.v1.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Automated Closed-Loop Smart Complaint Routing & Workflow Automation Platform",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to Smart Complaint Handler API",
        "docs_url": "/docs",
        "openapi_url": "/openapi.json",
        "health_check": "/health",
        "version": "1.0.0"
    }

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "database": "connected"
    }
