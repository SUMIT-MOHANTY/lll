from typing import Optional, List, Dict, Any, Union
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
import logging

from app.models.booking import Booking
from app.models.slot import Slot
from app.schemas.booking import BookingCreate, BookingUpdate

logger = logging.getLogger(__name__)

def create_booking(db: Session, booking_in: BookingCreate) -> Booking:
    """
    Create a new booking with atomic transaction to prevent duplicates.

    Args:
        db: Database session
        booking_in: Booking data to create

    Returns:
        The created booking

    Raises:
        HTTPException: If booking already exists or slot is fully booked
    """
    try:
        # Begin a transaction
        db_slot = db.query(Slot).filter(Slot.id == booking_in.slot_id).with_for_update().first()
        if not db_slot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Slot not found"
            )

        # Check slot availability
        bookings_count = db.query(Booking).filter(Booking.slot_id == booking_in.slot_id).count()
        if bookings_count >= db_slot.capacity:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Slot is fully booked"
            )

        # Create booking object
        db_booking = Booking(
            user_id=booking_in.user_id,
            slot_id=booking_in.slot_id,
            status="CONFIRMED"
        )
        db.add(db_booking)
        db.commit()
        db.refresh(db_booking)
        return db_booking

    except IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error during booking creation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Booking already exists for this slot and user"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error during booking creation: {str(e)}")
        raise

def get_booking(db: Session, booking_id: str) -> Optional[Booking]:
    """Get a booking by ID"""
    return db.query(Booking).filter(Booking.id == booking_id).first()

def get_user_bookings(db: Session, user_id: str) -> List[Booking]:
    """Get all bookings for a user"""
    return db.query(Booking).filter(Booking.user_id == user_id).all()

def update_booking(
    db: Session, db_obj: Booking, obj_in: Union[BookingUpdate, Dict[str, Any]]
) -> Booking:
    """Update a booking"""
    if isinstance(obj_in, dict):
        update_data = obj_in
    else:
        update_data = obj_in.dict(exclude_unset=True)

    for field in update_data:
        if hasattr(db_obj, field):
            setattr(db_obj, field, update_data[field])

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_booking(db: Session, booking_id: str) -> bool:
    """Delete a booking"""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        return False
    db.delete(booking)
    db.commit()
    return True
