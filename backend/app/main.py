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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local development
        "https://lingoscribe.vercel.app",  # If you deploy frontend to Vercel
        "https://lingoscribe-frontend.fly.dev",  # If you later deploy frontend to fly.io
        "*",  # Temporarily allow all origins for debugging
    ],
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

