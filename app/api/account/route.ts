import { createAuthSupabaseClient } from "@/lib/supabase/auth-server";
import { requestHasAllowedOrigin, unauthorized } from "@/lib/auth/request";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AccountInput = {
  companyName?: unknown;
  managerName?: unknown;
  roleTitle?: unknown;
};

function cleanField(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function getUser() {
  const { data, error } = await (await createAuthSupabaseClient()).auth.getUser();
  return error ? null : data.user;
}

export async function GET() {
  const user = await getUser();
  if (!user) return unauthorized();

  const { data, error } = await createServerSupabaseClient()
    .from("account_profiles")
    .select("company_name,manager_name,role_title")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (error) return Response.json({ message: "Account details could not be loaded." }, { status: 502 });

  return Response.json({
    account: {
      email: user.email ?? "",
      companyName: data?.company_name ?? "",
      managerName: data?.manager_name ?? "",
      roleTitle: data?.role_title ?? "",
    },
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request) {
  const user = await getUser();
  if (!user) return unauthorized();
  if (!requestHasAllowedOrigin(request)) {
    return Response.json({ message: "Cross-origin changes are not allowed." }, { status: 403 });
  }

  let body: AccountInput;
  try {
    body = (await request.json()) as AccountInput;
  } catch {
    return Response.json({ message: "The request body must be valid JSON." }, { status: 400 });
  }

  const companyName = cleanField(body.companyName);
  const managerName = cleanField(body.managerName);
  const roleTitle = cleanField(body.roleTitle);
  if ([companyName, managerName, roleTitle].some((value) => value.length > 120)) {
    return Response.json({ message: "Account fields must be 120 characters or fewer." }, { status: 400 });
  }

  const { data, error } = await createServerSupabaseClient()
    .from("account_profiles")
    .upsert({
      owner_user_id: user.id,
      company_name: companyName || null,
      manager_name: managerName || null,
      role_title: roleTitle || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "owner_user_id" })
    .select("company_name,manager_name,role_title")
    .single();
  if (error) return Response.json({ message: "Account details could not be saved." }, { status: 502 });

  return Response.json({
    account: {
      email: user.email ?? "",
      companyName: data.company_name ?? "",
      managerName: data.manager_name ?? "",
      roleTitle: data.role_title ?? "",
    },
  });
}
