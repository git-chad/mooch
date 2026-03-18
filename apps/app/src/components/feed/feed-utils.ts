import type { FeedItem, Profile } from "@mooch/types";
import type { FeedItemUI } from "./types";

export function sortByNewest(items: FeedItemUI[]): FeedItemUI[] {
  return [...items].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function uniqueById(items: FeedItemUI[]): FeedItemUI[] {
  const seen = new Map<string, FeedItemUI>();
  for (const item of items) {
    if (!seen.has(item.id)) {
      seen.set(item.id, item);
    }
  }
  return sortByNewest([...seen.values()]);
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function toCountsMap(item: FeedItemUI): Map<string, number> {
  const map = new Map<string, number>();
  for (const entry of item.reaction_counts) {
    map.set(entry.emoji, entry.count);
  }
  return map;
}

export function toggleReactionLocal(
  item: FeedItemUI,
  emoji: string,
): FeedItemUI {
  const prevEmoji = item.current_user_reaction;
  const nextEmoji = prevEmoji === emoji ? null : emoji;
  const counts = toCountsMap(item);

  if (prevEmoji) {
    const next = (counts.get(prevEmoji) ?? 0) - 1;
    if (next <= 0) counts.delete(prevEmoji);
    else counts.set(prevEmoji, next);
  }

  if (nextEmoji) {
    counts.set(nextEmoji, (counts.get(nextEmoji) ?? 0) + 1);
  }

  const reaction_counts = [...counts.entries()]
    .map(([k, v]) => ({ emoji: k, count: v }))
    .sort((a, b) => b.count - a.count);

  const total_reactions = reaction_counts.reduce(
    (sum, entry) => sum + entry.count,
    0,
  );

  return {
    ...item,
    reaction_counts,
    current_user_reaction: nextEmoji,
    total_reactions,
  };
}

export type CreatePayload = {
  type: FeedItem["type"];
  caption?: string | null;
  media_path?: string | null;
  local_object_url?: string | null;
  duration_seconds?: number | null;
  linked_expense_id?: string | null;
  linked_poll_id?: string | null;
};

export function buildOptimisticItem({
  tempId,
  groupId,
  profile,
  payload,
}: {
  tempId: string;
  groupId: string;
  profile: Profile;
  payload: CreatePayload;
}): FeedItemUI {
  const now = new Date().toISOString();

  return {
    id: tempId,
    group_id: groupId,
    type: payload.type,
    media_path: payload.media_path ?? null,
    media_url: payload.local_object_url ?? null,
    local_object_url: payload.local_object_url ?? null,
    caption: payload.caption?.trim() || null,
    duration_seconds: payload.duration_seconds ?? null,
    linked_expense_id: payload.linked_expense_id ?? null,
    linked_event_id: null,
    linked_poll_id: payload.linked_poll_id ?? null,
    created_by: profile.id,
    created_at: now,
    edited_at: null,
    created_by_profile: profile,
    reactions: [],
    reaction_counts: [],
    current_user_reaction: null,
    total_reactions: 0,
    optimistic: true,
  };
}

export function buildFallbackCreatedItem({
  created,
  profile,
  mediaUrl,
}: {
  created: FeedItem;
  profile: Profile;
  mediaUrl: string | null;
}): FeedItemUI {
  return {
    ...created,
    created_by_profile: profile,
    reactions: [],
    reaction_counts: [],
    current_user_reaction: null,
    total_reactions: 0,
    media_url: mediaUrl,
    local_object_url: null,
    optimistic: false,
  };
}
