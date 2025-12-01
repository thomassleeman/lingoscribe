"use client";

import { useState } from "react";
import { useAtom } from "jotai";
import { currentPlaybackTimeAtom } from "@/state/store";
import AudioPlayer from "./AudioPlayer";
import YouTubePlayer from "../../ytPlayer/YouTubePlayer";
import EmptyState from "./EmptyState";
import PopulatedState from "./PopulatedState";
import type { Database } from "@/types/database.types";

type Transcript = Database["public"]["Tables"]["transcripts"]["Row"];

interface TranscriptDisplayProps {
  transcript: Transcript | null;
}

export default function TranscriptDisplay({
  transcript,
}: TranscriptDisplayProps) {
  const [currentPlaybackTime] = useAtom(currentPlaybackTimeAtom);

  // Determine layout based on source type
  const isYouTube = transcript?.source_type === "youtube";
  const isAudioFile = transcript?.source_type === "file";
  const hasMedia = transcript?.audio_url && (isYouTube || isAudioFile);

  return (
    <div className="h-full flex">
      {/* Left side: Video player for YouTube (if applicable) */}
      {/* {isYouTube && transcript?.audio_url && (
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700">
          <YouTubePlayer videoId={transcript.audio_url} />
        </div>
      )} */}

      {/* Right side (or full width): Transcript content */}
      <div className="flex-1 relative">
        <div
          className="overflow-y-auto h-full"
          style={{
            paddingBottom: isAudioFile ? "80px" : "0",
          }}
        >
          {transcript ? (
            <PopulatedState transcript={transcript} />
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Audio player at bottom for uploaded files */}
        {isAudioFile && transcript?.audio_url && (
          <div className="absolute bottom-0 left-0 right-0">
            <AudioPlayer audioUrl={transcript.audio_url} />
          </div>
        )}
      </div>
    </div>
  );
}
