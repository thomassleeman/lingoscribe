import { FolderIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getTranscripts, deleteTranscript } from "@/lib/transcriptUtils";
import NewContentModal from "@/components/newContent/NewContentModal";
import { Database } from "@/types/database.types";
import TranscriptList from "./TranscriptList";
import NewContentButton from "@/components/newContent/NewContentButton";

type Transcript = Database["public"]["Tables"]["transcripts"]["Row"];

export default async function MyContentPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch transcripts server-side
  let transcripts: Transcript[] = [];
  let error = null;

  try {
    transcripts = await getTranscripts();
  } catch (err) {
    console.error("Error fetching transcripts:", err);
    error = "Failed to load your transcripts";
  }

  // const formatDate = (dateString: string) => {
  //   const date = new Date(dateString);
  //   return date.toLocaleDateString("en-US", {
  //     year: "numeric",
  //     month: "short",
  //     day: "numeric",
  //   });
  // };

  const formattedTranscripts = transcripts.map((transcript) => ({
    ...transcript,
    formattedDate: new Date(transcript.created_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <div className="container mx-auto p-6 dark:bg-gray-950">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center dark:text-white">
          <FolderIcon className="h-6 w-6 mr-2" />
          My Content
        </h1>

        <NewContentButton />
      </div>

      {error ? (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative">
          {error}
        </div>
      ) : transcripts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg px-8">
          <FolderIcon className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-500" />
          <h2 className="mt-4 text-xl font-medium text-gray-900 dark:text-gray-100">
            No transcripts yet
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            You haven&apos;t saved any transcripts yet. When you do,
            they&apos;ll appear here.
          </p>
        </div>
      ) : (
        <TranscriptList transcripts={formattedTranscripts} />
      )}
    </div>
  );
}
