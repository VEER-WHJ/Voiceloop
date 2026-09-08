import type { ReviewRecord } from "@/lib/supabase/database.types";
import { readApiJson } from "@/lib/http/client";

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
  return readApiJson<ReviewsPage>(await fetch(`/api/reviews?${params}`, { cache: "no-store" }));
}

export async function fetchReviewSources(locationId = "all") {
  const result = await readApiJson<{ sources: string[] }>(
    await fetch(`/api/reviews/sources?locationId=${encodeURIComponent(locationId)}`, { cache: "no-store" }),
  );
  return result.sources;
}
