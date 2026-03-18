from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from ..models.booking import Booking
from ..models.slot import Slot
from ..models.user import User
from datetime import datetime
import uuid
import logging
from ..config.database import get_db_session
from ..middleware.auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Create a new booking for the authenticated user.
    Implements duplicate booking prevention at both application and database levels.
    """
    try:
        # Extract data from request
        slot_id = booking_data.get("slotId")
        if not slot_id:
            raise HTTPException(status_code=400, detail="Slot ID is required")

        # Get the slot to ensure it exists and has availability
        slot = await db.get(Slot, uuid.UUID(slot_id))
        if not slot:
            raise HTTPException(status_code=404, detail="Slot not found")

        if slot.booked >= slot.capacity:
            raise HTTPException(status_code=409, detail="Slot is fully booked")

        # Check if user already has a booking on this date (application-level check)
        has_existing_booking = await Booking.check_existing_booking(
            db, current_user.id, slot.date
        )

        if has_existing_booking:
            logger.warning(f"User {current_user.id} attempted duplicate booking on {slot.date}")
            raise HTTPException(
                status_code=409,
                detail="You already have a booking on this date"
            )

        # Prepare booking reference (example implementation)
        reference = f"PB-{uuid.uuid4().hex[:8].upper()}"

        # Create new booking
        new_booking = Booking(
            user_id=current_user.id,
            slot_id=slot_id,
            slot_date=slot.date,
            reference=reference,
            status="confirmed"
        )

        # Start a transaction to handle race conditions
        async with db.begin():
            # Increment the booked count on the slot
            slot.booked += 1

            # Add the booking
            db.add(new_booking)
            await db.flush()

            # Return the created booking
            booking_dict = new_booking.to_dict()
            booking_dict["slot"] = {
                "date": slot.date.strftime("%Y-%m-%d"),
                "time": slot.time,
                "officeName": slot.office_name
            }

            return booking_dict

    except IntegrityError as e:
        logger.error(f"Database integrity error: {str(e)}")
        # Check for the unique constraint violation
        if "uix_user_slot_date" in str(e):
            raise HTTPException(
                status_code=409,
                detail="You already have a booking on this date"
            )
        raise HTTPException(status_code=500, detail="Database error occurred")
    except HTTPException:
        # Re-raise HTTP exceptions to preserve their status codes
        raise
    except Exception as e:
        logger.error(f"Error creating booking: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while creating the booking")
