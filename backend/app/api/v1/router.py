"""
SmartComplaintHandler - Master API Router Aggregator
Blueprint Reference: V1/M2/backend/06_api_router_update.md & V1/M3/backend/06_api_router_update.md
Role: Aggregates and mounts all domain sub-routers under /api/v1 namespace.
"""
from fastapi import APIRouter
from app.api.v1.endpoints import complaints, priority, assignment
from app.api.v1.endpoints.sla import router as sla_router

api_router = APIRouter()

# Module M2 Complaint Intake & Tracking
api_router.include_router(complaints.router, prefix="/tickets", tags=["tickets"])

# Module M3 Incident Triage & Priority Engine (mounted under /tickets and root /api/v1 for test compatibility)
api_router.include_router(priority.router, prefix="/tickets", tags=["priority"])
api_router.include_router(priority.router, tags=["priority"])

# Module M4 Workload & Squad Dispatch
api_router.include_router(assignment.router, tags=["assignment"])

# Module M5 SLA & Lifecycle Management
api_router.include_router(sla_router, tags=["SLA & Lifecycle"])

__all__ = ["api_router"]
