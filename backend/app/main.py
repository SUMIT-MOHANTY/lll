from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import bookings

app = FastAPI(title="Passport Office Booking API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(bookings.router)

@app.get("/")
async def root():
    return {"message": "Passport Office Booking API"}
