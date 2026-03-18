import logging
import sys
import json
import traceback
from datetime import datetime
from logging.handlers import RotatingFileHandler
from pathlib import Path
import uuid

class RequestContextFilter(logging.Filter):
    """Filter that adds request ID and user info to log records"""

    def filter(self, record):
        # These attributes will be set by the middleware if available
        if not hasattr(record, 'request_id'):
            record.request_id = getattr(RequestContextFilter, 'request_id', str(uuid.uuid4()))
        if not hasattr(record, 'user_id'):
            record.user_id = getattr(RequestContextFilter, 'user_id', None)
        if not hasattr(record, 'path'):
            record.path = getattr(RequestContextFilter, 'path', None)
        if not hasattr(record, 'method'):
            record.method = getattr(RequestContextFilter, 'method', None)
        return True

class JSONFormatter(logging.Formatter):
    """Format logs as JSON for better parsing by log aggregation tools"""

    def __init__(self):
        super().__init__()
        self.default_keys = [
            'timestamp', 'level', 'name', 'message',
            'request_id', 'user_id', 'path', 'method'
        ]

    def format(self, record):
        log_data = {
            'timestamp': datetime.utcfromtimestamp(record.created).isoformat(),
            'level': record.levelname,
            'name': record.name,
            'message': record.getMessage(),
        }

        # Add request context if available
        if hasattr(record, 'request_id'):
            log_data['request_id'] = record.request_id
        if hasattr(record, 'user_id') and record.user_id:
            log_data['user_id'] = record.user_id
        if hasattr(record, 'path'):
            log_data['path'] = record.path
        if hasattr(record, 'method'):
            log_data['method'] = record.method

        # Add exception info if available
        if record.exc_info:
            log_data['exception'] = {
                'type': record.exc_info[0].__name__,
                'message': str(record.exc_info[1]),
                'traceback': traceback.format_exception(*record.exc_info)
            }

        # Add any additional attributes that aren't in the default keys
        for key, value in record.__dict__.items():
            if key not in ['exc_info', 'exc_text', 'stack_info', 'lineno', 'funcName',
                          'created', 'msecs', 'relativeCreated', 'levelno', 'msg',
                          'args', 'pathname', 'filename', 'module', 'sinfo'] + self.default_keys:
                log_data[key] = value

        return json.dumps(log_data)

def configure_logging(log_level=logging.INFO, log_dir=None):
    """
    Configure logging for the application

    Args:
        log_level: The logging level to use
        log_dir: Directory to store log files (if None, logs to console only)
    """
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # Remove any existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Create console handler for all logs
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(JSONFormatter())
    root_logger.addHandler(console_handler)

    # Add context filter to root logger
    context_filter = RequestContextFilter()
    root_logger.addFilter(context_filter)

    # Create file handler if log directory is specified
    if log_dir:
        log_path = Path(log_dir)
        log_path.mkdir(exist_ok=True, parents=True)

        # Main application log
        app_log_file = log_path / 'app.log'
        file_handler = RotatingFileHandler(
            app_log_file, maxBytes=10485760, backupCount=5  # 10MB with 5 backups
        )
        file_handler.setLevel(log_level)
        file_handler.setFormatter(JSONFormatter())
        root_logger.addHandler(file_handler)

        # Separate error log
        error_log_file = log_path / 'error.log'
        error_handler = RotatingFileHandler(
            error_log_file, maxBytes=10485760, backupCount=5
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(JSONFormatter())
        root_logger.addHandler(error_handler)

    # Reduce noise from other libraries
    logging.getLogger('uvicorn.access').setLevel(logging.WARNING)
    logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)

    # Create a dedicated access logger for API requests
    access_logger = logging.getLogger('api.access')
    access_logger.propagate = False

    if log_dir:
        access_log_file = log_path / 'access.log'
        access_handler = RotatingFileHandler(
            access_log_file, maxBytes=10485760, backupCount=5
        )
        access_handler.setFormatter(JSONFormatter())
        access_logger.addHandler(access_handler)

    # Also log access to console
    access_console = logging.StreamHandler(sys.stdout)
    access_console.setFormatter(JSONFormatter())
    access_logger.addHandler(access_console)

    return root_logger
