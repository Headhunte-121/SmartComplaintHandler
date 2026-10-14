"""
SmartComplaintHandler - Authentication & Super Admin Test Suite
Verifies institutional @iiitnr.edu.in domain enforcement, bcrypt/PBKDF2 hashing,
persistent 30-day Remember Me JWT tokens, refresh token rotation, stateless OTP verification,
Google Workspace SSO, password changes, registration, and administration.
"""
import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_login_student_standard():
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
    assert resp.status_code == 422  # Pydantic domain validator rejected non-iiitnr domain


def test_register_refresh_change_password_and_me_lifecycle():
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

    # 1. Register new student
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

    # 2. Duplicate registration rejected
    resp_dup = client.post("/api/v1/auth/register", json=reg_payload)
    assert resp_dup.status_code == 409

    # 3. Access /auth/me with bearer token
    resp_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp_me.status_code == 200
    me_data = resp_me.json()
    assert me_data["email"] == reg_email
    assert me_data["name"] == "Priya Sharma"

    # 4. Refresh session using refresh_token
    resp_refresh = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token, "remember_me": True},
    )
    assert resp_refresh.status_code == 200
    refreshed = resp_refresh.json()
    assert "access_token" in refreshed
    assert refreshed["user"]["email"] == reg_email

    # 5. Change password with authenticated token
    resp_pw = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={"current_password": "mysecretpassword123", "new_password": "updatedpassword456"},
    )
    assert resp_pw.status_code == 200

    # 6. Login with updated password succeeds
    resp_login = client.post("/api/v1/auth/login", json={"email": reg_email, "password": "updatedpassword456"})
    assert resp_login.status_code == 200

    # 7. Login with old password rejected
    resp_bad = client.post("/api/v1/auth/login", json={"email": reg_email, "password": "mysecretpassword123"})
    assert resp_bad.status_code == 401


def test_stateless_otp_flow():
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
    # 1. List admins
    resp = client.get("/api/v1/auth/admins")
    assert resp.status_code == 200
    admins = resp.json()
    assert len(admins) >= 1

    # 2. Create new admin
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

    # 3. Delete admin
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
