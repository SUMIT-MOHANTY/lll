from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
import uuid
from ..config.database import Base
import logging

logger = logging.getLogger("passport_booking")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    @classmethod
    def create(cls, db, **kwargs):
        """Create a new user with error handling"""
        try:
            user = cls(**kwargs)
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"Created user with email: {kwargs.get('email')}")
            return user
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create user: {e}")
            raise
