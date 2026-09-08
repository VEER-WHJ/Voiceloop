import { NextResponse } from "next/server";

import { createAuthSupabaseClient } from "@/lib/supabase/auth-server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const { error } = await (await createAuthSupabaseClient()).auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/", url.origin));
  }
  return NextResponse.redirect(new URL("/login?error=confirmation", url.origin));
}
