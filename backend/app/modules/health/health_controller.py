from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from typing import Dict, Any

from app.modules.health.health_service import HealthService
from app.core.middleware.auth_middleware import get_admin_user

router = APIRouter(tags=["Health"])

@router.get("/health")
async def get_health_status() -> Dict[str, Any]:
    """
    Basic health check endpoint that returns the system status.
    Available to all users.
    """
    health_service = HealthService()
    return await health_service.get_basic_health()

@router.get("/health/detailed")
async def get_detailed_health_status(
    _=Depends(get_admin_user)
) -> Dict[str, Any]:
    """
    Detailed health check endpoint that returns comprehensive system metrics.
    Available only to admin users.
    """
    health_service = HealthService()
    return await health_service.get_detailed_health()
