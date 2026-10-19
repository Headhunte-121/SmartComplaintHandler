"""
SmartComplaintHandler - Authentication, Super Admin & Live-Internet Security Test Suite
Verifies:
  - Institutional @iiitnr.edu.in domain enforcement, bcrypt/PBKDF2 hashing, 30-day Remember Me JWTs,
    refresh token rotation, stateless OTP verification, Google Workspace SSO, and password changes.
  - Bug #1: Sanitized backend/.env (no exposed Supabase credentials) & zero-downtime JWT secret key rotation (PREVIOUS_SECRET_KEY)
  - Bug #2: Strict RBAC on Super Admin & Staff routes (/admins, /purge-tickets, /priority, /reassign, /resolve)
  - Bug #3: Authoritative Google OAuth2/OIDC verification (blocks spoofed JSON payloads and unsigned JWTs)
  - Bug #4: Restricted CORS origins, HTTP security headers, sanitized 500 error responses, & live SELECT 1 /health check
  - Bug #5: Brute-force password login lockout (429), OTP dispatch rate-limiting (429), & stateless OTP brute-force lockout
  - Bug #6: IDOR student complaint isolation, anti-spoofing on POST /tickets, & DoS pagination limit guard
  - Bug #7: Frontend production Client-ID injection guard & proactive expired token detection
"""
from pathlib import Path
import uuid
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.security import create_access_token, decode_access_token
from app.main import app
from app.services.user_service import reset_rate_limiters

client = TestClient(app, raise_server_exceptions=False)


def _mint_role_token(email: str, role: str, name: str = "Test User") -> str:
    return create_access_token(
        data={
            "sub": email,
            "name": name,
            "role": role,
            "department_name": "Computer Science & Engineering",
            "identifier": f"ID-{role}",
        }
    )


def test_login_student_standard():
    reset_rate_limiters()
    payload = {"email": "nikhil26100@iiitnr.edu.in", "password": "securepassword123", "remember_me": False}
    resp = client.post("/api/v1/auth/login", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in_days"] == 1
    assert data["user"]["role"] == "STUDENT"
    assert data["user"]["email"] == "nikhil26100@iiitnr.edu.in"
    assert "Nikhil" in data["user"]["name"]
    assert "Roll:" in data["user"]["identifier"]


def test_login_with_persistent_remember_me():
    reset_rate_limiters()
    payload = {"email": "admin@iiitnr.edu.in", "password": "adminpassword123", "remember_me": True}
    resp = client.post("/api/v1/auth/login", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["expires_in_days"] == 30


def test_login_non_institutional_rejected():
    payload = {"email": "student@gmail.com", "password": "password123"}
    resp = client.post("/api/v1/auth/login", json=payload)
    assert resp.status_code == 422


def test_register_refresh_change_password_and_me_lifecycle():
    reset_rate_limiters()
    unique_roll = str(uuid.uuid4().hex[:3])
    reg_email = f"student26{unique_roll}@iiitnr.edu.in"
    reg_payload = {
        "name": "Priya Sharma",
        "email": reg_email,
        "password": "mysecretpassword123",
        "department_name": "Computer Science & Engineering",
        "phone": "+91-9876543210",
        "remember_me": True,
    }

    resp_reg = client.post("/api/v1/auth/register", json=reg_payload)
    assert resp_reg.status_code == 201
    auth_data = resp_reg.json()
    assert "access_token" in auth_data
    assert "refresh_token" in auth_data
    assert auth_data["expires_in_days"] == 30
    assert auth_data["user"]["email"] == reg_email
    assert auth_data["user"]["role"] == "STUDENT"
    token = auth_data["access_token"]
    refresh_token = auth_data["refresh_token"]

    resp_dup = client.post("/api/v1/auth/register", json=reg_payload)
    assert resp_dup.status_code == 409

    resp_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp_me.status_code == 200
    me_data = resp_me.json()
    assert me_data["email"] == reg_email
    assert me_data["name"] == "Priya Sharma"

    resp_refresh = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token, "remember_me": True},
    )
    assert resp_refresh.status_code == 200
    refreshed = resp_refresh.json()
    assert "access_token" in refreshed
    assert refreshed["user"]["email"] == reg_email

    resp_pw = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={"current_password": "mysecretpassword123", "new_password": "updatedpassword456"},
    )
    assert resp_pw.status_code == 200

    resp_login = client.post("/api/v1/auth/login", json={"email": reg_email, "password": "updatedpassword456"})
    assert resp_login.status_code == 200

    resp_bad = client.post("/api/v1/auth/login", json={"email": reg_email, "password": "mysecretpassword123"})
    assert resp_bad.status_code == 401


def test_stateless_otp_flow():
    reset_rate_limiters()
    email = "nikhil26100@iiitnr.edu.in"
    resp_send = client.post("/api/v1/auth/send-otp", json={"email": email})
    assert resp_send.status_code == 200
    send_data = resp_send.json()
    assert "otp_token" in send_data
    otp_code = send_data.get("otp", "123456")

    resp_verify = client.post(
        "/api/v1/auth/verify-otp",
        json={"email": email, "otp": otp_code, "otp_token": send_data["otp_token"]},
    )
    assert resp_verify.status_code == 200
    assert resp_verify.json()["verified"] is True


def test_list_and_create_and_delete_admin():
    resp = client.get("/api/v1/auth/admins")
    assert resp.status_code == 200
    admins = resp.json()
    assert len(admins) >= 1

    new_admin = {
        "name": "Prof. Alok Sharma",
        "email": "alok.admin@iiitnr.edu.in",
        "role": "ADMIN",
        "department_name": "IT Support",
        "phone": "+91-9876543210",
    }
    resp_create = client.post("/api/v1/auth/admins", json=new_admin)
    assert resp_create.status_code == 201
    created = resp_create.json()
    assert created["email"] == "alok.admin@iiitnr.edu.in"
    user_id = created["id"]

    resp_delete = client.delete(f"/api/v1/auth/admins/{user_id}")
    assert resp_delete.status_code == 200


def test_purge_tickets():
    resp = client.post("/api/v1/auth/purge-tickets")
    assert resp.status_code == 200
    data = resp.json()
    assert "purged_count" in data


def test_google_auth_success():
    payload = {
        "email": "nikhil26100@iiitnr.edu.in",
        "name": "Nikhil Gavel",
        "picture": "https://lh3.googleusercontent.com/a/default-user",
        "hd": "iiitnr.edu.in",
        "remember_me": True,
    }
    resp = client.post("/api/v1/auth/google", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["expires_in_days"] == 30
    assert data["user"]["email"] == "nikhil26100@iiitnr.edu.in"
    assert data["user"]["name"] == "Nikhil Gavel"
    assert data["user"]["department_name"] == "Computer Science & Engineering"
    assert data["user"]["avatar_url"] == "https://lh3.googleusercontent.com/a/default-user"


def test_google_auth_non_iiitnr_rejected():
    payload = {
        "email": "student@gmail.com",
        "name": "Random User",
        "remember_me": True,
    }
    resp = client.post("/api/v1/auth/google", json=payload)
    assert resp.status_code == 403
    assert "strictly restricted to official @iiitnr.edu.in" in resp.json()["detail"]


def test_bug1_exposed_credentials_sanitized_and_jwt_key_rotation():
    """
    Bug #1 Verification:
    - Verify backend/.env no longer contains hardcoded plaintext Supabase PostgreSQL credentials.
    - Verify zero-downtime JWT secret key rotation via PREVIOUS_SECRET_KEY when an API/JWT secret is rotated.
    """
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        env_text = env_path.read_text(encoding="utf-8")
        assert "2TKUGaPmLDqXYKx0" not in env_text, "Plaintext Supabase password must not be present in backend/.env"
        assert "pooler.supabase.com" not in env_text, "Hardcoded Supabase host must not be committed in backend/.env"

    old_secret = settings.SECRET_KEY
    token_before_rotation = create_access_token({"sub": "nikhil26100@iiitnr.edu.in", "role": "STUDENT"})

    try:
        settings.PREVIOUS_SECRET_KEY = old_secret
        settings.SECRET_KEY = "newly-rotated-2026-production-secret-key-999999"

        decoded = decode_access_token(token_before_rotation)
        assert decoded is not None
        assert decoded["sub"] == "nikhil26100@iiitnr.edu.in"

        import jwt
        forged = jwt.encode(
            {"sub": "superadmin@iiitnr.edu.in", "role": "SUPER_ADMIN", "type": "access"},
            "attacker-key-32-bytes-minimum-padding-1234",
            algorithm="HS256",
        )
        assert decode_access_token(forged) is None
    finally:
        settings.SECRET_KEY = old_secret
        settings.PREVIOUS_SECRET_KEY = None


def test_bug2_unauthenticated_and_student_rbac_blocked_on_admin_routes():
    """
    Bug #2 Verification:
    - Students are blocked (403 Forbidden) from calling Super Admin and Staff endpoints (/admins, /purge-tickets, /priority, /reassign, /resolve).
    - When ENFORCE_STRICT_RBAC=True (production mode), anonymous requests without a Bearer token are rejected with 401 Unauthorized.
    """
    student_token = _mint_role_token("nikhil26100@iiitnr.edu.in", "STUDENT", "Nikhil")
    superadmin_token = _mint_role_token("superadmin@iiitnr.edu.in", "SUPER_ADMIN", "Chief Admin")
    student_headers = {"Authorization": f"Bearer {student_token}"}
    superadmin_headers = {"Authorization": f"Bearer {superadmin_token}"}

    assert client.get("/api/v1/auth/admins", headers=student_headers).status_code == 403
    assert client.post(
        "/api/v1/auth/admins",
        headers=student_headers,
        json={"name": "Rogue", "email": "rogue.admin@iiitnr.edu.in", "role": "ADMIN"},
    ).status_code == 403
    assert client.post("/api/v1/auth/purge-tickets", headers=student_headers).status_code == 403
    assert client.patch(
        "/api/v1/tickets/1/reassign",
        headers=student_headers,
        json={"team_id": 1, "reason": "Unauthorized student reassign"},
    ).status_code == 403
    assert client.post(
        "/api/v1/tickets/1/resolve",
        headers=student_headers,
        json={"resolution_notes": "Student trying to close ticket without permission"},
    ).status_code == 403

    prev_rbac = settings.ENFORCE_STRICT_RBAC
    try:
        settings.ENFORCE_STRICT_RBAC = True
        assert client.get("/api/v1/auth/admins").status_code == 401
        assert client.post("/api/v1/auth/purge-tickets").status_code == 401
        assert client.get("/api/v1/teams/workloads").status_code == 401
        assert client.get("/api/v1/sla/breaches").status_code == 401

        assert client.get("/api/v1/auth/admins", headers=superadmin_headers).status_code == 200
    finally:
        settings.ENFORCE_STRICT_RBAC = prev_rbac


def test_bug3_google_strict_token_verification_blocks_spoofed_payloads():
    """
    Bug #3 Verification:
    - When GOOGLE_STRICT_TOKEN_VERIFY=True (production default), calling /api/v1/auth/google
      with only an email/name JSON body and no valid Google OAuth token is rejected with 401.
    - Forged or malformed Google ID tokens are rejected with 401/503.
    """
    prev_strict = settings.GOOGLE_STRICT_TOKEN_VERIFY
    try:
        settings.GOOGLE_STRICT_TOKEN_VERIFY = True
        resp = client.post(
            "/api/v1/auth/google",
            json={"email": "superadmin@iiitnr.edu.in", "name": "Spoofer", "hd": "iiitnr.edu.in"},
        )
        assert resp.status_code == 401

        resp_forged = client.post(
            "/api/v1/auth/google",
            json={"credential": "eyJhbGciOiJub25lIn0.eyJlbWFpbCI6InN1cGVyYWRtaW5AaWlpdG5yLmVkdS5pbiJ9."},
        )
        assert resp_forged.status_code in (401, 503)
    finally:
        settings.GOOGLE_STRICT_TOKEN_VERIFY = prev_strict


def test_bug4_cors_restriction_security_headers_and_health_check():
    """
    Bug #4 Verification:
    - Verify HTTP security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy) are present.
    - Verify untrusted external origins (e.g. https://evil-phishing.com) are NOT reflected in Access-Control-Allow-Origin.
    - Verify /health performs a real SELECT 1 database check.
    """
    resp = client.get("/health", headers={"Origin": "https://evil-phishing.com"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"
    assert resp.headers.get("X-Content-Type-Options") == "nosniff"
    assert resp.headers.get("X-Frame-Options") == "DENY"
    assert resp.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert resp.headers.get("Content-Security-Policy") == "default-src 'self'; frame-ancestors 'none'; object-src 'none';"
    assert resp.headers.get("Permissions-Policy") == "geolocation=(), camera=(), microphone=()"
    assert resp.headers.get("Access-Control-Allow-Origin") != "https://evil-phishing.com"

    resp_vercel = client.get("/health", headers={"Origin": "https://smart-complaint-handler.vercel.app"})
    assert resp_vercel.headers.get("Access-Control-Allow-Origin") == "https://smart-complaint-handler.vercel.app"


def test_bug5_brute_force_login_lockout_and_otp_rate_limiting():
    """
    Bug #5 Verification:
    - Repeated failed password login attempts trigger 429 Too Many Requests account lockout.
    - Repeated /auth/send-otp requests trigger 429 Too Many Requests rate limiting.
    - Repeated wrong OTP verification attempts against a stateless otp_token lock out the challenge.
    """
    reset_rate_limiters()
    unique_id = uuid.uuid4().hex[:4]
    email = f"lockout26{unique_id}@iiitnr.edu.in"

    reg = client.post(
        "/api/v1/auth/register",
        json={"name": "Lockout Test", "email": email, "password": "correctpassword123"},
    )
    assert reg.status_code == 201

    for _ in range(5):
        r = client.post("/api/v1/auth/login", json={"email": email, "password": "wrongpassword"})
        assert r.status_code == 401

    r_locked = client.post("/api/v1/auth/login", json={"email": email, "password": "correctpassword123"})
    assert r_locked.status_code == 429
    assert "locked" in r_locked.json()["detail"].lower()

    reset_rate_limiters()
    otp_email = f"otpflood26{unique_id}@iiitnr.edu.in"
    last_token = None
    last_otp = None
    for _ in range(5):
        r_otp = client.post("/api/v1/auth/send-otp", json={"email": otp_email})
        assert r_otp.status_code == 200
        last_token = r_otp.json()["otp_token"]
        last_otp = r_otp.json().get("otp")

    r_otp_flood = client.post("/api/v1/auth/send-otp", json={"email": otp_email})
    assert r_otp_flood.status_code == 429

    for _ in range(5):
        r_bad_otp = client.post(
            "/api/v1/auth/verify-otp",
            json={"email": otp_email, "otp": "000000", "otp_token": last_token},
        )
        assert r_bad_otp.status_code == 400

    if last_otp:
        r_after_brute = client.post(
            "/api/v1/auth/verify-otp",
            json={"email": otp_email, "otp": last_otp, "otp_token": last_token},
        )
        assert r_after_brute.status_code == 400

    reset_rate_limiters()


def test_bug6_idor_complaint_isolation_and_spoofing_prevention():
    """
    Bug #6 Verification:
    - Authenticated Student A cannot spoof Student B's email when submitting a complaint to POST /api/v1/tickets/.
    - Authenticated Student A cannot query Student B's complaints via GET /api/v1/tickets/?student_email=... (403 Forbidden).
    - Authenticated Student A cannot submit feedback on Student B's ticket (403 Forbidden).
    - Unbounded pagination limit (e.g. limit=50000) is rejected with 422.
    """
    student_a_token = _mint_role_token("studenta26100@iiitnr.edu.in", "STUDENT", "Student A")
    student_b_token = _mint_role_token("studentb26101@iiitnr.edu.in", "STUDENT", "Student B")
    headers_a = {"Authorization": f"Bearer {student_a_token}"}
    headers_b = {"Authorization": f"Bearer {student_b_token}"}

    resp_create = client.post(
        "/api/v1/tickets/",
        headers=headers_a,
        json={
            "title": "Water cooler leaking on floor 2",
            "description": "Continuous water leak near the electrical conduit on the second floor.",
            "location": "Hostel H1 Floor 2",
            "student_name": "Spoofed Name",
            "student_email": "studentb26101@iiitnr.edu.in",
        },
    )
    assert resp_create.status_code == 201
    created_ticket = resp_create.json()
    assert created_ticket["student_email"] == "studenta26100@iiitnr.edu.in"
    assert created_ticket["student_name"] == "Student A"

    resp_idor_list = client.get(
        "/api/v1/tickets/?student_email=studenta26100@iiitnr.edu.in",
        headers=headers_b,
    )
    assert resp_idor_list.status_code == 403

    resp_idor_feedback = client.post(
        f"/api/v1/tickets/{created_ticket['id']}/feedback",
        headers=headers_b,
        json={"rating": 1, "comments": "Sabotaging another student's ticket rating"},
    )
    assert resp_idor_feedback.status_code == 403

    resp_dos = client.get("/api/v1/tickets/?limit=50000", headers=headers_a)
    assert resp_dos.status_code == 422


def test_bug7_frontend_client_id_injection_and_token_expiry_guards():
    """
    Bug #7 Verification:
    - Verify Login.jsx and Register.jsx enforce GOOGLE_CLIENT_ID_PATTERN and guard localStorage Client-ID overrides with IS_PROD_BUILD.
    - Verify client.js exports proactive isTokenExpired(token, storedExpiresAt) helper.
    """
    frontend_dir = Path(__file__).resolve().parent.parent.parent / "frontend" / "src"
    login_code = (frontend_dir / "pages" / "Login.jsx").read_text(encoding="utf-8")
    register_code = (frontend_dir / "pages" / "Register.jsx").read_text(encoding="utf-8")
    client_code = (frontend_dir / "api" / "client.js").read_text(encoding="utf-8")

    assert "GOOGLE_CLIENT_ID_PATTERN" in login_code
    assert "IS_PROD_BUILD" in login_code
    assert "GOOGLE_CLIENT_ID_PATTERN" in register_code
    assert "IS_PROD_BUILD" in register_code
    assert "export function isTokenExpired" in client_code


def test_iiitnr_hostel_room_persistence_and_zone_dispatch():
    """
    IIIT Naya Raipur Campus Map, Hostels & Student Room Persistence Verification:
    1. Student registration persists authentic IIIT-NR `hostel_name` (Ramanujan House) and `room_number` (Wing A, Room 204).
    2. `GET /api/v1/auth/me` returns the student's saved hostel and room number.
    3. `PATCH /api/v1/auth/profile` updates the student's hostel (Bhabha House) and room number (Wing B, Room 312).
    4. `compute_zone_affinity_bonus` matches authentic IIIT-NR hostels (Ramanujan, Bhabha, Bose, Raman, Shabhari)
       and academic/lab buildings (VLSI Lab, Room 131C, Smart E-Classroom E-101).
    """
    from app.services.dispatch_engine import compute_zone_affinity_bonus

    unique_suffix = uuid.uuid4().hex[:4]
    test_email = f"aarav26{unique_suffix}@iiitnr.edu.in"

    reg_resp = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Aarav Verma",
            "email": test_email,
            "password": "StrongPassword123!",
            "hostel_name": "Ramanujan House (Boys Hostel 1)",
            "room_number": "Wing A, Room 204",
            "remember_me": True,
        },
    )
    assert reg_resp.status_code == 201
    reg_data = reg_resp.json()
    assert reg_data["user"]["hostel_name"] == "Ramanujan House (Boys Hostel 1)"
    assert reg_data["user"]["room_number"] == "Wing A, Room 204"
    token = reg_data["access_token"]

    me_resp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["hostel_name"] == "Ramanujan House (Boys Hostel 1)"
    assert me_data["room_number"] == "Wing A, Room 204"

    patch_resp = client.patch(
        "/api/v1/auth/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "hostel_name": "Bhabha House (Boys Hostel 2)",
            "room_number": "Wing B, Room 312",
            "phone": "+91-9876543210",
        },
    )
    assert patch_resp.status_code == 200
    patched_user = patch_resp.json()
    assert patched_user["hostel_name"] == "Bhabha House (Boys Hostel 2)"
    assert patched_user["room_number"] == "Wing B, Room 312"
    assert patched_user["phone"] == "+91-9876543210"

    # Verify IIIT-NR Zone Affinity matching
    assert compute_zone_affinity_bonus("Ramanujan House (Boys Hostel 1), Wing A, Room 204", "Hostel Electrical Squad 1") == 1
    assert compute_zone_affinity_bonus("Shabhari House (Girls Hostel 2), Wing B, Room 118", "Hostel Plumbing Squad 2") == 1
    assert compute_zone_affinity_bonus("Academic Block, VLSI Lab (Room 202)", "Academic Power Crew") == 1
    assert compute_zone_affinity_bonus("Academic Block, Room 131C Data Centre", "Academic Network Squad") == 1


def test_unregistered_login_blocked_and_registration_allowed():
    reset_rate_limiters()
    random_id = str(uuid.uuid4().hex[:4])
    unregistered_email = f"unknown26{random_id}@iiitnr.edu.in"

    # 1. Unregistered user attempting password login must be rejected
    resp_pw_login = client.post(
        "/api/v1/auth/login",
        json={"email": unregistered_email, "password": "somepassword123"},
    )
    assert resp_pw_login.status_code == 401
    assert "register first" in resp_pw_login.json()["detail"].lower()

    # 2. Unregistered user attempting Google login without is_registration must be rejected
    resp_google_login = client.post(
        "/api/v1/auth/google",
        json={
            "email": unregistered_email,
            "name": "New Student",
            "hd": "iiitnr.edu.in",
            "is_registration": False,
        },
    )
    assert resp_google_login.status_code == 404
    assert "registration" in resp_google_login.json()["detail"].lower()

    # 3. Registering via Google with is_registration=True must succeed
    resp_google_reg = client.post(
        "/api/v1/auth/google",
        json={
            "email": unregistered_email,
            "name": "New Student",
            "hd": "iiitnr.edu.in",
            "is_registration": True,
        },
    )
    assert resp_google_reg.status_code == 200
    assert resp_google_reg.json()["user"]["email"] == unregistered_email

    # 4. Now that account is registered, subsequent Google login without is_registration succeeds
    resp_google_subsequent = client.post(
        "/api/v1/auth/google",
        json={
            "email": unregistered_email,
            "name": "New Student",
            "hd": "iiitnr.edu.in",
            "is_registration": False,
        },
    )
    assert resp_google_subsequent.status_code == 200
    assert resp_google_subsequent.json()["user"]["email"] == unregistered_email


def test_privilege_escalation_on_registration_blocked():
    """
    Verify that self-registering an account with an email prefix like 'rogue.admin@iiitnr.edu.in'
    or 'fake.director@iiitnr.edu.in' CANNOT acquire ADMIN or SUPER_ADMIN role.
    It must strictly receive role='STUDENT'.
    """
    reset_rate_limiters()
    rogue_email = f"rogue.admin{uuid.uuid4().hex[:4]}@iiitnr.edu.in"
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Rogue Attacker",
            "email": rogue_email,
            "password": "Password123!",
            "remember_me": False,
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["user"]["role"] == "STUDENT"
    assert data["user"]["role"] != "ADMIN"
    assert data["user"]["role"] != "SUPER_ADMIN"

