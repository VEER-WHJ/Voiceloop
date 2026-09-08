import { requireSession, requestHasAllowedOrigin, unauthorized } from "@/lib/auth/request";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STATUSES = new Set(["open", "monitoring", "resolved"]);

export async function PATCH(request: Request, context: RouteContext<"/api/actions/[id]">) {
  const userId = await requireSession();
  if (!userId) return unauthorized();
  if (!requestHasAllowedOrigin(request)) {
    return Response.json({ message: "Cross-origin changes are not allowed." }, { status: 403 });
  }
  const { id } = await context.params;
  const body = (await request.json()) as { status?: unknown };
  if (!UUID_PATTERN.test(id) || typeof body.status !== "string" || !STATUSES.has(body.status)) {
    return Response.json({ message: "Invalid manager action update." }, { status: 400 });
  }

  const { data, error } = await createServerSupabaseClient()
    .from("manager_actions")
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_user_id", userId)
    .select("*")
    .single();
  if (error) return Response.json({ message: "The manager action could not be updated." }, { status: 400 });
  return Response.json({ action: data });
}
