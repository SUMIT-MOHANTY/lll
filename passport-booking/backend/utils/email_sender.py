import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("email_sender")

class EmailSender:
    """Handles sending of emails for booking confirmations."""

    def __init__(self, config: Dict[str, Any]):
        """Initialize EmailSender with configuration."""
        self.smtp_server = config.get("SMTP_SERVER")
        self.smtp_port = int(config.get("SMTP_PORT", 587))
        self.smtp_username = config.get("SMTP_USERNAME")
        self.smtp_password = config.get("SMTP_PASSWORD")
        self.sender_email = config.get("SENDER_EMAIL")
        self.templates_dir = config.get("TEMPLATES_DIR", "templates")

        # Validate required configuration
        missing_configs = []
        for key in ["SMTP_SERVER", "SMTP_USERNAME", "SMTP_PASSWORD", "SENDER_EMAIL"]:
            if not config.get(key):
                missing_configs.append(key)

        if missing_configs:
            logger.error(f"Missing email configuration: {', '.join(missing_configs)}")
            raise ValueError(f"Missing required email configuration: {', '.join(missing_configs)}")

        logger.info("Email sender initialized successfully")

    def _load_template(self, template_name: str) -> str:
        """Load email template from file."""
        try:
            template_path = Path(self.templates_dir) / f"{template_name}.html"
            with open(template_path, 'r') as f:
                return f.read()
        except FileNotFoundError:
            logger.error(f"Template not found: {template_name}")
            raise FileNotFoundError(f"Email template '{template_name}' not found")
        except Exception as e:
            logger.error(f"Error loading template {template_name}: {str(e)}")
            raise

    def send_booking_confirmation(self, recipient_email: str, booking_data: Dict[str, Any]) -> bool:
        """
        Send booking confirmation email to user.

        Args:
            recipient_email: User's email address
            booking_data: Dictionary containing booking details

        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        try:
            # Validate input
            if not recipient_email or '@' not in recipient_email:
                logger.error(f"Invalid email address: {recipient_email}")
                return False

            if not booking_data:
                logger.error("No booking data provided")
                return False

            # Load template
            template = self._load_template("booking_confirmation")

            # Replace placeholders with actual data
            for key, value in booking_data.items():
                placeholder = f"{{{{{key}}}}}"
                template = template.replace(placeholder, str(value))

            # Create message
            message = MIMEMultipart()
            message["From"] = self.sender_email
            message["To"] = recipient_email
            message["Subject"] = f"Booking Confirmation - Reference #{booking_data.get('reference', 'Unknown')}"
            message.attach(MIMEText(template, "html"))

            # Connect to server and send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(message)

            logger.info(f"Booking confirmation sent to {recipient_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send booking confirmation: {str(e)}")
            return False

# Function to get email configuration
def get_email_config() -> Dict[str, str]:
    """Get email configuration from environment or settings."""
    try:
        from passport_booking.backend.config.email import EMAIL_CONFIG
        return EMAIL_CONFIG
    except ImportError:
        logger.warning("Email config module not found, using environment variables")
        return {
            "SMTP_SERVER": os.environ.get("SMTP_SERVER", ""),
            "SMTP_PORT": os.environ.get("SMTP_PORT", "587"),
            "SMTP_USERNAME": os.environ.get("SMTP_USERNAME", ""),
            "SMTP_PASSWORD": os.environ.get("SMTP_PASSWORD", ""),
            "SENDER_EMAIL": os.environ.get("SENDER_EMAIL", ""),
            "TEMPLATES_DIR": os.environ.get("EMAIL_TEMPLATES_DIR", "passport-booking/backend/templates")
        }

# Singleton instance for reuse
_email_sender: Optional[EmailSender] = None

def get_email_sender() -> EmailSender:
    """Get or create EmailSender singleton instance."""
    global _email_sender
    if _email_sender is None:
        try:
            config = get_email_config()
            _email_sender = EmailSender(config)
        except Exception as e:
            logger.error(f"Failed to initialize email sender: {str(e)}")
            raise
    return _email_sender
