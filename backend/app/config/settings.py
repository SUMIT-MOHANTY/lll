from pydantic import BaseSettings

class Settings(BaseSettings):
    """Application settings"""
    # JWT settings
    JWT_SECRET: str = "your-secret-key"  # In production, use a secure secret
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_TIME: int = 3600  # 1 hour

    # Database settings would go here

    class Config:
        env_file = ".env"

settings = Settings()
