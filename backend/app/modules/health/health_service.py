import time
import psutil
import socket
from typing import Dict, Any
import logging
from datetime import datetime
import asyncio
import aiosmtplib
from app.config.database import get_db_session
from app.config.settings import get_settings

logger = logging.getLogger(__name__)

class HealthService:
    """Service for checking the health of various system components"""

    def __init__(self):
        self.settings = get_settings()
        self.version = self.settings.app_version

    async def get_basic_health(self) -> Dict[str, Any]:
        """
        Performs basic health checks for the system
        Returns a simplified health status
        """
        db_start = time.time()
        db_status, _ = await self._check_database()
        db_time = round((time.time() - db_start) * 1000)

        email_start = time.time()
        email_status, _ = await self._check_email_service()
        email_time = round((time.time() - email_start) * 1000)

        overall_status = "healthy" if db_status == "up" and email_status == "up" else "degraded"

        return {
            "status": overall_status,
            "version": self.version,
            "timestamp": datetime.utcnow().isoformat(),
            "checks": {
                "database": {
                    "status": db_status,
                    "responseTime": db_time
                },
                "email": {
                    "status": email_status,
                    "responseTime": email_time
                }
            }
        }

    async def get_detailed_health(self) -> Dict[str, Any]:
        """
        Performs detailed health checks for the system
        Returns comprehensive metrics and diagnostic information
        Only available to admin users
        """
        # Basic checks
        db_start = time.time()
        db_status, db_details = await self._check_database()
        db_time = round((time.time() - db_start) * 1000)

        email_start = time.time()
        email_status, email_details = await self._check_email_service()
        email_time = round((time.time() - email_start) * 1000)

        # System metrics
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        uptime = time.time() - psutil.boot_time()

        overall_status = "healthy" if db_status == "up" and email_status == "up" else "degraded"

        return {
            "status": overall_status,
            "version": self.version,
            "timestamp": datetime.utcnow().isoformat(),
            "system": {
                "cpu": cpu_percent,
                "memory": memory_percent,
                "uptime": round(uptime),
                "hostname": socket.gethostname()
            },
            "checks": {
                "database": {
                    "status": db_status,
                    "responseTime": db_time,
                    "connections": db_details.get("connections", 0) if db_details else 0,
                    "details": db_details or {}
                },
                "email": {
                    "status": email_status,
                    "responseTime": email_time,
                    "details": email_details or {}
                }
            }
        }

    async def _check_database(self) -> tuple[str, Dict[str, Any]]:
        """Check if the database connection is working"""
        try:
            async with get_db_session() as session:
                # Simple query to check DB connection
                result = await session.execute("SELECT 1 as is_alive")
                row = result.fetchone()

                # Get connection stats if possible
                try:
                    stats_result = await session.execute(
                        "SELECT count(*) as connections FROM pg_stat_activity"
                    )
                    connections = stats_result.fetchone()[0]
                    details = {"connections": connections}
                except Exception:
                    details = {}

                if row and row[0] == 1:
                    logger.info("Database health check successful")
                    return "up", details
                else:
                    logger.error("Database health check failed: unexpected result")
                    return "down", {"error": "Unexpected query result"}

        except Exception as e:
            logger.error(f"Database health check failed: {str(e)}")
            return "down", {"error": str(e)}

    async def _check_email_service(self) -> tuple[str, Dict[str, Any]]:
        """Check if the email service is available"""
        try:
            email_settings = self.settings.email

            # Create a connection to the SMTP server but don't send actual email
            start_time = time.time()
            smtp = aiosmtplib.SMTP(
                hostname=email_settings.smtp_server,
                port=email_settings.smtp_port,
                use_tls=email_settings.use_tls
            )

            # Set a timeout for the connection attempt
            await asyncio.wait_for(smtp.connect(), timeout=5.0)

            # Try to authenticate if credentials are provided
            if email_settings.smtp_user and email_settings.smtp_password:
                await smtp.login(
                    email_settings.smtp_user,
                    email_settings.smtp_password
                )

            await smtp.quit()

            connection_time = time.time() - start_time
            logger.info("Email service health check successful")
            return "up", {"responseTime": round(connection_time * 1000)}

        except Exception as e:
            logger.error(f"Email service health check failed: {str(e)}")
            return "down", {"error": str(e)}
