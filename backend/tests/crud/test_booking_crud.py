import pytest
import uuid
from sqlalchemy.exc import IntegrityError
from threading import Thread
from concurrent.futures import ThreadPoolExecutor, as_completed

from app.models.booking import Booking
from app.models.slot import Slot
from app.schemas.booking import BookingCreate
from app.crud.booking import create_booking, get_booking
from app.tests.utils.user import create_random_user
from app.tests.utils.slot import create_random_slot

def test_create_booking(db_session):
    # Create test user and slot
    user = create_random_user(db_session)
    slot = create_random_slot(db_session)

    # Create booking
    booking_in = BookingCreate(
        user_id=user.id,
        slot_id=slot.id
    )
    booking = create_booking(db=db_session, booking_in=booking_in)

    # Check booking was created
    assert booking.user_id == user.id
    assert booking.slot_id == slot.id
    assert booking.status == "CONFIRMED"

    # Check it exists in DB
    db_booking = get_booking(db=db_session, booking_id=booking.id)
    assert db_booking is not None
    assert db_booking.id == booking.id

def test_create_duplicate_booking(db_session):
    # Create test user and slot
    user = create_random_user(db_session)
    slot = create_random_slot(db_session)

    # Create booking data
    booking_in = BookingCreate(
        user_id=user.id,
        slot_id=slot.id
    )

    # Create first booking
    booking1 = create_booking(db=db_session, booking_in=booking_in)
    assert booking1 is not None

    # Attempt to create duplicate booking
    with pytest.raises(HTTPException) as excinfo:
        booking2 = create_booking(db=db_session, booking_in=booking_in)

    assert excinfo.value.status_code == 409
    assert "already exists" in str(excinfo.value.detail).lower()

def test_concurrent_booking_creation(db_session):
    """Test that concurrent bookings are handled correctly"""
    # Create test slot with limited capacity
    slot = create_random_slot(db_session, capacity=1)

    # Create two users
    user1 = create_random_user(db_session)
    user2 = create_random_user(db_session)

    # Create booking data for each user
    booking_in1 = BookingCreate(user_id=user1.id, slot_id=slot.id)
    booking_in2 = BookingCreate(user_id=user2.id, slot_id=slot.id)

    # Create a function to attempt booking creation
    def attempt_booking(booking_data):
        try:
            # Use a new session for each thread
            from app.db.session import SessionLocal
            session = SessionLocal()
            booking = create_booking(db=session, booking_in=booking_data)
            session.close()
            return True
        except Exception:
            return False

    # Run concurrent booking attempts
    with ThreadPoolExecutor(max_workers=2) as executor:
        future1 = executor.submit(attempt_booking, booking_in1)
        future2 = executor.submit(attempt_booking, booking_in2)

        success1 = future1.result()
        success2 = future2.result()

    # Verify only one booking succeeded
    assert success1 != success2, "Either booking1 or booking2 should succeed, but not both"

    # Check the database state
    booking_count = db_session.query(Booking).filter(Booking.slot_id == slot.id).count()
    assert booking_count == 1, "There should be exactly one booking in the database"
