from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import asyncio

from ..auth.middleware import admin_required
from .models import SlotCreate, SlotResponse, BulkSlotCreate, BulkSlotResponse
from .service import SlotService

router = APIRouter(
    prefix="/api/slots",
    tags=["slots"]
)

@router.post("/bulk",
             response_model=BulkSlotResponse,
             status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(admin_required)])
async def bulk_create_slots(request: BulkSlotCreate):
    """
    Create multiple appointment slots at once.
    Requires admin privileges.
    """
    try:
        created_slots = await SlotService.bulk_create_slots(request.slots)
        return BulkSlotResponse(
            created=len(created_slots),
            slots=created_slots
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create slots: {str(e)}"
        )

@router.get("/", response_model=List[SlotResponse])
async def get_slots():
    """Get all available appointment slots"""
    # This would normally include filtering, pagination, etc.
    return list(SlotService._slots.values())
