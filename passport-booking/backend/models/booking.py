from sqlalchemy import Column, Integer, ForeignKey, String, DateTime, func, select, update, and_
from sqlalchemy.orm import relationship
from sqlalchemy.exc import IntegrityError
from ..config.database import Base
from ..config.logger import app_logger as logger
from datetime import datetime

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    slot_id = Column(Integer, ForeignKey("slots.id"), nullable=False, unique=True)
    confirmation_code = Column(String, unique=True, nullable=False, index=True)
    status = Column(String, default="confirmed")  # confirmed, cancelled, completed
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    # Relationships
    user = relationship("User")
    slot = relationship("Slot", back_populates="bookings")

    @classmethod
    def create_booking_atomic(cls, db, user_id, slot_id, confirmation_code):
        """
        Create a booking with atomic operation to ensure no duplicate bookings.
        Uses a SELECT FOR UPDATE followed by an UPDATE to claim the slot.
        """
        try:
            # Lock the slot for update
            from ..models.slot import Slot

            # First, check if slot exists and is available with row-level locking
            stmt = select(Slot).where(
                and_(
                    Slot.id == slot_id,
                    Slot.is_available == True
                )
            ).with_for_update()

            slot = db.execute(stmt).scalar_one_or_none()

            if not slot:
                logger.warning(f"Slot {slot_id} not available or does not exist")
                return None

            # Update the slot to mark it as unavailable
            slot.is_available = False

            # Create the booking
            booking = cls(
                user_id=user_id,
                slot_id=slot_id,
                confirmation_code=confirmation_code
            )
            db.add(booking)

            # Commit the transaction
            db.commit()
            db.refresh(booking)

            logger.info(f"Booking created: {confirmation_code} for slot {slot_id}")
            return booking

        except IntegrityError as e:
            db.rollback()
            logger.error(f"Integrity error during booking creation: {str(e)}")
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create booking: {str(e)}")
            raise
