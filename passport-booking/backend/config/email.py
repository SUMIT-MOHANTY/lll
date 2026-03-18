"""Email configuration settings for the passport booking system."""

import os
import logging
from typing import Dict, Any

# Configure logging
logger = logging.getLogger(__name__)

# Default values
DEFAULT_SMTP_SERVER = "smtp.gmail.com"
DEFAULT_SMTP_PORT = "587"
DEFAULT_SENDER_NAME = "Passport Booking System"

# Email configuration dictionary
EMAIL_CONFIG: Dict[str, Any] = {
    # SMTP Server details
    "SMTP_SERVER": os.environ.get("SMTP_SERVER", DEFAULT_SMTP_SERVER),
    "SMTP_PORT": os.environ.get("SMTP_PORT", DEFAULT_SMTP_PORT),
    "SMTP_USERNAME": os.environ.get("SMTP_USERNAME", ""),
    "SMTP_PASSWORD": os.environ.get("SMTP_PASSWORD", ""),

    # Email settings
    "SENDER_EMAIL": os.environ.get("SENDER_EMAIL", ""),
    "SENDER_NAME": os.environ.get("SENDER_NAME", DEFAULT_SENDER_NAME),

    # Templates location
    "TEMPLATES_DIR": os.path.abspath(os.environ.get(
        "EMAIL_TEMPLATES_DIR",
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
    )),
}

# Validate required configuration
missing_configs = []
for key in ["SMTP_USERNAME", "SMTP_PASSWORD", "SENDER_EMAIL"]:
    if not EMAIL_CONFIG.get(key):
        missing_configs.append(key)

if missing_configs:
    logger.warning(f"Missing email configuration: {', '.join(missing_configs)}")
    logger.warning("Email notifications will not work until these are set")

# Email template settings
TEMPLATE_SETTINGS = {
    "booking_confirmation": {
        "subject": "Your Passport Appointment Confirmation - Reference #{reference}",
        "required_fields": ["name", "date", "time", "office", "reference"],
    }
}
