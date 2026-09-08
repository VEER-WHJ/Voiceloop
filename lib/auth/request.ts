import { createAuthSupabaseClient } from "@/lib/supabase/auth-server";

export function requestHasAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function requireSession() {
  const { data, error } = await (await createAuthSupabaseClient()).auth.getUser();
  return error ? null : data.user?.id ?? null;
}

export function unauthorized() {
  return Response.json(
    { message: "Your Circuit session has expired. Sign in again." },
    { status: 401, headers: { "Cache-Control": "no-store" } },
  );
}
