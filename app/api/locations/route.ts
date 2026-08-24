import { requireSession, requestHasAllowedOrigin, unauthorized } from "@/lib/auth/request";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function GET() {
  if (!(await requireSession())) return unauthorized();
  const { data, error } = await createServerSupabaseClient()
    .from("locations")
    .select("*")
    .order("sort_order")
    .order("name");
  if (error) return Response.json({ message: "Locations could not be loaded." }, { status: 502 });
  return Response.json({ locations: data }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!(await requireSession())) return unauthorized();
  if (!requestHasAllowedOrigin(request)) {
    return Response.json({ message: "Cross-origin changes are not allowed." }, { status: 403 });
  }

  const body = (await request.json()) as { name?: unknown };
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length < 2 || name.length > 80) {
    return Response.json({ message: "Location names must be 2–80 characters." }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { count } = await supabase.from("locations").select("id", { count: "exact", head: true });
  const { data, error } = await supabase
    .from("locations")
    .insert({ name, slug: `${slugify(name)}-${Date.now().toString(36)}`, sort_order: count ?? 0 })
    .select("*")
    .single();
  if (error) return Response.json({ message: "That location could not be added." }, { status: 400 });
  return Response.json({ location: data }, { status: 201 });
}
