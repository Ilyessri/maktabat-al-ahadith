export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      hadiths: {
        Row: {
          id: number;
          text: string;
          tawthiq: string | null;
          source: string | null;
          volume_no: string | null;
          page_no: string | null;
          hadith_no: string | null;
          book_name: string | null;
          chapter_name: string | null;
          witness: string | null;
          indication: string | null;
          keywords: string | null;
          takhrij: string | null;
          ruling: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          text: string;
          tawthiq?: string | null;
          source?: string | null;
          volume_no?: string | null;
          page_no?: string | null;
          hadith_no?: string | null;
          book_name?: string | null;
          chapter_name?: string | null;
          witness?: string | null;
          indication?: string | null;
          keywords?: string | null;
          takhrij?: string | null;
          ruling?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          text?: string;
          tawthiq?: string | null;
          source?: string | null;
          volume_no?: string | null;
          page_no?: string | null;
          hadith_no?: string | null;
          book_name?: string | null;
          chapter_name?: string | null;
          witness?: string | null;
          indication?: string | null;
          keywords?: string | null;
          takhrij?: string | null;
          ruling?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      synonyms: {
        Row: {
          id: number;
          keyword: string;
          synonym: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          keyword: string;
          synonym: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          keyword?: string;
          synonym?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      sources: {
        Row: {
          id: number;
          source_name: string;
          book_name: string | null;
          chapter_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          source_name: string;
          book_name?: string | null;
          chapter_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          source_name?: string;
          book_name?: string | null;
          chapter_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: "admin" | "user";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: "admin" | "user";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: "admin" | "user";
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: "admin" | "user";
    };
    CompositeTypes: Record<string, never>;
  };
};
