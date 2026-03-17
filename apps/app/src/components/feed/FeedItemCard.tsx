"use client";

import { Avatar, Text } from "@mooch/ui";
import {
  BarChart3,
  Loader2,
  Mic,
  Pause,
  Play,
  ReceiptText,
  Trash2,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { relativeTime } from "@/lib/expenses";
import { getSurfaceTransition, motionDuration } from "@/lib/motion";
import { ReactionBar } from "./ReactionBar";
import type { FeedItemUI } from "./types";

type Props = {
  item: FeedItemUI;
  currentUserId: string;
  deleting?: boolean;
  reacting?: boolean;
  onToggleReaction: (itemId: string, emoji: string) => void;
  onDelete: (itemId: string) => void;
  onOpenPhoto: (itemId: string) => void;
};

export function FeedItemCard({
  item,
  currentUserId,
  deleting = false,
  reacting = false,
  onToggleReaction,
  onDelete,
  onOpenPhoto,
}: Props) {
  const reducedMotion = useReducedMotion() ?? false;
  const canDelete = item.created_by === currentUserId;
  const transition = useMemo(
    () => getSurfaceTransition(reducedMotion, motionDuration.fast),
    [reducedMotion],
  );

  const contextBadge = item.linked_poll_id
    ? { icon: BarChart3, label: "Linked poll" }
    : item.linked_expense_id
      ? { icon: ReceiptText, label: "Linked expense" }
      : null;

  return (
    <motion.article
      layout="position"
      className="rounded-2xl border p-4"
      style={{
        background:
          "linear-gradient(in oklab 160deg, oklab(100% .0001 .0001 / 72%) 0%, oklab(95.1% 0.006 0.009 / 52%) 100%)",
        borderColor: "#DCCBC0",
        boxShadow: "var(--shadow-elevated)",
      }}
      transition={transition}
    >
      <div className="space-y-3">
        <header className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar
              size="sm"
              src={item.created_by_profile.photo_url ?? undefined}
              name={item.created_by_profile.display_name || "Unknown"}
            />
            <div className="min-w-0">
              <Text variant="label" className="block truncate">
                {item.created_by_profile.display_name || "Unknown"}
              </Text>
              <Text variant="caption" color="subtle" className="block">
                {item.optimistic ? "Sending..." : relativeTime(item.created_at)}
              </Text>
            </div>
          </div>

          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              disabled={deleting}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-60"
              style={{ background: "#F7F2ED", color: "#8C7463" }}
              aria-label="Delete post"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          )}
        </header>

        {item.type === "text" && item.caption && (
          <Text variant="body" className="text-[15px] leading-[1.55]">
            {item.caption}
          </Text>
        )}

        {item.type === "photo" && item.media_url && (
          <button
            type="button"
            className="block w-full overflow-hidden rounded-xl border"
            style={{ borderColor: "#E7D8CC" }}
            onClick={() => onOpenPhoto(item.id)}
            aria-label="Open photo"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.media_url}
              alt={item.caption || "Feed photo"}
              className="h-auto max-h-[520px] w-full object-cover"
            />
          </button>
        )}

        {item.type === "voice" && item.media_url && (
          <VoicePlayer
            src={item.media_url}
            durationHint={item.duration_seconds ?? undefined}
          />
        )}

        {item.caption && item.type !== "text" && (
          <Text variant="body" color="label" className="leading-relaxed">
            {item.caption}
          </Text>
        )}

        {contextBadge && (
          <div className="inline-flex items-center gap-1.5 rounded-full border px-2 py-1">
            <contextBadge.icon className="h-3.5 w-3.5 text-[#6B7E90]" />
            <Text variant="caption" color="info">
              {contextBadge.label}
            </Text>
          </div>
        )}

        <ReactionBar
          reactionCounts={item.reaction_counts}
          currentUserReaction={item.current_user_reaction}
          disabled={reacting || deleting}
          onToggle={(emoji) => onToggleReaction(item.id, emoji)}
        />
      </div>
    </motion.article>
  );
}

function VoicePlayer({
  src,
  durationHint,
}: {
  src: string;
  durationHint?: number;
}) {
  const reducedMotion = useReducedMotion() ?? false;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationHint ?? 0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const onLoaded = () => setDuration(audio.duration || durationHint || 0);
    const onEnded = () => setPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
    };
  }, [durationHint]);

  async function toggle() {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }

    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }

  const pct = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const bars = Array.from({ length: 20 }, (_, i) => {
    const seed = ((i * 17) % 9) + 2;
    const h = 10 + seed * 3;
    const active = i / 20 <= pct;
    return { h, active };
  });

  return (
    <div
      className="rounded-xl border p-3"
      style={{ background: "#F8F4EF", borderColor: "#E7D8CC" }}
    >
      <audio ref={audioRef} src={src} preload="metadata" />
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={toggle}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors"
          style={{
            background: "#EFF8E3",
            border: "1px solid #C7DEB0",
            color: "#2D5A0E",
          }}
          aria-label={playing ? "Pause voice note" : "Play voice note"}
        >
          {playing ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 translate-x-[1px]" />
          )}
        </button>

        <div className="flex-1">
          <div className="flex h-9 items-end gap-[2px]">
            {bars.map((bar, idx) => (
              <motion.span
                // biome-ignore lint/suspicious/noArrayIndexKey: deterministic decorative bars.
                key={idx}
                className="block w-full rounded-sm"
                initial={false}
                animate={{
                  height: bar.h,
                  opacity: bar.active ? 1 : 0.36,
                  backgroundColor: bar.active ? "#5A9629" : "#BCAEA3",
                }}
                transition={getSurfaceTransition(reducedMotion, motionDuration.fast)}
              />
            ))}
          </div>
          <div className="mt-1 flex items-center justify-between">
            <Text variant="caption" color="subtle">
              <Mic className="mr-1 inline h-3 w-3 align-[-1px]" />
              Voice
            </Text>
            <Text variant="caption" color="subtle" className="tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
