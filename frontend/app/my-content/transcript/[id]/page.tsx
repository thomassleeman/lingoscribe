"use client";

import { useState, useEffect } from "react";
import Dashboard from "@/components/transcripts/Dashboard";
import { useParams } from "next/navigation";
import { getTranscriptById } from "@/lib/transcriptUtils";
import type { Database } from "@/types/database.types";

type Transcript = Database["public"]["Tables"]["transcripts"]["Row"];

export default function Document() {
  const params = useParams();
  const id = params.id as string;
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTranscript() {
      try {
        const data = await getTranscriptById(id);
        setTranscript(data);
      } catch (err) {
        console.error("Error loading transcript:", err);
        setError("Failed to load transcript");
      } finally {
        setLoading(false);
      }
    }

    loadTranscript();
  }, [id]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative">
          {error}
        </div>
      </div>
    );
  }

  return <Dashboard transcript={transcript} />;
}
