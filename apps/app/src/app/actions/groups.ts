"use server";

import { createClient } from "@mooch/db/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase-admin";

const GROUP_COVER_MAX_SIZE_BYTES = 1 * 1024 * 1024;
const GROUP_COVER_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

async function getUniqueInviteCode(supabase: SupabaseClient): Promise<string> {
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

async function ensureGroupCoversBucket(
  admin: SupabaseClient,
): Promise<{ error: string } | undefined> {
  const { data: bucket, error: bucketError } =
    await admin.storage.getBucket("group-covers");

  if (bucket) return;

  const isNotFound =
    bucketError?.message?.toLowerCase().includes("not found") ||
    (bucketError as { statusCode?: number | string } | null)?.statusCode ===
      404 ||
    (bucketError as { statusCode?: number | string } | null)?.statusCode ===
      "404";

  if (bucketError && !isNotFound) {
    return { error: bucketError.message };
  }

  const { error: createBucketError } = await admin.storage.createBucket(
    "group-covers",
    {
      public: true,
      fileSizeLimit: "1MB",
    },
  );

  if (
    createBucketError &&
    !createBucketError.message.toLowerCase().includes("already exists")
  ) {
    return { error: createBucketError.message };
  }
}

export async function uploadGroupCover(
  formData: FormData,
): Promise<{ publicUrl: string } | { error: string }> {
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const file = formData.get("cover");
  if (!(file instanceof File)) {
    return { error: "No cover image selected." };
  }

  if (file.size > GROUP_COVER_MAX_SIZE_BYTES) {
    return { error: "File is too large. Maximum size is 1 MB." };
  }

  if (file.type && !GROUP_COVER_ALLOWED_TYPES.has(file.type.toLowerCase())) {
    return { error: "Unsupported format. Use PNG, JPG, or WEBP." };
  }

  const ensureBucketResult = await ensureGroupCoversBucket(admin);
  if (ensureBucketResult) return ensureBucketResult;

  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
  const path = `${user.id}/${Date.now()}-${cleanName}`;

  const { error: uploadError } = await admin.storage
    .from("group-covers")
    .upload(path, file, {
      contentType: file.type || undefined,
      upsert: false,
    });

  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = admin.storage.from("group-covers").getPublicUrl(path);

  return { publicUrl };
}

export async function createGroup(formData: {
  name: string;
  emoji: string;
  currency: string;
  locale: string;
  cover_photo_url?: string;
}): Promise<{ groupId: string } | { error: string }> {
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const invite_code = await getUniqueInviteCode(admin);
  const groupId = crypto.randomUUID();

  const { error: groupError } = await admin.from("groups").insert({
    id: groupId,
    name: formData.name,
    emoji: formData.emoji,
    currency: formData.currency,
    locale: formData.locale,
    cover_photo_url: formData.cover_photo_url ?? null,
    invite_code,
    created_by: user.id,
  });

  if (groupError) return { error: groupError.message };

  const { error: memberError } = await admin
    .from("group_members")
    .insert({ group_id: groupId, user_id: user.id, role: "admin" });

  if (memberError) return { error: memberError.message };

  return { groupId };
}

export async function joinGroupByCode(
  inviteCode: string,
): Promise<{ groupId: string } | { error: string }> {
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: group, error: lookupError } = await admin
    .from("groups")
    .select("id")
    .eq("invite_code", inviteCode.toUpperCase())
    .maybeSingle();

  if (lookupError || !group) return { error: "Invalid invite code" };

  const { data: existing } = await admin
    .from("group_members")
    .select("user_id")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return { groupId: group.id };

  const { error: joinError } = await admin
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
): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await admin
    .from("groups")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", groupId);

  if (error) return { error: error.message };
}

export async function leaveGroup(
  groupId: string,
): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Prevent last admin from leaving
  const { data: admins } = await admin
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("role", "admin");

  const isOnlyAdmin = admins?.length === 1 && admins[0].user_id === user.id;
  if (isOnlyAdmin) {
    return {
      error: "You are the only admin. Promote another member before leaving.",
    };
  }

  const { error } = await admin
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
}

export async function deleteGroup(
  groupId: string,
): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: member } = await admin
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (member?.role !== "admin")
    return { error: "Only admins can delete the group" };

  const { error } = await admin.from("groups").delete().eq("id", groupId);

  if (error) return { error: error.message };
}

export async function regenerateInviteCode(
  groupId: string,
): Promise<{ invite_code: string } | { error: string }> {
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: member } = await admin
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (member?.role !== "admin")
    return { error: "Only admins can regenerate the invite code" };

  const invite_code = await getUniqueInviteCode(admin);

  const { error } = await admin
    .from("groups")
    .update({ invite_code, updated_at: new Date().toISOString() })
    .eq("id", groupId);

  if (error) return { error: error.message };

  return { invite_code };
}

export async function removeMember(
  groupId: string,
  userId: string,
): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: member } = await admin
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (member?.role !== "admin")
    return { error: "Only admins can remove members" };

  const { data: targetMember } = await admin
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!targetMember) return { error: "Member not found" };

  if (targetMember.role === "admin") {
    const { data: admins } = await admin
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId)
      .eq("role", "admin");

    if (admins?.length === 1) {
      return { error: "Cannot remove the last admin" };
    }
  }

  const { error } = await admin
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) return { error: error.message };
}

export async function updateMemberRole(
  groupId: string,
  userId: string,
  role: "admin" | "member",
): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: member } = await admin
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (member?.role !== "admin")
    return { error: "Only admins can change roles" };

  const { data: targetMember } = await admin
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!targetMember) return { error: "Member not found" };

  if (targetMember.role === role) return;

  if (targetMember.role === "admin" && role === "member") {
    const { data: admins } = await admin
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId)
      .eq("role", "admin");

    if (admins?.length === 1) {
      return { error: "Cannot demote the last admin" };
    }
  }

  const { error } = await admin
    .from("group_members")
    .update({ role })
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) return { error: error.message };
}
