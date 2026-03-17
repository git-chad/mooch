"use client";

import { ACTION_COSTS } from "@mooch/db";
import type { PollWithOptions } from "@mooch/stores";
import type { CorruptionAction } from "@mooch/types";
import { Text } from "@mooch/ui";
import { Ban, Check, Crown, Dices, Eye, EyeOff, UserX } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { motionDuration, motionEase } from "@/lib/motion";
import { CorruptionDeckSheet } from "./CorruptionDeckSheet";

type Props = {
  poll: PollWithOptions;
  currentUserId: string;
  groupId: string;
};

const MINI_CARDS: {
  action: CorruptionAction;
  icon: React.ReactNode;
  color: string;
}[] = [
  { action: "double_down", icon: <Dices className="w-2.5 h-2.5" />, color: "#C8963E" },
  { action: "the_leak", icon: <Eye className="w-2.5 h-2.5" />, color: "#1E3A5F" },
  { action: "ghost_vote", icon: <EyeOff className="w-2.5 h-2.5" />, color: "#9CA3AF" },
  { action: "hail_mary", icon: <Ban className="w-2.5 h-2.5" />, color: "#166534" },
  { action: "the_veto", icon: <UserX className="w-2.5 h-2.5" />, color: "#6B21A8" },
  { action: "the_coup", icon: <Crown className="w-2.5 h-2.5" />, color: "#DC2626" },
];

/** Solid opaque backgrounds per card — no transparency */
const SOLID_MINI_BG: Record<CorruptionAction, string> = {
  double_down: "#FDF6E8",
  the_leak:    "#EBF0F7",
  ghost_vote:  "#F3F4F6",
  hail_mary:   "#EDF5ED",
  the_veto:    "#F3EDF8",
  the_coup:    "#FCEEED",
};

export function CorruptionActionsBar({ poll, currentUserId, groupId }: Props) {
  const reducedMotion = useReducedMotion() ?? false;
  const [deckOpen, setDeckOpen] = useState(false);

  const usedActions = new Set(
    poll.token_actions
      .filter((a) => a.user_id === currentUserId)
      .map((a) => a.action),
  );

  function getCardState(action: CorruptionAction): "available" | "used" | "unavailable" {
    if (usedActions.has(action)) return "used";
    if (action === "the_leak" && !poll.is_anonymous) return "unavailable";
    if (action === "ghost_vote" && usedActions.has("double_down")) return "unavailable";
    if (action === "double_down" && usedActions.has("ghost_vote")) return "unavailable";
    return "available";
  }

  const availableCount = MINI_CARDS.filter(
    (c) => getCardState(c.action) === "available",
  ).length;

  return (
    <>
      {/* Compact trigger bar with mini card fan */}
      <button
        type="button"
        onClick={() => setDeckOpen(true)}
        className="w-full flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-[#FDFCFB]"
        style={{
          borderTop: "1px solid var(--color-edge)",
          background: "#FDFCFB",
        }}
      >
        {/* Mini card fan */}
        <div className="flex items-end" style={{ height: 28 }}>
          {MINI_CARDS.map((card, i) => {
            const state = getCardState(card.action);
            const totalCards = MINI_CARDS.length;
            const centerIdx = (totalCards - 1) / 2;
            const offset = i - centerIdx;
            const rotation = offset * 6;

            return (
              <motion.div
                key={card.action}
                initial={
                  reducedMotion ? false : { opacity: 0, scale: 0.8 }
                }
                animate={{
                  opacity: state === "available" ? 1 : 0.4,
                  scale: 1,
                  rotate: rotation,
                }}
                transition={{
                  duration: motionDuration.fast,
                  ease: motionEase.out,
                  delay: reducedMotion ? 0 : i * 0.03,
                }}
                className="flex items-center justify-center rounded-md shadow-sm"
                style={{
                  width: 22,
                  height: 28,
                  marginLeft: i === 0 ? 0 : -6,
                  transformOrigin: "bottom center",
                  background:
                    state === "used"
                      ? "#E8E4E0"
                      : SOLID_MINI_BG[card.action],
                  border:
                    state === "used"
                      ? "1px solid #D4CFC8"
                      : `1px solid ${card.color}30`,
                  zIndex: totalCards - Math.abs(offset),
                  position: "relative",
                }}
              >
                <span
                  style={{
                    color: state === "used" ? "#B0A296" : card.color,
                  }}
                >
                  {state === "used" ? (
                    <Check className="w-2.5 h-2.5" />
                  ) : (
                    card.icon
                  )}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Label */}
        <Text variant="caption" color="subtle" className="font-medium">
          Play a card
          {availableCount < 6 && (
            <span className="text-[var(--color-ink-subtle)] opacity-60">
              {" "}
              · {availableCount} left
            </span>
          )}
        </Text>
      </button>

      {/* Full deck sheet */}
      <CorruptionDeckSheet
        open={deckOpen}
        onOpenChange={setDeckOpen}
        poll={poll}
        currentUserId={currentUserId}
      />
    </>
  );
}
