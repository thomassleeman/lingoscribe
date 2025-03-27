"use client";

import { useState, useRef, useEffect } from "react";
import { useAtom } from "jotai";
import { currentPlaybackTimeAtom } from "@/state/store";
import { PlayIcon, PauseIcon } from "@heroicons/react/24/solid";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import {
  Volume2,
  VolumeX,
  Rewind,
  RotateCcw,
  RotateCw,
  Settings,
} from "lucide-react";

interface AudioPlayerProps {
  audioUrl: string;
}

export default function AudioPlayer({ audioUrl }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [, setCurrentPlaybackTime] = useAtom(currentPlaybackTimeAtom);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Handle audio source changes
  useEffect(() => {
    // Reset state when audio source changes
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  }, [audioUrl]);

  // Close dropdown when clicking outside
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

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts if we're not typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case " ": // Space to play/pause
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft": // Left arrow to skip back
          skipBackward();
          break;
        case "ArrowRight": // Right arrow to skip forward
          skipForward();
          break;
        case "Home": // Home to go to beginning
          goToBeginning();
          break;
        case "1": // Number keys for playback speed
          handlePlaybackSpeedChange(1);
          break;
        case "2":
          handlePlaybackSpeedChange(0.75);
          break;
        case "3":
          handlePlaybackSpeedChange(0.5);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [duration]); // Re-add when duration changes (new audio loaded)

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      setCurrentPlaybackTime(time); // Update global state for synchronization
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      audioRef.current.playbackRate = playbackSpeed;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 1;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    setCurrentPlaybackTime(seekTime); // Update global state
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      const newTime = Math.min(audioRef.current.currentTime + 5, duration);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setCurrentPlaybackTime(newTime);
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      const newTime = Math.max(audioRef.current.currentTime - 5, 0);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setCurrentPlaybackTime(newTime);
    }
  };

  const goToBeginning = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setCurrentPlaybackTime(0);
    }
  };

  const handlePlaybackSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  // Complete URL for audio source
  // const fullAudioUrl = audioUrl.startsWith("http")
  //   ? audioUrl
  //   : `/api${audioUrl}`;

  const fullAudioUrl = audioUrl;

  return (
    <div className="w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-2 shadow-md">
      <audio
        ref={audioRef}
        src={fullAudioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex items-center gap-x-6">
        {/* Controls and progress bar */}
        <div className="flex items-center gap">
          {/* Buttons */}
          <div className="flex items-center space-x-3 justify-self-center">
            <button
              onClick={goToBeginning}
              className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white rounded-full border border-gray-300 dark:border-gray-600"
              title="Go to beginning"
            >
              <Rewind className="h-3 w-3" />
            </button>

            <button
              onClick={skipBackward}
              className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white rounded-full border border-gray-300 dark:border-gray-600"
              title="Skip back 5 seconds"
            >
              <RotateCcw className="h-3 w-3" />
            </button>

            <button
              onClick={togglePlay}
              className="p-2 bg-sky-600 hover:bg-sky-700 text-white rounded-full"
            >
              {isPlaying ? (
                <PauseIcon className="h-5 w-5" />
              ) : (
                <PlayIcon className="h-5 w-5" />
              )}
            </button>

            <button
              onClick={skipForward}
              className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white rounded-full border border-gray-300 dark:border-gray-600"
              title="Skip forward 5 seconds"
            >
              <RotateCw className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex-grow mx-1">
          <div className="flex justify-between text-xs mb-1 text-gray-700 dark:text-gray-300">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        {/* Settings dropdown */}
        <div className="relative justify-self-end" ref={settingsRef}>
          <button
            onClick={toggleSettings}
            className="flex items-center space-x-1 p-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white rounded-full border border-gray-300 dark:border-gray-600"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
            {isSettingsOpen ? (
              <ChevronUpIcon className="h-3 w-3" />
            ) : (
              <ChevronDownIcon className="h-3 w-3" />
            )}
          </button>
        </div>
        {isSettingsOpen && (
          <div className="absolute right-0 bottom-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg p-3 z-10 border border-gray-200 dark:border-gray-700">
            {/* Volume control */}
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
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-full h-1.5 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Playback speed control */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Playback Speed
                </span>
              </div>
              <div className="flex space-x-2">
                {[0.5, 0.75, 1].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => handlePlaybackSpeedChange(speed)}
                    className={`flex-1 px-2 py-1 text-xs rounded ${
                      playbackSpeed === speed
                        ? "bg-sky-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {speed === 1 ? "1x" : `${speed}x`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
