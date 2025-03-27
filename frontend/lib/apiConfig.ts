// API configurations for different environments

// Base URL for API requests
// We'll use relative URLs and let Next.js handle the routing via rewrites
const API_BASE_URL = "/api";

// WebSocket base URLs need direct connection
// For WebSockets, we need to use the actual backend URL
export const WS_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "wss://lingoscribe.fly.dev"
    : "ws://127.0.0.1:8000";

// Endpoints
export const ENDPOINTS = {
  UPLOAD: `${API_BASE_URL}/upload`,
  TRANSCRIBE_YOUTUBE: `${API_BASE_URL}/transcribe-youtube`,
  CHAT: `${API_BASE_URL}/chat`,
  WEBSOCKET: (id: string) => `${WS_BASE_URL}/ws/${id}`,
};
