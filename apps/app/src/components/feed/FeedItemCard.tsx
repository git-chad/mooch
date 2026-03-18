"use client";

import { Avatar, Text } from "@mooch/ui";
import {
  ArrowUpRight,
  BarChart3,
  Loader2,
  Mic,
  Pause,
  Play,
  ReceiptText,
  Trash2,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { relativeTime } from "@/lib/expenses";
import { getSurfaceTransition, motionDuration } from "@/lib/motion";
import { ReactionBar } from "./ReactionBar";
import type { FeedItemUI } from "./types";

type Props = {
  groupId: string;
  item: FeedItemUI;
  currentUserId: string;
  deleting?: boolean;
  reacting?: boolean;
  onToggleReaction: (itemId: string, emoji: string) => void;
  onDelete: (itemId: string) => void;
  onOpenPhoto: (itemId: string) => void;
};

export function FeedItemCard({
  groupId,
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
    ? {
        icon: BarChart3,
        label: "Linked poll",
        href: `/${groupId}/polls#${item.linked_poll_id}`,
      }
    : item.linked_expense_id
      ? {
          icon: ReceiptText,
          label: "Linked expense",
          href: `/${groupId}/expenses`,
        }
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
          <Link
            href={contextBadge.href}
            className="inline-flex items-center gap-1.5 rounded-full border px-2 py-1 transition-colors hover:bg-[#F5EFE8]"
            style={{ borderColor: "#DCCBC0" }}
          >
            <contextBadge.icon className="h-3.5 w-3.5 text-[#6B7E90]" />
            <Text variant="caption" color="info">
              {contextBadge.label}
            </Text>
            <ArrowUpRight className="h-3 w-3 text-[#6B7E90]" />
          </Link>
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

const VOICE_PEAK_COUNT = 48;

function VoicePlayer({
  src,
  durationHint,
}: {
  src: string;
  durationHint?: number;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const barsRef = useRef<HTMLDivElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(durationHint ?? 0);
  const [peaks, setPeaks] = useState<number[]>(() => defaultVoicePeaks());
  const [hasExtractedPeaks, setHasExtractedPeaks] = useState(false);

  // Extract real peaks from audio on mount
  useEffect(() => {
    let cancelled = false;

    async function extract() {
      try {
        const res = await fetch(src);
        const buf = await res.arrayBuffer();
        const ctx = new AudioContext();
        const decoded = await ctx.decodeAudioData(buf);
        const channel = decoded.getChannelData(0);
        const blockSize = Math.floor(channel.length / VOICE_PEAK_COUNT);
        const extracted: number[] = [];

        for (let i = 0; i < VOICE_PEAK_COUNT; i++) {
          let max = 0;
          const start = i * blockSize;
          const end = Math.min(start + blockSize, channel.length);
          for (let j = start; j < end; j++) {
            const abs = Math.abs(channel[j]);
            if (abs > max) max = abs;
          }
          extracted.push(max);
        }

        const peakMax = Math.max(...extracted, 0.01);
        if (!cancelled) {
          setPeaks(extracted.map((v) => v / peakMax));
          setHasExtractedPeaks(true);
          if (decoded.duration && Number.isFinite(decoded.duration)) {
            setDuration(decoded.duration);
          }
        }
        void ctx.close();
      } catch {
        // keep default baseline peaks
      }
    }

    void extract();
    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onEnded = () => {
      setPlaying(false);
      setProgress(1);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  function startProgressLoop() {
    const audio = audioRef.current;
    if (!audio) return;
    const tick = () => {
      const dur =
        audio.duration && Number.isFinite(audio.duration)
          ? audio.duration
          : duration;
      if (dur > 0) setProgress(audio.currentTime / dur);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }

  function stopProgressLoop() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }

  async function toggle() {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      stopProgressLoop();
      return;
    }

    try {
      await audio.play();
      setPlaying(true);
      startProgressLoop();
    } catch {
      setPlaying(false);
    }
  }

  function handleSeek(e: React.PointerEvent<HTMLDivElement>) {
    const container = barsRef.current;
    const audio = audioRef.current;
    if (!container || !audio) return;

    const rect = container.getBoundingClientRect();
    const seek = (clientX: number) => {
      const ratio = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width),
      );
      const dur =
        audio.duration && Number.isFinite(audio.duration)
          ? audio.duration
          : duration;
      if (dur > 0) audio.currentTime = ratio * dur;
      setProgress(ratio);
    };

    seek(e.clientX);

    const onMove = (ev: PointerEvent) => seek(ev.clientX);
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  const playedIndex = Math.floor(progress * peaks.length);
  const elapsed = progress * duration;

  return (
    <div
      className="rounded-xl border p-3"
      style={{ background: "#F8F4EF", borderColor: "#E7D8CC" }}
    >
      {/* biome-ignore lint/a11y/useMediaCaption: voice notes have no caption track */}
      <audio ref={audioRef} src={src} preload="metadata" />
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={toggle}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full btn-primary shadow-[0_3px_10px_rgba(90,150,41,0.3)]"
          aria-label={playing ? "Pause voice note" : "Play voice note"}
        >
          {playing ? (
            <Pause className="h-4 w-4 text-white" fill="white" />
          ) : (
            <Play
              className="h-4 w-4 text-white translate-x-[1px]"
              fill="white"
            />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div
            ref={barsRef}
            className="flex h-8 cursor-pointer items-end gap-[2px] rounded"
            onPointerDown={handleSeek}
          >
            {peaks.map((peak, idx) => {
              const h = Math.max(3, peak * 28);
              const played = idx <= playedIndex;
              return (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: deterministic peaks
                  key={idx}
                  className="block flex-1 rounded-sm motion-reduce:transition-none"
                  style={{
                    height: h,
                    backgroundColor: played ? "#5A9629" : "#C0B0A4",
                    transitionProperty: "height, background-color",
                    transitionDuration: hasExtractedPeaks ? "240ms, 100ms" : "100ms",
                    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                    transitionDelay: hasExtractedPeaks ? `${idx * 6}ms` : "0ms",
                  }}
                />
              );
            })}
          </div>
          <div className="mt-1 flex items-center justify-between">
            <Text variant="caption" color="subtle">
              <Mic className="mr-1 inline h-3 w-3 align-[-1px]" />
              Voice
            </Text>
            <Text variant="caption" color="subtle" className="tabular-nums">
              {formatTime(elapsed)} / {formatTime(duration)}
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}

function defaultVoicePeaks(): number[] {
  return Array.from({ length: VOICE_PEAK_COUNT }, (_, i) => {
    return 0.1 + ((i * 17) % 5) * 0.015;
  });
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
