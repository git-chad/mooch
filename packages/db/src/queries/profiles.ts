import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@mooch/types";

export async function getProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) return null;
  return data as Profile;
}

export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  data: Partial<Pick<Profile, "display_name" | "photo_url" | "locale" | "default_currency">>,
): Promise<Profile | null> {
  const { data: updated, error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", userId)
    .select()
    .single();

  if (error) return null;
  return updated as Profile;
}
