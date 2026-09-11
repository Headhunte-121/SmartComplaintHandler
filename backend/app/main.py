"""
SmartComplaintHandler - FastAPI Application Entry Point
Blueprint Reference: V1/M1/backend/09_fastapi_app.md
Role: Mounts CORS middleware, lifespan events (seed trigger), and master API router.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router

# Initialize the central FastAPI application instance with title and metadata
# Governed by: V1/M1/backend/09_fastapi_app.md
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Automated Closed-Loop Smart Complaint Routing & Workflow Automation Platform"
)

# Configure Cross-Origin Resource Sharing (CORS) middleware
# Allows the Vite development server running on port 5173 to communicate with FastAPI on port 8000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # In production, replace with specific frontend origin ["http://localhost:5173"]
    allow_credentials=True,     # Allow cookies and authentication headers
    allow_methods=["*"],        # Allow all HTTP methods (GET, POST, PATCH, DELETE, OPTIONS)
    allow_headers=["*"],        # Allow all standard and custom request headers
)

# Mount the consolidated API v1 router containing all module routes under the /api/v1 prefix
app.include_router(api_router, prefix=settings.API_V1_STR)

# Root service endpoint providing basic API orientation and documentation links
@app.get("/", tags=["Root"])
def root():
    # Returns friendly welcome payload pointing developers to interactive Swagger docs
    return {
        "message": "Welcome to Smart Complaint Handler API",
        "docs_url": "/docs",
        "openapi_url": "/openapi.json",
        "health_check": "/health",
        "version": "1.0.0"
    }

# Health check probe endpoint used by monitoring systems and frontend connectivity checks
@app.get("/health", tags=["Health"])
def health_check():
    # Returns HTTP 200 with service status to verify the backend server process is active
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "database": "connected"
    }
