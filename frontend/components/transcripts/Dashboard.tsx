"use client";

import TranscriptDisplay from "./transcriptDisplay/TranscriptDisplay";
import ChatInterface from "./aiAssistant/ChatInterface";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import type { Database } from "@/types/database.types";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

type Transcript = Database["public"]["Tables"]["transcripts"]["Row"];

interface DashboardProps {
  transcript: Transcript | null;
}

export default function Dashboard({ transcript }: DashboardProps) {
  return (
    <>
      {/* Small */}
      <div className="lg:hidden h-full">
        <PanelGroup direction="vertical">
          <Panel defaultSize={50} maxSize={95} className="h-full">
            <TranscriptDisplay transcript={transcript} />
          </Panel>
          <ChevronUpIcon className="w-6 h-6 mx-auto text-gray-200" />
          <PanelResizeHandle className="h-2 bg-gray-200 cursor-row-resize z-10" />
          <ChevronDownIcon className="w-6 h-6 mx-auto text-gray-200" />
          <Panel defaultSize={50} maxSize={95} className="">
            <ChatInterface transcript={transcript} />
          </Panel>
        </PanelGroup>
      </div>
      {/* Large */}
      <div className="hidden h-full lg:block">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={65} maxSize={80} className="h-full">
            <TranscriptDisplay transcript={transcript} />
          </Panel>
          <PanelResizeHandle className="w-2 bg-gray-200 drop-shadow-2xl cursor-column-resize z-10" />
          <Panel defaultSize={35} maxSize={80}>
            <ChatInterface transcript={transcript} />
          </Panel>
        </PanelGroup>
      </div>
    </>
  );
}
