from datetime import date, time
from typing import Optional, List
from uuid import UUID, uuid4
from sqlalchemy import Column, String, Integer, Date, Time, ForeignKey, func
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field

from config.database import Base

class SlotModel(Base):
    __tablename__ = "slots"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    office_id = Column(String, ForeignKey("offices.id"))
    date = Column(Date, nullable=False)
    time = Column(Time, nullable=False)
    capacity = Column(Integer, nullable=False)

    # Relationships
    office = relationship("OfficeModel", back_populates="slots")
    bookings = relationship("BookingModel", back_populates="slot")

    @property
    def booked(self) -> int:
        return len(self.bookings) if self.bookings else 0

    @property
    def available(self) -> int:
        return self.capacity - self.booked

class Slot(BaseModel):
    id: str
    officeId: str
    officeName: str
    date: str
    time: str
    capacity: int
    booked: int
    available: int

class SlotFilterParams(BaseModel):
    location: Optional[str] = None
    date: Optional[date] = None
    available: Optional[int] = None
    limit: int = Field(20, ge=1, le=100)
    offset: int = Field(0, ge=0)

class PaginationResponse(BaseModel):
    total: int
    limit: int
    offset: int

class SlotListResponse(BaseModel):
    data: List[Slot]
    pagination: PaginationResponse
