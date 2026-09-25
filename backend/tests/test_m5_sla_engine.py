"""
Unit tests for Module M5: SLA Deadline Engine (sla_engine.py)
"""
from datetime import datetime, timedelta, timezone
import pytest

from app.services.sla_engine import (
    SLA_POLICIES,
    DEFAULT_SLA_HOURS,
    calculate_sla_deadline,
    calculate_sla_remaining_seconds,
    is_sla_breached,
    get_sla_status,
)


def test_sla_policy_durations():
    assert SLA_POLICIES["CRITICAL"] == 4
    assert SLA_POLICIES["HIGH"] == 12
    assert SLA_POLICIES["MEDIUM"] == 24
    assert SLA_POLICIES["LOW"] == 72
    assert DEFAULT_SLA_HOURS == 24


def test_calculate_sla_deadline_utc():
    now = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    
    crit_deadline = calculate_sla_deadline(now, "CRITICAL")
    assert crit_deadline == now + timedelta(hours=4)
    
    high_deadline = calculate_sla_deadline(now, "HIGH")
    assert high_deadline == now + timedelta(hours=12)
    
    med_deadline = calculate_sla_deadline(now, "MEDIUM")
    assert med_deadline == now + timedelta(hours=24)
    
    low_deadline = calculate_sla_deadline(now, "LOW")
    assert low_deadline == now + timedelta(hours=72)
    
    # Fallback for unknown priority
    unknown_deadline = calculate_sla_deadline(now, "UNKNOWN")
    assert unknown_deadline == now + timedelta(hours=24)


def test_calculate_sla_remaining_seconds_and_breach():
    now = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    future_deadline = now + timedelta(hours=2)
    past_deadline = now - timedelta(hours=1)
    
    # Future deadline
    remaining = calculate_sla_remaining_seconds(future_deadline, current_time=now)
    assert remaining == 7200
    assert is_sla_breached(future_deadline, current_time=now) is False
    
    # Past deadline
    overdue = calculate_sla_remaining_seconds(past_deadline, current_time=now)
    assert overdue == -3600
    assert is_sla_breached(past_deadline, current_time=now) is True


def test_get_sla_status_categories():
    now = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    
    # Healthy state (20 hours remaining out of 24h = 83% remaining)
    healthy_deadline = now + timedelta(hours=20)
    res_healthy = get_sla_status(healthy_deadline, "MEDIUM", current_time=now)
    assert res_healthy["status"] == "HEALTHY"
    assert res_healthy["is_breached"] is False
    assert res_healthy["overdue_seconds"] == 0
    assert res_healthy["remaining_seconds"] == 20 * 3600
    
    # Warning state (3 hours remaining out of 24h = 12.5% remaining, <= 20% threshold)
    warning_deadline = now + timedelta(hours=3)
    res_warning = get_sla_status(warning_deadline, "MEDIUM", current_time=now)
    assert res_warning["status"] == "WARNING"
    assert res_warning["is_breached"] is False
    assert res_warning["remaining_seconds"] == 3 * 3600
    
    # Breached state (1 hour overdue)
    breached_deadline = now - timedelta(hours=1)
    res_breached = get_sla_status(breached_deadline, "MEDIUM", current_time=now)
    assert res_breached["status"] == "BREACHED"
    assert res_breached["is_breached"] is True
    assert res_breached["overdue_seconds"] == 3600
    assert res_breached["remaining_seconds"] == 0
