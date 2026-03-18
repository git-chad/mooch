"use server";

import { createClient } from "@mooch/db/server";
import {
  buildFeedPhotoPath,
  buildFeedVoicePath,
  PHOTO_MAX_UPLOAD_BYTES,
  pathMatchesGroup,
} from "@mooch/db/storage/feed";
import { isR2Configured, uploadToR2 } from "@mooch/db/storage/r2";
import type {
  FeedItem,
  FeedItemType,
  FeedReaction,
  FeedReply,
  GroupMember,
} from "@mooch/types";
import {
  deleteFeedMediaForPath,
  getSignedFeedMediaUrlForPath,
} from "@/lib/feed-media";
import { createAdminClient } from "@/lib/supabase-admin";

const TEXT_MAX_CHARS = 500;
const CAPTION_MAX_CHARS = 200;
const VOICE_MAX_SECONDS = 60;
const VOICE_MAX_BYTES = 5 * 1024 * 1024;

// Mention pattern: @[Display Name](userId)
const MENTION_PATTERN = /@\[([^\]]+)\]\(([a-f0-9-]+)\)/g;

function extractMentionIds(text: string | null | undefined): string[] {
  if (!text) return [];
  const ids: string[] = [];
  for (const match of text.matchAll(MENTION_PATTERN)) {
    const id = match[2];
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

async function syncMentions(
  admin: ReturnType<typeof createAdminClient>,
  mentionedUserIds: string[],
  opts: { feedItemId?: string; feedReplyId?: string },
) {
  const { feedItemId, feedReplyId } = opts;

  // Delete existing mentions for this parent
  if (feedItemId) {
    await admin.from("feed_mentions").delete().eq("feed_item_id", feedItemId);
  } else if (feedReplyId) {
    await admin.from("feed_mentions").delete().eq("feed_reply_id", feedReplyId);
  }

  if (mentionedUserIds.length === 0) return;

  const rows = mentionedUserIds.map((userId) => ({
    feed_item_id: feedItemId ?? null,
    feed_reply_id: feedReplyId ?? null,
    mentioned_user_id: userId,
  }));

  await admin.from("feed_mentions").insert(rows);
}

type GroupRole = GroupMember["role"];

type AddFeedItemInput = {
  type: FeedItemType;
  caption?: string | null;
  media_path?: string | null;
  duration_seconds?: number | null;
  linked_expense_id?: string | null;
  linked_poll_id?: string | null;
  linked_event_id?: string | null;
  location_name?: string | null;
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

function normalizeFileType(value: string | null | undefined): string {
  return value?.trim().toLowerCase() || "application/octet-stream";
}

function isAllowedPhotoType(contentType: string): boolean {
  return [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
  ].includes(contentType);
}

function isAllowedVoiceType(contentType: string): boolean {
  return [
    "audio/webm",
    "audio/mpeg",
    "audio/mp4",
    "audio/wav",
    "audio/x-wav",
    "audio/ogg",
  ].includes(contentType);
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

async function requireGroupMembership(
  groupId: string,
): Promise<{ userId: string; role: GroupRole } | { error: string }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "Not authenticated" };

  const role = await getMemberRole(groupId, userId);
  if (!role) return { error: "Not a member of this group" };

  return { userId, role };
}

async function uploadFeedFileToR2(
  groupId: string,
  file: File,
  options: {
    kind: "photo" | "voice";
    maxBytes: number;
    isAllowedType: (contentType: string) => boolean;
  },
): Promise<{ media_path: string } | { error: string }> {
  if (!isR2Configured()) {
    return { error: "Cloudflare R2 is not configured yet." };
  }

  const membership = await requireGroupMembership(groupId);
  if ("error" in membership) return membership;

  const contentType = normalizeFileType(file.type);
  if (!options.isAllowedType(contentType)) {
    return {
      error:
        options.kind === "photo"
          ? "Unsupported image format."
          : "Unsupported audio format.",
    };
  }

  if (file.size <= 0) {
    return { error: "Upload cannot be empty." };
  }

  if (file.size > options.maxBytes) {
    return {
      error:
        options.kind === "photo"
          ? "Photo exceeds the 3MB limit."
          : "Voice note exceeds the 5MB limit.",
    };
  }

  const media_path =
    options.kind === "photo"
      ? buildFeedPhotoPath(groupId, file.name, contentType)
      : buildFeedVoicePath(groupId, contentType);

  await uploadToR2(
    media_path,
    new Uint8Array(await file.arrayBuffer()),
    contentType,
  );
  return { media_path };
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
  const linked_expense_id = data.linked_expense_id?.trim() || null;
  const linked_poll_id = data.linked_poll_id?.trim() || null;
  const location_name = data.location_name?.trim()?.slice(0, 100) || null;

  if (data.type === "text") {
    if (!caption) return { error: "Text posts cannot be empty" };
    if (caption.length > TEXT_MAX_CHARS) {
      return {
        error: `Text posts must be ${TEXT_MAX_CHARS} characters or fewer`,
      };
    }
    if (media_path) return { error: "Text posts cannot include media" };
    if (duration_seconds != null)
      return { error: "Text posts cannot include duration" };
  } else {
    if (!media_path)
      return { error: "Media path is required for photo/voice posts" };
    if (caption && caption.length > CAPTION_MAX_CHARS) {
      return {
        error: `Caption must be ${CAPTION_MAX_CHARS} characters or fewer`,
      };
    }
  }

  if (data.type === "voice") {
    if (duration_seconds == null) {
      return { error: "Voice posts must include duration" };
    }
    if (duration_seconds <= 0 || duration_seconds > VOICE_MAX_SECONDS) {
      return {
        error: `Voice notes must be between 1 and ${VOICE_MAX_SECONDS} seconds`,
      };
    }
  } else if (duration_seconds != null) {
    return { error: "Only voice posts can include duration" };
  }

  const admin = createAdminClient();

  if (linked_expense_id) {
    const { data: expense, error: expenseError } = await admin
      .from("expenses")
      .select("id, group_id")
      .eq("id", linked_expense_id)
      .maybeSingle();

    if (expenseError) {
      return { error: expenseError.message };
    }
    if (!expense) {
      return { error: "Linked expense not found." };
    }
    if (expense.group_id !== groupId) {
      return { error: "Linked expense must belong to this group." };
    }
  }

  if (linked_poll_id) {
    const { data: poll, error: pollError } = await admin
      .from("polls")
      .select("id, group_id")
      .eq("id", linked_poll_id)
      .maybeSingle();

    if (pollError) {
      return { error: pollError.message };
    }
    if (!poll) {
      return { error: "Linked poll not found." };
    }
    if (poll.group_id !== groupId) {
      return { error: "Linked poll must belong to this group." };
    }
  }

  const { data: item, error } = await admin
    .from("feed_items")
    .insert({
      group_id: groupId,
      type: data.type,
      media_path,
      caption,
      duration_seconds,
      linked_expense_id,
      linked_event_id: null,
      linked_poll_id,
      location_name,
      created_by: userId,
    })
    .select("*")
    .single();

  if (error || !item)
    return { error: error?.message ?? "Failed to create feed item" };

  const mentionIds = extractMentionIds(caption);
  if (mentionIds.length > 0) {
    await syncMentions(admin, mentionIds, { feedItemId: item.id as string });
  }

  return { item: item as FeedItem };
}

export async function uploadFeedPhotoToR2(
  groupId: string,
  formData: FormData,
): Promise<{ media_path: string } | { error: string }> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "Photo file is required." };
  }

  return uploadFeedFileToR2(groupId, file, {
    kind: "photo",
    maxBytes: PHOTO_MAX_UPLOAD_BYTES,
    isAllowedType: isAllowedPhotoType,
  });
}

export async function uploadFeedVoiceToR2(
  groupId: string,
  formData: FormData,
): Promise<{ media_path: string } | { error: string }> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "Voice file is required." };
  }

  return uploadFeedFileToR2(groupId, file, {
    kind: "voice",
    maxBytes: VOICE_MAX_BYTES,
    isAllowedType: isAllowedVoiceType,
  });
}

export async function getFeedMediaUrl(
  groupId: string,
  mediaPath: string,
): Promise<string | null> {
  const membership = await requireGroupMembership(groupId);
  if ("error" in membership) return null;
  if (!pathMatchesGroup(mediaPath, groupId)) return null;
  return getSignedFeedMediaUrlForPath(mediaPath);
}

export async function deleteUploadedFeedMedia(
  groupId: string,
  mediaPath: string,
): Promise<{ success: true } | { error: string }> {
  const membership = await requireGroupMembership(groupId);
  if ("error" in membership) return membership;
  if (!pathMatchesGroup(mediaPath, groupId)) {
    return { error: "Media path does not belong to this group." };
  }

  try {
    await deleteFeedMediaForPath(mediaPath);
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not delete uploaded media.",
    };
  }
}

export async function editFeedItem(
  itemId: string,
  data: { caption: string; location_name?: string | null },
): Promise<{ item: FeedItem } | { error: string }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "Not authenticated" };

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("feed_items")
    .select("id, group_id, type, created_by")
    .eq("id", itemId)
    .maybeSingle();

  if (!existing) return { error: "Feed item not found" };
  if (existing.created_by !== userId) {
    return { error: "Only the creator can edit this post" };
  }

  const role = await getMemberRole(existing.group_id, userId);
  if (!role) return { error: "Not a member of this group" };

  const caption = normalizeCaption(data.caption);

  if (existing.type === "text") {
    if (!caption) return { error: "Text posts cannot be empty" };
    if (caption.length > TEXT_MAX_CHARS) {
      return {
        error: `Text posts must be ${TEXT_MAX_CHARS} characters or fewer`,
      };
    }
  } else {
    if (caption && caption.length > CAPTION_MAX_CHARS) {
      return {
        error: `Caption must be ${CAPTION_MAX_CHARS} characters or fewer`,
      };
    }
  }

  const { data: updated, error } = await admin
    .from("feed_items")
    .update({
      caption,
      edited_at: new Date().toISOString(),
      ...(data.location_name !== undefined && {
        location_name: data.location_name?.trim()?.slice(0, 100) || null,
      }),
    })
    .eq("id", itemId)
    .select("*")
    .single();

  if (error || !updated) {
    return { error: error?.message ?? "Failed to update feed item" };
  }

  const mentionIds = extractMentionIds(caption);
  await syncMentions(admin, mentionIds, { feedItemId: itemId });

  return { item: updated as FeedItem };
}

export async function deleteFeedItem(
  itemId: string,
): Promise<{ success: true } | { error: string }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "Not authenticated" };

  const admin = createAdminClient();
  const { data: item } = await admin
    .from("feed_items")
    .select("id, group_id, created_by, media_path")
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

  if (item.media_path) {
    try {
      await deleteFeedMediaForPath(item.media_path as string);
    } catch (error) {
      console.error("Failed to delete feed media object", {
        itemId,
        mediaPath: item.media_path,
        error,
      });
    }
  }

  return { success: true };
}

export async function toggleReaction(
  itemId: string,
  emoji: string,
): Promise<
  { status: ToggleStatus; reaction: FeedReaction | null } | { error: string }
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

// --- Replies ---

const REPLY_MAX_CHARS = 500;

export async function addReply(
  feedItemId: string,
  content: string,
): Promise<{ reply: FeedReply } | { error: string }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "Not authenticated" };

  const trimmed = content.trim();
  if (!trimmed) return { error: "Reply cannot be empty" };
  if (trimmed.length > REPLY_MAX_CHARS) {
    return { error: `Reply must be ${REPLY_MAX_CHARS} characters or fewer` };
  }

  const admin = createAdminClient();
  const { data: item } = await admin
    .from("feed_items")
    .select("id, group_id")
    .eq("id", feedItemId)
    .maybeSingle();

  if (!item) return { error: "Feed item not found" };

  const role = await getMemberRole(item.group_id, userId);
  if (!role) return { error: "Not a member of this group" };

  const { data: reply, error } = await admin
    .from("feed_replies")
    .insert({
      feed_item_id: feedItemId,
      user_id: userId,
      content: trimmed,
    })
    .select("*")
    .single();

  if (error || !reply) {
    return { error: error?.message ?? "Failed to add reply" };
  }

  const mentionIds = extractMentionIds(trimmed);
  if (mentionIds.length > 0) {
    await syncMentions(admin, mentionIds, {
      feedReplyId: reply.id as string,
    });
  }

  return { reply: reply as FeedReply };
}

export async function deleteReply(
  replyId: string,
): Promise<{ success: true } | { error: string }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { error: "Not authenticated" };

  const admin = createAdminClient();
  const { data: reply } = await admin
    .from("feed_replies")
    .select("id, user_id, feed_item_id")
    .eq("id", replyId)
    .maybeSingle();

  if (!reply) return { error: "Reply not found" };
  if (reply.user_id !== userId) {
    return { error: "Only the author can delete this reply" };
  }

  const { error } = await admin.from("feed_replies").delete().eq("id", replyId);

  if (error) return { error: error.message };
  return { success: true };
}
