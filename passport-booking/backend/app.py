from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .config.logger import app_logger as logger
from .routes import booking_routes
import uvicorn
import os

# Initialize FastAPI app
app = FastAPI(title="Passport Booking System")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(booking_routes.router)

@app.get("/")
async def root():
    return {"message": "Passport Booking System API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Error handling for the entire application
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    logger.error(f"HTTP error: {exc.detail}")
    return {"detail": exc.detail, "status_code": exc.status_code}

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled error: {str(exc)}")
    return {"detail": "Internal server error", "status_code": 500}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    logger.info(f"Starting server on port {port}")
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
