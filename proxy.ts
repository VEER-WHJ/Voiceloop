import { NextResponse, type NextRequest } from "next/server";

import { isValidSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isLoginRoute = pathname === "/login";
  const isPublicApi = pathname === "/api/auth/login" || pathname === "/api/health";
  const validSession = await isValidSession(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
  );

  if (isPublicApi) return NextResponse.next();

  if (isLoginRoute) {
    return validSession
      ? NextResponse.redirect(new URL("/", request.url))
      : NextResponse.next();
  }

  if (!validSession) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { message: "VoiceLoop access is required." },
        { status: 401 },
      );
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|csv)$).*)"],
};
