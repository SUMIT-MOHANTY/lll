from sqlalchemy import Column, ForeignKey, String, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base_class import Base
import uuid

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    slot_id = Column(UUID(as_uuid=True), ForeignKey("slots.id"), nullable=False)
    status = Column(String, nullable=False, default="CONFIRMED")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Define relationships
    user = relationship("User", back_populates="bookings")
    slot = relationship("Slot", back_populates="bookings")

    # Define unique constraint to prevent duplicate bookings
    __table_args__ = (
        UniqueConstraint('user_id', 'slot_id', name='uix_user_slot'),
    )
