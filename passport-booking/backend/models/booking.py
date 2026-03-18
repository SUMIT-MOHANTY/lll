from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import logging

Base = declarative_base()
logger = logging.getLogger(__name__)

class Booking(Base):
    """
    Booking model representing a user's appointment booking.
    Includes a unique constraint to prevent duplicate bookings on the same day.
    """
    __tablename__ = 'bookings'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    slot_id = Column(UUID(as_uuid=True), ForeignKey('slots.id'), nullable=False)
    slot_date = Column(DateTime, nullable=False)
    reference = Column(String, unique=True, nullable=False)
    status = Column(String, default='confirmed', nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

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

    def to_dict(self):
        """Convert booking instance to dictionary"""
        return {
            "id": str(self.id),
            "userId": str(self.user_id),
            "slotId": str(self.slot_id),
            "slotDate": self.slot_date.isoformat() if self.slot_date else None,
            "reference": self.reference,
            "status": self.status,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }
