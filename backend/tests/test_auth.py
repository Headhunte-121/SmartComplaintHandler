"""
SmartComplaintHandler - Authentication & Super Admin Test Suite
Verifies institutional @iiitnr.edu.in domain enforcement, role resolution,
administrative account management, and database sanitization.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_login_student_standard():
    payload = {"email": "nikhil26100@iiitnr.edu.in", "password": "pass"}
    resp = client.post("/api/v1/auth/login", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["role"] == "STUDENT"
    assert data["email"] == "nikhil26100@iiitnr.edu.in"
    assert data["name"] == "Nikhil"
    assert "Roll:" in data["identifier"]

def test_login_non_institutional_rejected():
    payload = {"email": "student@gmail.com", "password": "pass"}
    resp = client.post("/api/v1/auth/login", json=payload)
    assert resp.status_code == 422  # Pydantic validation rejected non-iiitnr domain

def test_login_admin():
    payload = {"email": "admin@iiitnr.edu.in", "password": "pass"}
    resp = client.post("/api/v1/auth/login", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["role"] in ["ADMIN", "SUPER_ADMIN"]

def test_login_superadmin():
    payload = {"email": "superadmin@iiitnr.edu.in", "password": "pass"}
    resp = client.post("/api/v1/auth/login", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["role"] == "SUPER_ADMIN"

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
