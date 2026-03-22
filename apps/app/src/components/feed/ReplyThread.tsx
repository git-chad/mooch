"use client";

import type { FeedReplyWithProfile } from "@mooch/db";
import { createBrowserClient, getReplies } from "@mooch/db";
import type { Profile } from "@mooch/types";
import { Avatar, Text } from "@mooch/ui";
import { Loader2, MessageCircle, Send, Trash2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { addReply, deleteReply } from "@/app/actions/feed";
import { relativeTime } from "@/lib/expenses";
import { getSurfaceTransition, motionDuration } from "@/lib/motion";
import type { MentionMember } from "./MentionInput";
import {
  MentionSuggestions,
  renderMentionText,
  useMentionInput,
} from "./MentionInput";

const REPLY_MAX = 500;

type Props = {
  feedItemId: string;
  currentUser: Profile;
  replyCount: number;
  members: MentionMember[];
  onReplyCountChange: (feedItemId: string, delta: number) => void;
};

export function ReplyThread({
  feedItemId,
  currentUser,
  replyCount,
  members,
  onReplyCountChange,
}: Props) {
  const reducedMotion = useReducedMotion() ?? false;
  const supabase = useMemo(() => createBrowserClient(), []);
  const [expanded, setExpanded] = useState(false);
  const [replies, setReplies] = useState<FeedReplyWithProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const mention = useMentionInput(input, setInput, members);

  const transition = useMemo(
    () => getSurfaceTransition(reducedMotion, motionDuration.fast),
    [reducedMotion],
  );

  const loadReplies = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const data = await getReplies(supabase, feedItemId);
      setReplies(data);
      setLoaded(true);
    } catch {
      toast.error("Could not load replies.");
    } finally {
      setLoading(false);
    }
  }, [supabase, feedItemId, loaded]);

  function handleToggle() {
    if (!expanded) {
      setExpanded(true);
      if (!loaded) void loadReplies();
    } else {
      setExpanded(false);
    }
  }

  // Focus input when thread expands
  useEffect(() => {
    if (expanded && loaded) {
      inputRef.current?.focus();
    }
  }, [expanded, loaded]);

  // Realtime for replies on this item
  useEffect(() => {
    if (!expanded) return;

    const channel = supabase
      .channel(`replies-${feedItemId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "feed_replies",
          filter: `feed_item_id=eq.${feedItemId}`,
        },
        async () => {
          // Re-fetch all replies for simplicity
          const data = await getReplies(supabase, feedItemId);
          setReplies(data);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "feed_replies",
        },
        async (payload) => {
          const oldRow = payload.old as { id?: string };
          if (!oldRow.id) return;
          setReplies((prev) => prev.filter((r) => r.id !== oldRow.id));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, feedItemId, expanded]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const encoded = mention.encode(trimmed);

    // Optimistic insert — show display text locally, send encoded to server
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimistic: FeedReplyWithProfile = {
      id: tempId,
      feed_item_id: feedItemId,
      user_id: currentUser.id,
      content: encoded,
      created_at: new Date().toISOString(),
      profile: currentUser,
    };

    setReplies((prev) => [...prev, optimistic]);
    setInput("");
    mention.reset();
    onReplyCountChange(feedItemId, 1);
    setSending(true);

    const result = await addReply(feedItemId, encoded);
    setSending(false);

    if ("error" in result) {
      setReplies((prev) => prev.filter((r) => r.id !== tempId));
      onReplyCountChange(feedItemId, -1);
      toast.error(result.error);
      return;
    }

    // Replace optimistic with real reply
    setReplies((prev) =>
      prev.map((r) =>
        r.id === tempId ? { ...result.reply, profile: currentUser } : r,
      ),
    );
  }

  async function handleDelete(replyId: string) {
    const target = replies.find((r) => r.id === replyId);
    if (!target) return;

    setDeletingId(replyId);
    setReplies((prev) => prev.filter((r) => r.id !== replyId));
    onReplyCountChange(feedItemId, -1);

    const result = await deleteReply(replyId);
    setDeletingId(null);

    if ("error" in result) {
      setReplies((prev) =>
        [...prev, target].sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        ),
      );
      onReplyCountChange(feedItemId, 1);
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleToggle}
        className="inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-[12px] font-medium text-[#7C6858] transition-colors hover:bg-[#F5EFE8]"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        {replyCount > 0 ? (
          <span>
            {replyCount} {replyCount === 1 ? "reply" : "replies"}
          </span>
        ) : (
          <span>Reply</span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={transition}
            className="overflow-hidden"
          >
            <div
              className="space-y-2 rounded-xl border p-3"
              style={{ background: "#FAF7F4", borderColor: "#E7D8CC" }}
            >
              {loading && !loaded && (
                <div className="flex items-center justify-center py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-[#9C8778]" />
                </div>
              )}

              {loaded && replies.length === 0 && (
                <Text
                  variant="caption"
                  color="subtle"
                  className="py-2 text-center"
                >
                  No replies yet. Be the first!
                </Text>
              )}

              <AnimatePresence initial={false}>
                {replies.map((reply) => (
                  <motion.div
                    key={reply.id}
                    initial={
                      reducedMotion ? { opacity: 0 } : { opacity: 0, y: 4 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      reducedMotion ? { opacity: 0 } : { opacity: 0, x: -8 }
                    }
                    transition={transition}
                    className="group/reply flex items-start gap-2"
                  >
                    <Avatar
                      size="sm"
                      src={reply.profile.photo_url ?? undefined}
                      name={reply.profile.display_name || "Unknown"}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5">
                        <Text
                          variant="caption"
                          className="shrink-0 font-semibold"
                        >
                          {reply.profile.display_name || "Unknown"}
                        </Text>
                        <Text variant="caption" color="subtle">
                          {relativeTime(reply.created_at)}
                        </Text>
                      </div>
                      <Text
                        variant="caption"
                        color="label"
                        className="leading-snug"
                      >
                        {renderMentionText(reply.content)}
                      </Text>
                    </div>
                    {reply.user_id === currentUser.id && (
                      <button
                        type="button"
                        onClick={() => handleDelete(reply.id)}
                        disabled={deletingId === reply.id}
                        className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md opacity-0 transition-opacity group-hover/reply:opacity-100 disabled:opacity-40"
                        style={{ color: "#9C8778" }}
                        aria-label="Delete reply"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Reply input */}
              <div className="flex items-center gap-2 pt-1">
                <Avatar
                  size="sm"
                  src={currentUser.photo_url ?? undefined}
                  name={currentUser.display_name || "You"}
                />
                <div className="relative min-w-0 flex-1">
                  <MentionSuggestions
                    suggestions={mention.suggestions}
                    highlightIndex={mention.highlightIndex}
                    onSelect={mention.selectMention}
                  />
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => mention.handleChange(e.target.value)}
                    maxLength={REPLY_MAX}
                    placeholder="Write a reply... (@ to mention)"
                    disabled={sending}
                    className="w-full rounded-full border border-[#DECFC2] bg-white py-1.5 pl-3 pr-9 text-[13px] text-ink outline-none transition-colors placeholder:text-[#AF9F93] focus:border-[#93BB6D]"
                    onKeyDown={(e) => {
                      mention.handleKeyDown(e);
                      if (
                        e.key === "Enter" &&
                        !e.shiftKey &&
                        mention.mentionQuery === null
                      ) {
                        e.preventDefault();
                        void handleSend();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={!input.trim() || sending}
                    className="absolute right-1.5 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full transition-colors disabled:opacity-40"
                    style={{
                      background: input.trim() ? "#5A9629" : "transparent",
                      color: input.trim() ? "white" : "#9C8778",
                    }}
                    aria-label="Send reply"
                  >
                    {sending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Send className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
