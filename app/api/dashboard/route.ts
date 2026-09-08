import { requireSession, unauthorized } from "@/lib/auth/request";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ThemeCount = { name: string; count: number };

function topCounts(values: Array<string | null>, limit = 5): ThemeCount[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Array.from(counts, ([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export async function GET(request: Request) {
  const userId = await requireSession();
  if (!userId) return unauthorized();

  const locationId = new URL(request.url).searchParams.get("locationId") ?? "all";
  const supabase = createServerSupabaseClient();
  const [locationsResult, actionsResult] = await Promise.all([
    supabase.from("locations").select("id,name,is_active").eq("owner_user_id", userId).order("sort_order").order("name"),
    supabase.from("manager_actions").select("id").eq("owner_user_id", userId).neq("status", "resolved"),
  ]);

  if (locationsResult.error || actionsResult.error) {
    return Response.json({ message: "Overview data could not be loaded." }, { status: 502 });
  }

  let reviewsQuery = supabase
    .from("reviews")
    .select("id,review_text,rating,review_date,source,sentiment,theme,location_id,legitimacy_status")
    .eq("owner_user_id", userId)
    .neq("legitimacy_status", "excluded")
    .limit(5000);
  if (locationId !== "all") reviewsQuery = reviewsQuery.eq("location_id", locationId);
  const { data: reviews, error: reviewsError } = await reviewsQuery;
  if (reviewsError) return Response.json({ message: "Review metrics could not be loaded." }, { status: 502 });

  const rated = reviews.filter((review) => review.rating !== null);
  const averageRating = rated.length
    ? rated.reduce((sum, review) => sum + (review.rating ?? 0), 0) / rated.length
    : null;
  const analyzed = reviews.filter((review) => review.sentiment !== null);
  const positiveReviews = analyzed.filter((review) => review.sentiment?.toLowerCase() === "positive");
  const negativeReviews = analyzed.filter((review) => review.sentiment?.toLowerCase() === "negative");
  const positiveCount = positiveReviews.length;
  const negativeThemes = topCounts(negativeReviews.map((review) => review.theme));
  const positiveThemes = topCounts(positiveReviews.map((review) => review.theme));
  const topIssue = negativeThemes[0] ?? null;
  const evidence = topIssue
    ? negativeReviews.filter((review) => review.theme === topIssue.name).slice(0, 5)
    : [];

  const locationMetrics = locationsResult.data
    .filter((location) => location.is_active && (locationId === "all" || location.id === locationId))
    .map((location) => {
    const locationReviews = reviews.filter((review) => review.location_id === location.id);
    const locationRated = locationReviews.filter((review) => review.rating !== null);
    const score = locationRated.length ? locationRated.reduce((sum, review) => sum + (review.rating ?? 0), 0) / locationRated.length : null;
    const issue = topCounts(locationReviews.filter((review) => review.sentiment?.toLowerCase() === "negative").map((review) => review.theme), 1)[0]?.name ?? null;
    return { id: location.id, name: location.name, score, reviews: locationReviews.length, issue };
  });

  return Response.json({
    metrics: {
      reviewCount: reviews.length,
      averageRating,
      analyzedCount: analyzed.length,
      positivePercent: analyzed.length ? Math.round((positiveCount / analyzed.length) * 100) : null,
      negativeCount: negativeReviews.length,
      sourceCount: new Set(reviews.map((review) => review.source).filter(Boolean)).size,
      openActionCount: actionsResult.data.length,
    },
    topIssue,
    evidence,
    positiveThemes,
    negativeThemes,
    locations: locationMetrics,
  }, { headers: { "Cache-Control": "no-store" } });
}
