"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/src/shared/lib/env";

export function createSupabaseBrowserClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
}