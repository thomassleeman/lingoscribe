"use client";

import { createClient } from "@/utils/supabase/client";
import { Database } from "@/types/database.types";

type Transcript = Database["public"]["Tables"]["transcripts"]["Row"];
type TranscriptInsert = Database["public"]["Tables"]["transcripts"]["Insert"];
type TranscriptUpdate = Database["public"]["Tables"]["transcripts"]["Update"];

export async function saveTranscript(
  transcriptData: Omit<TranscriptInsert, "user_id">
): Promise<Transcript> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  const { data, error } = await supabase
    .from("transcripts")
    .insert({ ...transcriptData, user_id: user.id })
    .select()
    .single();

  if (error) {
    console.error("Error saving transcript:", error);
    throw error;
  }

  return data;
}

export async function updateTranscript(
  id: string,
  updates: TranscriptUpdate
): Promise<Transcript> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  const { data, error } = await supabase
    .from("transcripts")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating transcript with id ${id}:`, error);
    throw error;
  }

  return data;
}

export async function getTranscriptById(id: string): Promise<Transcript> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  const { data, error } = await supabase
    .from("transcripts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error(`Error fetching transcript with id ${id}:`, error);
    throw error;
  }

  return data;
}

export async function deleteTranscript(id: string): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  const { error } = await supabase
    .from("transcripts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error(`Error deleting transcript with id ${id}:`, error);
    throw error;
  }

  return true;
}
