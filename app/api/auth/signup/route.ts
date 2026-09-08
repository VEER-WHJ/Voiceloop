import { requestHasAllowedOrigin } from "@/lib/auth/request";
import { createAuthSupabaseClient } from "@/lib/supabase/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!requestHasAllowedOrigin(request)) {
    return Response.json({ message: "Cross-origin account creation is not allowed." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { email?: unknown; password?: unknown };
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || password.length < 8) {
      return Response.json({ message: "Use a valid email and a password with at least 8 characters." }, { status: 400 });
    }

    const { data, error } = await (await createAuthSupabaseClient()).auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${new URL(request.url).origin}/auth/callback` },
    });
    if (error) return Response.json({ message: error.message }, { status: 400 });
    return Response.json(
      { ok: true, signedIn: Boolean(data.session), confirmationRequired: !data.session },
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return Response.json({ message: "Circuit could not create your account." }, { status: 500 });
  }
}
