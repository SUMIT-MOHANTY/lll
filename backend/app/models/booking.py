from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4
from pydantic import BaseModel, Field

class BookingBase(BaseModel):
    """Base model for booking data."""
    slot_id: UUID
    user_id: Optional[UUID] = None

class BookingCreate(BookingBase):
    """Model for creating a new booking."""
    pass

class BookingResponse(BookingBase):
    """Response model for booking data."""
    id: UUID = Field(default_factory=uuid4)
    status: str
    created_at: datetime = Field(default_factory=datetime.now)

    class Config:
        orm_mode = True

class BookingError(BaseModel):
    """Model for booking error responses."""
    error: str
