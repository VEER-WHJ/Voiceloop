import { requireSession, unauthorized } from "@/lib/auth/request";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const userId = await requireSession();
  if (!userId) return unauthorized();

  const locationId = new URL(request.url).searchParams.get("locationId") ?? "all";
  let query = createServerSupabaseClient()
    .from("reviews")
    .select("source")
    .eq("owner_user_id", userId)
    .not("source", "is", null);
  if (locationId !== "all") query = query.eq("location_id", locationId);
  const { data, error } = await query.order("source");

  if (error) {
    return Response.json({ message: "Review sources could not be loaded." }, { status: 502 });
  }

  const sources = Array.from(
    new Set(data.map(({ source }) => source).filter((value): value is string => Boolean(value))),
  );
  return Response.json({ sources }, { headers: { "Cache-Control": "no-store" } });
}
