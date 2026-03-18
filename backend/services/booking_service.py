from ..models.booking import Booking, BookingError
from ..models.slot import Slot
from ..config.database import get_db
from sqlalchemy.orm import Session
from datetime import datetime
import logging

logger = logging.getLogger("passport_booking")

class BookingService:
    @staticmethod
    def create_booking(user_id, slot_id, notes=None, db=None):
        """
        Create a booking with proper transaction handling

        Args:
            user_id: User ID making the booking
            slot_id: Slot ID being booked
            notes: Optional notes
            db: Optional database session (will create if not provided)

        Returns:
            Booking object

        Raises:
            BookingError: If booking fails
        """
        if db:
            return Booking.create_atomic(db, user_id, slot_id, notes)
        else:
            with get_db() as db:
                return Booking.create_atomic(db, user_id, slot_id, notes)

    @staticmethod
    def cancel_booking(booking_id, user_id=None, db=None):
        """
        Cancel a booking with proper transaction handling

        Args:
            booking_id: ID of booking to cancel
            user_id: Optional user ID for verification
            db: Optional database session

        Returns:
            Cancelled booking

        Raises:
            BookingError: If cancellation fails
        """
        if db:
            return Booking.cancel_atomic(db, booking_id, user_id)
        else:
            with get_db() as db:
                return Booking.cancel_atomic(db, booking_id, user_id)

    @staticmethod
    def get_user_bookings(user_id, db=None):
        """Get all bookings for a user"""
        try:
            if db:
                bookings = db.query(Booking).filter(Booking.user_id == user_id).all()
                return bookings
            else:
                with get_db() as db:
                    bookings = db.query(Booking).filter(Booking.user_id == user_id).all()
                    return bookings
        except Exception as e:
            logger.error(f"Error retrieving user bookings: {e}")
            raise BookingError(f"Failed to retrieve bookings: {str(e)}")

    @staticmethod
    def get_available_slots(office_id=None, start_date=None, end_date=None, db=None):
        """Get available slots with optional filters"""
        try:
            if db:
                return BookingService._filter_slots(db, office_id, start_date, end_date)
            else:
                with get_db() as db:
                    return BookingService._filter_slots(db, office_id, start_date, end_date)
        except Exception as e:
            logger.error(f"Error retrieving available slots: {e}")
            raise BookingError(f"Failed to retrieve available slots: {str(e)}")

    @staticmethod
    def _filter_slots(db, office_id=None, start_date=None, end_date=None):
        """Helper method to filter slots based on criteria"""
        query = db.query(Slot).filter(Slot.is_active == True, Slot.available > 0)

        if office_id:
            query = query.filter(Slot.office_id == office_id)

        if start_date:
            if isinstance(start_date, str):
                start_date = datetime.fromisoformat(start_date)
            query = query.filter(Slot.start_time >= start_date)

        if end_date:
            if isinstance(end_date, str):
                end_date = datetime.fromisoformat(end_date)
            query = query.filter(Slot.start_time <= end_date)

        return query.order_by(Slot.start_time).all()
