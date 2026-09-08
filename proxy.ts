import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isLoginRoute = pathname === "/login";
  const isAuthCallback = pathname === "/auth/callback";
  const isPublicApi = pathname === "/api/auth/login" || pathname === "/api/auth/signup" || pathname === "/api/health";
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (values) => {
          for (const { name, value } of values) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of values) response.cookies.set(name, value, options);
        },
      },
    },
  );
  const { data } = await supabase.auth.getClaims();
  const validSession = Boolean(data?.claims?.sub);

  if (isPublicApi || isAuthCallback) return response;

  if (isLoginRoute) {
    return validSession
      ? NextResponse.redirect(new URL("/", request.url))
      : response;
  }

  if (!validSession) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { message: "Circuit account access is required." },
        { status: 401 },
      );
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp)$).*)"],
};
