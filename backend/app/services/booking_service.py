from datetime import datetime
from uuid import UUID
from typing import Dict, Any, Optional, Tuple, Union
from fastapi import HTTPException, status

from ..models.booking import BookingCreate, BookingResponse

# In-memory database for demo purposes
# In a real application, use proper database queries
bookings_db = {}
slots_db = {
    "550e8400-e29b-41d4-a716-446655440000": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "capacity": 3,
        "booked_count": 0
    }
}

class BookingService:
    """Service for handling booking operations."""

    @staticmethod
    def create_booking(booking_data: BookingCreate) -> Tuple[BookingResponse, bool]:
        """
        Create a new booking with duplicate checking.

        Args:
            booking_data: The booking data to create

        Returns:
            Tuple with booking response and boolean indicating if booking was created

        Raises:
            HTTPException: If slot is fully booked or already booked by user
        """
        # Check if slot exists
        slot_id = str(booking_data.slot_id)
        if slot_id not in slots_db:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Slot not found"
            )

        slot = slots_db[slot_id]

        # Check if slot is already fully booked
        if slot["booked_count"] >= slot["capacity"]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Slot already fully booked"
            )

        # Check if user already has a booking for this slot
        user_id = str(booking_data.user_id)
        for booking_id, booking in bookings_db.items():
            if booking["user_id"] == user_id and booking["slot_id"] == slot_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="User already has a booking for this slot"
                )

        # Create the booking
        booking_id = UUID(int=len(bookings_db) + 1)
        new_booking = {
            "id": booking_id,
            "slot_id": booking_data.slot_id,
            "user_id": booking_data.user_id,
            "status": "confirmed",
            "created_at": datetime.now()
        }

        # Update slot booking count - atomically in a real database
        slots_db[slot_id]["booked_count"] += 1

        # Save booking - transaction would be used in a real database
        bookings_db[str(booking_id)] = new_booking

        # Return response
        return BookingResponse(
            id=booking_id,
            slot_id=booking_data.slot_id,
            user_id=booking_data.user_id,
            status="confirmed",
            created_at=new_booking["created_at"]
        ), True

    @staticmethod
    def get_booking(booking_id: UUID) -> Optional[Dict[str, Any]]:
        """Get a booking by ID."""
        return bookings_db.get(str(booking_id))
