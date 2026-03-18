from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.schemas.booking import Booking, BookingCreate, BookingResponse
from app.crud import booking as crud_booking

router = APIRouter()

@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    *,
    db: Session = Depends(deps.get_db),
    booking_in: BookingCreate,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Create a new booking.

    This endpoint ensures atomic booking operations to prevent duplicate bookings
    even under high concurrency conditions. The database has a unique constraint
    on user_id and slot_id combination.
    """
    # If no user_id provided, use the current authenticated user's ID
    if not booking_in.user_id:
        booking_in.user_id = current_user.id

    # Only admins can create bookings for other users
    if booking_in.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to book for another user"
        )

    try:
        # Create booking with atomic transaction handling
        booking = crud_booking.create_booking(db=db, booking_in=booking_in)

        # Prepare response
        return {
            "id": booking.id,
            "slotId": booking.slot_id,
            "userId": booking.user_id,
            "createdAt": booking.created_at,
            "status": booking.status
        }
    except HTTPException:
        # Re-raise HTTP exceptions from the CRUD layer
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )

@router.get("/", response_model=List[BookingResponse])
def read_bookings(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Retrieve bookings.

    Regular users can only see their own bookings.
    Admin users can see all bookings.
    """
    if current_user.role == "admin":
        return crud_booking.get_all_bookings(db)
    return crud_booking.get_user_bookings(db, current_user.id)

@router.get("/{booking_id}", response_model=BookingResponse)
def read_booking(
    *,
    db: Session = Depends(deps.get_db),
    booking_id: str,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Get booking by ID.
    """
    booking = crud_booking.get_booking(db, booking_id)
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )

    # Check permissions
    if booking.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this booking"
        )

    return booking
