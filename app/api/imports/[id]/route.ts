import { requireSession, requestHasAllowedOrigin, unauthorized } from "@/lib/auth/request";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function DELETE(request: Request, context: RouteContext<"/api/imports/[id]">) {
  if (!(await requireSession())) return unauthorized();
  if (!requestHasAllowedOrigin(request)) {
    return Response.json({ message: "Cross-origin changes are not allowed." }, { status: 403 });
  }

  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) {
    return Response.json({ message: "Invalid import identifier." }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { count, error: countError } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("import_batch_id", id);
  if (countError) {
    return Response.json({ message: "The import could not be inspected." }, { status: 502 });
  }

  const { error } = await supabase.from("import_batches").delete().eq("id", id);
  if (error) {
    return Response.json({ message: "The import could not be undone." }, { status: 502 });
  }

  return Response.json({ removedReviews: count ?? 0 });
}
