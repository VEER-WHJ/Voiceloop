import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Supabase server environment variables are not configured.");
  }

  return createClient<Database>(supabaseUrl, supabasePublishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
