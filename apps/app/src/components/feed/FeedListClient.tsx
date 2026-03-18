"use client";

import {
  createBrowserClient,
  getFeedItemById,
  getFeedItems,
  getSignedFeedMediaUrl,
  uploadFeedPhoto,
  uploadFeedVoice,
} from "@mooch/db";
import type { FeedItemWithMeta } from "@mooch/db";
import type { FeedItem, FeedItemType, Profile } from "@mooch/types";
import { Container, Text } from "@mooch/ui";
import {
  Camera,
  Loader2,
  MessageSquareText,
  Mic,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  addFeedItem,
  deleteFeedItem,
  toggleReaction,
} from "@/app/actions/feed";
import { EmptyState } from "@/components/EmptyState";
import { TransitionSlot } from "@/components/TransitionSlot";
import { getSurfaceTransition, motionDuration, motionEase } from "@/lib/motion";
import { ComposerDock, type ComposerDockItem } from "./ComposerDock";
import { FeedItemCard } from "./FeedItemCard";
import { ImageLightbox } from "./ImageLightbox";
import { PostPhotoSheet } from "./PostPhotoSheet";
import { PostTextSheet } from "./PostTextSheet";
import { RecordVoiceSheet } from "./RecordVoiceSheet";
import type { FeedItemUI, FeedLinkOption } from "./types";

const PAGE_SIZE = 20;
const revealedGroups = new Set<string>();

type Props = {
  groupId: string;
  currentUserProfile: Profile;
  initialItems: FeedItemUI[];
  pollOptions: FeedLinkOption[];
  expenseOptions: FeedLinkOption[];
};

type CreatePayload = {
  type: FeedItemType;
  caption?: string | null;
  media_path?: string | null;
  local_object_url?: string | null;
  duration_seconds?: number | null;
  linked_expense_id?: string | null;
  linked_poll_id?: string | null;
};

type LightboxPhoto = {
  id: string;
  url: string;
  caption: string | null;
  author: string;
  createdAt: string;
};

function sortByNewest(items: FeedItemUI[]): FeedItemUI[] {
  return [...items].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

function uniqueById(items: FeedItemUI[]): FeedItemUI[] {
  const seen = new Map<string, FeedItemUI>();
  for (const item of items) {
    if (!seen.has(item.id)) {
      seen.set(item.id, item);
    }
  }
  return sortByNewest([...seen.values()]);
}

function toCountsMap(item: FeedItemUI): Map<string, number> {
  const map = new Map<string, number>();
  for (const entry of item.reaction_counts) {
    map.set(entry.emoji, entry.count);
  }
  return map;
}

function toggleReactionLocal(item: FeedItemUI, emoji: string): FeedItemUI {
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

function buildOptimisticItem({
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
    created_by_profile: profile,
    reactions: [],
    reaction_counts: [],
    current_user_reaction: null,
    total_reactions: 0,
    optimistic: true,
  };
}

function buildFallbackCreatedItem({
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

export function FeedListClient({
  groupId,
  currentUserProfile,
  initialItems,
  pollOptions,
  expenseOptions,
}: Props) {
  const reducedMotion = useReducedMotion() ?? false;
  const supabase = useMemo(() => createBrowserClient(), []);

  const [items, setItems] = useState<FeedItemUI[]>(() =>
    uniqueById(initialItems),
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialItems.length >= PAGE_SIZE);
  const [textOpen, setTextOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [reactionBusy, setReactionBusy] = useState<Record<string, boolean>>({});
  const [lightboxItemId, setLightboxItemId] = useState<string | null>(null);

  const itemsRef = useRef(items);
  const prevGroupIdRef = useRef(groupId);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);
  const shouldAnimateIn = !revealedGroups.has(groupId);
  const overlayOpen = textOpen || photoOpen || voiceOpen || !!lightboxItemId;

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    // On group switch, replace with the server snapshot.
    if (prevGroupIdRef.current !== groupId) {
      prevGroupIdRef.current = groupId;
      setItems(uniqueById(initialItems));
      setHasMore(initialItems.length >= PAGE_SIZE);
      return;
    }

    // Same group: merge server snapshot without clobbering local optimistic/realtime state.
    setItems((current) => {
      const optimistic = current.filter((item) => item.optimistic);
      const persisted = current.filter((item) => !item.optimistic);
      const persistedById = new Map(persisted.map((item) => [item.id, item]));
      const incomingIds = new Set(initialItems.map((item) => item.id));

      const mergedIncoming = initialItems.map((incoming) => {
        const existing = persistedById.get(incoming.id);
        if (!existing) return incoming;

        const preservedLocalUrl =
          existing.local_object_url && !incoming.media_url
            ? existing.local_object_url
            : null;

        return {
          ...existing,
          ...incoming,
          local_object_url: preservedLocalUrl,
          optimistic: false,
        } satisfies FeedItemUI;
      });

      const localOnly = persisted.filter((item) => !incomingIds.has(item.id));
      return uniqueById([...optimistic, ...mergedIncoming, ...localOnly]);
    });

    setHasMore(
      (currentHasMore) => currentHasMore || initialItems.length >= PAGE_SIZE,
    );
  }, [groupId, initialItems]);

  useEffect(() => {
    revealedGroups.add(groupId);
  }, [groupId]);

  const itemTransition = useMemo(
    () => getSurfaceTransition(reducedMotion, motionDuration.fast),
    [reducedMotion],
  );

  const photoItems = useMemo<LightboxPhoto[]>(
    () =>
      items
        .filter((item) => item.type === "photo" && !!item.media_url)
        .map((item) => ({
          id: item.id,
          url: item.media_url as string,
          caption: item.caption,
          author: item.created_by_profile.display_name || "Unknown",
          createdAt: item.created_at,
        })),
    [items],
  );

  const hydrateItem = useCallback(
    async (item: FeedItemWithMeta): Promise<FeedItemUI> => {
      const media_url = item.media_path
        ? await getSignedFeedMediaUrl(supabase, item.media_path)
        : null;

      return {
        ...item,
        media_url,
        local_object_url: null,
        optimistic: false,
      };
    },
    [supabase],
  );

  const fetchHydratedItemById = useCallback(
    async (itemId: string): Promise<FeedItemUI | null> => {
      const fresh = await getFeedItemById(
        supabase,
        itemId,
        currentUserProfile.id,
      );
      if (!fresh) return null;
      return hydrateItem(fresh);
    },
    [supabase, currentUserProfile.id, hydrateItem],
  );

  const refreshItemById = useCallback(
    async (itemId: string) => {
      const fresh = await fetchHydratedItemById(itemId);
      if (!fresh) {
        setItems((prev) => prev.filter((item) => item.id !== itemId));
        return;
      }

      setItems((prev) =>
        uniqueById([fresh, ...prev.filter((item) => item.id !== itemId)]),
      );
    },
    [fetchHydratedItemById],
  );

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore) return;

    const persisted = itemsRef.current.filter((item) => !item.optimistic);
    const cursor = persisted[persisted.length - 1]?.created_at;
    if (!cursor) {
      setHasMore(false);
      return;
    }

    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const nextItems = await getFeedItems(
        supabase,
        groupId,
        cursor,
        currentUserProfile.id,
      );

      if (nextItems.length < PAGE_SIZE) {
        setHasMore(false);
      }

      if (nextItems.length === 0) {
        return;
      }

      const hydrated = await Promise.all(nextItems.map(hydrateItem));
      setItems((prev) => uniqueById([...prev, ...hydrated]));
    } catch {
      toast.error("Could not load more posts.");
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [groupId, hasMore, supabase, currentUserProfile.id, hydrateItem]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting) {
          void loadMore();
        }
      },
      {
        root: null,
        rootMargin: "220px",
        threshold: 0,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  useEffect(() => {
    const channel = supabase
      .channel(`feed-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "feed_items",
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          if (payload.eventType === "DELETE") {
            const oldRow = payload.old as { id?: string };
            if (!oldRow.id) return;
            setItems((prev) => prev.filter((item) => item.id !== oldRow.id));
            return;
          }

          const newRow = payload.new as { id?: string };
          if (!newRow.id) return;
          await refreshItemById(newRow.id);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "feed_reactions",
        },
        async (payload) => {
          const newRow = payload.new as { feed_item_id?: string };
          const oldRow = payload.old as { feed_item_id?: string };
          const feedItemId = newRow.feed_item_id ?? oldRow.feed_item_id;
          if (!feedItemId) return;

          const existsInList = itemsRef.current.some(
            (item) => item.id === feedItemId,
          );
          if (!existsInList) return;

          await refreshItemById(feedItemId);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, groupId, refreshItemById]);

  const createItem = useCallback(
    async (payload: CreatePayload): Promise<boolean> => {
      const tempId = `optimistic-${crypto.randomUUID()}`;
      const optimistic = buildOptimisticItem({
        tempId,
        groupId,
        profile: currentUserProfile,
        payload,
      });

      setItems((prev) => uniqueById([optimistic, ...prev]));

      const result = await addFeedItem(groupId, {
        type: payload.type,
        caption: payload.caption ?? null,
        media_path: payload.media_path ?? null,
        duration_seconds: payload.duration_seconds ?? null,
        linked_expense_id: payload.linked_expense_id ?? null,
        linked_poll_id: payload.linked_poll_id ?? null,
      });

      if ("error" in result) {
        if (payload.local_object_url) {
          URL.revokeObjectURL(payload.local_object_url);
        }

        setItems((prev) => prev.filter((item) => item.id !== tempId));
        toast.error(result.error);
        return false;
      }

      const signedMedia = result.item.media_path
        ? await getSignedFeedMediaUrl(supabase, result.item.media_path)
        : null;

      const fresh = await fetchHydratedItemById(result.item.id);
      const next =
        fresh ??
        buildFallbackCreatedItem({
          created: result.item,
          profile: currentUserProfile,
          mediaUrl: signedMedia ?? payload.local_object_url ?? null,
        });

      if (payload.local_object_url && signedMedia) {
        URL.revokeObjectURL(payload.local_object_url);
      }

      setItems((prev) =>
        uniqueById([next, ...prev.filter((item) => item.id !== tempId)]),
      );
      return true;
    },
    [groupId, currentUserProfile, supabase, fetchHydratedItemById],
  );

  const handleTextSubmit = useCallback(
    async (data: {
      caption: string;
      linked_expense_id: string | null;
      linked_poll_id: string | null;
    }): Promise<boolean> => {
      setPosting(true);
      try {
        const success = await createItem({
          type: "text",
          caption: data.caption,
          linked_expense_id: data.linked_expense_id,
          linked_poll_id: data.linked_poll_id,
        });
        if (success) {
          setTextOpen(false);
        }
        return success;
      } finally {
        setPosting(false);
      }
    },
    [createItem],
  );

  const handlePhotoSubmit = useCallback(
    async (data: {
      file: File;
      caption: string;
      linked_expense_id: string | null;
      linked_poll_id: string | null;
      preview_url: string;
    }): Promise<boolean> => {
      setPosting(true);
      try {
        const media_path = await uploadFeedPhoto(supabase, groupId, data.file);

        const success = await createItem({
          type: "photo",
          caption: data.caption,
          media_path,
          local_object_url: data.preview_url,
          linked_expense_id: data.linked_expense_id,
          linked_poll_id: data.linked_poll_id,
        });

        if (success) {
          setPhotoOpen(false);
        }
        return success;
      } catch {
        URL.revokeObjectURL(data.preview_url);
        toast.error("Could not upload photo.");
        return false;
      } finally {
        setPosting(false);
      }
    },
    [supabase, groupId, createItem],
  );

  const handleVoiceSubmit = useCallback(
    async (data: {
      blob: Blob;
      caption: string;
      duration_seconds: number;
      linked_expense_id: string | null;
      linked_poll_id: string | null;
    }): Promise<boolean> => {
      setPosting(true);
      try {
        const localUrl = URL.createObjectURL(data.blob);
        const media_path = await uploadFeedVoice(supabase, groupId, data.blob);

        const success = await createItem({
          type: "voice",
          caption: data.caption,
          media_path,
          local_object_url: localUrl,
          duration_seconds: data.duration_seconds,
          linked_expense_id: data.linked_expense_id,
          linked_poll_id: data.linked_poll_id,
        });

        if (success) {
          setVoiceOpen(false);
        }
        return success;
      } catch {
        toast.error("Could not upload voice note.");
        return false;
      } finally {
        setPosting(false);
      }
    },
    [supabase, groupId, createItem],
  );

  const handleDelete = useCallback(async (itemId: string) => {
    const target = itemsRef.current.find((item) => item.id === itemId);
    if (!target) return;

    const confirmed = window.confirm("Delete this post?");
    if (!confirmed) return;

    setDeletingItemId(itemId);
    setItems((prev) => prev.filter((item) => item.id !== itemId));

    const result = await deleteFeedItem(itemId);
    setDeletingItemId(null);

    if ("error" in result) {
      setItems((prev) => uniqueById([target, ...prev]));
      toast.error(result.error);
    }
  }, []);

  const handleReactionToggle = useCallback(
    async (itemId: string, emoji: string) => {
      const before = itemsRef.current.find((item) => item.id === itemId);
      if (!before) return;

      setReactionBusy((prev) => ({ ...prev, [itemId]: true }));
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? toggleReactionLocal(item, emoji) : item,
        ),
      );

      const result = await toggleReaction(itemId, emoji);

      setReactionBusy((prev) => ({ ...prev, [itemId]: false }));

      if ("error" in result) {
        setItems((prev) =>
          prev.map((item) => (item.id === itemId ? before : item)),
        );
        toast.error(result.error);
      }
    },
    [],
  );

  const openTextComposer = useCallback(() => {
    setTextOpen(true);
    setPhotoOpen(false);
    setVoiceOpen(false);
  }, []);

  const openPhotoComposer = useCallback(() => {
    setTextOpen(false);
    setPhotoOpen(true);
    setVoiceOpen(false);
  }, []);

  const openVoiceComposer = useCallback(() => {
    setTextOpen(false);
    setPhotoOpen(false);
    setVoiceOpen(true);
  }, []);

  const dockItems = useMemo<ComposerDockItem[]>(
    () => [
      {
        key: "text",
        label: "Text",
        icon: MessageSquareText,
        onClick: openTextComposer,
      },
      {
        key: "photo",
        label: "Photo",
        icon: Camera,
        onClick: openPhotoComposer,
      },
      {
        key: "voice",
        label: "Voice",
        icon: Mic,
        onClick: openVoiceComposer,
      },
    ],
    [openTextComposer, openPhotoComposer, openVoiceComposer],
  );

  return (
    <Container as="section" className="py-4 sm:py-6">
      <TransitionSlot
        className="col-span-6 sm:col-span-12 mx-auto w-full max-w-2xl pb-28 md:pb-24"
        variant="context"
      >
        <header className="relative overflow-hidden rounded-3xl border border-[#E8DCCF] bg-[linear-gradient(155deg,#FFFBF8_0%,#F7F1EA_62%,#ECF8DF_100%)] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_28px_rgba(92,63,42,0.10)] sm:px-6">
          <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(127,190,68,0.22)_0%,rgba(127,190,68,0)_72%)]" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(123,162,201,0.22)_0%,rgba(123,162,201,0)_72%)]" />

          <div className="relative z-10 space-y-2.5">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D9CEC2] bg-[#F8F2EC] px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 text-[#766355]" />
              <Text variant="caption" className="font-medium text-[#766355]">
                Feed dropzone
              </Text>
            </div>

            <div>
              <Text variant="title">Squad feed</Text>
              <Text variant="body" color="subtle" className="mt-1 max-w-[44ch]">
                Dump receipts, chaos, and voice memos in one running stream.
              </Text>
            </div>
          </div>
        </header>

        <div className="mt-5 space-y-4">
          <AnimatePresence initial={false}>
            {items.length === 0 ? (
              <motion.div
                initial={
                  reducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: 10, filter: "blur(4px)" }
                }
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{
                  duration: motionDuration.standard,
                  ease: motionEase.out,
                }}
              >
                <EmptyState
                  iconSrc="/icons/feed-empty.webp"
                  title="Dead quiet in here"
                  description="First post sets the vibe. Make it loud."
                />
              </motion.div>
            ) : (
              <motion.div
                className="space-y-4"
                initial={shouldAnimateIn ? "hidden" : false}
                animate="show"
                variants={{
                  hidden: {},
                  show: {
                    transition: reducedMotion
                      ? undefined
                      : { staggerChildren: 0.055, delayChildren: 0.04 },
                  },
                }}
              >
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout="position"
                      variants={{
                        hidden: reducedMotion
                          ? { opacity: 0 }
                          : { opacity: 0, y: 14, filter: "blur(5px)" },
                        show: { opacity: 1, y: 0, filter: "blur(0px)" },
                      }}
                      initial={
                        shouldAnimateIn
                          ? undefined
                          : reducedMotion
                            ? { opacity: 0 }
                            : { opacity: 0, y: 8, filter: "blur(3px)" }
                      }
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={
                        reducedMotion
                          ? { opacity: 0 }
                          : {
                              opacity: 0,
                              y: -10,
                              filter: "blur(4px)",
                              scale: 0.985,
                            }
                      }
                      transition={itemTransition}
                    >
                      <FeedItemCard
                        item={item}
                        currentUserId={currentUserProfile.id}
                        deleting={deletingItemId === item.id}
                        reacting={reactionBusy[item.id] ?? false}
                        onDelete={handleDelete}
                        onToggleReaction={handleReactionToggle}
                        onOpenPhoto={setLightboxItemId}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={sentinelRef} className="h-8" />

          <AnimatePresence initial={false}>
            {loadingMore && (
              <motion.div
                className="flex items-center justify-center py-2"
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={getSurfaceTransition(
                  reducedMotion,
                  motionDuration.fast,
                )}
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-[#DCCBC0] bg-[#F8F3EE] px-3 py-1 text-[12px] text-[#7E695A]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading more
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </TransitionSlot>

      <AnimatePresence initial={false}>
        {!overlayOpen && (
          <motion.div
            className="pointer-events-none fixed inset-x-0 bottom-[4.75rem] z-10 px-2 md:bottom-4 md:pl-60"
            initial={
              reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 14, scale: 0.985 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }
            }
            transition={getSurfaceTransition(
              reducedMotion,
              motionDuration.fast,
            )}
          >
            <div className="mx-auto flex w-full max-w-2xl justify-center">
              <ComposerDock items={dockItems} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PostTextSheet
        open={textOpen}
        onOpenChange={(open) => {
          setTextOpen(open);
          if (open) {
            setPhotoOpen(false);
            setVoiceOpen(false);
          }
        }}
        posting={posting}
        groupId={groupId}
        pollOptions={pollOptions}
        expenseOptions={expenseOptions}
        onSubmit={handleTextSubmit}
      />

      <PostPhotoSheet
        open={photoOpen}
        onOpenChange={(open) => {
          setPhotoOpen(open);
          if (open) {
            setTextOpen(false);
            setVoiceOpen(false);
          }
        }}
        posting={posting}
        groupId={groupId}
        pollOptions={pollOptions}
        expenseOptions={expenseOptions}
        onSubmit={handlePhotoSubmit}
      />

      <RecordVoiceSheet
        open={voiceOpen}
        onOpenChange={(open) => {
          setVoiceOpen(open);
          if (open) {
            setTextOpen(false);
            setPhotoOpen(false);
          }
        }}
        posting={posting}
        groupId={groupId}
        pollOptions={pollOptions}
        expenseOptions={expenseOptions}
        onSubmit={handleVoiceSubmit}
      />

      <ImageLightbox
        open={!!lightboxItemId}
        onOpenChange={(open) => {
          if (!open) {
            setLightboxItemId(null);
          } else {
            setTextOpen(false);
            setPhotoOpen(false);
            setVoiceOpen(false);
          }
        }}
        photos={photoItems}
        initialItemId={lightboxItemId}
      />
    </Container>
  );
}
