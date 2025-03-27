from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from .routes import router
from .websockets import router as websocket_router

app = FastAPI(
    title="Language Learning Transcriber",
    description="Upload audio/video files for transcription with language learning tools",
    version="1.0.0",
)

# Get allowed origins from environment or use default values
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
allowed_origins = [
    frontend_url,
    # Add additional origins if needed
]

if os.getenv("ALLOW_ALL_ORIGINS", "False").lower() == "true":
    allowed_origins.append("*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the API routes
app.include_router(router)

# Include the WebSocket routes
app.include_router(websocket_router)

# Add a simple health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}