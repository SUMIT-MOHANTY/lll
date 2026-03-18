import uvicorn
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from config.database import get_db, engine
from models import user, office, slot, booking
from services.booking_service import BookingService
from config.logger import app_logger as logger

# Create tables
user.Base.metadata.create_all(bind=engine)
office.Base.metadata.create_all(bind=engine)
slot.Base.metadata.create_all(bind=engine)
booking.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Passport Booking System")

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

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
