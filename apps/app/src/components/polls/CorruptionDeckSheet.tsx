"use client";

import { ACTION_COSTS } from "@mooch/db";
import type { PollWithOptions } from "@mooch/stores";
import type { CorruptionAction } from "@mooch/types";
import { Sheet, Text } from "@mooch/ui";
import { Ban, Check, Coins, Crown, Dices, Eye, EyeOff, Lock, UserX } from "lucide-react";
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
import {
  CorruptionIconTile,
  CorruptionRevealTile,
} from "./corruptionIconPack";

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
  iconSmall: React.ReactNode;
  color: string;
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
    iconSmall: <Dices className="w-4 h-4" />,
    color: "#C8963E",
  },
  {
    action: "the_leak",
    label: "The Leak",
    description: "Reveal who voted what",
    dramaticDescription:
      "Rip the curtain open. Every anonymous vote will be exposed for all to see. No more hiding.",
    confirmLabel: "Leak it",
    icon: <Eye className="w-6 h-6" />,
    iconSmall: <Eye className="w-4 h-4" />,
    color: "#1E3A5F",
  },
  {
    action: "ghost_vote",
    label: "Ghost Vote",
    description: "Cast an invisible vote",
    dramaticDescription:
      "Become a phantom. Your vote will count but nobody will ever know it was you. Silent influence.",
    confirmLabel: "Go ghost",
    icon: <EyeOff className="w-6 h-6" />,
    iconSmall: <EyeOff className="w-4 h-4" />,
    color: "#9CA3AF",
  },
  {
    action: "hail_mary",
    label: "Hail Mary",
    description: "Block debtors from voting",
    dramaticDescription:
      "Pay up or shut up. Anyone who owes money in this group loses their voice. Desperation move.",
    confirmLabel: "Block the debtors",
    icon: <Ban className="w-6 h-6" />,
    iconSmall: <Ban className="w-4 h-4" />,
    color: "#166534",
  },
  {
    action: "the_veto",
    label: "The Veto",
    description: "Nullify someone's vote",
    dramaticDescription:
      "Erase them from the record. One person's vote — gone, like it never happened.",
    confirmLabel: "Veto them",
    icon: <UserX className="w-6 h-6" />,
    iconSmall: <UserX className="w-4 h-4" />,
    color: "#6B21A8",
  },
  {
    action: "the_coup",
    label: "The Coup",
    description: "Force-close this poll",
    dramaticDescription:
      "Democracy ends now. You seize control and declare the current leader the winner. Absolute power.",
    confirmLabel: "Seize power",
    icon: <Crown className="w-6 h-6" />,
    iconSmall: <Crown className="w-4 h-4" />,
    color: "#DC2626",
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

type RGB = { r: number; g: number; b: number };

function parseHexColor(value: string): RGB | null {
  const hex = value.replace("#", "").trim();
  if (!/^[\da-fA-F]{6}$/.test(hex)) return null;
  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
  };
}

function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function mixColor(source: RGB, target: RGB, amount: number): RGB {
  return {
    r: clamp(source.r + (target.r - source.r) * amount),
    g: clamp(source.g + (target.g - source.g) * amount),
    b: clamp(source.b + (target.b - source.b) * amount),
  };
}

function rgbString(color: RGB): string {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

function getActionButtonPalette(baseHex: string) {
  const base = parseHexColor(baseHex);
  if (!base) {
    return {
      start: "#EE4D4D",
      end: "#C82323",
      border: "#BB1E1E",
      depth: "#911515",
      glow: "rgba(190, 38, 38, 0.32)",
    };
  }

  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };
  return {
    start: rgbString(mixColor(base, white, 0.16)),
    end: rgbString(mixColor(base, black, 0.09)),
    border: rgbString(mixColor(base, black, 0.18)),
    depth: rgbString(mixColor(base, black, 0.34)),
    glow: `rgba(${base.r}, ${base.g}, ${base.b}, 0.28)`,
  };
}

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
  const selectedActionPalette = selectedCard
    ? getActionButtonPalette(selectedCard.color)
    : null;

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

        <AnimatedHeight overflow="visible">
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
                className="relative h-[300px] w-[220px] overflow-hidden rounded-[28px] text-center shadow-lg"
                style={{
                  background: SOLID_BG[selectedCard.action],
                  border: `2px solid ${selectedCard.color}50`,
                }}
              >
                <CorruptionRevealTile
                  key={selectedCard.action}
                  action={selectedCard.action}
                  reducedMotion={reducedMotion}
                  tone="fullbleed"
                  className="absolute inset-0 size-full"
                  imageClassName="h-full w-full object-cover"
                  fallback={
                    <span className="inline-flex text-[#7C6758]">
                      {selectedCard.icon}
                    </span>
                  }
                />
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-28"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(253,249,245,0) 0%, rgba(253,249,245,0.56) 58%, rgba(253,249,245,0.9) 100%)",
                  }}
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center px-4 text-center">
                  <Text
                    variant="subheading"
                    className="font-bold leading-tight [text-shadow:0_2px_8px_rgba(255,255,255,0.8)]"
                  >
                    {selectedCard.label}
                  </Text>
                  <Text
                    variant="caption"
                    className="mt-1 inline-flex items-center gap-1.5 font-bold text-[13px] [text-shadow:0_2px_8px_rgba(255,255,255,0.82)]"
                    style={{ color: selectedCard.color }}
                  >
                    <Coins className="h-3 w-3" />
                    <span>
                      {ACTION_COSTS[selectedCard.action]}{" "}
                      {ACTION_COSTS[selectedCard.action] === 1
                        ? "token"
                        : "tokens"}
                    </span>
                  </Text>
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
                <motion.button
                  type="button"
                  onClick={() => setSelectedCard(null)}
                  whileHover={reducedMotion ? undefined : { y: -1, scale: 1.008 }}
                  whileTap={reducedMotion ? undefined : { y: 1, scale: 0.992 }}
                  transition={{
                    type: "spring",
                    stiffness: 520,
                    damping: 28,
                    mass: 0.52,
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
                  style={{
                    background:
                      "linear-gradient(180deg, #FFFDF9 0%, #F4ECE4 100%)",
                    borderColor: "var(--color-edge)",
                    color: "var(--color-ink-label)",
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.72), inset 0 -1px 2px rgba(0,0,0,0.08), 0 1px 0 #C2B4A7, 0 5px 10px rgba(128,101,79,0.14)",
                  }}
                >
                  Back
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isPlaying}
                  whileHover={
                    !isPlaying && !reducedMotion
                      ? { y: -1, scale: 1.008, filter: "brightness(1.04)" }
                      : undefined
                  }
                  whileTap={
                    !isPlaying && !reducedMotion
                      ? { y: 1, scale: 0.992 }
                      : undefined
                  }
                  transition={{
                    type: "spring",
                    stiffness: 560,
                    damping: 28,
                    mass: 0.5,
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white border disabled:cursor-not-allowed"
                  style={{
                    background: `linear-gradient(180deg, ${selectedActionPalette?.start ?? selectedCard.color} 0%, ${selectedActionPalette?.end ?? selectedCard.color} 100%)`,
                    borderColor:
                      selectedActionPalette?.border ?? selectedCard.color,
                    opacity: isPlaying ? 0.7 : 1,
                    boxShadow: [
                      "inset 0 1px 0 rgba(255,255,255,0.34)",
                      "inset 0 -2px 3px rgba(0,0,0,0.2)",
                      `0 2px 0 ${selectedActionPalette?.depth ?? selectedCard.color}`,
                      `0 8px 14px ${selectedActionPalette?.glow ?? "rgba(0,0,0,0.2)"}`,
                    ].join(", "),
                  }}
                >
                  {isPlaying ? "Playing..." : selectedCard.confirmLabel}
                </motion.button>
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
                style={{ height: 310, perspective: "920px" }}
              >
                {CARDS.map((card, i) => {
                  const state = getCardState(card.action);
                  const centerIdx = (totalCards - 1) / 2;
                  const offset = i - centerIdx;
                  const rotation = offset * arcSpread;
                  const xShift = offset * 52;
                  const yShift = Math.abs(offset) * 10;
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
                      className="absolute overflow-hidden rounded-[22px] shadow-[0_12px_22px_rgba(67,45,33,0.16)] select-none"
                      style={{
                        width: 125,
                        height: 178,
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
                      <CorruptionIconTile
                        action={card.action}
                        variant="blueprint"
                        tone="fullbleed"
                        className="absolute inset-0 size-full"
                        imageClassName="h-full w-full object-cover"
                        fallback={
                          <span
                            style={{
                              color: state === "used" ? "#B0A296" : card.color,
                            }}
                          >
                            {card.iconSmall}
                          </span>
                        }
                      />
                      <div
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
                        style={{
                          background:
                            "linear-gradient(180deg, rgba(253,249,245,0) 0%, rgba(253,249,245,0.44) 62%, rgba(253,249,245,0.84) 100%)",
                        }}
                      />
                      <div className="pointer-events-none absolute inset-x-2 bottom-2 rounded-xl px-2 py-1.5 text-center">
                        <Text
                          variant="caption"
                          color={state === "used" ? "subtle" : "default"}
                          className="font-semibold leading-tight text-[11px] [text-shadow:0_1px_2px_rgba(255,255,255,0.6)]"
                        >
                          {card.label}
                        </Text>
                      </div>
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
