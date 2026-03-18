from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from app.db.database import get_db
from app.models.slot import Slot
from app.models.office import Office
from app.schemas.slots import SlotResponse, SlotListResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/slots", response_model=SlotListResponse)
def search_slots(
    location: Optional[str] = None,
    date: Optional[date] = None,
    available: Optional[int] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """
    Search available appointment slots with filtering options.
    """
    query = db.query(Slot).join(Office, Slot.office_id == Office.id)

    # Apply filters
    if location:
        query = query.filter(Office.id == location)

    if date:
        query = query.filter(Slot.date == date)

    if available is not None:
        query = query.filter(Slot.capacity - Slot.booked >= available)

    # Get total count before applying pagination
    total = query.count()

    # Apply pagination
    slots = query.offset(offset).limit(limit).all()

    # Convert to response format
    slot_responses = []
    for slot in slots:
        office = db.query(Office).filter(Office.id == slot.office_id).first()
        office_name = office.name if office else "Unknown Office"

        slot_responses.append(
            SlotResponse(
                id=str(slot.id),
                officeId=str(slot.office_id),
                officeName=office_name,
                date=slot.date.isoformat(),
                time=slot.time.isoformat(timespec='minutes'),
                capacity=slot.capacity,
                booked=slot.booked
            )
        )

    return SlotListResponse(
        data=slot_responses,
        total=total,
        limit=limit,
        offset=offset
    )

@router.get("/slots/{slot_id}", response_model=SlotResponse)
def get_slot(
    slot_id: str,
    db: Session = Depends(get_db)
):
    """
    Get details of a specific appointment slot
    """
    slot = db.query(Slot).filter(Slot.id == slot_id).first()

    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    office = db.query(Office).filter(Office.id == slot.office_id).first()
    office_name = office.name if office else "Unknown Office"

    return SlotResponse(
        id=str(slot.id),
        officeId=str(slot.office_id),
        officeName=office_name,
        date=slot.date.isoformat(),
        time=slot.time.isoformat(timespec='minutes'),
        capacity=slot.capacity,
        booked=slot.booked
    )
