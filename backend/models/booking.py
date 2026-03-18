from datetime import datetime
import logging
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

# Setup logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

Base = declarative_base()

class Booking(Base):
    """
    Booking model with uniqueness constraint to prevent double bookings
    """
    __tablename__ = 'bookings'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    office_id = Column(Integer, ForeignKey('offices.id'), nullable=False)
    slot_id = Column(Integer, ForeignKey('slots.id'), nullable=False)
    booking_date = Column(DateTime, nullable=False)
    status = Column(String(20), default='pending')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Define relationships
    user = relationship("User", back_populates="bookings")
    office = relationship("Office", back_populates="bookings")
    slot = relationship("Slot", back_populates="bookings")

    # Uniqueness constraint to prevent double bookings
    __table_args__ = (
        UniqueConstraint('user_id', 'slot_id', 'booking_date', name='unique_booking'),
    )

    def __repr__(self):
        return f"<Booking(id={self.id}, user_id={self.user_id}, slot_id={self.slot_id}, date={self.booking_date})>"

    def to_dict(self):
        """Convert booking to dictionary for API responses"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'office_id': self.office_id,
            'slot_id': self.slot_id,
            'booking_date': self.booking_date.isoformat(),
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
