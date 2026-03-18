from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from ..config.database import Base
from ..config.logger import app_logger as logger

class Office(Base):
    __tablename__ = "offices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    zipcode = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

    # Relationships
    slots = relationship("Slot", back_populates="office", cascade="all, delete-orphan")

    @classmethod
    def get_active_offices(cls, db):
        """Get all active offices"""
        try:
            offices = db.query(cls).filter(cls.is_active == True).all()
            return offices
        except Exception as e:
            logger.error(f"Failed to get active offices: {str(e)}")
            raise
