import { requireSession, unauthorized } from "@/lib/auth/request";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await requireSession();
  if (!userId) return unauthorized();

  const { data, error } = await createServerSupabaseClient()
    .from("import_batches")
    .select("*")
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    return Response.json({ message: "Import history could not be loaded." }, { status: 502 });
  }

  return Response.json({ imports: data }, { headers: { "Cache-Control": "no-store" } });
}
