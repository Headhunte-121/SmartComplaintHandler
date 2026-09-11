"""
SmartComplaintHandler - Global Constants & System Enums
Blueprint Reference: V1/M1/backend/
Role: Defines system-wide priorities, statuses, and campus operational domains.
"""
from enum import Enum

class PriorityEnum(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class TicketStatusEnum(str, Enum):
    SUBMITTED = "SUBMITTED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
