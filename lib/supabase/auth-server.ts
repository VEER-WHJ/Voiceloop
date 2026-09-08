import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "./database.types";

function requirePublicEnvironment() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase authentication is not configured.");
  return { url, key };
}

export async function createAuthSupabaseClient() {
  const cookieStore = await cookies();
  const { url, key } = requirePublicEnvironment();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => {
        for (const { name, value, options } of values) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });
}
