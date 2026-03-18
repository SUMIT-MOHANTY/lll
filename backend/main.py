import logging
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from sqlalchemy.orm import Session

# Import core modules
from app.core.logging_config import configure_logging
from app.core.middleware.logging_middleware import LoggingMiddleware
from app.core.middleware.error_handling_middleware import ErrorHandlingMiddleware
from config.database import get_db, engine
from config.logger import app_logger as logger
from models import user, office, slot, booking
from services.booking_service import BookingService

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

# Create tables
user.Base.metadata.create_all(bind=engine)
office.Base.metadata.create_all(bind=engine)
slot.Base.metadata.create_all(bind=engine)
booking.Base.metadata.create_all(bind=engine)

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

@app.get("/")
def read_root():
    return {"message": "Passport Booking System API"}

@app.get("/health")
def health_check():
    try:
        # Verify database connection
        db = next(get_db())
        db.execute("SELECT 1")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service unhealthy: {str(e)}"
        )

@app.on_event("startup")
async def startup_event():
    logger.info("Application starting up")
    # Add any startup code here (DB connections, etc.)

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application shutting down")
    # Add any cleanup code here

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
