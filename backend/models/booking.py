from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, update
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.exc import SQLAlchemyError
from ..config.database import Base, get_db
import uuid
import logging
from datetime import datetime
from sqlalchemy.ext.declarative import declarative_base

logger = logging.getLogger("passport_booking")

class BookingError(Exception):
    """Custom exception for booking errors"""
    pass

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_reference = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey("users.id"))
    slot_id = Column(Integer, ForeignKey("slots.id"))
    status = Column(String, default="confirmed")  # confirmed, cancelled, completed
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User")
    slot = relationship("Slot")

    @classmethod
    def create_atomic(cls, db, user_id, slot_id, notes=None):
        """
        Create booking with atomic operation to ensure no double-bookings
        even under high concurrency.

        Args:
            db: Database session
            user_id: ID of the user making the booking
            slot_id: ID of the slot to book
            notes: Optional notes for the booking

        Returns:
            Booking object if successful

        Raises:
            BookingError: If booking fails for any reason
        """
        try:
            # Start transaction
            db.begin_nested()

            # Get slot with FOR UPDATE lock to prevent race conditions
            slot = db.query(Slot).filter(Slot.id == slot_id).with_for_update().first()

            if not slot:
                raise BookingError("Slot not found")

            if not slot.is_active:
                raise BookingError("Slot is not active")

            if slot.available <= 0:
                raise BookingError("No availability for this slot")

            # Create booking
            booking = cls(
                user_id=user_id,
                slot_id=slot_id,
                booking_reference=str(uuid.uuid4()),
                status="confirmed",
                notes=notes
            )

            # Add booking and update slot availability atomically
            db.add(booking)
            slot.available -= 1

            # Commit transaction
            db.commit()
            logger.info(f"Created booking {booking.booking_reference} for user {user_id} and slot {slot_id}")

            return booking

        except SQLAlchemyError as e:
            db.rollback()
            error_msg = f"Database error creating booking: {str(e)}"
            logger.error(error_msg)
            raise BookingError(error_msg)

        except Exception as e:
            db.rollback()
            error_msg = f"Unexpected error creating booking: {str(e)}"
            logger.error(error_msg)
            raise BookingError(error_msg)

    @classmethod
    def cancel_atomic(cls, db, booking_id, user_id=None):
        """
        Cancel booking atomically, restoring slot availability

        Args:
            db: Database session
            booking_id: ID of the booking to cancel
            user_id: Optional user ID to verify booking ownership

        Returns:
            Cancelled booking object

        Raises:
            BookingError: If cancellation fails
        """
        try:
            # Start transaction
            db.begin_nested()

            # Query to get booking with lock
            query = db.query(cls).filter(cls.id == booking_id).with_for_update()

            # Add user check if user_id provided
            if user_id:
                query = query.filter(cls.user_id == user_id)

            booking = query.first()

            if not booking:
                raise BookingError("Booking not found or not owned by user")

            if booking.status == "cancelled":
                raise BookingError("Booking already cancelled")

            # Get slot with lock
            slot = db.query(Slot).filter(Slot.id == booking.slot_id).with_for_update().first()

            if not slot:
                raise BookingError("Associated slot not found")

            # Update booking status and restore slot availability
            booking.status = "cancelled"
            slot.available += 1

            # Commit transaction
            db.commit()
            logger.info(f"Cancelled booking {booking.booking_reference}")

            return booking

        except SQLAlchemyError as e:
            db.rollback()
            error_msg = f"Database error cancelling booking: {str(e)}"
            logger.error(error_msg)
            raise BookingError(error_msg)

        except Exception as e:
            db.rollback()
            error_msg = f"Unexpected error cancelling booking: {str(e)}"
            logger.error(error_msg)
            raise BookingError(error_msg)
