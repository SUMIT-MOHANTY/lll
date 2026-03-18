import logging
from typing import Callable, Dict, Any
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException
import traceback
import json

logger = logging.getLogger(__name__)

class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """
    Middleware for handling and standardizing error responses across the application.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            return await call_next(request)
        except StarletteHTTPException as e:
            # Handle HTTP exceptions
            return self._handle_http_exception(e, request)
        except RequestValidationError as e:
            # Handle validation errors
            return await self._handle_validation_error(e, request)
        except SQLAlchemyError as e:
            # Handle database errors
            return await self._handle_database_error(e, request)
        except Exception as e:
            # Handle all other exceptions
            return await self._handle_internal_error(e, request)

    def _handle_http_exception(self, exc: StarletteHTTPException, request: Request) -> Response:
        """Handle standard HTTP exceptions"""
        status_code = exc.status_code

        # Get request ID for correlation
        request_id = getattr(request.state, "request_id", None)

        # Format error message
        error_detail = str(exc.detail) if exc.detail else "HTTP Error"

        # Log the error
        logger.error(
            f"HTTP Exception: {status_code} - {error_detail}",
            extra={
                "request_id": request_id,
                "path": request.url.path,
                "method": request.method,
                "status_code": status_code,
                "error_detail": error_detail
            }
        )

        # Return standardized error response
        return JSONResponse(
            status_code=status_code,
            content={
                "error": error_detail,
                "status_code": status_code,
                "request_id": request_id
            },
        )

    async def _handle_validation_error(self, exc: RequestValidationError, request: Request) -> Response:
        """Handle request validation errors"""
        # Get request ID for correlation
        request_id = getattr(request.state, "request_id", None)

        # Format validation errors
        errors = []
        for error in exc.errors():
            error_location = error.get("loc", [])
            field = error_location[-1] if error_location else ""
            field_location = error_location[0] if error_location else ""

            errors.append({
                "field": field,
                "location": field_location,
                "message": error.get("msg", ""),
                "type": error.get("type", "")
            })

        # Log the validation error
        logger.warning(
            f"Validation Error: {len(errors)} errors found",
            extra={
                "request_id": request_id,
                "path": request.url.path,
                "method": request.method,
                "validation_errors": errors
            }
        )

        # Return standardized validation error response
        return JSONResponse(
            status_code=422,
            content={
                "error": "Validation Error",
                "status_code": 422,
                "request_id": request_id,
                "detail": errors
            },
        )

    async def _handle_database_error(self, exc: SQLAlchemyError, request: Request) -> Response:
        """Handle database errors"""
        # Get request ID for correlation
        request_id = getattr(request.state, "request_id", None)

        # Log the database error
        logger.error(
            f"Database Error: {type(exc).__name__}",
            extra={
                "request_id": request_id,
                "path": request.url.path,
                "method": request.method,
                "error_type": type(exc).__name__,
                "error_detail": str(exc)
            },
            exc_info=True
        )

        # Return standardized database error response
        return JSONResponse(
            status_code=500,
            content={
                "error": "Database Error",
                "status_code": 500,
                "request_id": request_id,
                "message": "An unexpected database error occurred"
            },
        )

    async def _handle_internal_error(self, exc: Exception, request: Request) -> Response:
        """Handle all other exceptions as internal server errors"""
        # Get request ID for correlation
        request_id = getattr(request.state, "request_id", None)

        # Log the internal error with stack trace
        logger.error(
            f"Internal Server Error: {type(exc).__name__} - {str(exc)}",
            extra={
                "request_id": request_id,
                "path": request.url.path,
                "method": request.method,
                "error_type": type(exc).__name__,
                "error_detail": str(exc),
                "traceback": traceback.format_exc()
            },
            exc_info=True
        )

        # Return standardized internal error response
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal Server Error",
                "status_code": 500,
                "request_id": request_id,
                "message": "An unexpected error occurred"
            },
        )
