import threading
import time
import random
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from ..config.database import Base, DATABASE_URL
from ..config.logger import setup_logger
from ..models.user import User
from ..models.office import Office
from ..models.slot import Slot
from ..models.booking import Booking
from ..services.booking_service import BookingService

logger = setup_logger(name="test_atomic")

def setup_test_data():
    """Create test data for the atomic booking demonstration"""
    engine = create_engine(DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)

    with Session() as session:
        # Create test users
        users = []
        for i in range(5):
            user = User(
                email=f"user{i}@example.com",
                hashed_password=f"hashed_password_{i}",
                full_name=f"Test User {i}"
            )
            session.add(user)
            users.append(user)

        # Create test office
        office = Office(
            name="Test Passport Office",
            address="123 Test St",
            city="Test City",
            state="TS",
            zipcode="12345",
            is_active=True
        )
        session.add(office)

        # Create test slots for today
        now = datetime.now()
        slots = []

        # Create 10 slots starting from now, each 30 minutes apart
        for i in range(10):
            start_time = now + timedelta(minutes=30 * i)
            end_time = start_time + timedelta(minutes=25)

            slot = Slot(
                office_id=1,  # This will be the first office
                start_time=start_time,
                end_time=end_time,
                is_available=True
            )
            session.add(slot)
            slots.append(slot)

        session.commit()

        logger.info(f"Created {len(users)} test users")
        logger.info(f"Created {len(slots)} test slots")

        return users, office, slots

def book_slot(user_id, slot_id):
    """Attempt to book a slot for a user"""
    try:
        result = BookingService.create_booking(user_id, slot_id)
        if result:
            logger.info(f"User {user_id} successfully booked slot {slot_id}: {result['confirmation_code']}")
        else:
            logger.warning(f"User {user_id} failed to book slot {slot_id}")
    except Exception as e:
        logger.error(f"Error in booking process for user {user_id}, slot {slot_id}: {str(e)}")

def simulate_concurrent_bookings():
    """Simulate multiple users trying to book the same slots concurrently"""
    users, office, slots = setup_test_data()

    # Create threads to simulate concurrent booking attempts
    threads = []

    # Each slot will have multiple users trying to book it
    for slot in slots:
        # Each slot has 3 users competing for it
        for i in range(3):
            user_id = random.randint(1, len(users))
            thread = threading.Thread(
                target=book_slot,
                args=(user_id, slot.id)
            )
            threads.append(thread)

    # Start all threads to simulate concurrent access
    logger.info(f"Starting {len(threads)} concurrent booking attempts")
    for thread in threads:
        # Small random delay to make it more realistic
        time.sleep(random.uniform(0.1, 0.3))
        thread.start()

    # Wait for all threads to complete
    for thread in threads:
        thread.join()

    logger.info("All booking attempts completed")

    # Verify the results - each slot should have at most one booking
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)

    with Session() as session:
        bookings = session.query(Booking).all()
        slots = session.query(Slot).all()

        logger.info(f"Total bookings created: {len(bookings)}")
        logger.info(f"Slots no longer available: {len([s for s in slots if not s.is_available])}")

        # Each slot should have at most one booking
        slot_booking_count = {}
        for booking in bookings:
            if booking.slot_id in slot_booking_count:
                slot_booking_count[booking.slot_id] += 1
            else:
                slot_booking_count[booking.slot_id] = 1

        # Check if any slot has more than one booking (which would indicate a problem)
        success = True
        for slot_id, count in slot_booking_count.items():
            if count > 1:
                logger.error(f"FAILURE: Slot {slot_id} has {count} bookings!")
                success = False

        if success:
            logger.info("SUCCESS: Atomic booking operation worked correctly. Each slot has at most one booking.")
        else:
            logger.error("FAILURE: Atomic booking operation failed. Some slots have multiple bookings.")

if __name__ == "__main__":
    simulate_concurrent_bookings()
