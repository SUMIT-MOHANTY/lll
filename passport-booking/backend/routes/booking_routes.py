from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional
from ..services.booking_service import BookingService
from ..config.logger import app_logger as logger

router = APIRouter(prefix="/bookings", tags=["bookings"])

class BookingCreate(BaseModel):
    user_id: int
    slot_id: int

class BookingResponse(BaseModel):
    id: int
    user_id: int
    slot_id: int
    confirmation_code: str
    status: str
    created_at: str

@router.post("/", response_model=BookingResponse)
async def create_booking(booking: BookingCreate):
    """
    Create a new booking with atomic operation to ensure
    no duplicate bookings can occur under high concurrency.
    """
    logger.info(f"Booking request received for user {booking.user_id}, slot {booking.slot_id}")

    result = BookingService.create_booking(
        booking.user_id,
        booking.slot_id
    )

    if not result:
        logger.warning(f"Booking failed for user {booking.user_id}, slot {booking.slot_id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not create booking. The slot may no longer be available."
        )

    logger.info(f"Booking created successfully: {result['confirmation_code']}")
    return result

@router.get("/{confirmation_code}", response_model=BookingResponse)
async def get_booking(confirmation_code: str):
    """Get booking details by confirmation code"""
    booking = BookingService.get_booking_by_confirmation(confirmation_code)

    if not booking:
        logger.warning(f"Booking not found: {confirmation_code}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )

    return booking
