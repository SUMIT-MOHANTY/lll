from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel, Field, validator

from ..middleware.admin_auth import get_current_admin
from ..models.slot import Slot
from ..models.user import User

router = APIRouter(prefix="/api/admin", tags=["admin"])

# --- Pydantic models for request/response ---

class SlotBase(BaseModel):
    officeId: str
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    capacity: int
    description: Optional[str] = None

    @validator('capacity')
    def capacity_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Capacity must be greater than 0')
        return v

    @validator('date')
    def validate_date_format(cls, v):
        try:
            datetime.strptime(v, '%Y-%m-%d')
            return v
        except ValueError:
            raise ValueError('Date must be in YYYY-MM-DD format')

    @validator('time')
    def validate_time_format(cls, v):
        try:
            datetime.strptime(v, '%H:%M')
            return v
        except ValueError:
            raise ValueError('Time must be in HH:MM format')

class CreateSlotRequest(BaseModel):
    slots: List[SlotBase]

class CreateSlotResponse(BaseModel):
    created: int
    errors: int

class OfficeAnalytics(BaseModel):
    officeId: str
    officeName: str
    bookingCount: int

class DateAnalytics(BaseModel):
    date: str
    bookingCount: int

class BookingAnalytics(BaseModel):
    totalBookings: int
    bookingsByOffice: List[OfficeAnalytics]
    bookingsByDate: List[DateAnalytics]

# --- Slot Management Endpoints ---

@router.post("/slots", response_model=CreateSlotResponse)
async def create_slots(
    slot_request: CreateSlotRequest,
    current_admin: User = Depends(get_current_admin)
):
    """Create new appointment slots"""
    created = 0
    errors = 0

    # In a real implementation, you'd bulk insert into the database
    # For now, we'll simulate the creation process
    for slot in slot_request.slots:
        try:
            # Here you would save to database
            # db.add(Slot(**slot.dict()))
            created += 1
        except Exception:
            errors += 1

    return {"created": created, "errors": errors}

@router.put("/slots/{slot_id}")
async def update_slot(
    slot_id: str,
    slot: SlotBase,
    current_admin: User = Depends(get_current_admin)
):
    """Update an existing appointment slot"""
    # Here you would update the database record
    # Check if slot exists
    # db_slot = db.query(Slot).filter(Slot.id == slot_id).first()
    # if not db_slot:
    #     raise HTTPException(status_code=404, detail="Slot not found")

    # Example response
    return {"id": slot_id, **slot.dict(), "updated": True}

@router.delete("/slots/{slot_id}")
async def delete_slot(
    slot_id: str,
    current_admin: User = Depends(get_current_admin)
):
    """Delete an appointment slot"""
    # Here you would delete from database
    # Check if slot exists and can be deleted (no bookings)
    # db_slot = db.query(Slot).filter(Slot.id == slot_id).first()
    # if not db_slot:
    #     raise HTTPException(status_code=404, detail="Slot not found")

    # Example response
    return {"id": slot_id, "deleted": True}

@router.get("/slots")
async def get_slots(
    current_admin: User = Depends(get_current_admin),
    office_id: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    limit: int = Query(20, ge=1),
    offset: int = Query(0, ge=0)
):
    """Get all slots with filtering options"""
    # Here you would query the database with filters
    # Example response
    return {
        "data": [
            {
                "id": "1",
                "officeId": "office1",
                "officeName": "Main Office",
                "date": "2023-06-15",
                "time": "09:00",
                "capacity": 10,
                "booked": 3,
                "available": 7
            }
        ],
        "pagination": {
            "total": 1,
            "limit": limit,
            "offset": offset
        }
    }

# --- Analytics Endpoints ---

@router.get("/analytics/bookings", response_model=BookingAnalytics)
async def get_booking_analytics(
    current_admin: User = Depends(get_current_admin),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    """Get booking statistics"""
    # In a real implementation, you would query the database for analytics
    # Example response with mock data
    return {
        "totalBookings": 100,
        "bookingsByOffice": [
            {"officeId": "office1", "officeName": "Main Office", "bookingCount": 75},
            {"officeId": "office2", "officeName": "Branch Office", "bookingCount": 25}
        ],
        "bookingsByDate": [
            {"date": "2023-06-15", "bookingCount": 30},
            {"date": "2023-06-16", "bookingCount": 70}
        ]
    }

@router.get("/analytics/offices")
async def get_office_analytics(
    current_admin: User = Depends(get_current_admin)
):
    """Get office-specific analytics"""
    # In a real implementation, you would query the database
    # Example response
    return {
        "offices": [
            {
                "id": "office1",
                "name": "Main Office",
                "totalSlots": 500,
                "bookedSlots": 300,
                "availability": 0.4  # 40% available
            },
            {
                "id": "office2",
                "name": "Branch Office",
                "totalSlots": 300,
                "bookedSlots": 100,
                "availability": 0.67  # 67% available
            }
        ]
    }
