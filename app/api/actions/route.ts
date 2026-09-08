import { requireSession, requestHasAllowedOrigin, unauthorized } from "@/lib/auth/request";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function cleanText(value: unknown, maxLength: number, required = false) {
  const text = typeof value === "string" ? value.trim() : "";
  if ((required && !text) || text.length > maxLength) throw new Error("Invalid action details.");
  return text || null;
}

export async function GET() {
  const userId = await requireSession();
  if (!userId) return unauthorized();
  const { data, error } = await createServerSupabaseClient()
    .from("manager_actions")
    .select("*")
    .eq("owner_user_id", userId)
    .order("status")
    .order("created_at", { ascending: false });
  if (error) return Response.json({ message: "Manager actions could not be loaded." }, { status: 502 });
  return Response.json({ actions: data }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const userId = await requireSession();
  if (!userId) return unauthorized();
  if (!requestHasAllowedOrigin(request)) {
    return Response.json({ message: "Cross-origin changes are not allowed." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const priority = body.priority === "normal" ? "normal" : "high";
    const { data, error } = await createServerSupabaseClient()
      .from("manager_actions")
      .insert({
        title: cleanText(body.title, 160, true) as string,
        description: cleanText(body.description, 500),
        location_name: cleanText(body.locationName, 80),
        priority,
        status: "open",
        owner_user_id: userId,
      })
      .select("*")
      .single();
    if (error) throw error;
    return Response.json({ action: data }, { status: 201 });
  } catch {
    return Response.json({ message: "The manager action could not be created." }, { status: 400 });
  }
}
