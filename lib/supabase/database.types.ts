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
