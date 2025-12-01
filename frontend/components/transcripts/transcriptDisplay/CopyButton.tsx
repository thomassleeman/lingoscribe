"use client";
import { useState } from "react";
import { ClipboardDocumentIcon, CheckIcon } from "@heroicons/react/24/outline";

interface CopyButtonProps {
  textToCopy: string;
}

export default function CopyButton({ textToCopy }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <button
      onClick={copyToClipboard}
      className="flex items-center py-2 px-4 rounded-3xl hover:bg-gray-100/25 space-x-2 text-gray-600 dark:text-gray-200 hover:text-gray-600 transition duration-300"
    >
      {copied ? (
        <CheckIcon className="h-5 w-5" />
      ) : (
        <ClipboardDocumentIcon className="h-5 w-5" />
      )}
      <span className="text-sm">{copied ? "Copied!" : "Copy"}</span>
    </button>
  );
}
