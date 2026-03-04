"use server";

import { createClient } from "@mooch/db/server";
import { redirect } from "next/navigation";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

async function getUniqueInviteCode(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateInviteCode();
    const { data } = await supabase
      .from("groups")
      .select("id")
      .eq("invite_code", code)
      .maybeSingle();
    if (!data) return code;
  }
  throw new Error("Failed to generate unique invite code");
}

export async function createGroup(formData: {
  name: string;
  emoji: string;
  currency: string;
  locale: string;
  cover_photo_url?: string;
}): Promise<{ groupId: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const invite_code = await getUniqueInviteCode(supabase);

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({
      name: formData.name,
      emoji: formData.emoji,
      currency: formData.currency,
      locale: formData.locale,
      cover_photo_url: formData.cover_photo_url ?? null,
      invite_code,
      created_by: user.id,
    })
    .select()
    .single();

  if (groupError) return { error: groupError.message };

  const { error: memberError } = await supabase
    .from("group_members")
    .insert({ group_id: group.id, user_id: user.id, role: "admin" });

  if (memberError) return { error: memberError.message };

  return { groupId: group.id };
}

export async function joinGroupByCode(
  inviteCode: string,
): Promise<{ groupId: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: group, error: lookupError } = await supabase
    .from("groups")
    .select("id")
    .eq("invite_code", inviteCode.toUpperCase())
    .maybeSingle();

  if (lookupError || !group) return { error: "Invalid invite code" };

  const { data: existing } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return { groupId: group.id };

  const { error: joinError } = await supabase
    .from("group_members")
    .insert({ group_id: group.id, user_id: user.id, role: "member" });

  if (joinError) return { error: joinError.message };

  return { groupId: group.id };
}

export async function updateGroup(
  groupId: string,
  data: Partial<{
    name: string;
    emoji: string;
    cover_photo_url: string | null;
    currency: string;
    locale: string;
  }>,
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("groups")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", groupId);

  if (error) return { error: error.message };
}

export async function leaveGroup(
  groupId: string,
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Prevent last admin from leaving
  const { data: admins } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("role", "admin");

  const isOnlyAdmin =
    admins?.length === 1 && admins[0].user_id === user.id;
  if (isOnlyAdmin) {
    return { error: "You are the only admin. Promote another member before leaving." };
  }

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
}

export async function deleteGroup(
  groupId: string,
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: member } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (member?.role !== "admin") return { error: "Only admins can delete the group" };

  const { error } = await supabase
    .from("groups")
    .delete()
    .eq("id", groupId);

  if (error) return { error: error.message };
}

export async function regenerateInviteCode(
  groupId: string,
): Promise<{ invite_code: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: member } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (member?.role !== "admin") return { error: "Only admins can regenerate the invite code" };

  const invite_code = await getUniqueInviteCode(supabase);

  const { error } = await supabase
    .from("groups")
    .update({ invite_code, updated_at: new Date().toISOString() })
    .eq("id", groupId);

  if (error) return { error: error.message };

  return { invite_code };
}

export async function removeMember(
  groupId: string,
  userId: string,
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: member } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (member?.role !== "admin") return { error: "Only admins can remove members" };

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) return { error: error.message };
}
