"use client";

import { ACTION_COSTS } from "@mooch/db";
import type { PollWithOptions } from "@mooch/stores";
import type { CorruptionAction } from "@mooch/types";
import { Sheet, Text } from "@mooch/ui";
import { Ban, Check, Crown, Dices, Eye, EyeOff, Lock, UserX } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AnimatedHeight } from "@/components/shared/AnimatedHeight";
import { useState } from "react";
import { toast } from "sonner";
import {
  doubleDown,
  ghostVote,
  hailMary,
  theCoup,
  theLeak,
} from "@/app/actions/poll-corruption";
import { motionDuration, motionEase } from "@/lib/motion";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poll: PollWithOptions;
  currentUserId: string;
};

type CardDef = {
  action: CorruptionAction;
  label: string;
  description: string;
  dramaticDescription: string;
  confirmLabel: string;
  icon: React.ReactNode;
  color: string;
  patternEmoji: string;
};

const CARDS: CardDef[] = [
  {
    action: "double_down",
    label: "Double Down",
    description: "Your vote counts double",
    dramaticDescription:
      "Fortune favors the bold. Your vote will carry twice the weight — because some opinions matter more.",
    confirmLabel: "Roll the dice",
    icon: <Dices className="w-6 h-6" />,
    color: "#C8963E",
    patternEmoji: "🎲",
  },
  {
    action: "the_leak",
    label: "The Leak",
    description: "Reveal who voted what",
    dramaticDescription:
      "Rip the curtain open. Every anonymous vote will be exposed for all to see. No more hiding.",
    confirmLabel: "Leak it",
    icon: <Eye className="w-6 h-6" />,
    color: "#1E3A5F",
    patternEmoji: "👁️",
  },
  {
    action: "ghost_vote",
    label: "Ghost Vote",
    description: "Cast an invisible vote",
    dramaticDescription:
      "Become a phantom. Your vote will count but nobody will ever know it was you. Silent influence.",
    confirmLabel: "Go ghost",
    icon: <EyeOff className="w-6 h-6" />,
    color: "#9CA3AF",
    patternEmoji: "👻",
  },
  {
    action: "hail_mary",
    label: "Hail Mary",
    description: "Block debtors from voting",
    dramaticDescription:
      "Pay up or shut up. Anyone who owes money in this group loses their voice. Desperation move.",
    confirmLabel: "Block the debtors",
    icon: <Ban className="w-6 h-6" />,
    color: "#166534",
    patternEmoji: "🙏",
  },
  {
    action: "the_veto",
    label: "The Veto",
    description: "Nullify someone's vote",
    dramaticDescription:
      "Erase them from the record. One person's vote — gone, like it never happened.",
    confirmLabel: "Veto them",
    icon: <UserX className="w-6 h-6" />,
    color: "#6B21A8",
    patternEmoji: "💀",
  },
  {
    action: "the_coup",
    label: "The Coup",
    description: "Force-close this poll",
    dramaticDescription:
      "Democracy ends now. You seize control and declare the current leader the winner. Absolute power.",
    confirmLabel: "Seize power",
    icon: <Crown className="w-6 h-6" />,
    color: "#DC2626",
    patternEmoji: "👑",
  },
];

/** Solid opaque backgrounds per card — no transparency */
const SOLID_BG: Record<CorruptionAction, string> = {
  double_down: "#FDF6E8", // warm cream / gold tint
  the_leak:    "#EBF0F7", // cool slate blue tint
  ghost_vote:  "#F3F4F6", // soft grey
  hail_mary:   "#EDF5ED", // sage green tint
  the_veto:    "#F3EDF8", // soft lavender
  the_coup:    "#FCEEED", // blush red tint
};

/** Map raw server error strings to user-friendly messages. */
function friendlyError(raw: string, actionLabel: string): string {
  if (raw === "INSUFFICIENT_TOKENS" || raw.includes("INSUFFICIENT_TOKENS"))
    return `Not enough tokens for ${actionLabel}. Buy more in Settings.`;
  if (raw === "Not authenticated")
    return "You need to be logged in to use corruption tokens.";
  if (raw.includes("already used"))
    return `You already used ${actionLabel} on this poll.`;
  if (raw.includes("Poll is closed") || raw.includes("already closed"))
    return "This poll is already closed.";
  if (raw.includes("Cannot use")) return raw;
  if (raw.includes("only works on anonymous"))
    return "The Leak only works on anonymous polls.";
  if (raw.includes("Not a member"))
    return "You're not a member of this group.";
  if (raw.includes("coming soon")) return raw;
  return `Something went wrong using ${actionLabel}. Try again.`;
}

export function CorruptionDeckSheet({
  open,
  onOpenChange,
  poll,
  currentUserId,
}: Props) {
  const reducedMotion = useReducedMotion() ?? false;
  const [selectedCard, setSelectedCard] = useState<CardDef | null>(null);
  const [hoveredCard, setHoveredCard] = useState<CorruptionAction | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const usedActions = new Set(
    poll.token_actions
      .filter((a) => a.user_id === currentUserId)
      .map((a) => a.action),
  );

  function isAvailable(action: CorruptionAction): boolean {
    if (usedActions.has(action)) return false;
    if (action === "the_leak" && !poll.is_anonymous) return false;
    if (action === "ghost_vote" && usedActions.has("double_down")) return false;
    if (action === "double_down" && usedActions.has("ghost_vote")) return false;
    return true;
  }

  function getCardState(
    action: CorruptionAction,
  ): "available" | "used" | "unavailable" {
    if (usedActions.has(action)) return "used";
    if (!isAvailable(action)) return "unavailable";
    return "available";
  }

  async function handleConfirm() {
    if (!selectedCard || isPlaying) return;
    setIsPlaying(true);

    const { action, label } = selectedCard;

    let result:
      | { success: true; remainingBalance: number }
      | { error: string }
      | {
          success: true;
          remainingBalance: number;
          leaked: unknown;
        }
      | {
          success: true;
          remainingBalance: number;
          blockedUsers: string[];
        };

    switch (action) {
      case "double_down":
        result = await doubleDown(poll.id, poll.options[0]?.id ?? "");
        break;
      case "the_leak":
        result = await theLeak(poll.id);
        break;
      case "the_coup":
        result = await theCoup(poll.id);
        break;
      case "ghost_vote":
        result = await ghostVote(poll.id, [poll.options[0]?.id ?? ""]);
        break;
      case "the_veto":
        result = { error: "Select a user to veto (coming soon)" };
        break;
      case "hail_mary":
        result = await hailMary(poll.id);
        break;
      default:
        result = { error: "Unknown action" };
    }

    if ("error" in result) {
      toast.error(friendlyError(result.error, label));
    } else {
      toast.success(`${label} activated`);
    }

    setIsPlaying(false);
    setSelectedCard(null);
    onOpenChange(false);
  }

  function handleClose() {
    setSelectedCard(null);
    setIsPlaying(false);
    onOpenChange(false);
  }

  const totalCards = CARDS.length;
  const arcSpread = 5; // degrees per card from center

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
        else onOpenChange(v);
      }}
      title="Corruption Cards"
      hideTitle
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <Text variant="web-section">Play a card</Text>
          <Text variant="body" color="subtle" className="mt-1.5">
            Unleash chaos on this poll
          </Text>
        </div>

        <AnimatedHeight>
          <AnimatePresence mode="wait">
            {selectedCard ? (
            /* ── Selected card detail view ── */
            <motion.div
              key="detail"
              initial={
                reducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.95, y: 8 }
              }
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={
                reducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.97 }
              }
              transition={{
                duration: 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex flex-col items-center gap-4"
            >
              {/* Large card */}
              <div
                className="w-48 rounded-2xl p-6 flex flex-col items-center gap-3 text-center shadow-lg"
                style={{
                  background: SOLID_BG[selectedCard.action],
                  border: `2px solid ${selectedCard.color}50`,
                }}
              >
                <span
                  className="text-3xl mb-1"
                  role="img"
                  aria-hidden="true"
                >
                  {selectedCard.patternEmoji}
                </span>
                <span style={{ color: selectedCard.color }}>
                  {selectedCard.icon}
                </span>
                <Text variant="subheading" className="font-bold">
                  {selectedCard.label}
                </Text>
                <div
                  className="px-2.5 py-1 rounded-full text-[11px] font-bold"
                  style={{
                    background: `${selectedCard.color}20`,
                    color: selectedCard.color,
                  }}
                >
                  {ACTION_COSTS[selectedCard.action]}{" "}
                  {ACTION_COSTS[selectedCard.action] === 1
                    ? "token"
                    : "tokens"}
                </div>
              </div>

              {/* Dramatic description */}
              <Text
                variant="body"
                color="subtle"
                className="text-center max-w-[280px] leading-relaxed"
              >
                {selectedCard.dramaticDescription}
              </Text>

              {/* Action buttons */}
              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setSelectedCard(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    background: "#F7F4F0",
                    border: "1px solid var(--color-edge)",
                    color: "var(--color-ink-subtle)",
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isPlaying}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                  style={{
                    background: selectedCard.color,
                    opacity: isPlaying ? 0.7 : 1,
                    boxShadow: `0 4px 14px ${selectedCard.color}40`,
                  }}
                >
                  {isPlaying ? "Playing..." : selectedCard.confirmLabel}
                </button>
              </div>
            </motion.div>
          ) : (
            /* ── Card fan ── */
            <motion.div
              key="fan"
              className="relative flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Fan container */}
              <div
                className="relative flex items-end justify-center"
                style={{ height: 220, perspective: "800px" }}
              >
                {CARDS.map((card, i) => {
                  const state = getCardState(card.action);
                  const centerIdx = (totalCards - 1) / 2;
                  const offset = i - centerIdx;
                  const rotation = offset * arcSpread;
                  const xShift = offset * 48;
                  const yShift = Math.abs(offset) * 6;
                  const cost = ACTION_COSTS[card.action];
                  const baseZ = totalCards - Math.abs(offset);
                  const isDisabled = state !== "available";

                  return (
                    <motion.button
                      key={card.action}
                      type="button"
                      disabled={isDisabled}
                      onClick={() =>
                        state === "available" && setSelectedCard(card)
                      }
                      onHoverStart={() =>
                        !isDisabled && setHoveredCard(card.action)
                      }
                      onHoverEnd={() => setHoveredCard(null)}
                      initial={
                        reducedMotion
                          ? { opacity: 0 }
                          : { opacity: 0, y: 60, scale: 0.8 }
                      }
                      animate={{
                        opacity: isDisabled ? 0.35 : 1,
                        y: -yShift,
                        scale: 1,
                        rotate: rotation,
                        x: xShift,
                        zIndex: baseZ,
                        transition: {
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                          mass: 0.6,
                          delay: reducedMotion ? 0 : i * 0.05,
                        },
                      }}
                      whileHover={
                        !isDisabled && !reducedMotion
                          ? {
                              y: -yShift - 20,
                              scale: 1.1,
                              zIndex: 20,
                              transition: {
                                type: "spring",
                                stiffness: 800,
                                damping: 35,
                                mass: 0.4,
                              },
                            }
                          : undefined
                      }
                      whileTap={
                        !isDisabled && !reducedMotion
                          ? {
                              scale: 0.97,
                              transition: { duration: 0.1, ease: [0.22, 1, 0.36, 1] },
                            }
                          : undefined
                      }
                      className="absolute flex flex-col items-center gap-1.5 rounded-xl px-3 py-3.5 shadow-md select-none"
                      style={{
                        width: 80,
                        height: 110,
                        transformOrigin: "bottom center",
                        background:
                          state === "used"
                            ? "#E8E4E0"
                            : SOLID_BG[card.action],
                        border:
                          state === "used"
                            ? "1.5px solid #D4CFC8"
                            : `1.5px solid ${card.color}40`,
                        cursor: isDisabled ? "not-allowed" : "pointer",
                      }}
                    >
                      {/* Status overlay */}
                      {state === "used" && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl">
                          <div className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-[#9A8E82] bg-[#D4CFC8] -rotate-12">
                            Used
                          </div>
                        </div>
                      )}
                      {state === "unavailable" && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-[#F7F4F0]/90">
                          <Lock className="w-4 h-4 text-[#B0A296]" />
                        </div>
                      )}

                      {/* Card content */}
                      <span
                        style={{
                          color:
                            state === "used" ? "#B0A296" : card.color,
                        }}
                      >
                        {card.icon}
                      </span>
                      <Text
                        variant="caption"
                        color={state === "used" ? "subtle" : "default"}
                        className="font-semibold text-center leading-tight text-[10px]"
                      >
                        {card.label}
                      </Text>
                      <Text variant="caption" color="subtle" className="text-[9px]">
                        {state === "used" ? (
                          <Check className="w-3 h-3 inline" />
                        ) : (
                          `${cost}🪙`
                        )}
                      </Text>
                    </motion.button>
                  );
                })}
              </div>

              {/* Hover description — appears below the fan */}
              <div className="h-8 flex items-center justify-center mt-2">
                <AnimatePresence mode="wait">
                  {hoveredCard && (
                    <motion.div
                      key={hoveredCard}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                        mass: 0.5,
                      }}
                    >
                      <Text variant="caption" color="subtle" className="text-center">
                        {CARDS.find((c) => c.action === hoveredCard)
                          ?.description}
                      </Text>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </AnimatedHeight>
      </div>
    </Sheet>
  );
}
