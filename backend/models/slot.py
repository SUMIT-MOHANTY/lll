from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Date, Time
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pydantic import BaseModel, Field
from ..config.database import Base
import logging

logger = logging.getLogger("passport_booking")

class Slot(Base):
    __tablename__ = "slots"

    id = Column(Integer, primary_key=True, index=True)
    office_id = Column(Integer, ForeignKey("offices.id"))
    start_time = Column(DateTime(timezone=True), index=True)
    end_time = Column(DateTime(timezone=True))
    capacity = Column(Integer, default=1)
    available = Column(Integer)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    office = relationship("Office")
    bookings = relationship("BookingModel", back_populates="slot")

    @property
    def booked(self) -> int:
        return len(self.bookings) if self.bookings else 0

    @classmethod
    def create(cls, db, **kwargs):
        """Create a new slot with error handling"""
        try:
            # Set available equal to capacity if not provided
            if "available" not in kwargs and "capacity" in kwargs:
                kwargs["available"] = kwargs["capacity"]

            slot = cls(**kwargs)
            db.add(slot)
            db.commit()
            db.refresh(slot)
            logger.info(f"Created slot at office {kwargs.get('office_id')} for {kwargs.get('start_time')}")
            return slot
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create slot: {e}")
            raise

class SlotSchema(BaseModel):
    id: int
    officeId: int
    officeName: str
    start_time: datetime
    end_time: datetime
    capacity: int
    booked: int
    available: int
    is_active: bool

class SlotFilterParams(BaseModel):
    location: Optional[str] = None
    date: Optional[datetime] = None
    available: Optional[int] = None
    limit: int = Field(20, ge=1, le=100)
    offset: int = Field(0, ge=0)

class PaginationResponse(BaseModel):
    total: int
    limit: int
    offset: int

class SlotListResponse(BaseModel):
    data: List[SlotSchema]
    pagination: PaginationResponse
