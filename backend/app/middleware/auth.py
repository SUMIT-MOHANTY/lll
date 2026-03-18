from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from typing import Dict, Any

# This is a simplified auth middleware
# In a real application, use proper token validation and user retrieval

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Get the current authenticated user from the JWT token

    Args:
        credentials: The HTTP authorization credentials

    Returns:
        Dict containing user information

    Raises:
        HTTPException: If authentication fails
    """
    try:
        token = credentials.credentials
        # In a real app, verify the token with a secret key
        # This is just a simplified example
        # payload = jwt.decode(token, "your-secret-key", algorithms=["HS256"])

        # For demo purposes, return a mock user
        return {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "email": "user@example.com",
            "role": "user"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
