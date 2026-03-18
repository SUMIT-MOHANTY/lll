from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import scoped_session, sessionmaker
import os
import logging

# Setup logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Get database URL from environment or use SQLite for development
DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///./passport_booking.db')

try:
    # Create engine
    engine = create_engine(DATABASE_URL)

    # Create session factory
    db_session = scoped_session(sessionmaker(autocommit=False,
                                            autoflush=False,
                                            bind=engine))

    # Base class for all models
    Base = declarative_base()
    Base.query = db_session.query_property()

    def init_db():
        """Initialize database and create all tables"""
        try:
            logger.info("Initializing database...")

            # Import all models here to ensure they are registered
            from backend.models.booking import Booking
            from backend.models.user import User
            from backend.models.office import Office
            from backend.models.slot import Slot

            Base.metadata.create_all(bind=engine)
            logger.info("Database initialized successfully")
        except Exception as e:
            logger.error(f"Database initialization failed: {str(e)}")
            raise

    logger.info(f"Database configuration loaded with URL: {DATABASE_URL}")

except Exception as e:
    logger.critical(f"Database configuration failed: {str(e)}")
    raise
