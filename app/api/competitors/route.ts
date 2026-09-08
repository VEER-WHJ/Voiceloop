import { requireSession, requestHasAllowedOrigin, unauthorized } from "@/lib/auth/request";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanWebsite(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || value.length > 500) throw new Error("Enter a valid website URL.");
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error("Website links must use http or https.");
  return url.toString();
}

export async function GET() {
  const userId = await requireSession();
  if (!userId) return unauthorized();
  const { data, error } = await createServerSupabaseClient().from("competitors").select("*").eq("owner_user_id", userId).order("created_at");
  if (error) return Response.json({ message: "Competitors could not be loaded." }, { status: 502 });
  return Response.json({ competitors: data }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const userId = await requireSession();
  if (!userId) return unauthorized();
  if (!requestHasAllowedOrigin(request)) return Response.json({ message: "Cross-origin changes are not allowed." }, { status: 403 });

  try {
    const body = await request.json() as { name?: unknown; website?: unknown };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (name.length < 2 || name.length > 120) throw new Error("Competitor names must be 2–120 characters.");
    const { data, error } = await createServerSupabaseClient().from("competitors").insert({ owner_user_id: userId, name, website: cleanWebsite(body.website) }).select("*").single();
    if (error) throw new Error(error.code === "23505" ? "That competitor is already in your workspace." : "The competitor could not be added.");
    return Response.json({ competitor: data }, { status: 201 });
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "The competitor could not be added." }, { status: 400 });
  }
}
