from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .slots.router import router as slots_router

app = FastAPI(
    title="Passport Office Booking API",
    description="API for booking passport office appointments",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(slots_router)

@app.get("/")
async def root():
    return {"message": "Welcome to the Passport Office Booking API"}
