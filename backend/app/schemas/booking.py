from typing import Optional
from datetime import datetime
from pydantic import BaseModel, UUID4
from uuid import UUID

# Base schema for booking data
class BookingBase(BaseModel):
    slot_id: UUID

# Schema for creating a booking
class BookingCreate(BookingBase):
    user_id: Optional[UUID] = None

# Schema for updating a booking
class BookingUpdate(BaseModel):
    status: Optional[str] = None

# Schema for booking response
class BookingResponse(BaseModel):
    id: UUID4
    slotId: UUID4
    userId: UUID4
    createdAt: datetime
    status: str

    class Config:
        orm_mode = True

# Schema for booking in database
class Booking(BookingBase):
    id: UUID4
    user_id: UUID4
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
