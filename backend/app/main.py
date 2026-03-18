from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, slots, bookings, admin
from .config.database import create_tables

app = FastAPI(
    title="Passport Office Booking API",
    description="API for booking passport office appointments",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables if they don't exist
@app.on_event("startup")
async def startup():
    create_tables()

# Include routers
app.include_router(auth.router)
app.include_router(slots.router)
app.include_router(bookings.router)
app.include_router(admin.router)  # Add the admin router

@app.get("/")
async def root():
    return {"message": "Welcome to the Passport Office Booking API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
