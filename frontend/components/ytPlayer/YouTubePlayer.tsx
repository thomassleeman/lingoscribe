"use client";

import { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { currentPlaybackTimeAtom } from "@/state/store";
import { PlayIcon, PauseIcon } from "@heroicons/react/24/solid";
import {
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  ChevronUpIcon,
  ChevronDownIcon,
} from "lucide-react";

interface YouTubePlayerProps {
  videoId: string;
}

// Declare YouTube IFrame API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function YouTubePlayer({ videoId }: YouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setCurrentPlaybackTime] = useAtom(currentPlaybackTimeAtom);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load YouTube IFrame API
  useEffect(() => {
    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      initializePlayer();
      return;
    }

    // Load the API
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Set up callback for when API is ready
    window.onYouTubeIframeAPIReady = initializePlayer;

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [videoId]);

  const initializePlayer = () => {
    if (!containerRef.current) return;

    // Check if container has dimensions before initializing
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.height === 0 || rect.width === 0) {
      // Container not yet laid out - retry after layout settles
      requestAnimationFrame(() => {
        requestAnimationFrame(initializePlayer);
      });
      return;
    }

    // Destroy existing player if it exists
    if (playerRef.current && playerRef.current.destroy) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId: videoId,
      height: "100%",
      width: "100%",
      playerVars: {
        autoplay: 0,
        controls: 0, // Hide default controls since we're building custom ones
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        fs: 1,
        playsinline: 1,
        iv_load_policy: 3, // Hide video annotations
        // disablekb: 1, // Disable keyboard controls to prevent YouTube logo from showing
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      },
    });
  };

  const onPlayerReady = (event: any) => {
    setIsPlayerReady(true);
    setDuration(event.target.getDuration());
    setVolume(event.target.getVolume());
    setIsMuted(event.target.isMuted());

    // Start interval to update current time
    updateIntervalRef.current = setInterval(() => {
      if (playerRef.current) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
        setCurrentPlaybackTime(time);
      }
    }, 100); // Update every 100ms for smooth synchronization
  };

  const onPlayerStateChange = (event: any) => {
    // -1: unstarted, 0: ended, 1: playing, 2: paused, 3: buffering, 5: cued
    setIsPlaying(event.data === 1);

    if (event.data === 0) {
      // Video ended
      setIsPlaying(false);
    }
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  // Close settings dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const togglePlay = () => {
    if (!isPlayerReady || !playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPlayerReady || !playerRef.current) return;

    const time = parseFloat(e.target.value);
    playerRef.current.seekTo(time, true);
    setCurrentTime(time);
    setCurrentPlaybackTime(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPlayerReady || !playerRef.current) return;

    const newVolume = parseInt(e.target.value);
    playerRef.current.setVolume(newVolume);
    setVolume(newVolume);

    if (newVolume === 0) {
      setIsMuted(true);
      playerRef.current.mute();
    } else if (isMuted) {
      setIsMuted(false);
      playerRef.current.unMute();
    }
  };

  const toggleMute = () => {
    if (!isPlayerReady || !playerRef.current) return;

    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (!isPlayerReady || !playerRef.current) return;

    playerRef.current.setPlaybackRate(rate);
    setPlaybackRate(rate);
    setIsSettingsOpen(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    const iframe = containerRef.current.querySelector("iframe");
    if (!iframe) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      iframe.requestFullscreen();
    }
  };

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return "0:00";

    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  return (
    <div
      className={`h-full w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex flex-col`}
    >
      {/* Video Container */}
      <div
        ref={containerRef}
        className="w-full flex-1 bg-black"
        style={{ minHeight: "200px" }}
      />

      {/* Custom Controls */}
      <div className="px-4 py-2 shadow-md">
        <div className="flex items-center gap-x-6">
          {/* Play/Pause and Time */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              disabled={!isPlayerReady}
              className="p-2 bg-sky-600 hover:bg-sky-700 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPlaying ? (
                <PauseIcon className="h-5 w-5" />
              ) : (
                <PlayIcon className="h-5 w-5" />
              )}
            </button>

            <div className="text-sm text-gray-700 dark:text-gray-300 min-w-[80px]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex-grow mx-1">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              disabled={!isPlayerReady}
              className="w-full h-1.5 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            />
          </div>

          {/* Settings Dropdown */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={toggleSettings}
              disabled={!isPlayerReady}
              className="flex items-center space-x-1 p-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white rounded-full border border-gray-300 dark:border-gray-600 disabled:opacity-50"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
              {isSettingsOpen ? (
                <ChevronUpIcon className="h-3 w-3" />
              ) : (
                <ChevronDownIcon className="h-3 w-3" />
              )}
            </button>

            {isSettingsOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg p-3 z-10 border border-gray-200 dark:border-gray-700">
                {/* Volume Control */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Volume
                    </span>
                    <button
                      onClick={toggleMute}
                      className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                    >
                      {isMuted ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-full h-1.5 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Playback Speed */}
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                    Playback Speed
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => handlePlaybackRateChange(rate)}
                        className={`px-2 py-1 text-sm rounded ${
                          playbackRate === rate
                            ? "bg-sky-600 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            disabled={!isPlayerReady}
            className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white rounded-full border border-gray-300 dark:border-gray-600 disabled:opacity-50"
            title="Fullscreen"
          >
            <Maximize className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
