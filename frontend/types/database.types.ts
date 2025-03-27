export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      transcripts: {
        Row: {
          id: string
          created_at: string
          transcript: string
          title: string
          user_id: string | null
          audio_url: string | null
          source_type: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          transcript: string
          title: string
          user_id?: string | null
          audio_url?: string | null
          source_type?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          transcript?: string
          title?: string
          user_id?: string | null
          audio_url?: string | null
          source_type?: string | null
        }
      }
    }
  }
}