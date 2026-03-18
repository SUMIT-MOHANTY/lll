from sqlalchemy import Column, Integer, ForeignKey, String, DateTime, func, select, update, and_, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.exc import IntegrityError
from sqlalchemy.dialects.postgresql import UUID
from ..config.database import Base
from ..config.logger import app_logger as logger
import uuid
from datetime import datetime

class Booking(Base):
    """
    Booking model representing a user's appointment booking.
    Includes a unique constraint to prevent duplicate bookings on the same day.
    """
    __tablename__ = "bookings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    slot_id = Column(Integer, ForeignKey("slots.id"), nullable=False, unique=True)
    slot_date = Column(DateTime, nullable=False)
    confirmation_code = Column(String, unique=True, nullable=False, index=True)
    status = Column(String, default="confirmed")  # confirmed, cancelled, completed
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    # Relationships
    user = relationship("User")
    slot = relationship("Slot", back_populates="bookings")

    # Unique constraint to prevent multiple bookings by the same user on the same day
    __table_args__ = (
        UniqueConstraint('user_id', func.date(slot_date), name='uix_user_slot_date'),
    )

    @staticmethod
    async def check_existing_booking(db_session, user_id, date):
        """
        Check if a user already has a booking on the specified date.

        Args:
            db_session: Database session
            user_id: User ID to check
            date: Date to check (datetime object)

        Returns:
            Boolean indicating if a booking exists
        """
        try:
            # Convert datetime to date for comparison
            query = f"""
                SELECT EXISTS(
                    SELECT 1 FROM bookings
                    WHERE user_id = '{user_id}'
                    AND DATE(slot_date) = DATE('{date.isoformat()}')
                )
            """
            result = await db_session.execute(query)
            exists = result.scalar()
            return exists
        except Exception as e:
            logger.error(f"Error checking for existing booking: {str(e)}")
            # Re-raise to allow proper error handling at controller level
            raise

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
                confirmation_code=confirmation_code,
                slot_date=slot.start_time
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

    def to_dict(self):
        """Convert booking instance to dictionary"""
        return {
            "id": str(self.id),
            "userId": str(self.user_id),
            "slotId": str(self.slot_id),
            "slotDate": self.slot_date.isoformat() if self.slot_date else None,
            "confirmationCode": self.confirmation_code,
            "status": self.status,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }
