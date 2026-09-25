"""
SmartComplaintHandler - Lifecycle State Machine
Blueprint Reference: V1/M5/backend/02_lifecycle_state_machine.md
Role: Finite State Automata enforcing legal ticket lifecycle transitions and audit notes.
"""
from datetime import datetime, timezone
from typing import Dict, Optional, Set

# Canonical lifecycle status definitions
STATUS_SUBMITTED: str = "SUBMITTED"
STATUS_IN_PROGRESS: str = "IN_PROGRESS"
STATUS_ESCALATED: str = "ESCALATED"
STATUS_ON_HOLD: str = "ON_HOLD"
STATUS_RESOLVED: str = "RESOLVED"
STATUS_CLOSED: str = "CLOSED"
STATUS_CANCELLED: str = "CANCELLED"

ALL_STATUSES: Set[str] = {
    STATUS_SUBMITTED,
    STATUS_IN_PROGRESS,
    STATUS_ESCALATED,
    STATUS_ON_HOLD,
    STATUS_RESOLVED,
    STATUS_CLOSED,
    STATUS_CANCELLED,
}

# Graph of permitted state transitions (Finite State Automata)
VALID_TRANSITIONS: Dict[str, Set[str]] = {
    STATUS_SUBMITTED: {STATUS_IN_PROGRESS, STATUS_CANCELLED},
    STATUS_IN_PROGRESS: {STATUS_RESOLVED, STATUS_ESCALATED, STATUS_ON_HOLD, STATUS_CANCELLED},
    STATUS_ESCALATED: {STATUS_IN_PROGRESS, STATUS_RESOLVED},
    STATUS_ON_HOLD: {STATUS_IN_PROGRESS, STATUS_CANCELLED},
    STATUS_RESOLVED: {STATUS_CLOSED},
    STATUS_CLOSED: set(),      # Terminal state: cannot transition out
    STATUS_CANCELLED: set(),   # Terminal state: cannot transition out
}

TERMINAL_STATES: Set[str] = {STATUS_CLOSED, STATUS_CANCELLED}


# Custom domain exceptions for lifecycle enforcement
class InvalidStateTransitionError(Exception):
    """Raised when an illegal lifecycle state transition is attempted."""
    pass


class MissingResolutionNotesError(Exception):
    """Raised when transitioning to RESOLVED without sufficient documentation (min 10 chars)."""
    pass


class TerminalStateModificationError(Exception):
    """Raised when attempting to modify or transition a ticket from a terminal state."""
    pass


def validate_transition(
    current_status: str,
    target_status: str,
    notes: Optional[str] = None
) -> None:
    """
    Validate whether a proposed lifecycle transition is legally permitted.
    
    Args:
        current_status: The current status of the ticket.
        target_status: The desired destination status.
        notes: Supporting staff notes or resolution documentation.
        
    Raises:
        TerminalStateModificationError: If ticket is in a terminal state.
        InvalidStateTransitionError: If the transition path is forbidden or cancellation reason too short.
        MissingResolutionNotesError: If resolving with notes shorter than 10 characters.
    """
    curr = (current_status or "").strip().upper()
    target = (target_status or "").strip().upper()
    
    if curr not in ALL_STATUSES:
        raise InvalidStateTransitionError(f"Unknown current status: '{current_status}'.")
    if target not in ALL_STATUSES:
        raise InvalidStateTransitionError(f"Unknown target status: '{target_status}'.")
        
    if curr in TERMINAL_STATES:
        raise TerminalStateModificationError(
            f"Cannot transition ticket from terminal state '{curr}'."
        )
        
    allowed_targets = VALID_TRANSITIONS.get(curr, set())
    if target not in allowed_targets:
        legal_targets = sorted(list(allowed_targets)) if allowed_targets else ["None (Terminal)"]
        raise InvalidStateTransitionError(
            f"Invalid transition from '{curr}' to '{target}'. Legal next states: {legal_targets}"
        )
        
    # Transition-specific input validation guards
    if target == STATUS_RESOLVED:
        if not notes or len(notes.strip()) < 10:
            raise MissingResolutionNotesError(
                "Resolution requires notes of at least 10 characters detailing the physical repair."
            )
            
    if target == STATUS_CANCELLED:
        if not notes or len(notes.strip()) < 5:
            raise InvalidStateTransitionError(
                "Cancellation requires a documented reason of at least 5 characters."
            )


def format_audit_log_entry(
    previous_status: str,
    new_status: str,
    actor: str = "Staff",
    notes: Optional[str] = None
) -> str:
    """
    Format a standardized immutable audit log record for state transitions.
    
    Args:
        previous_status: Status before the transition.
        new_status: Status after the transition.
        actor: Identity of the person or system enacting the transition.
        notes: Staff documentation or remarks.
        
    Returns:
        Structured string for appending to the ticket resolution / audit trail.
    """
    timestamp = datetime.now(timezone.utc).isoformat()
    clean_notes = notes.strip() if notes else "None"
    return f"[TRANSITION: {timestamp} | Actor: {actor} | {previous_status} -> {new_status} | Notes: {clean_notes}]"
