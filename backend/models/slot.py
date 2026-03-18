from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Time, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

class Slot(Base):
    """Slot model representing available booking time slots"""
    __tablename__ = 'slots'

    id = Column(Integer, primary_key=True)
    office_id = Column(Integer, ForeignKey('offices.id'), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    capacity = Column(Integer, default=1)
    day_of_week = Column(Integer)  # 0=Monday, 6=Sunday
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Define relationships
    office = relationship("Office", back_populates="slots")
    bookings = relationship("Booking", back_populates="slot")

    def __repr__(self):
        return f"<Slot(id={self.id}, office_id={self.office_id}, time={self.start_time}-{self.end_time})>"
