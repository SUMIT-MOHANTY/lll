import logging
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import os

# Import core modules
from app.core.logging_config import configure_logging
from app.core.middleware.logging_middleware import LoggingMiddleware
from app.core.middleware.error_handling_middleware import ErrorHandlingMiddleware

# Import routes
from app.modules.health.health_controller import router as health_router
# Import other routers here

# Configure logging first
log_level = os.getenv("LOG_LEVEL", "INFO")
log_dir = os.getenv("LOG_DIR", "./logs")
configure_logging(
    log_level=getattr(logging, log_level),
    log_dir=log_dir
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Passport Office Appointment Booking System",
    description="API for booking passport office appointments",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with actual frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom middleware
app.add_middleware(LoggingMiddleware)
app.add_middleware(ErrorHandlingMiddleware)

# Register routes
app.include_router(health_router, prefix="/api")
# Register other routers here

@app.on_event("startup")
async def startup_event():
    logger.info("Application starting up")
    # Add any startup code here (DB connections, etc.)

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application shutting down")
    # Add any cleanup code here

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
