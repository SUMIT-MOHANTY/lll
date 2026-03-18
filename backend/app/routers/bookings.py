from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from uuid import UUID

from ..models.booking import BookingCreate, BookingResponse, BookingError
from ..services.booking_service import BookingService
from ..middleware.auth import get_current_user

router = APIRouter(
    prefix="/api/bookings",
    tags=["bookings"],
    responses={
        409: {"model": BookingError, "description": "Slot already booked"},
        400: {"model": BookingError, "description": "Invalid booking request"},
    },
)

@router.post(
    "",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_booking(
    booking_data: BookingCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> BookingResponse:
    """
    Create a new booking with duplicate checking.

    Args:
        booking_data: The booking data to create
        current_user: The authenticated user making the request

    Returns:
        BookingResponse: The newly created booking

    Raises:
        HTTPException: If validation fails or booking cannot be created
    """
    try:
        # Inject user_id from authenticated user
        booking_data.user_id = UUID(current_user["id"])

        # Create booking using service
        booking, created = BookingService.create_booking(booking_data)

        if not created:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Failed to create booking"
            )

        return booking

    except HTTPException as e:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log the error in a real application
        print(f"Error creating booking: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid booking request"
        )
