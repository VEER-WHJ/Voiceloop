import { supabase } from "@/lib/supabase/client";
import type {
  ReviewInsert,
  ReviewRecord,
} from "@/lib/supabase/database.types";

export const REVIEWS_PAGE_SIZE = 6;

export type ReviewSort = "newest" | "oldest";

export type ReviewFilters = {
  search: string;
  source: string;
  reviewDate: string;
  sort: ReviewSort;
  page: number;
};

export type ReviewsPage = {
  reviews: ReviewRecord[];
  total: number;
};

export async function insertReviews(rows: ReviewInsert[]) {
  const { data, error } = await supabase
    .from("reviews")
    .insert(rows)
    .select("id");

  if (error) throw error;
  return data;
}

export async function fetchReviews({
  search,
  source,
  reviewDate,
  sort,
  page,
}: ReviewFilters): Promise<ReviewsPage> {
  const from = (page - 1) * REVIEWS_PAGE_SIZE;
  const to = from + REVIEWS_PAGE_SIZE - 1;
  const ascending = sort === "oldest";

  let query = supabase.from("reviews").select("*", { count: "exact" });

  if (search.trim()) {
    query = query.ilike("review_text", `%${search.trim()}%`);
  }
  if (source) {
    query = query.eq("source", source);
  }
  if (reviewDate) {
    query = query.eq("review_date", reviewDate);
  }

  const { data, error, count } = await query
    .order("review_date", { ascending, nullsFirst: false })
    .order("created_at", { ascending })
    .range(from, to);

  if (error) throw error;

  return {
    reviews: data,
    total: count ?? 0,
  };
}

export async function fetchReviewSources() {
  const { data, error } = await supabase
    .from("reviews")
    .select("source")
    .not("source", "is", null)
    .order("source");

  if (error) throw error;

  return Array.from(
    new Set(data.map(({ source }) => source).filter((value): value is string => !!value)),
  );
}
