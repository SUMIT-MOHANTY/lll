import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager
from sqlalchemy.exc import SQLAlchemyError

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get database connection string from environment or use default
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./passport_booking.db")

# Create SQLAlchemy engine
try:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=3600,
        connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
    )
    logger.info("Database engine initialized successfully")
except Exception as e:
    logger.critical(f"Failed to initialize database engine: {e}")
    raise

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

@contextmanager
def get_db():
    """Provide a transactional scope around a series of operations."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
        logger.debug("Database transaction committed successfully")
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database transaction rolled back due to error: {e}")
        raise
    finally:
        db.close()
        logger.debug("Database connection closed")
