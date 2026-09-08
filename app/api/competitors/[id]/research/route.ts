import { researchCompetitor } from "@/lib/competitors/openai";
import { requireSession, requestHasAllowedOrigin, unauthorized } from "@/lib/auth/request";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireSession();
  if (!userId) return unauthorized();
  if (!requestHasAllowedOrigin(request)) return Response.json({ message: "Cross-origin changes are not allowed." }, { status: 403 });

  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient();
    const { data: competitor, error } = await supabase.from("competitors").select("id,name,website").eq("id", id).eq("owner_user_id", userId).single();
    if (error || !competitor) return Response.json({ message: "Competitor not found." }, { status: 404 });

    const research = await researchCompetitor(competitor.name, competitor.website);
    const timestamp = new Date().toISOString();
    const { data: updated, error: updateError } = await supabase.from("competitors").update({ latest_summary: research.summary, latest_sources: research.sources, last_researched_at: timestamp, updated_at: timestamp }).eq("id", id).eq("owner_user_id", userId).select("*").single();
    if (updateError) throw new Error("The briefing was created but could not be saved.");
    return Response.json({ competitor: updated });
  } catch (error) {
    console.error("Circuit competitor research failed.", error);
    return Response.json({ message: error instanceof Error ? error.message : "Competitor research failed." }, { status: 502 });
  }
}
