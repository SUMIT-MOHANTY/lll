from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from config.database import get_db
from services.slots_service import SlotService
from models.slot import SlotListResponse, PaginationResponse

router = APIRouter(
    prefix="/api/slots",
    tags=["slots"]
)

@router.get("", response_model=SlotListResponse)
async def get_slots(
    location: Optional[str] = None,
    date: Optional[date] = None,
    available: Optional[int] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    try:
        slots_data, total = SlotService.search_slots(
            db=db,
            location=location,
            date_filter=date,
            available_min=available,
            limit=limit,
            offset=offset
        )

        return {
            "data": slots_data,
            "pagination": {
                "total": total,
                "limit": limit,
                "offset": offset
            }
        }
    except Exception as e:
        # Log the exception here
        raise HTTPException(status_code=500, detail=str(e))
