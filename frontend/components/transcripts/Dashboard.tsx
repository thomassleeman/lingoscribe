"use client";
import { useState, useEffect } from "react";
import TranscriptDisplay from "./transcriptDisplay/TranscriptDisplay";
import ChatInterface from "./aiAssistant/ChatInterface";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import type { Database } from "@/types/database.types";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from "lucide-react";
import YouTubePlayer from "../ytPlayer/YouTubePlayer";

type Transcript = Database["public"]["Tables"]["transcripts"]["Row"];

interface DashboardProps {
  transcript: Transcript | null;
}

// Hook to detect screen size - returns null during SSR to avoid hydration mismatch
function useIsLargeScreen(): boolean | null {
  const [isLarge, setIsLarge] = useState<boolean | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    setIsLarge(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsLarge(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return isLarge;
}

export default function Dashboard({ transcript }: DashboardProps) {
  const [currentTab, setCurrentTab] = useState<"video" | "transcript" | "ai">(
    "video"
  );
  const isLargeScreen = useIsLargeScreen();

  const isYouTube = transcript?.source_type === "youtube";
  const hasVideo = isYouTube && transcript?.audio_url;

  // Don't render until we know the screen size (avoids hydration issues)
  // Show a loading state or the mobile layout by default
  if (isLargeScreen === null) {
    // Return a simple loading state that matches either layout structurally
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  // Render mobile layout
  if (!isLargeScreen) {
    return (
      <div className="h-full max-h-screen flex flex-col">
        <div className="flex-1 overflow-hidden pb-10 min-h-0">
          {/* Video Tab Panel */}
          <div className={currentTab === "video" ? "h-full" : "hidden"}>
            {hasVideo && <YouTubePlayer videoId={transcript.audio_url!} />}
          </div>

          {/* Transcript Tab Panel */}
          <div className={currentTab === "transcript" ? "h-full" : "hidden"}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={34} maxSize={95} className="h-full">
                <TranscriptDisplay transcript={transcript} />
              </Panel>
              <div className="relative h-0">
                <ChevronUpIcon className="w-6 h-6 text-gray-300 absolute left-1/2 -translate-x-1/2 -top-5 pointer-events-none" />
              </div>
              <PanelResizeHandle className="h-2 bg-gray-200 cursor-row-resize z-10" />
              <div className="relative h-0">
                <ChevronDownIcon className="w-6 h-6 text-gray-300 absolute left-1/2 -translate-x-1/2 -bottom-5 pointer-events-none" />
              </div>
              <Panel defaultSize={33} maxSize={95}>
                <ChatInterface transcript={transcript} />
              </Panel>
            </PanelGroup>
          </div>

          {/* AI Tab Panel */}
          <div className={currentTab === "ai" ? "h-full" : "hidden"}>
            <ChatInterface transcript={transcript} />
          </div>
        </div>
        <div className="grid bottom-0 fixed h-10 grid-cols-2 w-full">
          <button
            onClick={() => setCurrentTab("video")}
            className={`border-t border-r flex flex-col items-center justify-center ${
              currentTab === "video"
                ? "bg-sky-50 dark:bg-gray-700"
                : "bg-white dark:bg-gray-800"
            }`}
          >
            <span>Video</span>
          </button>
          <button
            onClick={() => setCurrentTab("transcript")}
            className={`border-t flex flex-col items-center justify-center ${
              currentTab === "transcript"
                ? "bg-sky-50 dark:bg-gray-700"
                : "bg-white dark:bg-gray-800"
            }`}
          >
            <span>Transcript</span>
          </button>
        </div>
      </div>
    );
  }

  // Render desktop layout
  return (
    <div className="h-full">
      <PanelGroup direction="horizontal">
        {hasVideo && (
          <Panel defaultSize={33} maxSize={90} minSize={10} className="h-full">
            <YouTubePlayer videoId={transcript.audio_url!} />
          </Panel>
        )}
        <div className="relative w-0">
          <ChevronLeftIcon className="w-6 h-6 text-gray-300 absolute top-1/2 -translate-y-1/2 -left-5 pointer-events-none" />
        </div>
        <PanelResizeHandle className="w-2 bg-gray-200 drop-shadow-2xl cursor-column-resize z-10" />
        <div className="relative w-0">
          <ChevronRightIcon className="w-6 h-6 text-gray-300 absolute top-1/2 -translate-y-1/2 -right-5 pointer-events-none" />
        </div>
        <Panel defaultSize={34} maxSize={90} minSize={10} className="h-full">
          <TranscriptDisplay transcript={transcript} />
        </Panel>
        <div className="relative w-0">
          <ChevronLeftIcon className="w-6 h-6 text-gray-300 absolute top-1/2 -translate-y-1/2 -left-5 pointer-events-none" />
        </div>
        <PanelResizeHandle className="w-2 bg-gray-200 drop-shadow-2xl cursor-column-resize z-10" />
        <div className="relative w-0">
          <ChevronRightIcon className="w-6 h-6 text-gray-300 absolute top-1/2 -translate-y-1/2 -right-5 pointer-events-none" />
        </div>
        <Panel defaultSize={33} maxSize={90} minSize={5}>
          <ChatInterface transcript={transcript} />
        </Panel>
      </PanelGroup>
    </div>
  );
}

// "use client";
// import { useState } from "react";
// import TranscriptDisplay from "./transcriptDisplay/TranscriptDisplay";
// import ChatInterface from "./aiAssistant/ChatInterface";
// import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
// import type { Database } from "@/types/database.types";
// import {
//   ChevronDownIcon,
//   ChevronUpIcon,
//   ChevronRightIcon,
//   ChevronLeftIcon,
// } from "lucide-react";
// import YouTubePlayer from "../ytPlayer/YouTubePlayer";

// type Transcript = Database["public"]["Tables"]["transcripts"]["Row"];

// interface DashboardProps {
//   transcript: Transcript | null;
// }

// export default function Dashboard({ transcript }: DashboardProps) {
//   const [currentTab, setCurrentTab] = useState<"video" | "transcript" | "ai">(
//     "video"
//   );

//   const isYouTube = transcript?.source_type === "youtube";
//   return (
//     <>
//       {/* Small */}
//       <div className="lg:hidden h-full max-h-screen flex flex-col">
//         <div className="flex-1 overflow-hidden pb-10">
//           {/* Video Tab Panel - Always mounted */}
//           <div className={currentTab === "video" ? "h-full" : "hidden"}>
//             <YouTubePlayer videoId={transcript?.audio_url || ""} />
//           </div>

//           {/* Transcript Tab Panel - Always mounted */}
//           <div className={currentTab === "transcript" ? "h-full" : "hidden"}>
//             <PanelGroup direction="vertical">
//               <Panel defaultSize={50} maxSize={95} className="h-full">
//                 <TranscriptDisplay transcript={transcript} />
//               </Panel>
//               <div className="relative h-0">
//                 <ChevronUpIcon className="w-6 h-6 text-gray-300 absolute left-1/2 -translate-x-1/2 -top-5 pointer-events-none" />
//               </div>
//               <PanelResizeHandle className="h-2 bg-gray-200 cursor-row-resize z-10" />
//               <div className="relative h-0">
//                 <ChevronDownIcon className="w-6 h-6 text-gray-300 absolute left-1/2 -translate-x-1/2 -bottom-5 pointer-events-none" />
//               </div>
//               <Panel defaultSize={50} maxSize={95}>
//                 <ChatInterface transcript={transcript} />
//               </Panel>
//             </PanelGroup>
//           </div>

//           {/* AI Tab Panel - Always mounted (if needed in future) */}
//           <div className={currentTab === "ai" ? "h-full" : "hidden"}>
//             <ChatInterface transcript={transcript} />
//           </div>
//         </div>
//         <div className="grid bottom-0 fixed h-10 grid-cols-2 w-full">
//           <button
//             onClick={() => setCurrentTab("video")}
//             className="border-t border-r bg-white dark:bg-gray-800 flex flex-col items-center justify-center"
//           >
//             <span>Video</span>
//           </button>
//           <button
//             onClick={() => setCurrentTab("transcript")}
//             className="border-t bg-white dark:bg-gray-800 flex flex-col items-center justify-center"
//           >
//             <span>Transcript</span>
//           </button>
//         </div>
//       </div>
//       {/* Large */}
//       <div className="hidden h-full lg:block">
//         <PanelGroup direction="horizontal">
//           {isYouTube && transcript?.audio_url && (
//             <Panel
//               defaultSize={33}
//               maxSize={90}
//               minSize={10}
//               className="h-full"
//             >
//               <YouTubePlayer videoId={transcript?.audio_url || ""} />
//             </Panel>
//           )}
//           <div className="relative w-0">
//             <ChevronLeftIcon className="w-6 h-6 text-gray-300 absolute top-1/2 -translate-y-1/2 -left-5 pointer-events-none" />
//           </div>
//           <PanelResizeHandle className="w-2 bg-gray-200 drop-shadow-2xl cursor-column-resize z-10" />
//           <div className="relative w-0">
//             <ChevronRightIcon className="w-6 h-6 text-gray-300 absolute top-1/2 -translate-y-1/2 -right-5 pointer-events-none" />
//           </div>
//           <Panel defaultSize={34} maxSize={90} minSize={10} className="h-full">
//             <TranscriptDisplay transcript={transcript} />
//           </Panel>
//           <div className="relative w-0">
//             <ChevronLeftIcon className="w-6 h-6 text-gray-300 absolute top-1/2 -translate-y-1/2 -left-5 pointer-events-none" />
//           </div>
//           <PanelResizeHandle className="w-2 bg-gray-200 drop-shadow-2xl cursor-column-resize z-10" />
//           <div className="relative w-0">
//             <ChevronRightIcon className="w-6 h-6 text-gray-300 absolute top-1/2 -translate-y-1/2 -right-5 pointer-events-none" />
//           </div>
//           <Panel defaultSize={33} maxSize={90} minSize={5}>
//             <ChatInterface transcript={transcript} />
//           </Panel>
//         </PanelGroup>
//       </div>
//     </>
//   );
// }
