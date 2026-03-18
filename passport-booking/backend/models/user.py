from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from ..config.database import Base
from ..config.logger import app_logger as logger

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    @classmethod
    def create_user(cls, db, email, hashed_password, full_name, is_admin=False):
        """Create and save a new user"""
        try:
            user = cls(
                email=email,
                hashed_password=hashed_password,
                full_name=full_name,
                is_admin=is_admin
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"User created: {email}")
            return user
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create user: {str(e)}")
            raise
