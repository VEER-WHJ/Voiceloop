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
          import_batch_id: string | null;
          location_id: string | null;
          external_review_id: string | null;
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
          import_batch_id?: string | null;
          location_id?: string | null;
          external_review_id?: string | null;
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
          import_batch_id?: string | null;
          location_id?: string | null;
          external_review_id?: string | null;
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
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slug?: string;
          name?: string;
          is_active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      import_batches: {
        Row: {
          id: string;
          filename: string;
          row_count: number;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          filename: string;
          row_count: number;
          status?: string;
          created_at?: string;
        };
        Update: {
          filename?: string;
          row_count?: number;
          status?: string;
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
        };
        Update: {
          title?: string;
          description?: string | null;
          location_name?: string | null;
          priority?: string;
          status?: string;
          updated_at?: string;
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
        };
        Insert: {
          id?: string;
          provider: string;
          status?: string;
          account_label?: string | null;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: string;
          account_label?: string | null;
          last_synced_at?: string | null;
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
