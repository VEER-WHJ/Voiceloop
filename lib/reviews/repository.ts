import type {
  ReviewInsert,
  ReviewRecord,
} from "@/lib/supabase/database.types";

export const REVIEWS_PAGE_SIZE = 6;

export type ReviewSort = "newest" | "oldest";
export type ReviewQuality = "standard" | "all" | "review";

export type ReviewFilters = {
  search: string;
  source: string;
  reviewDate: string;
  sort: ReviewSort;
  page: number;
  quality: ReviewQuality;
  locationId: string;
};

export type ReviewsPage = {
  reviews: ReviewRecord[];
  total: number;
};

async function readJson<T>(response: Response): Promise<T> {
  const result = (await response.json()) as T & { message?: string };
  if (!response.ok) throw new Error(result.message ?? "Circuit could not complete the request.");
  return result;
}

export async function insertReviews(
  rows: ReviewInsert[],
  options: { filename: string; locationId?: string | null },
) {
  return readJson<{ reviews: { id: string }[]; importBatchId: string }>(
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows, ...options }),
    }),
  );
}

export async function fetchReviews({
  search,
  source,
  reviewDate,
  sort,
  page,
  quality,
  locationId,
}: ReviewFilters): Promise<ReviewsPage> {
  const params = new URLSearchParams({
    search,
    source,
    reviewDate,
    sort,
    page: String(page),
    quality,
    locationId,
  });
  return readJson<ReviewsPage>(await fetch(`/api/reviews?${params}`, { cache: "no-store" }));
}

export async function fetchReviewSources(locationId = "all") {
  const result = await readJson<{ sources: string[] }>(
    await fetch(`/api/reviews/sources?locationId=${encodeURIComponent(locationId)}`, { cache: "no-store" }),
  );
  return result.sources;
}
