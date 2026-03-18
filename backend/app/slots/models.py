from datetime import date, time
from typing import List, Optional
from uuid import UUID, uuid4
from pydantic import BaseModel, Field, validator
import re

class SlotBase(BaseModel):
    """Base slot model with common fields"""
    officeId: UUID
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    capacity: int

    @validator('date')
    def validate_date_format(cls, v):
        if not re.match(r'^\d{4}-\d{2}-\d{2}$', v):
            raise ValueError('Date must be in YYYY-MM-DD format')
        return v

    @validator('time')
    def validate_time_format(cls, v):
        if not re.match(r'^\d{2}:\d{2}$', v):
            raise ValueError('Time must be in HH:MM format')
        return v

    @validator('capacity')
    def validate_capacity(cls, v):
        if v <= 0:
            raise ValueError('Capacity must be a positive integer')
        return v

class SlotCreate(SlotBase):
    """Model for creating a slot"""
    pass

class SlotResponse(SlotBase):
    """Model for slot response"""
    id: UUID = Field(default_factory=uuid4)
    booked: int = 0

    class Config:
        orm_mode = True

class BulkSlotCreate(BaseModel):
    """Model for bulk slot creation request"""
    slots: List[SlotCreate]

class BulkSlotResponse(BaseModel):
    """Model for bulk slot creation response"""
    created: int
    slots: List[SlotResponse]
