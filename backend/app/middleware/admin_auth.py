from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from typing import Optional

from ..config.jwt import JWT_SECRET_KEY, ALGORITHM
from ..models.user import User

security = HTTPBearer()

async def get_current_admin(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Optional[User]:
    """
    Middleware to validate that the requester is an admin user.

    Args:
        request: FastAPI request object
        credentials: HTTP Authorization credentials

    Returns:
        User object if the user is authenticated and has admin role

    Raises:
        HTTPException: If token is invalid or user is not an admin
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        user_role: str = payload.get("role")

        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication token")

        if user_role != "admin":
            raise HTTPException(
                status_code=403,
                detail="Not authorized - Admin privileges required"
            )

        # Here you would typically query the database to get the full user object
        # For this implementation, we'll return a basic user object with admin role
        return User(id=user_id, email=payload.get("email", ""), role=user_role)

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
