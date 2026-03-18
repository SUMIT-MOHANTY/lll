from sqlalchemy import create_engine
from ..config.database import Base, DATABASE_URL
from ..config.logger import setup_logger
from ..models.user import User
from ..models.office import Office
from ..models.slot import Slot
from ..models.booking import Booking

logger = setup_logger(name="db_migration")

def create_tables():
    """Create all database tables"""
    try:
        engine = create_engine(DATABASE_URL)
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to create database tables: {str(e)}")
        return False

if __name__ == "__main__":
    create_tables()
