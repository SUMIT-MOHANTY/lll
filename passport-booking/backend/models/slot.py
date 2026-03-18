from sqlalchemy import Column, Integer, ForeignKey, DateTime, Boolean, func, and_, select
from sqlalchemy.orm import relationship
from ..config.database import Base
from ..config.logger import app_logger as logger
from datetime import datetime

class Slot(Base):
    __tablename__ = "slots"

    id = Column(Integer, primary_key=True, index=True)
    office_id = Column(Integer, ForeignKey("offices.id"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    office = relationship("Office", back_populates="slots")
    bookings = relationship("Booking", back_populates="slot", cascade="all, delete-orphan")

    @classmethod
    def get_available_slots(cls, db, office_id, date):
        """Get all available slots for a specific office and date"""
        try:
            # Convert date to datetime objects for the beginning and end of the day
            start_of_day = datetime.combine(date, datetime.min.time())
            end_of_day = datetime.combine(date, datetime.max.time())

            # Query for available slots
            slots = db.query(cls).filter(
                cls.office_id == office_id,
                cls.start_time >= start_of_day,
                cls.start_time <= end_of_day,
                cls.is_available == True
            ).all()

            return slots
        except Exception as e:
            logger.error(f"Failed to get available slots: {str(e)}")
            raise
