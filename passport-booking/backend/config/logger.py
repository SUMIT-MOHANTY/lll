import logging
import os
import sys
from logging.handlers import RotatingFileHandler

def setup_logger(name='passport-booking', log_file='app.log', level=logging.INFO):
    """Configure and return a logger instance with proper formatting"""

    # Create logs directory if it doesn't exist
    os.makedirs('logs', exist_ok=True)

    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Setup file handler
    file_handler = RotatingFileHandler(
        os.path.join('logs', log_file),
        maxBytes=10485760,  # 10MB
        backupCount=5
    )
    file_handler.setFormatter(formatter)

    # Setup console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)

    # Setup logger
    logger = logging.getLogger(name)
    logger.setLevel(level)

    # Add handlers if they don't exist yet
    if not logger.handlers:
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)

    return logger

# Create default application logger
app_logger = setup_logger()
