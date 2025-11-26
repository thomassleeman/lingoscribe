"use client";
import { useState } from "react";
import NewContentModal from "./NewContentModal";
import { PlusIcon } from "@heroicons/react/24/outline";

export default function NewContentButton() {
  const [showNewContentModal, setShowNewContentModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowNewContentModal(true)}
        className="flex items-center px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors"
      >
        <PlusIcon className="h-5 w-5 mr-2" />
        New Content
      </button>

      {showNewContentModal && (
        <NewContentModal onClose={() => setShowNewContentModal(false)} />
      )}
    </>
  );
}
