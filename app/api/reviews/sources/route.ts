import { requireSession, unauthorized } from "@/lib/auth/request";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireSession())) return unauthorized();

  const { data, error } = await createServerSupabaseClient()
    .from("reviews")
    .select("source")
    .not("source", "is", null)
    .order("source");

  if (error) {
    return Response.json({ message: "Review sources could not be loaded." }, { status: 502 });
  }

  const sources = Array.from(
    new Set(data.map(({ source }) => source).filter((value): value is string => Boolean(value))),
  );
  return Response.json({ sources }, { headers: { "Cache-Control": "no-store" } });
}
