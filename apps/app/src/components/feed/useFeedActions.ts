"use client";

import type { FeedItemWithMeta } from "@mooch/db";
import {
  getFeedItemById,
  getSignedFeedMediaUrl,
  uploadFeedPhoto,
  uploadFeedVoice,
} from "@mooch/db";
import type { Profile } from "@mooch/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  addFeedItem,
  deleteFeedItem,
  editFeedItem,
  toggleReaction,
} from "@/app/actions/feed";
import {
  buildFallbackCreatedItem,
  buildOptimisticItem,
  type CreatePayload,
  toggleReactionLocal,
  uniqueById,
  withTimeout,
} from "./feed-utils";
import type { FeedItemUI } from "./types";

const CREATE_ITEM_TIMEOUT_MS = 20_000;
const MEDIA_UPLOAD_TIMEOUT_MS = 20_000;

type SetItems = React.Dispatch<React.SetStateAction<FeedItemUI[]>>;

export function useFeedActions({
  groupId,
  currentUserProfile,
  supabase,
  setItems,
  setPosting,
  setTextOpen,
  setPhotoOpen,
  setVoiceOpen,
  setDeletingItemId,
  setReactionBusy,
}: {
  groupId: string;
  currentUserProfile: Profile;
  supabase: SupabaseClient;
  setItems: SetItems;
  setPosting: (v: boolean) => void;
  setTextOpen: (v: boolean) => void;
  setPhotoOpen: (v: boolean) => void;
  setVoiceOpen: (v: boolean) => void;
  setDeletingItemId: (v: string | null) => void;
  setReactionBusy: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
}) {
  const itemsRef = useRef<FeedItemUI[]>([]);

  const syncItemsRef = useCallback((items: FeedItemUI[]) => {
    itemsRef.current = items;
  }, []);

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
    [fetchHydratedItemById, setItems],
  );

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

      // Step 1: persist — if this fails, revert the optimistic item
      let result: Awaited<ReturnType<typeof addFeedItem>>;
      try {
        result = await withTimeout(
          addFeedItem(groupId, {
            type: payload.type,
            caption: payload.caption ?? null,
            media_path: payload.media_path ?? null,
            duration_seconds: payload.duration_seconds ?? null,
            linked_expense_id: payload.linked_expense_id ?? null,
            linked_poll_id: payload.linked_poll_id ?? null,
          }),
          CREATE_ITEM_TIMEOUT_MS,
          "Post request timed out.",
        );

        if ("error" in result) {
          if (payload.local_object_url) {
            URL.revokeObjectURL(payload.local_object_url);
          }
          setItems((prev) => prev.filter((item) => item.id !== tempId));
          toast.error(result.error);
          return false;
        }
      } catch {
        if (payload.local_object_url) {
          URL.revokeObjectURL(payload.local_object_url);
        }
        setItems((prev) => prev.filter((item) => item.id !== tempId));
        toast.error("Could not finish posting. Please try again.");
        return false;
      }

      // Step 2: hydrate — post is already saved, so don't revert on failure.
      // Realtime will reconcile eventually.
      try {
        const signedMedia = result.item.media_path
          ? await withTimeout(
              getSignedFeedMediaUrl(supabase, result.item.media_path),
              CREATE_ITEM_TIMEOUT_MS,
              "Media signing timed out.",
            )
          : null;

        const fresh = await withTimeout(
          fetchHydratedItemById(result.item.id),
          CREATE_ITEM_TIMEOUT_MS,
          "Post hydration timed out.",
        );
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
      } catch {
        // Post is persisted — leave optimistic item in place, realtime will replace it
      }
      return true;
    },
    [groupId, currentUserProfile, supabase, fetchHydratedItemById, setItems],
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
    [createItem, setPosting, setTextOpen],
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
        const media_path = await withTimeout(
          uploadFeedPhoto(supabase, groupId, data.file),
          MEDIA_UPLOAD_TIMEOUT_MS,
          "Something went wrong, please try again.",
        );

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
      } catch (error) {
        URL.revokeObjectURL(data.preview_url);
        const message =
          error instanceof Error && error.message
            ? error.message
            : "Could not upload photo.";
        toast.error(message);
        return false;
      } finally {
        setPosting(false);
      }
    },
    [supabase, groupId, createItem, setPosting, setPhotoOpen],
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
      let localUrl: string | null = null;
      try {
        localUrl = URL.createObjectURL(data.blob);
        const media_path = await withTimeout(
          uploadFeedVoice(supabase, groupId, data.blob),
          MEDIA_UPLOAD_TIMEOUT_MS,
          "Voice upload timed out.",
        );

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
      } catch (error) {
        if (localUrl) URL.revokeObjectURL(localUrl);
        const message =
          error instanceof Error && error.message
            ? error.message
            : "Could not upload voice note.";
        toast.error(message);
        return false;
      } finally {
        setPosting(false);
      }
    },
    [supabase, groupId, createItem, setPosting, setVoiceOpen],
  );

  const handleDelete = useCallback(
    async (itemId: string) => {
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
    },
    [setItems, setDeletingItemId],
  );

  const handleEdit = useCallback(
    async (itemId: string, caption: string): Promise<boolean> => {
      const before = itemsRef.current.find((item) => item.id === itemId);
      if (!before) return false;

      // Optimistic update
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, caption, edited_at: new Date().toISOString() }
            : item,
        ),
      );

      const result = await editFeedItem(itemId, { caption });

      if ("error" in result) {
        // Revert
        setItems((prev) =>
          prev.map((item) => (item.id === itemId ? before : item)),
        );
        toast.error(result.error);
        return false;
      }

      return true;
    },
    [setItems],
  );

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
    [setItems, setReactionBusy],
  );

  return {
    itemsRef,
    syncItemsRef,
    hydrateItem,
    refreshItemById,
    handleTextSubmit,
    handlePhotoSubmit,
    handleVoiceSubmit,
    handleDelete,
    handleEdit,
    handleReactionToggle,
  };
}
