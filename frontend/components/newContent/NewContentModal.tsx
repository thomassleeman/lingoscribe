"use client";

import { useRouter } from "next/navigation";
import { saveTranscript } from "@/lib/transcriptUtils";
import FileUpload from "./FileUpload";
import YouTubeTranscriber from "./YouTubeTranscriber";
import PasteInText from "./PasteInText";

import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface NewContentModalProps {
  onClose: () => void;
}

export default function NewContentModal({ onClose }: NewContentModalProps) {
  const router = useRouter();

  const handleUpload = async (
    data: string,
    segments: any[],
    audioUrl: string
  ) => {
    try {
      // Generate a title from the first few words of the transcript
      const title = data.split(" ").slice(0, 5).join(" ") + "...";

      // Save to database - UNCHANGED for file uploads
      const savedTranscript = await saveTranscript({
        transcript: data,
        title,
        audio_url: audioUrl,
        source_type: "file",
      });

      // Navigate to the new document page
      if (savedTranscript?.id) {
        router.push(`/my-content/transcript/${savedTranscript.id}`);
      }

      // Close the modal
      onClose();
    } catch (error) {
      console.error("Error saving transcript:", error);
      // TODO: Add error handling UI
    }
  };

  const handleTranscribe = async (
    data: string,
    segments: any[],
    videoId: string, // NEW: Receive videoId instead of audioUrl
    sourceUrl: string
  ) => {
    try {
      // Generate a title from the first few words of the transcript
      const title = data.split(" ").slice(0, 5).join(" ") + "...";

      // NEW: For YouTube videos, we store the video ID in audio_url field
      // This allows us to reconstruct the YouTube embed URL later
      const savedTranscript = await saveTranscript({
        transcript: data,
        title,
        audio_url: videoId, // Store video ID instead of audio URL
        source_type: "youtube",
      });

      // Navigate to the new document page
      if (savedTranscript?.id) {
        router.push(`/my-content/transcript/${savedTranscript.id}`);
      }

      // Close the modal
      onClose();
    } catch (error) {
      console.error("Error saving transcript:", error);
      // TODO: Add error handling UI
    }
  };

  return (
    <Dialog open={true} onClose={onClose} className="relative z-10">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 px-4 pb-4 pt-5 text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-lg sm:p-6 data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
          >
            <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-white text-gray-400 dark:bg-gray-800 dark:text-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <span className="sr-only">Close</span>
                <XMarkIcon aria-hidden="true" className="size-6 " />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* YouTube Transcriber - Now first since it's the primary use case */}
              <YouTubeTranscriber
                onTranscribe={handleTranscribe}
                onClose={onClose}
              />

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <FileUpload onUpload={handleUpload} onClose={onClose} />
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <PasteInText onClose={onClose} />
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}

// "use client";

// import { useRouter } from "next/navigation";
// import { saveTranscript } from "@/lib/transcriptUtils";
// import FileUpload from "./FileUpload";
// import YouTubeTranscriber from "./YouTubeTranscriber";
// import PasteInText from "./PasteInText";

// import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
// import { XMarkIcon } from "@heroicons/react/24/outline";

// interface NewContentModalProps {
//   onClose: () => void;
// }

// export default function NewContentModal({ onClose }: NewContentModalProps) {
//   const router = useRouter();

//   const handleUpload = async (
//     data: string,
//     segments: any[],
//     audioUrl: string
//   ) => {
//     try {
//       // Generate a title from the first few words of the transcript
//       const title = data.split(" ").slice(0, 5).join(" ") + "...";

//       // Save to database
//       const savedTranscript = await saveTranscript({
//         transcript: data,
//         title,
//         audio_url: audioUrl,
//         source_type: "file",
//       });

//       // Navigate to the new document page
//       if (savedTranscript?.id) {
//         router.push(`/my-content/transcript/${savedTranscript.id}`);
//       }

//       // Close the modal
//       onClose();
//     } catch (error) {
//       console.error("Error saving transcript:", error);
//       // We could add error handling UI here
//     }
//   };

//   const handleTranscribe = async (
//     data: string,
//     segments: any[],
//     audioUrl: string,
//     sourceUrl: string
//   ) => {
//     try {
//       // Generate a title from the first few words of the transcript
//       const title = data.split(" ").slice(0, 5).join(" ") + "...";

//       // Save to database
//       const savedTranscript = await saveTranscript({
//         transcript: data,
//         title,
//         audio_url: audioUrl,
//         source_type: "youtube",
//       });

//       // Navigate to the new document page
//       if (savedTranscript?.id) {
//         router.push(`/my-content/transcript/${savedTranscript.id}`);
//       }

//       // Close the modal
//       onClose();
//     } catch (error) {
//       console.error("Error saving transcript:", error);
//       // We could add error handling UI here
//     }
//   };

//   return (
//     <Dialog open={true} onClose={onClose} className="relative z-10">
//       <DialogBackdrop
//         transition
//         className="fixed inset-0 bg-gray-500/75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
//       />

//       <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
//         <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
//           <DialogPanel
//             transition
//             className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 px-4 pb-4 pt-5 text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-lg sm:p-6 data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
//           >
//             <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
//               <button
//                 type="button"
//                 onClick={onClose}
//                 className="rounded-md bg-white text-gray-400 dark:bg-gray-800 dark:text-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
//               >
//                 <span className="sr-only">Close</span>
//                 <XMarkIcon aria-hidden="true" className="size-6 " />
//               </button>
//             </div>
//             <div className="p-6 space-y-6">
//               <FileUpload onUpload={handleUpload} onClose={onClose} />
//               <div className="border-t border-gray-200 pt-6">
//                 <YouTubeTranscriber
//                   onTranscribe={handleTranscribe}
//                   onClose={onClose}
//                 />
//               </div>
//               <div className="border-t border-gray-200 pt-6">
//                 <PasteInText onClose={onClose} />
//               </div>
//             </div>
//           </DialogPanel>
//         </div>
//       </div>
//     </Dialog>
//   );
// }
