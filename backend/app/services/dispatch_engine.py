"""
SmartComplaintHandler - Workload Dispatch Engine
Blueprint Reference: V1/M4/backend/01_dispatch_engine.md
Role: Least-loaded queue balancing algorithm dispatching tickets to squads with lowest load.
"""
from typing import List, Dict, Any

def dispatch_to_least_loaded_team(teams: List[Dict[str, Any]]) -> int:
    return min(teams, key=lambda t: t.get("active_ticket_count", 0))["id"]
