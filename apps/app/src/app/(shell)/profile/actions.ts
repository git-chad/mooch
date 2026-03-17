"use server";

import { createClient } from "@mooch/db/server";

export async function signOutProfileAction(): Promise<{
  ok?: true;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) return { error: error.message };
    return { ok: true };
  } catch {
    return { error: "Failed to sign out. Please try again." };
  }
}
