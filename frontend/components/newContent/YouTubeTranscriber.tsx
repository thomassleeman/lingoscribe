"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { ENDPOINTS } from "@/lib/apiConfig";

interface YouTubeTranscriberProps {
  onTranscribe: (
    data: string,
    segments: any[],
    audioUrl: string,
    sourceUrl: string
  ) => void;
  onClose: () => void;
}

export default function YouTubeTranscriber({
  onTranscribe,
  onClose,
}: YouTubeTranscriberProps) {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progressMessages, setProgressMessages] = useState<string[]>([]);

  const prepWebSocket = (id: string) => {
    const ws = new WebSocket(ENDPOINTS.WEBSOCKET(id));
    ws.onmessage = (event) => {
      setProgressMessages((prevMessages) => [...prevMessages, event.data]);
    };
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };
    return () => {
      ws.close();
    };
  };

  const handleYouTubeSubmit = async () => {
    if (!videoUrl) return;
    setLoading(true);
    setError("");
    setProgressMessages([]);

    const newClientId = uuidv4();
    prepWebSocket(newClientId);

    try {
      const response = await fetch(ENDPOINTS.TRANSCRIBE_YOUTUBE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: videoUrl, client_id: newClientId }),
      });
      const data = await response.json();
      if (response.ok) {
        // Call the parent component's onTranscribe handler to handle database saving and navigation
        onTranscribe(
          data.transcript,
          data.segments,
          data.audioUrl,
          data.sourceUrl
        );

        // No need to save to database here as the parent component will do that
      } else {
        console.error("Error response:", data);
        setError(
          "Error fetching transcript: " + (data.detail || "Unknown error")
        );
      }
    } catch (err) {
      setError("Error fetching transcript: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-800">
        Transcribe YouTube Video
      </h2>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-4 lg:gap-x-8">
        <input
          type="text"
          placeholder="Enter YouTube video URL"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          className="flex-1 text-gray-800 dark:text-gray-100 border border-gray-300 bg-white dark:bg-gray-700 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <button
          onClick={handleYouTubeSubmit}
          disabled={loading || !videoUrl}
          className="bg-emerald-600 text-white rounded-lg py-2 px-6 hover:bg-emerald-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? progressMessages[progressMessages.length - 1]
            : "Transcribe"}
        </button>
      </div>
      {loading && (
        <div className="text-slate-600 animate-pulse">
          Processing your video. Please wait...
        </div>
      )}
      {error && <div className="text-red-600">{error}</div>}
    </div>
  );
}
