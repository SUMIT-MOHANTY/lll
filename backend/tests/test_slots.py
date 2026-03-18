import pytest
from fastapi.testclient import TestClient
from uuid import uuid4, UUID
import jwt
from datetime import datetime, timedelta

from ..app.main import app
from ..app.config.settings import settings

client = TestClient(app)

def create_test_token(role="user"):
    """Helper function to create a test JWT token"""
    payload = {
        "sub": {"id": str(uuid4()), "email": "test@example.com", "role": role},
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def test_bulk_create_slots_admin_access():
    """Test that only admins can access the bulk slot creation endpoint"""
    # Create admin token
    admin_token = create_test_token(role="admin")

    # Test data
    test_data = {
        "slots": [
            {
                "officeId": str(uuid4()),
                "date": "2023-07-15",
                "time": "09:00",
                "capacity": 10
            }
        ]
    }

    # Test with admin token
    response = client.post(
        "/api/slots/bulk",
        json=test_data,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 201
    assert response.json()["created"] == 1

    # Test with user token
    user_token = create_test_token(role="user")
    response = client.post(
        "/api/slots/bulk",
        json=test_data,
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 403

    # Test without token
    response = client.post("/api/slots/bulk", json=test_data)
    assert response.status_code == 401

def test_bulk_create_slots_validation():
    """Test input validation for bulk slot creation"""
    admin_token = create_test_token(role="admin")

    # Test invalid date format
    response = client.post(
        "/api/slots/bulk",
        json={
            "slots": [
                {
                    "officeId": str(uuid4()),
                    "date": "15-07-2023",  # Wrong format
                    "time": "09:00",
                    "capacity": 10
                }
            ]
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 422

    # Test invalid time format
    response = client.post(
        "/api/slots/bulk",
        json={
            "slots": [
                {
                    "officeId": str(uuid4()),
                    "date": "2023-07-15",
                    "time": "9:00",  # Should be 09:00
                    "capacity": 10
                }
            ]
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 422

    # Test invalid capacity
    response = client.post(
        "/api/slots/bulk",
        json={
            "slots": [
                {
                    "officeId": str(uuid4()),
                    "date": "2023-07-15",
                    "time": "09:00",
                    "capacity": -1  # Should be positive
                }
            ]
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 422

def test_bulk_create_multiple_slots():
    """Test creating multiple slots in one request"""
    admin_token = create_test_token(role="admin")

    office_id = str(uuid4())
    test_data = {
        "slots": [
            {
                "officeId": office_id,
                "date": "2023-07-15",
                "time": "09:00",
                "capacity": 10
            },
            {
                "officeId": office_id,
                "date": "2023-07-15",
                "time": "10:00",
                "capacity": 15
            },
            {
                "officeId": office_id,
                "date": "2023-07-15",
                "time": "11:00",
                "capacity": 20
            }
        ]
    }

    response = client.post(
        "/api/slots/bulk",
        json=test_data,
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == 201
    assert response.json()["created"] == 3
    assert len(response.json()["slots"]) == 3

    # Verify the data in the response
    slots = response.json()["slots"]
    assert slots[0]["officeId"] == office_id
    assert slots[0]["date"] == "2023-07-15"
    assert slots[0]["time"] == "09:00"
    assert slots[0]["capacity"] == 10
    assert slots[0]["booked"] == 0
