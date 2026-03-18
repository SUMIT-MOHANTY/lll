from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from typing import List, Optional

from ..config.database import Base

class Slot(Base):
    """Appointment slot model"""
    __tablename__ = "slots"

    id = Column(String, primary_key=True, index=True)
    office_id = Column(String, ForeignKey("offices.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    time = Column(String, nullable=False)  # Stored as HH:MM
    capacity = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    office = relationship("Office", back_populates="slots")
    bookings = relationship("Booking", back_populates="slot")

    @property
    def booked(self) -> int:
        """Get number of bookings for this slot"""
        return len(self.bookings)

    @property
    def available(self) -> int:
        """Get number of available spots"""
        return max(0, self.capacity - self.booked)

    @property
    def is_available(self) -> bool:
        """Check if slot has available capacity"""
        return self.available > 0
