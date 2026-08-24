import { cookies } from "next/headers";

import { requestHasAllowedOrigin } from "@/lib/auth/request";
import {
  createSessionToken,
  isValidAccessCode,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
} from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!requestHasAllowedOrigin(request)) {
    return Response.json({ message: "Cross-origin sign-in is not allowed." }, { status: 403 });
  }

  let accessCode = "";
  try {
    const body = (await request.json()) as { accessCode?: unknown };
    accessCode = typeof body.accessCode === "string" ? body.accessCode.trim() : "";
  } catch {
    return Response.json({ message: "Enter the private access code." }, { status: 400 });
  }

  try {
    if (!accessCode || !(await isValidAccessCode(accessCode))) {
      return Response.json({ message: "That access code is not valid." }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, await createSessionToken(), {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_DURATION_SECONDS,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("VoiceLoop private access is not configured.", error);
    return Response.json(
      { message: "Private access is not configured on this deployment." },
      { status: 503 },
    );
  }
}
