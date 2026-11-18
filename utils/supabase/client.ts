"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/utils/supabase/env";
import type { Database } from "@/utils/supabase/database.types";

export function createClient() {
  const { url, publishableKey } = getSupabaseEnv();
  return createBrowserClient<Database>(url, publishableKey);
}
