"""
Email Service for Passport Office Appointment Booking System

This service is responsible for sending email notifications to users
when they successfully book an appointment.
"""
import smtplib
import os
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from jinja2 import Environment, FileSystemLoader
from pathlib import Path
import time
import asyncio
from typing import Dict, Any, Optional

# Configure logger
logger = logging.getLogger(__name__)

class EmailService:
    """Email service for sending booking confirmations and other notifications"""

    def __init__(self):
        """Initialize email service with configuration from environment variables"""
        self.smtp_host = os.getenv("SMTP_HOST", "localhost")
        self.smtp_port = int(os.getenv("SMTP_PORT", 587))
        self.smtp_username = os.getenv("SMTP_USERNAME", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.use_tls = os.getenv("SMTP_USE_TLS", "True").lower() == "true"
        self.from_email = os.getenv("SMTP_FROM_EMAIL", "bookings@passport-office.gov")
        self.max_retries = int(os.getenv("EMAIL_MAX_RETRIES", 3))
        self.retry_delay = int(os.getenv("EMAIL_RETRY_DELAY_SECONDS", 5))

        # Setup template environment
        template_dir = Path(__file__).parent.parent / "templates"
        self.template_env = Environment(
            loader=FileSystemLoader(template_dir),
            autoescape=True
        )

        logger.info(f"Email service initialized with SMTP host: {self.smtp_host}")

    def _render_template(self, template_name: str, context: Dict[str, Any]) -> str:
        """
        Render an email template with provided context

        Args:
            template_name: The name of the template file
            context: Dictionary containing variables for template rendering

        Returns:
            Rendered HTML content as string
        """
        try:
            template = self.template_env.get_template(template_name)
            return template.render(**context)
        except Exception as e:
            logger.error(f"Error rendering template {template_name}: {str(e)}")
            # Fallback to simple plain text if template rendering fails
            return self._generate_fallback_content(context)

    def _generate_fallback_content(self, context: Dict[str, Any]) -> str:
        """Generate a simple fallback email content if template rendering fails"""
        if "booking" not in context:
            return "Your booking has been confirmed."

        booking = context["booking"]
        office_name = booking.get("office_name", "our office")
        date = booking.get("date", "the scheduled date")
        time = booking.get("time", "the scheduled time")
        reference = booking.get("reference", "N/A")

        return f"""
        Your booking has been confirmed.

        Office: {office_name}
        Date: {date}
        Time: {time}
        Reference Number: {reference}

        Please arrive 10 minutes before your appointment with your required documents.

        If you need to cancel or reschedule, please visit our website.

        Thank you,
        Passport Office
        """

    async def send_email_async(self, to_email: str, subject: str, template_name: str,
                        context: Dict[str, Any], retry_count: int = 0) -> bool:
        """
        Send an email asynchronously with retry logic

        Args:
            to_email: Recipient email address
            subject: Email subject
            template_name: Template file name
            context: Dictionary of variables for template rendering
            retry_count: Current retry attempt number

        Returns:
            Boolean indicating success or failure
        """
        # Create a task to run the synchronous email sending function
        try:
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(
                None, self.send_email, to_email, subject, template_name, context, retry_count
            )
        except Exception as e:
            logger.error(f"Error in async email sending: {str(e)}")
            return False

    def send_email(self, to_email: str, subject: str, template_name: str,
                  context: Dict[str, Any], retry_count: int = 0) -> bool:
        """
        Send an email with retry logic

        Args:
            to_email: Recipient email address
            subject: Email subject
            template_name: Template file name
            context: Dictionary of variables for template rendering
            retry_count: Current retry attempt number

        Returns:
            Boolean indicating success or failure
        """
        try:
            # Render the template
            html_content = self._render_template(template_name, context)

            # Create message
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = to_email
            msg['Subject'] = subject

            # Attach HTML content
            msg.attach(MIMEText(html_content, 'html'))

            # Connect to SMTP server and send
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                if self.use_tls:
                    server.starttls()

                # Login if credentials provided
                if self.smtp_username and self.smtp_password:
                    server.login(self.smtp_username, self.smtp_password)

                # Send email
                server.send_message(msg)

            logger.info(f"Email sent successfully to {to_email}, subject: {subject}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")

            # Retry logic
            if retry_count < self.max_retries:
                logger.info(f"Retrying email to {to_email} (attempt {retry_count + 1} of {self.max_retries})")
                time.sleep(self.retry_delay)
                return self.send_email(to_email, subject, template_name, context, retry_count + 1)
            else:
                logger.error(f"Max retries reached for email to {to_email}")
                return False

    def send_booking_confirmation(self, email: str, booking: Dict[str, Any]) -> bool:
        """
        Send booking confirmation email

        Args:
            email: Recipient email address
            booking: Dictionary containing booking details

        Returns:
            Boolean indicating success or failure
        """
        subject = f"Your Passport Appointment Confirmation - Ref: {booking.get('reference', 'N/A')}"
        context = {
            "booking": booking,
            "contact_email": os.getenv("CONTACT_EMAIL", "support@passport-office.gov"),
            "contact_phone": os.getenv("CONTACT_PHONE", "0300 222 0000"),
            "office_details": {
                "name": booking.get("office_name", ""),
                "address": booking.get("office_address", ""),
            }
        }

        return self.send_email(email, subject, "confirmation.html", context)

    async def send_booking_confirmation_async(self, email: str, booking: Dict[str, Any]) -> bool:
        """
        Send booking confirmation email asynchronously

        Args:
            email: Recipient email address
            booking: Dictionary containing booking details

        Returns:
            Boolean indicating success or failure
        """
        subject = f"Your Passport Appointment Confirmation - Ref: {booking.get('reference', 'N/A')}"
        context = {
            "booking": booking,
            "contact_email": os.getenv("CONTACT_EMAIL", "support@passport-office.gov"),
            "contact_phone": os.getenv("CONTACT_PHONE", "0300 222 0000"),
            "office_details": {
                "name": booking.get("office_name", ""),
                "address": booking.get("office_address", ""),
            }
        }

        return await self.send_email_async(email, subject, "confirmation.html", context)

# Singleton instance for use across the application
email_service = EmailService()
