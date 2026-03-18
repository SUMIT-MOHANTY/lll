from typing import List, Optional
from pydantic import BaseModel, UUID4
from datetime import date, time

class SlotBase(BaseModel):
    officeId: UUID4
    officeName: str
    date: date
    time: time
    capacity: int
    booked: int

class SlotCreate(BaseModel):
    officeId: UUID4
    date: date
    time: time
    capacity: int

class SlotInDB(SlotBase):
    id: UUID4

    class Config:
        orm_mode = True

class SlotResponse(SlotBase):
    id: UUID4
    # Converting date and time to strings for easier JSON serialization
    date: str
    time: str

class SlotSearchParams(BaseModel):
    location: Optional[str] = None
    date: Optional[date] = None
    available: Optional[int] = None
    limit: int = 20
    offset: int = 0

class SlotListResponse(BaseModel):
    data: List[SlotResponse]
    total: int
    limit: int
    offset: int
