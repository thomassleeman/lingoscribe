"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
//jotai
import { useAtom } from "jotai";
import { selectedTextAtom, currentPlaybackTimeAtom } from "@/state/store";
import { FolderIcon } from "@heroicons/react/24/outline";
import CopyButton from "./CopyButton";
import ClientActionButton from "./ClientActionButton";
import type { Database } from "@/types/database.types";

type Transcript = Database["public"]["Tables"]["transcripts"]["Row"];

interface PopulatedStateClientProps {
  transcript: Transcript;
}

export default function PopulatedStateClient({
  transcript,
}: PopulatedStateClientProps) {
  const router = useRouter();
  const [selectedText, setSelectedText] = useAtom(selectedTextAtom);
  const [currentPlaybackTime] = useAtom(currentPlaybackTimeAtom);
  const articleRef = useRef<HTMLElement>(null);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection) {
      setSelectedText(selection.toString());
    }
  };

  const handleMyContent = () => {
    router.push("/my-content");
  };

  // Define buttons based on whether this is a new or existing document
  const actionButtons = [
    {
      id: "copy",
      component: <CopyButton textToCopy={transcript.transcript} />,
    },
    {
      id: "myContent",
      component: (
        <ClientActionButton
          onClick={handleMyContent}
          icon={<FolderIcon className="h-6 w-6" />}
          label="My Content"
        />
      ),
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-start items-center gap-2">
        {actionButtons.map((button) => (
          <div key={button.id}>{button.component}</div>
        ))}
      </div>

      <article
        ref={articleRef}
        onMouseUp={handleTextSelection} // Trigger when mouse is released
        onTouchEnd={handleTextSelection} // Trigger on mobile
        style={{ padding: "20px", lineHeight: "1.6", userSelect: "text" }} // Enable text selection
        className="mx-auto space-y-4 prose lg:prose-xl selection:bg-yellow-500/25 selection:text-yellow-900 dark:selection:bg-pink-500 dark:selection:text-sky-950"
      >
        {/* Simple display of transcript by splitting on periods */}
        {transcript.transcript.split(". ").map((sentence, index) => (
          <p
            key={index}
            className="text-gray-700 leading-relaxed dark:text-gray-50"
          >
            {sentence.trim() + (sentence.trim().length > 0 ? "." : "")}
          </p>
        ))}
      </article>
    </div>
  );
}
