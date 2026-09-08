import { requestHasAllowedOrigin } from "@/lib/auth/request";
import { createAuthSupabaseClient } from "@/lib/supabase/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!requestHasAllowedOrigin(request)) {
    return Response.json({ message: "Cross-origin sign-in is not allowed." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { email?: unknown; password?: unknown };
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || password.length < 8) {
      return Response.json({ message: "Enter your email and password." }, { status: 400 });
    }

    const { error } = await (await createAuthSupabaseClient()).auth.signInWithPassword({ email, password });
    if (error) return Response.json({ message: "Email or password is incorrect." }, { status: 401 });
    return Response.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ message: "Circuit could not sign you in." }, { status: 500 });
  }
}
