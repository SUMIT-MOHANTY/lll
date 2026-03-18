import uuid
from datetime import datetime
from sqlalchemy.exc import IntegrityError
from ..config.database import get_db_session
from ..config.logger import app_logger as logger
from ..models.booking import Booking
from ..models.slot import Slot

class BookingService:
    @staticmethod
    def generate_confirmation_code():
        """Generate a unique confirmation code for bookings"""
        return str(uuid.uuid4())[:8].upper()

    @staticmethod
    def create_booking(user_id, slot_id):
        """
        Create a new booking with atomic operation to ensure
        no duplicate bookings can occur.
        """
        confirmation_code = BookingService.generate_confirmation_code()

        try:
            with get_db_session() as db:
                # Use the atomic booking creation method
                booking = Booking.create_booking_atomic(
                    db, user_id, slot_id, confirmation_code
                )

                if not booking:
                    logger.warning("Booking could not be created - slot not available")
                    return None

                return {
                    "id": booking.id,
                    "user_id": booking.user_id,
                    "slot_id": booking.slot_id,
                    "confirmation_code": booking.confirmation_code,
                    "status": booking.status,
                    "created_at": booking.created_at
                }

        except IntegrityError:
            logger.error("Integrity error - the slot has been booked by someone else")
            return None
        except Exception as e:
            logger.error(f"Error creating booking: {str(e)}")
            return None

    @staticmethod
    def get_booking_by_confirmation(confirmation_code):
        """Get booking details by confirmation code"""
        try:
            with get_db_session() as db:
                booking = db.query(Booking).filter(
                    Booking.confirmation_code == confirmation_code
                ).first()

                if not booking:
                    return None

                return {
                    "id": booking.id,
                    "user_id": booking.user_id,
                    "slot_id": booking.slot_id,
                    "confirmation_code": booking.confirmation_code,
                    "status": booking.status,
                    "created_at": booking.created_at
                }
        except Exception as e:
            logger.error(f"Error retrieving booking: {str(e)}")
            return None
