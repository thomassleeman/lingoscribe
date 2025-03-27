"use client";

import { useState } from "react";
import { DocumentTextIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import NewContentModal from "@/components/newContent/NewContentModal";

// No mock data needed

interface EmptyStateProps {
  // No props needed
}

export default function EmptyState() {
  const [showNewContentModal, setShowNewContentModal] = useState(false);

  return (
    <div className="px-4 h-full mt-8">
      <div className="mx-auto sm:max-w-md lg:max-w-lg 2xl:max-w-xl">
        <div className="text-center mb-8">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h2 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
            No Document Selected
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Select a document or create a new one
          </p>
        </div>

        {/* Create new document button */}
        <div className="mb-8">
          <button
            onClick={() => setShowNewContentModal(true)}
            type="button"
            className="w-full flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <PlusCircleIcon className="h-5 w-5" />
            Create New Transcript
          </button>
        </div>

        {/* Visit my content section */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Want to see your existing transcripts?
          </p>
          <a
            href="/my-content"
            className="inline-block px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-400 dark:hover:bg-gray-800"
          >
            Go to My Content
          </a>
        </div>
      </div>

      {/* New Content Modal */}
      {showNewContentModal && (
        <NewContentModal onClose={() => setShowNewContentModal(false)} />
      )}
    </div>
  );
}
