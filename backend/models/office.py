from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime
from sqlalchemy.sql import func
from ..config.database import Base
import logging

logger = logging.getLogger("passport_booking")

class Office(Base):
    __tablename__ = "offices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    address = Column(Text)
    city = Column(String, index=True)
    state = Column(String, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    @classmethod
    def create(cls, db, **kwargs):
        """Create a new office with error handling"""
        try:
            office = cls(**kwargs)
            db.add(office)
            db.commit()
            db.refresh(office)
            logger.info(f"Created office: {kwargs.get('name')}")
            return office
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create office: {e}")
            raise
