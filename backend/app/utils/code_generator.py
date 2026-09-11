"""
SmartComplaintHandler - Code Generator Utility
Blueprint Reference: V1/M2/backend/01_code_generator.md
Role: CSPRNG collision-resistant tracking code generator (format: TICK-XXXX).
"""
import secrets
import string

def generate_ticket_code() -> str:
    chars = string.ascii_uppercase + string.digits
    suffix = ''.join(secrets.choice(chars) for _ in range(4))
    return f"TICK-{suffix}"
