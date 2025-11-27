"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteTranscript, updateTranscript } from "@/lib/transcriptUtils";
import { Database } from "@/types/database.types";
import {
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import YouTubeThumbnail from "@/components/transcripts/YouTubeThumbnail";

type Transcript = Database["public"]["Tables"]["transcripts"]["Row"];

interface ClientTranscriptListProps {
  transcripts: (Transcript & { formattedDate: string })[];
}

export default function TranscriptList({
  transcripts,
}: ClientTranscriptListProps) {
  const router = useRouter();
  const [displayedTranscripts, setDisplayedTranscripts] = useState(transcripts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleTranscriptClick = (transcript: Transcript) => {
    if (editingId) return; // Don't navigate if we're editing
    router.push(`/my-content/transcript/${transcript.id}`);
  };

  const startEditing = (e: React.MouseEvent, transcript: Transcript) => {
    e.stopPropagation();
    setEditingId(transcript.id);
    setEditTitle(transcript.title);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const saveTitle = async (e: React.MouseEvent, transcriptId: string) => {
    e.stopPropagation();
    if (!editTitle.trim()) return;

    try {
      await updateTranscript(transcriptId, { title: editTitle.trim() });
      setDisplayedTranscripts(
        displayedTranscripts.map((t) =>
          t.id === transcriptId ? { ...t, title: editTitle.trim() } : t
        )
      );
      setEditingId(null);
    } catch (err) {
      console.error("Error updating transcript title:", err);
      alert("Failed to update transcript title");
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
      {displayedTranscripts.map((transcript) => (
        <div
          key={transcript.id}
          className="border flex flex-col justify-between rounded-lg shadow-sm hover:shadow-md transition cursor-pointer bg-white dark:bg-gray-800 dark:border-gray-700 overflow-hidden"
          onClick={() => handleTranscriptClick(transcript)}
        >
          {transcript.source_type === "youtube" && transcript.audio_url && (
            <YouTubeThumbnail
              videoId={transcript.audio_url}
              title={transcript.title}
            />
          )}
          <div className="p-4">
            {editingId === transcript.id ? (
              <div
                className="mb-2 flex items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-1 border rounded dark:bg-gray-700 dark:text-white"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveTitle(e as any, transcript.id);
                    if (e.key === "Escape") cancelEditing(e as any);
                  }}
                />
                <button
                  onClick={(e) => saveTitle(e, transcript.id)}
                  className="ml-2 text-green-500 hover:text-green-600"
                >
                  <CheckIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={cancelEditing}
                  className="ml-1 text-gray-500 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <h2 className="font-bold text-lg mb-2 line-clamp-1 dark:text-gray-100">
                {transcript.title}
              </h2>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Created: {transcript.formattedDate}
            </p>
            <p className="text-sm text-gray-800 dark:text-gray-300 line-clamp-2">
              {transcript.transcript}
            </p>
          </div>
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 flex justify-between items-center rounded-b-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Source: {transcript.source_type || "Unknown"}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={(e) => startEditing(e, transcript)}
                className="text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  // Replace with modal later like we did with the chat clear
                  if (
                    confirm("Are you sure you want to delete this transcript?")
                  ) {
                    try {
                      await deleteTranscript(transcript.id);
                      setDisplayedTranscripts(
                        displayedTranscripts.filter(
                          (t) => t.id !== transcript.id
                        )
                      );
                    } catch (err) {
                      console.error("Error deleting transcript:", err);
                      alert("Failed to delete transcript");
                    }
                  }
                }}
                className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
