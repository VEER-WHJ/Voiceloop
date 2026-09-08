import { requireSession, unauthorized } from "@/lib/auth/request";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 6;

export async function GET(request: Request) {
  const userId = await requireSession();
  if (!userId) return unauthorized();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const source = searchParams.get("source") ?? "";
  const reviewDate = searchParams.get("reviewDate") ?? "";
  const sort = searchParams.get("sort") === "oldest" ? "oldest" : "newest";
  const quality = searchParams.get("quality") === "all" ? "all" : searchParams.get("quality") === "review" ? "review" : "standard";
  const locationId = searchParams.get("locationId") ?? "all";
  const requestedPage = Number(searchParams.get("page") ?? "1");
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const ascending = sort === "oldest";

  const supabase = createServerSupabaseClient();
  let query = supabase.from("reviews").select("*", { count: "exact" }).eq("owner_user_id", userId);

  if (search) query = query.ilike("review_text", `%${search}%`);
  if (source) query = query.eq("source", source);
  if (reviewDate) query = query.eq("review_date", reviewDate);
  if (locationId !== "all") query = query.eq("location_id", locationId);
  if (quality === "standard") query = query.neq("legitimacy_status", "excluded");
  if (quality === "review") query = query.in("legitimacy_status", ["review", "excluded"]);

  const { data, error, count } = await query
    .order("review_date", { ascending, nullsFirst: false })
    .order("created_at", { ascending })
    .range(from, to);

  if (error) {
    console.error("Circuit could not load reviews.", error);
    return Response.json({ message: "Reviews could not be loaded." }, { status: 502 });
  }

  return Response.json(
    { reviews: data, total: count ?? 0 },
    { headers: { "Cache-Control": "no-store" } },
  );
}
