// Base URL for API requests will come from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

// WebSocket base URLs need direct connection
const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_BASE_URL || "ws://localhost:8000";

// Endpoints
export const ENDPOINTS = {
  UPLOAD: `${API_BASE_URL}/upload`,
  TRANSCRIBE_YOUTUBE: `${API_BASE_URL}/transcribe-youtube/`,
  CHAT: `${API_BASE_URL}/chat`,
  WEBSOCKET: (id: string) => `${WS_BASE_URL}/ws/${id}`,
};
