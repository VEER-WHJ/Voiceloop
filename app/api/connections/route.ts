import { requireSession, unauthorized } from "@/lib/auth/request";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const userId = await requireSession();
  if (!userId) return unauthorized();
  const locationId = new URL(request.url).searchParams.get("locationId");
  let query = createServerSupabaseClient().from("source_connections").select("provider,status,account_label,last_synced_at,location_id").eq("owner_user_id", userId);
  if (locationId && locationId !== "all") query = query.eq("location_id", locationId);
  const { data, error } = await query;
  if (error) return Response.json({ message: "Connection status could not be loaded." }, { status: 502 });
  return Response.json({ connections: data }, { headers: { "Cache-Control": "no-store" } });
}
