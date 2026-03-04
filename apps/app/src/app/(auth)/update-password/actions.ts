"use server";

import { createClient } from "@mooch/db/server";

export async function updatePasswordAction(password: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  return { error: error?.message ?? null };
}
