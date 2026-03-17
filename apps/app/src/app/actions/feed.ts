"use server";

import { createClient } from "@mooch/db/server";
import type { FeedItem, FeedItemType, FeedReaction, GroupMember } from "@mooch/types";
import { createAdminClient } from "@/lib/supabase-admin";

const TEXT_MAX_CHARS = 500;
const CAPTION_MAX_CHARS = 200;
const VOICE_MAX_SECONDS = 60;

type GroupRole = GroupMember["role"];

type AddFeedItemInput = {
  type: FeedItemType;
  caption?: string | null;
  media_path?: string | null;
  duration_seconds?: number | null;
  linked_expense_id?: string | null;
  linked_poll_id?: string | null;
  linked_event_id?: string | null;
};

type ToggleStatus = "added" | "removed" | "switched";

function normalizeCaption(value?: string | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function canModerate(role: GroupRole | null): boolean {
  return role === "admin" || role === "owner";
}

async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function getMemberRole(
  groupId: string,
  userId: string,
): Promise<GroupRole | null> {
  const admin = createAdminClient();
  const { data: member } = await admin
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  return (member?.role as GroupRole | undefined) ?? null;
}

export async function addFeedItem(
  groupId: string,
  data: AddFeedItemInput,
): Promise<{ item: FeedItem } | { error: string }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "Not authenticated" };

  const role = await getMemberRole(groupId, userId);
  if (!role) return { error: "Not a member of this group" };

  if (data.linked_event_id) {
    return { error: "Event linking is not available yet." };
  }

  const caption = normalizeCaption(data.caption);
  const media_path = data.media_path?.trim() || null;
  const duration_seconds = data.duration_seconds ?? null;

  if (data.type === "text") {
    if (!caption) return { error: "Text posts cannot be empty" };
    if (caption.length > TEXT_MAX_CHARS) {
      return { error: `Text posts must be ${TEXT_MAX_CHARS} characters or fewer` };
    }
    if (media_path) return { error: "Text posts cannot include media" };
    if (duration_seconds != null) return { error: "Text posts cannot include duration" };
  } else {
    if (!media_path) return { error: "Media path is required for photo/voice posts" };
    if (caption && caption.length > CAPTION_MAX_CHARS) {
      return { error: `Caption must be ${CAPTION_MAX_CHARS} characters or fewer` };
    }
  }

  if (data.type === "voice") {
    if (duration_seconds == null) {
      return { error: "Voice posts must include duration" };
    }
    if (duration_seconds <= 0 || duration_seconds > VOICE_MAX_SECONDS) {
      return { error: `Voice notes must be between 1 and ${VOICE_MAX_SECONDS} seconds` };
    }
  } else if (duration_seconds != null) {
    return { error: "Only voice posts can include duration" };
  }

  const admin = createAdminClient();
  const { data: item, error } = await admin
    .from("feed_items")
    .insert({
      group_id: groupId,
      type: data.type,
      media_path,
      caption,
      duration_seconds,
      linked_expense_id: data.linked_expense_id ?? null,
      linked_event_id: null,
      linked_poll_id: data.linked_poll_id ?? null,
      created_by: userId,
    })
    .select("*")
    .single();

  if (error || !item) return { error: error?.message ?? "Failed to create feed item" };

  return { item: item as FeedItem };
}

export async function deleteFeedItem(
  itemId: string,
): Promise<{ success: true } | { error: string }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "Not authenticated" };

  const admin = createAdminClient();
  const { data: item } = await admin
    .from("feed_items")
    .select("id, group_id, created_by")
    .eq("id", itemId)
    .maybeSingle();

  if (!item) return { error: "Feed item not found" };

  const role = await getMemberRole(item.group_id, userId);
  if (!role) return { error: "Not a member of this group" };

  if (item.created_by !== userId && !canModerate(role)) {
    return { error: "Only the creator or a group admin can delete this post" };
  }

  const { error } = await admin.from("feed_items").delete().eq("id", itemId);
  if (error) return { error: error.message };

  return { success: true };
}

export async function toggleReaction(
  itemId: string,
  emoji: string,
): Promise<
  | { status: ToggleStatus; reaction: FeedReaction | null }
  | { error: string }
> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "Not authenticated" };

  const normalizedEmoji = emoji.trim();
  if (!normalizedEmoji) return { error: "Emoji is required" };
  if (normalizedEmoji.length > 16) return { error: "Emoji is too long" };

  const admin = createAdminClient();
  const { data: item } = await admin
    .from("feed_items")
    .select("id, group_id")
    .eq("id", itemId)
    .maybeSingle();

  if (!item) return { error: "Feed item not found" };

  const role = await getMemberRole(item.group_id, userId);
  if (!role) return { error: "Not a member of this group" };

  const { data: existing } = await admin
    .from("feed_reactions")
    .select("*")
    .eq("feed_item_id", itemId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.emoji === normalizedEmoji) {
    const { error: deleteError } = await admin
      .from("feed_reactions")
      .delete()
      .eq("feed_item_id", itemId)
      .eq("user_id", userId);

    if (deleteError) return { error: deleteError.message };

    return { status: "removed", reaction: null };
  }

  if (existing) {
    const { data: updated, error: updateError } = await admin
      .from("feed_reactions")
      .update({ emoji: normalizedEmoji })
      .eq("feed_item_id", itemId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (updateError || !updated) {
      return { error: updateError?.message ?? "Failed to update reaction" };
    }

    return { status: "switched", reaction: updated as FeedReaction };
  }

  const { data: inserted, error: insertError } = await admin
    .from("feed_reactions")
    .insert({
      feed_item_id: itemId,
      user_id: userId,
      emoji: normalizedEmoji,
    })
    .select("*")
    .single();

  if (insertError || !inserted) {
    return { error: insertError?.message ?? "Failed to add reaction" };
  }

  return { status: "added", reaction: inserted as FeedReaction };
}
