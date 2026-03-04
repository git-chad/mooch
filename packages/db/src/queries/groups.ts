import type { SupabaseClient } from "@supabase/supabase-js";
import type { Group, GroupMember, Profile } from "@mooch/types";

export async function getGroupsByUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<Group[]> {
  const { data, error } = await supabase
    .from("groups")
    .select("*, group_members!inner(user_id)")
    .eq("group_members.user_id", userId);

  if (error) return [];
  return data as Group[];
}

export async function getGroupById(
  supabase: SupabaseClient,
  groupId: string,
): Promise<(Group & { members: (GroupMember & { profile: Profile })[] }) | null> {
  const { data, error } = await supabase
    .from("groups")
    .select("*, members:group_members(*, profile:profiles(*))")
    .eq("id", groupId)
    .single();

  if (error) return null;
  return data as Group & { members: (GroupMember & { profile: Profile })[] };
}

export async function getGroupMembers(
  supabase: SupabaseClient,
  groupId: string,
): Promise<(GroupMember & { profile: Profile })[]> {
  const { data, error } = await supabase
    .from("group_members")
    .select("*, profile:profiles(*)")
    .eq("group_id", groupId);

  if (error) return [];
  return data as (GroupMember & { profile: Profile })[];
}
