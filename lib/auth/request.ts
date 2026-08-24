import { cookies } from "next/headers";

import { isValidSession, SESSION_COOKIE_NAME } from "./session";

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
  const cookieStore = await cookies();
  return isValidSession(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export function unauthorized() {
  return Response.json(
    { message: "Your VoiceLoop session has expired. Refresh and sign in again." },
    { status: 401, headers: { "Cache-Control": "no-store" } },
  );
}
