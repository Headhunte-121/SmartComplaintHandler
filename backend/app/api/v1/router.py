"""
SmartComplaintHandler - Master API Router
Blueprint Reference: V1/M2/backend/06_api_router_update.md
Role: Unifies and mounts all module sub-routers under /api/v1.
"""
from fastapi import APIRouter
from app.api.v1.endpoints import complaints, priority, assignment, sla

api_router = APIRouter()
api_router.include_router(complaints.router, tags=["Complaints"])
api_router.include_router(priority.router, tags=["Priority & Triage"])
api_router.include_router(assignment.router, tags=["Workload & Dispatch"])
api_router.include_router(sla.router, tags=["SLA & Lifecycle"])
