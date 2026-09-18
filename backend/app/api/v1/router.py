"""
SmartComplaintHandler - Master API Router
Blueprint Reference: V1/M2/backend/06_api_router_update.md & V1/M5/backend/05_sla_endpoints.md
Role: Unifies and mounts all module sub-routers under /api/v1.
"""
from fastapi import APIRouter
from app.api.v1.endpoints.sla import router as sla_router

api_router = APIRouter()

# Mount Module M5 SLA & Lifecycle controllers
api_router.include_router(sla_router, tags=["SLA & Lifecycle"])
