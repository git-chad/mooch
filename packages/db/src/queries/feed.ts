import type { FeedItem, FeedReaction, Profile } from "@mooch/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type FeedReactionCount = {
  emoji: string;
  count: number;
};

export type FeedItemWithMeta = FeedItem & {
  created_by_profile: Profile;
  reactions: FeedReaction[];
  reaction_counts: FeedReactionCount[];
  current_user_reaction: string | null;
  total_reactions: number;
};

type RawFeedItem = FeedItem & {
  created_by_profile: Profile;
  feed_reactions: FeedReaction[] | null;
};

function toFeedItemWithMeta(
  item: RawFeedItem,
  userId?: string,
): FeedItemWithMeta {
  const reactions = (item.feed_reactions ?? []) as FeedReaction[];
  const counts = new Map<string, number>();

  for (const reaction of reactions) {
    counts.set(reaction.emoji, (counts.get(reaction.emoji) ?? 0) + 1);
  }

  const reaction_counts: FeedReactionCount[] = [...counts.entries()]
    .map(([emoji, count]) => ({ emoji, count }))
    .sort((a, b) => b.count - a.count);

  const current_user_reaction = userId
    ? reactions.find((r) => r.user_id === userId)?.emoji ?? null
    : null;

  return {
    ...item,
    feed_reactions: undefined,
    created_by_profile: item.created_by_profile as Profile,
    reactions,
    reaction_counts,
    current_user_reaction,
    total_reactions: reactions.length,
  } as FeedItemWithMeta;
}

export async function getFeedItems(
  supabase: SupabaseClient,
  groupId: string,
  cursor?: string,
  userId?: string,
): Promise<FeedItemWithMeta[]> {
  let query = supabase
    .from("feed_items")
    .select("*, created_by_profile:profiles!created_by(*), feed_reactions(*)")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((item) => toFeedItemWithMeta(item as RawFeedItem, userId));
}

export async function getFeedItemById(
  supabase: SupabaseClient,
  itemId: string,
  userId?: string,
): Promise<FeedItemWithMeta | null> {
  const { data, error } = await supabase
    .from("feed_items")
    .select("*, created_by_profile:profiles!created_by(*), feed_reactions(*)")
    .eq("id", itemId)
    .single();

  if (error || !data) return null;

  return toFeedItemWithMeta(data as RawFeedItem, userId);
}

export async function getSignedFeedMediaUrl(
  supabase: SupabaseClient,
  mediaPath: string,
  expiresInSeconds = 60 * 30,
): Promise<string | null> {
  if (!mediaPath) return null;

  const { data, error } = await supabase.storage
    .from("feed-media")
    .createSignedUrl(mediaPath, expiresInSeconds);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
