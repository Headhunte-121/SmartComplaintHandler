"""
SmartComplaintHandler - Authentication & Super Admin Test Suite
Verifies institutional @iiitnr.edu.in domain enforcement, bcrypt hashing,
persistent 30-day Remember Me JWT tokens, registration, and administration.
"""
import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_login_student_standard():
    payload = {"email": "nikhil26100@iiitnr.edu.in", "password": "securepassword123", "remember_me": False}
    resp = client.post("/api/v1/auth/login", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in_days"] == 1
    assert data["user"]["role"] == "STUDENT"
    assert data["user"]["email"] == "nikhil26100@iiitnr.edu.in"
    assert data["user"]["name"] == "Nikhil"
    assert "Roll:" in data["user"]["identifier"]


def test_login_with_persistent_remember_me():
    payload = {"email": "admin@iiitnr.edu.in", "password": "adminpassword123", "remember_me": True}
    resp = client.post("/api/v1/auth/login", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["expires_in_days"] == 30


def test_login_non_institutional_rejected():
    payload = {"email": "student@gmail.com", "password": "password123"}
    resp = client.post("/api/v1/auth/login", json=payload)
    assert resp.status_code == 422  # Pydantic domain validator rejected non-iiitnr domain


def test_register_and_get_me_lifecycle():
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
    assert auth_data["expires_in_days"] == 30
    assert auth_data["user"]["email"] == reg_email
    assert auth_data["user"]["role"] == "STUDENT"
    token = auth_data["access_token"]

    # 2. Duplicate registration rejected
    resp_dup = client.post("/api/v1/auth/register", json=reg_payload)
    assert resp_dup.status_code == 409

    # 3. Access /auth/me with bearer token
    resp_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp_me.status_code == 200
    me_data = resp_me.json()
    assert me_data["email"] == reg_email
    assert me_data["name"] == "Priya Sharma"

    # 4. Login with correct password
    resp_login = client.post("/api/v1/auth/login", json={"email": reg_email, "password": "mysecretpassword123"})
    assert resp_login.status_code == 200

    # 5. Login with wrong password rejected
    resp_bad = client.post("/api/v1/auth/login", json={"email": reg_email, "password": "wrongpassword"})
    assert resp_bad.status_code == 401


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
        "phone": "+91-9876543210"
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
