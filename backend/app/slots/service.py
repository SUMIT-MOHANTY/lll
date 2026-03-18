from typing import List
from uuid import UUID, uuid4
from fastapi import HTTPException
import asyncio
from datetime import datetime

from .models import SlotCreate, SlotResponse

class SlotService:
    """Service for managing appointment slots"""

    # This would normally interact with a database
    # For simplicity, we're using an in-memory store in this example
    _slots = {}

    @classmethod
    async def create_slot(cls, slot: SlotCreate) -> SlotResponse:
        """Create a single appointment slot"""
        # Check if slot with same date, time, and office already exists
        for existing_slot in cls._slots.values():
            if (existing_slot.officeId == slot.officeId and
                existing_slot.date == slot.date and
                existing_slot.time == slot.time):
                raise HTTPException(
                    status_code=409,
                    detail=f"Slot already exists for office {slot.officeId} on {slot.date} at {slot.time}"
                )

        # Create new slot with UUID
        slot_id = uuid4()
        slot_response = SlotResponse(
            id=slot_id,
            officeId=slot.officeId,
            date=slot.date,
            time=slot.time,
            capacity=slot.capacity,
            booked=0
        )

        # Store in our "database"
        cls._slots[slot_id] = slot_response

        return slot_response

    @classmethod
    async def bulk_create_slots(cls, slots: List[SlotCreate]) -> List[SlotResponse]:
        """Create multiple appointment slots at once"""
        created_slots = []

        for slot in slots:
            try:
                # Create each slot and add to result list
                created_slot = await cls.create_slot(slot)
                created_slots.append(created_slot)
            except HTTPException as e:
                # Log the error but continue with other slots
                print(f"Error creating slot: {e.detail}")
                continue

        return created_slots
