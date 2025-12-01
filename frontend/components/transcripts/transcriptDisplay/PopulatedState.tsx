"use client";

import { useAtom } from "jotai";
import { selectedTextAtom } from "@/state/store";
import CopyButton from "./CopyButton";
import ActionButton from "./ActionButton";
import { FolderIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import type { Database } from "@/types/database.types";

type Transcript = Database["public"]["Tables"]["transcripts"]["Row"];

interface PopulatedStateProps {
  transcript: Transcript;
}

export default function PopulatedState({ transcript }: PopulatedStateProps) {
  const [, setSelectedText] = useAtom(selectedTextAtom);
  const router = useRouter();

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection) {
      setSelectedText(selection.toString());
    }
  };

  const handleGoToMyContent = () => {
    router.push("/my-content");
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-start items-center gap-2">
        <CopyButton textToCopy={transcript.transcript} />
        {/* <ActionButton
          onClick={handleGoToMyContent}
          icon={<FolderIcon className="h-6 w-6" />}
          label="My Content"
        /> */}
      </div>

      <article
        onMouseUp={handleTextSelection}
        onTouchEnd={handleTextSelection}
        style={{ padding: "20px", lineHeight: "1.6", userSelect: "text" }}
        className="mx-auto space-y-4 prose lg:prose-xl selection:bg-yellow-500/25 selection:text-yellow-900 dark:selection:bg-pink-500 dark:selection:text-sky-950"
      >
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
