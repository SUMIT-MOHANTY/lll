from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from datetime import datetime
from typing import Optional

from ..config.settings import settings

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Extract and validate the JWT token from request headers"""
    try:
        token = credentials.credentials
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )

        # Check if token is expired
        if datetime.fromtimestamp(payload.get("exp", 0)) < datetime.now():
            raise HTTPException(status_code=401, detail="Token has expired")

        # Return user information from token
        return payload.get("sub")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    except Exception:
        raise HTTPException(status_code=401, detail="Authentication error")

async def admin_required(request: Request, user: dict = Depends(get_current_user)):
    """Middleware to verify that a user has admin role"""
    if not user or user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    return user
