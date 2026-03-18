import time
import uuid
import logging
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import json

# Get the access logger
logger = logging.getLogger("api.access")

class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware for logging all requests and responses.
    Adds correlation IDs for request tracing.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate a unique request ID
        request_id = str(uuid.uuid4())

        # Add request ID to the request state
        request.state.request_id = request_id

        # Record start time
        start_time = time.time()

        # Extract user ID if available
        user_id = None
        if hasattr(request.state, "user") and request.state.user:
            user_id = request.state.user.id

        # Set context for logging
        from app.core.logging_config import RequestContextFilter
        RequestContextFilter.request_id = request_id
        RequestContextFilter.user_id = user_id
        RequestContextFilter.path = request.url.path
        RequestContextFilter.method = request.method

        # Log the request (excluding sensitive data)
        content_type = request.headers.get("content-type", "")
        query_params = dict(request.query_params)

        # Redact sensitive information
        if "password" in query_params:
            query_params["password"] = "[REDACTED]"
        if "token" in query_params:
            query_params["token"] = "[REDACTED]"

        # Attempt to parse body for logging, excluding sensitive fields
        body = None
        if "application/json" in content_type:
            try:
                body_bytes = await request.body()
                request._body = body_bytes  # Save the body for later use

                if body_bytes:
                    body = json.loads(body_bytes.decode())

                    # Redact sensitive fields
                    if isinstance(body, dict):
                        for sensitive_field in ["password", "token", "secret", "credit_card", "ssn"]:
                            if sensitive_field in body:
                                body[sensitive_field] = "[REDACTED]"
            except Exception:
                # If we can't parse the body, just log that it couldn't be parsed
                body = "<unparseable>"

        # Log the incoming request
        logger.info(
            f"Request started: {request.method} {request.url.path}",
            extra={
                "request_id": request_id,
                "user_id": user_id,
                "method": request.method,
                "path": request.url.path,
                "query_params": query_params,
                "body": body,
                "remote_addr": request.client.host if request.client else None,
                "user_agent": request.headers.get("user-agent")
            }
        )

        # Process the request and get the response
        try:
            response = await call_next(request)

            # Calculate request processing time
            process_time = round((time.time() - start_time) * 1000, 2)  # ms

            # Add request ID to response headers for client-side tracking
            response.headers["X-Request-ID"] = request_id

            # Log response info
            status_code = response.status_code
            logger.info(
                f"Request completed: {request.method} {request.url.path} {status_code}",
                extra={
                    "request_id": request_id,
                    "user_id": user_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": status_code,
                    "process_time_ms": process_time
                }
            )

            return response

        except Exception as e:
            # Calculate request processing time
            process_time = round((time.time() - start_time) * 1000, 2)  # ms

            # Log the error with stack trace
            logger.exception(
                f"Request failed: {request.method} {request.url.path}",
                extra={
                    "request_id": request_id,
                    "user_id": user_id,
                    "method": request.method,
                    "path": request.url.path,
                    "error": str(e),
                    "process_time_ms": process_time
                }
            )

            # Re-raise the exception to be handled by the error handler
            raise
