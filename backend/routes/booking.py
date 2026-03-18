from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..config.database import get_db
from ..models.booking import BookingError
from ..services.booking_service import BookingService
from ..middleware.auth import get_current_user
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import logging

logger = logging.getLogger("passport_booking")

router = APIRouter()

# Request models
class BookingCreate(BaseModel):
    slot_id: int
    notes: Optional[str] = None

class BookingCancel(BaseModel):
    booking_id: int

class SlotFilter(BaseModel):
    office_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

# Response models
class BookingResponse(BaseModel):
    id: int
    booking_reference: str
    slot_id: int
    status: str
    created_at: datetime

    class Config:
        orm_mode = True

class SlotResponse(BaseModel):
    id: int
    office_id: int
    start_time: datetime
    end_time: datetime
    available: int

    class Config:
        orm_mode = True

@router.post("/bookings", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking: BookingCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new booking atomically"""
    try:
        logger.info(f"Creating booking for user {current_user.id}, slot {booking.slot_id}")
        new_booking = BookingService.create_booking(
            user_id=current_user.id,
            slot_id=booking.slot_id,
            notes=booking.notes,
            db=db
        )
        return new_booking
    except BookingError as e:
        logger.warning(f"Booking creation failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error creating booking: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/bookings/cancel", response_model=BookingResponse)
async def cancel_booking(
    cancel_data: BookingCancel,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel a booking atomically"""
    try:
        logger.info(f"Cancelling booking {cancel_data.booking_id} for user {current_user.id}")
        cancelled_booking = BookingService.cancel_booking(
            booking_id=cancel_data.booking_id,
            user_id=current_user.id,
            db=db
        )
        return cancelled_booking
    except BookingError as e:
        logger.warning(f"Booking cancellation failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error cancelling booking: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/bookings/user", response_model=List[BookingResponse])
async def get_user_bookings(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all bookings for the current user"""
    try:
        return BookingService.get_user_bookings(current_user.id, db)
    except BookingError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error retrieving user bookings: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/slots/available", response_model=List[SlotResponse])
async def get_available_slots(
    filters: SlotFilter,
    db: Session = Depends(get_db)
):
    """Get available slots with optional filtering"""
    try:
        return BookingService.get_available_slots(
            office_id=filters.office_id,
            start_date=filters.start_date,
            end_date=filters.end_date,
            db=db
        )
    except BookingError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error retrieving available slots: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
