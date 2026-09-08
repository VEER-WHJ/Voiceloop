import { requireSession, requestHasAllowedOrigin, unauthorized } from "@/lib/auth/request";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(request: Request, context: RouteContext<"/api/locations/[id]">) {
  const userId = await requireSession();
  if (!userId) return unauthorized();
  if (!requestHasAllowedOrigin(request)) {
    return Response.json({ message: "Cross-origin changes are not allowed." }, { status: 403 });
  }

  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) return Response.json({ message: "Invalid location." }, { status: 400 });
  const body = (await request.json()) as { name?: unknown; isActive?: unknown };
  const updates: { name?: string; is_active?: boolean; updated_at: string } = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (name.length < 2 || name.length > 80) {
      return Response.json({ message: "Location names must be 2–80 characters." }, { status: 400 });
    }
    updates.name = name;
  }
  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") {
      return Response.json({ message: "Invalid location status." }, { status: 400 });
    }
    updates.is_active = body.isActive;
  }

  const { data, error } = await createServerSupabaseClient()
    .from("locations")
    .update(updates)
    .eq("id", id)
    .eq("owner_user_id", userId)
    .select("*")
    .single();
  if (error) return Response.json({ message: "The location could not be updated." }, { status: 400 });
  return Response.json({ location: data });
}
