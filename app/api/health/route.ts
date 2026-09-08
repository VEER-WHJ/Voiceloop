export const dynamic = "force-dynamic";

export function GET() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
      process.env.OPENAI_API_KEY,
  );

  return Response.json(
    { status: configured ? "ready" : "configuration_required" },
    { status: configured ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
