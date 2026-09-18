"""
Unit tests for Module M5: Lifecycle State Machine (lifecycle.py)
"""
import pytest

from app.services.lifecycle import (
    STATUS_SUBMITTED,
    STATUS_IN_PROGRESS,
    STATUS_ESCALATED,
    STATUS_ON_HOLD,
    STATUS_RESOLVED,
    STATUS_CLOSED,
    STATUS_CANCELLED,
    InvalidStateTransitionError,
    MissingResolutionNotesError,
    TerminalStateModificationError,
    validate_transition,
    format_audit_log_entry,
)


def test_valid_transitions():
    # SUBMITTED -> IN_PROGRESS
    validate_transition(STATUS_SUBMITTED, STATUS_IN_PROGRESS)
    
    # IN_PROGRESS -> ON_HOLD
    validate_transition(STATUS_IN_PROGRESS, STATUS_ON_HOLD)
    
    # ON_HOLD -> IN_PROGRESS
    validate_transition(STATUS_ON_HOLD, STATUS_IN_PROGRESS)
    
    # IN_PROGRESS -> ESCALATED
    validate_transition(STATUS_IN_PROGRESS, STATUS_ESCALATED)
    
    # ESCALATED -> RESOLVED (with >= 10 chars notes)
    validate_transition(STATUS_ESCALATED, STATUS_RESOLVED, notes="Replaced blown capacitor in panel")
    
    # RESOLVED -> CLOSED
    validate_transition(STATUS_RESOLVED, STATUS_CLOSED)


def test_invalid_transitions():
    # Illegal direct jump: SUBMITTED -> RESOLVED
    with pytest.raises(InvalidStateTransitionError):
        validate_transition(STATUS_SUBMITTED, STATUS_RESOLVED, notes="Direct jump")
        
    # Illegal transition: ON_HOLD -> RESOLVED
    with pytest.raises(InvalidStateTransitionError):
        validate_transition(STATUS_ON_HOLD, STATUS_RESOLVED, notes="Illegal resolve from hold")
        
    # Unknown state
    with pytest.raises(InvalidStateTransitionError):
        validate_transition("UNKNOWN", STATUS_IN_PROGRESS)


def test_terminal_state_immutability():
    # CLOSED is terminal
    with pytest.raises(TerminalStateModificationError):
        validate_transition(STATUS_CLOSED, STATUS_IN_PROGRESS)
        
    # CANCELLED is terminal
    with pytest.raises(TerminalStateModificationError):
        validate_transition(STATUS_CANCELLED, STATUS_SUBMITTED)


def test_resolution_notes_guard():
    # < 10 characters must raise MissingResolutionNotesError
    with pytest.raises(MissingResolutionNotesError):
        validate_transition(STATUS_IN_PROGRESS, STATUS_RESOLVED, notes="Fixed it")
        
    with pytest.raises(MissingResolutionNotesError):
        validate_transition(STATUS_IN_PROGRESS, STATUS_RESOLVED, notes=None)
        
    # Exactly >= 10 characters must succeed
    validate_transition(STATUS_IN_PROGRESS, STATUS_RESOLVED, notes="Fixed power cord")


def test_cancellation_notes_guard():
    # < 5 characters must raise InvalidStateTransitionError
    with pytest.raises(InvalidStateTransitionError):
        validate_transition(STATUS_SUBMITTED, STATUS_CANCELLED, notes="No")
        
    # >= 5 characters succeeds
    validate_transition(STATUS_SUBMITTED, STATUS_CANCELLED, notes="Duplicate complaint filed")


def test_format_audit_log_entry():
    entry = format_audit_log_entry(
        previous_status=STATUS_SUBMITTED,
        new_status=STATUS_IN_PROGRESS,
        actor="John Technician",
        notes="Starting on-site inspection"
    )
    assert "[TRANSITION:" in entry
    assert "Actor: John Technician" in entry
    assert "SUBMITTED -> IN_PROGRESS" in entry
    assert "Notes: Starting on-site inspection" in entry
