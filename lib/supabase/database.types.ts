export type Database = {
  public: {
    Tables: {
      reviews: {
        Row: {
          id: string;
          review_text: string;
          rating: number | null;
          review_date: string | null;
          source: string | null;
          reviewer_name: string | null;
          sentiment: string | null;
          theme: string | null;
          location_id: string | null;
          external_review_id: string | null;
          owner_user_id: string;
          external_order_id: string | null;
          ordered_items: string[];
          feedback_channel: string | null;
          reviewer_review_count: number | null;
          reviewer_is_verified: boolean | null;
          provider_flagged: boolean;
          legitimacy_status: "trusted" | "review" | "excluded" | "unassessed";
          legitimacy_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          review_text: string;
          rating?: number | null;
          review_date?: string | null;
          source?: string | null;
          reviewer_name?: string | null;
          sentiment?: string | null;
          theme?: string | null;
          location_id?: string | null;
          external_review_id?: string | null;
          owner_user_id: string;
          external_order_id?: string | null;
          ordered_items?: string[];
          feedback_channel?: string | null;
          reviewer_review_count?: number | null;
          reviewer_is_verified?: boolean | null;
          provider_flagged?: boolean;
          legitimacy_status?: "trusted" | "review" | "excluded" | "unassessed";
          legitimacy_reason?: string | null;
          created_at?: string;
        };
        Update: {
          review_text?: string;
          rating?: number | null;
          review_date?: string | null;
          source?: string | null;
          reviewer_name?: string | null;
          sentiment?: string | null;
          theme?: string | null;
          location_id?: string | null;
          external_review_id?: string | null;
          owner_user_id?: string;
          external_order_id?: string | null;
          ordered_items?: string[];
          feedback_channel?: string | null;
          reviewer_review_count?: number | null;
          reviewer_is_verified?: boolean | null;
          provider_flagged?: boolean;
          legitimacy_status?: "trusted" | "review" | "excluded" | "unassessed";
          legitimacy_reason?: string | null;
        };
        Relationships: [];
      };
      locations: {
        Row: {
          id: string;
          slug: string;
          name: string;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
          owner_user_id: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
          owner_user_id: string;
        };
        Update: {
          slug?: string;
          name?: string;
          is_active?: boolean;
          sort_order?: number;
          updated_at?: string;
          owner_user_id?: string;
        };
        Relationships: [];
      };
      manager_actions: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          location_name: string | null;
          priority: string;
          status: string;
          created_at: string;
          updated_at: string;
          owner_user_id: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          location_name?: string | null;
          priority?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
          owner_user_id: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          location_name?: string | null;
          priority?: string;
          status?: string;
          updated_at?: string;
          owner_user_id?: string;
        };
        Relationships: [];
      };
      source_connections: {
        Row: {
          id: string;
          provider: string;
          status: string;
          account_label: string | null;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
          owner_user_id: string;
          location_id: string | null;
        };
        Insert: {
          id?: string;
          provider: string;
          status?: string;
          account_label?: string | null;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
          owner_user_id: string;
          location_id?: string | null;
        };
        Update: {
          status?: string;
          account_label?: string | null;
          last_synced_at?: string | null;
          updated_at?: string;
          owner_user_id?: string;
          location_id?: string | null;
        };
        Relationships: [];
      };
      competitors: {
        Row: {
          id: string;
          owner_user_id: string;
          name: string;
          website: string | null;
          latest_summary: string | null;
          latest_sources: { title: string; url: string }[];
          last_researched_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          name: string;
          website?: string | null;
          latest_summary?: string | null;
          latest_sources?: { title: string; url: string }[];
          last_researched_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          website?: string | null;
          latest_summary?: string | null;
          latest_sources?: { title: string; url: string }[];
          last_researched_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type ReviewRecord = Database["public"]["Tables"]["reviews"]["Row"];
export type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];
