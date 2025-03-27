import { supabase, getCurrentUser } from "./supabaseUtils";

import { Database } from "../types/database.types";

type Transcript = Database["public"]["Tables"]["transcripts"]["Row"];
type TranscriptInsert = Database["public"]["Tables"]["transcripts"]["Insert"];
type TranscriptUpdate = Database["public"]["Tables"]["transcripts"]["Update"];

export async function saveTranscript(transcriptData: TranscriptInsert) {
  // Get current user
  const user = await getCurrentUser();

  // Always associate content with the current user if logged in
  const dataWithUser = user
    ? { ...transcriptData, user_id: user.id }
    : { ...transcriptData, user_id: null }; // Explicitly set to null for anonymous users

  const { data, error } = await supabase
    .from("transcripts")
    .insert(dataWithUser)
    .select()
    .single();

  if (error) {
    console.error("Error saving transcript:", error);
    throw error;
  }

  return data;
}

export async function getTranscripts() {
  // Get current user
  const user = await getCurrentUser();

  let query = supabase.from("transcripts").select("*");

  // If user is logged in, filter by user_id
  if (user) {
    query = query.eq("user_id", user.id);
  } else {
    // If no user is logged in, only show transcripts with null user_id
    query = query.is("user_id", null);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching transcripts:", error);
    throw error;
  }

  return data;
}

export async function getTranscriptById(id: string) {
  // Get current user
  const user = await getCurrentUser();

  let query = supabase.from("transcripts").select("*").eq("id", id);

  // If user is logged in, make sure the transcript belongs to the user
  if (user) {
    query = query.eq("user_id", user.id);
  } else {
    // If no user is logged in, only allow access to transcripts with null user_id
    query = query.is("user_id", null);
  }

  const { data, error } = await query.single();

  if (error) {
    console.error(`Error fetching transcript with id ${id}:`, error);
    throw error;
  }

  return data;
}

export async function updateTranscript(id: string, updates: TranscriptUpdate) {
  // Get current user
  const user = await getCurrentUser();

  let query = supabase.from("transcripts").update(updates).eq("id", id);

  // If user is logged in, ensure only their transcripts are updated
  if (user) {
    query = query.eq("user_id", user.id);
  } else {
    // If no user is logged in, only update transcripts with null user_id
    query = query.is("user_id", null);
  }

  const { data, error } = await query.select().single();

  if (error) {
    console.error(`Error updating transcript with id ${id}:`, error);
    throw error;
  }

  return data;
}

export async function deleteTranscript(id: string) {
  // Get current user
  const user = await getCurrentUser();

  let query = supabase.from("transcripts").delete().eq("id", id);

  // If user is logged in, ensure only their transcripts are deleted
  if (user) {
    query = query.eq("user_id", user.id);
  } else {
    // If no user is logged in, only delete transcripts with null user_id
    query = query.is("user_id", null);
  }

  const { error } = await query;

  if (error) {
    console.error(`Error deleting transcript with id ${id}:`, error);
    throw error;
  }

  return true;
}
