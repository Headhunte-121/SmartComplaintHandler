"""
SmartComplaintHandler - Code Generator Utility
Blueprint Reference: V1/M2/backend/01_code_generator.md
Role: CSPRNG collision-resistant tracking code generator (format: TICK-XXXX).
"""
import secrets
import string
from typing import Optional
from sqlalchemy.orm import Session

def generate_ticket_code() -> str:
    """
    Generate a 4-character alphanumeric uppercase code with TICK- prefix using secrets CSPRNG.
    """
    chars = string.ascii_uppercase + string.digits
    suffix = ''.join(secrets.choice(chars) for _ in range(4))
    return f"TICK-{suffix}"


def generate_unique_tracking_code(db: Optional[Session] = None) -> str:
    """
    Generate a tracking code guaranteed to be unique within the database table.
    """
    if db is None:
        return generate_ticket_code()

    from app.models.ticket import Ticket
    for _ in range(20):
        code = generate_ticket_code()
        exists = db.query(Ticket).filter(Ticket.tracking_code == code).first()
        if not exists:
            return code
    return generate_ticket_code()
