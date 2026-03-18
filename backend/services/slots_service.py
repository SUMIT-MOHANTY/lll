from datetime import date
from typing import List, Optional, Tuple
from sqlalchemy import func
from sqlalchemy.orm import Session

from models.slot import SlotModel
from models.office import OfficeModel

class SlotService:
    @staticmethod
    def search_slots(
        db: Session,
        location: Optional[str] = None,
        date_filter: Optional[date] = None,
        available_min: Optional[int] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Tuple[List[dict], int]:
        """
        Search and filter available slots based on criteria
        Returns tuple of (slots_list, total_count)
        """
        # Base query with join to get office information
        query = db.query(
            SlotModel,
            OfficeModel.name.label("office_name"),
            func.count(SlotModel.bookings).label("booking_count")
        ).join(OfficeModel)

        # Apply filters
        if location:
            query = query.filter(func.lower(OfficeModel.name).contains(location.lower()))

        if date_filter:
            query = query.filter(SlotModel.date == date_filter)

        # Count total results before pagination
        total = query.count()

        # Apply pagination
        results = query.offset(offset).limit(limit).all()

        # Transform to response format
        slots_data = []
        for slot, office_name, booking_count in results:
            # Filter by available slots if specified
            available = slot.capacity - booking_count
            if available_min is not None and available < available_min:
                continue

            slots_data.append({
                "id": slot.id,
                "officeId": slot.office_id,
                "officeName": office_name,
                "date": slot.date.isoformat(),
                "time": slot.time.isoformat(timespec="minutes"),
                "capacity": slot.capacity,
                "booked": booking_count,
                "available": available
            })

        return slots_data, total
