"use client";

import type { FeedReactionCount } from "@mooch/db";
import { Plus } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { getSurfaceTransition, motionDuration } from "@/lib/motion";

const PRESET_EMOJIS = ["❤️", "😂", "🔥", "😮", "👏", "💀"] as const;

type Props = {
  reactionCounts: FeedReactionCount[];
  currentUserReaction: string | null;
  disabled?: boolean;
  onToggle: (emoji: string) => void;
};

export function ReactionBar({
  reactionCounts,
  currentUserReaction,
  disabled = false,
  onToggle,
}: Props) {
  const reducedMotion = useReducedMotion() ?? false;
  const [pickerOpen, setPickerOpen] = useState(false);

  const displayReactions = useMemo(() => {
    const fromCounts = reactionCounts.map((entry) => ({
      emoji: entry.emoji,
      count: entry.count,
    }));

    if (
      currentUserReaction &&
      !fromCounts.some((entry) => entry.emoji === currentUserReaction)
    ) {
      fromCounts.unshift({ emoji: currentUserReaction, count: 0 });
    }

    return fromCounts;
  }, [reactionCounts, currentUserReaction]);

  return (
    <div className="space-y-2">
      <motion.div layout className="flex flex-wrap items-center gap-1.5">
        <AnimatePresence initial={false}>
          {displayReactions.map((entry) => {
            const active = currentUserReaction === entry.emoji;
            return (
              <motion.button
                key={entry.emoji}
                type="button"
                layout
                whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                onClick={() => onToggle(entry.emoji)}
                disabled={disabled}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors disabled:opacity-60"
                style={
                  active
                    ? {
                        background: "#EFF8E3",
                        border: "1px solid #C7DEB0",
                        color: "#2D5A0E",
                      }
                    : {
                        background: "#F7F2ED",
                        border: "1px solid #DCCBC0",
                        color: "#6f5a4b",
                      }
                }
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                transition={getSurfaceTransition(
                  reducedMotion,
                  motionDuration.fast,
                )}
              >
                <span>{entry.emoji}</span>
                <motion.span
                  key={`${entry.emoji}-${entry.count}`}
                  className="tabular-nums"
                  initial={
                    reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85 }
                  }
                  animate={{ opacity: 1, scale: 1 }}
                  transition={getSurfaceTransition(
                    reducedMotion,
                    motionDuration.fast,
                  )}
                >
                  {entry.count}
                </motion.span>
              </motion.button>
            );
          })}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          disabled={disabled}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors disabled:opacity-60"
          style={{
            background: pickerOpen ? "#EFF8E3" : "#F7F2ED",
            border: "1px solid #DCCBC0",
            color: pickerOpen ? "#2D5A0E" : "#6f5a4b",
          }}
          aria-label="Open reaction picker"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </motion.div>

      <AnimatePresence initial={false}>
        {pickerOpen && (
          <motion.div
            className="flex flex-wrap gap-1.5 rounded-xl p-2"
            style={{ background: "#F8F4EF", border: "1px solid #E7D8CC" }}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={getSurfaceTransition(
              reducedMotion,
              motionDuration.fast,
            )}
          >
            {PRESET_EMOJIS.map((emoji) => {
              const active = currentUserReaction === emoji;
              return (
                <motion.button
                  key={emoji}
                  type="button"
                  whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                  onClick={() => {
                    onToggle(emoji);
                    setPickerOpen(false);
                  }}
                  disabled={disabled}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-transform disabled:opacity-60"
                  style={{
                    background: active ? "#EFF8E3" : "#FFFFFF",
                    border: active ? "1px solid #C7DEB0" : "1px solid #E7D8CC",
                  }}
                >
                  {emoji}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
