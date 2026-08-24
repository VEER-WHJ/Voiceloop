import { cookies } from "next/headers";

import { requestHasAllowedOrigin } from "@/lib/auth/request";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function POST(request: Request) {
  if (!requestHasAllowedOrigin(request)) {
    return Response.json({ message: "Cross-origin sign-out is not allowed." }, { status: 403 });
  }

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return Response.json({ ok: true });
}
