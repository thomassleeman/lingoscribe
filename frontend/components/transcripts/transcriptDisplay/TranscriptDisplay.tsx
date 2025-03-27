"use client";

import { useState } from "react";
import { useAtom } from "jotai";
import { currentPlaybackTimeAtom } from "@/state/store";
import AudioPlayer from "./AudioPlayer";
import EmptyState from "./EmptyState";
import PopulatedState from "./PopulatedState";
import type { Database } from "@/types/database.types";

type Transcript = Database["public"]["Tables"]["transcripts"]["Row"];

interface TranscriptDisplayProps {
  transcript: Transcript | null;
}

export default function TranscriptDisplay({ transcript }: TranscriptDisplayProps) {
  const [currentPlaybackTime] = useAtom(currentPlaybackTimeAtom);

  return (
    <div className="h-full relative">
      <div className="overflow-y-auto h-full" style={{ 
        paddingBottom: transcript?.audio_url && 
          (transcript.source_type === 'youtube' || transcript.source_type === 'file') 
          ? '80px' : '0' 
      }}>
        {transcript ? (
          <PopulatedState transcript={transcript} />
        ) : (
          <EmptyState />
        )}
      </div>
      
      {transcript?.audio_url && 
       (transcript.source_type === 'youtube' || transcript.source_type === 'file') && (
        <div className="absolute bottom-0 left-0 right-0">
          <AudioPlayer audioUrl={transcript.audio_url} />
        </div>
      )}
    </div>
  );
}