"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { ENDPOINTS } from "@/lib/apiConfig";

interface FileUploadProps {
  onUpload: (data: string, segments: any[], audioUrl: string) => void;
  onClose: () => void;
}

export default function FileUpload({ onUpload, onClose }: FileUploadProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
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

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError("");
    setProgressMessages([]);

    const newClientId = uuidv4();
    prepWebSocket(newClientId);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("client_id", newClientId);

    try {
      const response = await fetch(ENDPOINTS.UPLOAD, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        // Call the parent component's onUpload handler to handle database saving and navigation
        onUpload(data.transcript, data.segments, data.audioUrl);

        // No need to save to database here as the parent component will do that
      } else {
        setError("Failed to upload or transcribe the file: " + data.detail);
        console.error("Error response:", data);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("An error occurred during the upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-800">
        Upload Audio or Video
      </h2>
      <div className="flex flex-wrap items-center gap-x-4 lg:gap-x-8 gap-y-4">
        <label className="flex-1">
          <input
            type="file"
            accept="audio/*,video/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
          />
          <div className="cursor-pointer bg-slate-100 dark:bg-gray-500 text-slate-800 dark:text-slate-100 rounded-lg py-2 px-4 hover:bg-slate-200 transition duration-300 text-center">
            {file ? file.name : "Choose audio file"}
          </div>
        </label>
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="bg-sky-600 text-white rounded-lg py-2 px-6 hover:bg-sky-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? progressMessages[progressMessages.length - 1]
            : "Transcribe"}
        </button>
      </div>
      {loading && (
        <div className="text-slate-600 animate-pulse">
          Processing your file. Please wait...
        </div>
      )}
      {error && <div className="text-red-600">{error}</div>}
    </div>
  );
}
