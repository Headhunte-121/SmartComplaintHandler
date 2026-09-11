"""
SmartComplaintHandler - Lifecycle State Machine
Blueprint Reference: V1/M5/backend/02_lifecycle_state_machine.md
Role: Finite State Automata enforcing legal ticket lifecycle transitions and audit notes.
"""
VALID_TRANSITIONS = {
    "SUBMITTED": ["IN_PROGRESS"],
    "IN_PROGRESS": ["RESOLVED"],
    "RESOLVED": []
}

def validate_status_transition(current: str, target: str) -> bool:
    return target in VALID_TRANSITIONS.get(current, [])
