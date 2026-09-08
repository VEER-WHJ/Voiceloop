import { requestHasAllowedOrigin } from "@/lib/auth/request";
import { createAuthSupabaseClient } from "@/lib/supabase/auth-server";

export async function POST(request: Request) {
  if (!requestHasAllowedOrigin(request)) {
    return Response.json({ message: "Cross-origin sign-out is not allowed." }, { status: 403 });
  }

  await (await createAuthSupabaseClient()).auth.signOut();
  return Response.json({ ok: true });
}
