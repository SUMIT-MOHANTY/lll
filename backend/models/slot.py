from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
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
