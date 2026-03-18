import pytest
from fastapi.testclient import TestClient
import uuid
from unittest.mock import patch
from concurrent.futures import ThreadPoolExecutor, as_completed

from app.main import app
from app.tests.utils.utils import get_token_for_user
from app.tests.utils.booking import create_random_booking
from app.tests.utils.user import create_random_user
from app.tests.utils.slot import create_random_slot

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_create_booking(client, db_session):
    # Create test user
    user = create_random_user(db_session)
    # Create test slot
    slot = create_random_slot(db_session)
    # Get auth token
    token = get_token_for_user(client, user.email, "testpassword")

    # Create booking
    response = client.post(
        "/api/bookings/",
        headers={"Authorization": f"Bearer {token}"},
        json={"slotId": str(slot.id)}
    )

    # Check response
    assert response.status_code == 201
    data = response.json()
    assert data["slotId"] == str(slot.id)
    assert data["userId"] == str(user.id)
    assert data["status"] == "CONFIRMED"
    assert "id" in data
    assert "createdAt" in data

def test_create_duplicate_booking(client, db_session):
    # Create test user
    user = create_random_user(db_session)
    # Create test slot
    slot = create_random_slot(db_session)
    # Get auth token
    token = get_token_for_user(client, user.email, "testpassword")

    # Create first booking
    response1 = client.post(
        "/api/bookings/",
        headers={"Authorization": f"Bearer {token}"},
        json={"slotId": str(slot.id)}
    )
    assert response1.status_code == 201

    # Try to create duplicate booking
    response2 = client.post(
        "/api/bookings/",
        headers={"Authorization": f"Bearer {token}"},
        json={"slotId": str(slot.id)}
    )

    # Check that we get a conflict error
    assert response2.status_code == 409
    assert "already exists" in response2.json()["error"].lower()

def test_concurrent_bookings(client, db_session):
    # Create test slot with 1 capacity
    slot = create_random_slot(db_session, capacity=1)

    # Create multiple users
    user1 = create_random_user(db_session)
    user2 = create_random_user(db_session)

    # Get auth tokens
    token1 = get_token_for_user(client, user1.email, "testpassword")
    token2 = get_token_for_user(client, user2.email, "testpassword")

    # Function to make booking request
    def make_booking(user_token):
        return client.post(
            "/api/bookings/",
            headers={"Authorization": f"Bearer {user_token}"},
            json={"slotId": str(slot.id)}
        )

    # Make concurrent booking requests
    with ThreadPoolExecutor(max_workers=2) as executor:
        future1 = executor.submit(make_booking, token1)
        future2 = executor.submit(make_booking, token2)

        response1 = future1.result()
        response2 = future2.result()

    # Check that only one booking succeeded
    success_count = 0
    if response1.status_code == 201:
        success_count += 1
    if response2.status_code == 201:
        success_count += 1

    assert success_count == 1, "Only one booking should succeed"

    # The other response should be either a conflict due to unique constraint
    # or a conflict due to capacity being full
    failed_response = response1 if response1.status_code != 201 else response2
    assert failed_response.status_code == 409
