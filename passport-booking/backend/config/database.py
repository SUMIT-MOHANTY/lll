import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager
from .logger import app_logger as logger

# Get database URL from environment or use default SQLite connection
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./passport_booking.db")

# Create SQLAlchemy engine
try:
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10
    )
    logger.info(f"Database engine created successfully with {DATABASE_URL}")
except Exception as e:
    logger.critical(f"Failed to create database engine: {str(e)}")
    raise

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()

@contextmanager
def get_db_session():
    """Provide a transactional scope around a series of operations."""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        logger.error(f"Database session error: {str(e)}")
        raise
    finally:
        session.close()
