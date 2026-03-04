import { createBrowserClient } from "@mooch/db";
import type { SupabaseClient } from "@supabase/supabase-js";

declare global {
  // eslint-disable-next-line no-var
  var __supabase: SupabaseClient | undefined;
}

// Persists across Turbopack module re-evaluations and HMR so only one client
// instance ever exists in the browser — prevents Web Lock steal conflicts.
export const supabase: SupabaseClient =
  globalThis.__supabase ?? (globalThis.__supabase = createBrowserClient());
