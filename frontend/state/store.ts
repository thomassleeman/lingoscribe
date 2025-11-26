// store.ts
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// Keep only minimal UI state in Jotai
// Ephemeral UI state
export const selectedTextAtom = atom("");
export const currentPlaybackTimeAtom = atom<number>(0);

// User preferences and persistent UI state
export const darkModeAtom = atomWithStorage<"dark" | "light">("darkMode", "light");

// Define interface for chat messages with transcript ID
export interface ChatMessage {
  role: string;
  content: string;
  transcriptId: string; // The ID to identify which transcript this message belongs to
}

// Chat history - persisted in localStorage
export const chatMessagesAtom = atomWithStorage<ChatMessage[]>("chat-messages-store", []);
