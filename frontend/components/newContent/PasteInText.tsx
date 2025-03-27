"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveTranscript } from "@/lib/transcriptUtils";

interface PasteInTextProps {
  onClose: () => void;
}

export default function PasteInText({ onClose }: PasteInTextProps) {
  const router = useRouter();
  const [userInput, setUserInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleInputChange = (value: string) => {
    setUserInput(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    setLoading(true);

    try {
      const title = userInput.split(" ").slice(0, 5).join(" ") + "...";

      const savedTranscript = await saveTranscript({
        transcript: userInput,
        title,
        audio_url: null,
        source_type: "text",
      });

      setUserInput("");
      onClose();

      if (savedTranscript && savedTranscript.id) {
        router.push(`/my-content/transcript/${savedTranscript.id}`);
      }
    } catch (error) {
      console.error("Error saving transcript:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 w-full">
      <h2 className="text-2xl font-semibold text-gray-800">Paste in Text</h2>
      <div className="flex flex-wrap items-center gap-x-4 lg:gap-x-8 gap-y-4 w-full">
        <form onSubmit={handleSubmit} className="w-full">
          <textarea
            className="my-2 h-48 w-full bg-white dark:bg-gray-700 rounded-md border-0 p-2 shadow-sm ring-2 text-gray-800 dark:text-gray-100 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-emerald-700"
            value={userInput}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Paste your text here..."
            disabled={loading}
          ></textarea>
          <button
            type="submit"
            disabled={loading}
            className="bg-amber-600 text-white rounded-lg py-2 px-6 hover:bg-amber-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Uploading..." : "Upload"}
          </button>
        </form>
      </div>
    </div>
  );
}
