"use client";

import type { PollOptionWithVotes } from "@mooch/stores";
import { Avatar, Text } from "@mooch/ui";
import { Crown } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useMemo } from "react";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { motionDuration, motionEase } from "@/lib/motion";

type Props = {
  option: PollOptionWithVotes;
  totalWeightedVotes: number;
  isSelected: boolean;
  isClosed: boolean;
  isAnonymous: boolean;
  isMultiChoice: boolean;
  isLeading: boolean;
  isWinner: boolean;
  onVote: () => void;
};

export function PollOptionTile({
  option,
  totalWeightedVotes,
  isSelected,
  isClosed,
  isAnonymous,
  isMultiChoice,
  isLeading,
  isWinner,
  onVote,
}: Props) {
  const reducedMotion = useReducedMotion() ?? false;
  const percentage =
    totalWeightedVotes > 0
      ? Math.round((option.weighted_count / totalWeightedVotes) * 100)
      : 0;

  const barTransition = useMemo(
    () =>
      reducedMotion
        ? { duration: motionDuration.fast, ease: motionEase.out }
        : { type: "spring" as const, stiffness: 300, damping: 30, mass: 0.8 },
    [reducedMotion],
  );

  const isInteractive = !isClosed;

  // Closed poll styling
  const isMutedLoser = isClosed && !isWinner && totalWeightedVotes > 0;

  // Bar color logic
  const barColor = isMutedLoser
    ? "#E0D8D0"
    : isWinner
      ? "#C8963E"
      : isSelected
        ? "var(--color-accent)"
        : "#C4B8AE";

  // Background gradient for winner
  const winnerBg = isWinner
    ? "linear-gradient(135deg, #FDF8F0 0%, #F8EFE0 100%)"
    : undefined;

  return (
    <motion.button
      type="button"
      onClick={isInteractive ? onVote : undefined}
      disabled={!isInteractive}
      whileTap={isInteractive && !reducedMotion ? { scale: 0.985 } : undefined}
      className="relative w-full text-left rounded-xl overflow-hidden transition-colors"
      style={{
        background: winnerBg ?? (isSelected ? "#F0EDE8" : "#F7F4F0"),
        border: isWinner
          ? "1.5px solid #C8963E"
          : isSelected
            ? "1.5px solid var(--color-accent)"
            : "1.5px solid var(--color-edge)",
        boxShadow: isWinner
          ? "inset 3px 0 0 #C8963E"
          : undefined,
        cursor: isInteractive ? "pointer" : "default",
      }}
    >
      {/* Content */}
      <div className="relative z-10 px-3 py-2.5 space-y-2">
        {/* Top row: indicator + text + avatars + percentage */}
        <div className="flex items-center gap-3">
          {/* Radio/checkbox indicator or crown for winner */}
          {isWinner ? (
            <div className="w-[18px] h-[18px] shrink-0 flex items-center justify-center">
              <Crown className="w-4 h-4" style={{ color: "#C8963E" }} />
            </div>
          ) : (
            <div
              className="w-[18px] h-[18px] shrink-0 flex items-center justify-center"
              style={{
                border: isSelected
                  ? "2px solid var(--color-accent)"
                  : "1.5px solid #C4B8AE",
                borderRadius: isMultiChoice ? "5px" : "50%",
                background: isSelected ? "var(--color-accent)" : "transparent",
                transition:
                  "background 0.15s ease-out, border-color 0.15s ease-out",
                opacity: isMutedLoser ? 0.5 : 1,
              }}
            >
              {isSelected && (
                <motion.svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  initial={reducedMotion ? false : { scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 25,
                  }}
                >
                  <path
                    d="M2 5.5L4 7.5L8 3"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </motion.svg>
              )}
            </div>
          )}

          {/* Option text */}
          <Text
            variant="label"
            color={isMutedLoser ? "subtle" : "default"}
            className="flex-1 min-w-0"
          >
            {option.text}
          </Text>

          {/* Voter avatars (non-anonymous, max 3 + overflow) */}
          {!isAnonymous && option.voters.length > 0 && (
            <div className="flex -space-x-1.5 shrink-0">
              {option.voters.slice(0, 3).map((voter) => (
                <motion.div
                  key={voter.id}
                  className="rounded-full ring-1 ring-white"
                  initial={reducedMotion ? false : { scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 22,
                  }}
                >
                  <Avatar
                    src={voter.photo_url ?? undefined}
                    name={voter.display_name}
                    size="sm"
                  />
                </motion.div>
              ))}
              {option.voters.length > 3 && (
                <div className="w-7 h-7 rounded-full bg-[#F7F2ED] ring-1 ring-white flex items-center justify-center">
                  <Text variant="caption" color="subtle">
                    +{option.voters.length - 3}
                  </Text>
                </div>
              )}
            </div>
          )}

          {/* Animated percentage */}
          <span className="shrink-0 tabular-nums font-semibold w-10 text-right text-[13px]">
            <AnimatedNumber
              value={percentage}
              className={
                isMutedLoser
                  ? "text-[var(--color-ink-subtle)]"
                  : isWinner
                    ? "text-[#C8963E]"
                    : isSelected
                      ? "text-[var(--color-ink)]"
                      : "text-[var(--color-ink-subtle)]"
              }
              format={(n) => `${Math.round(n)}%`}
            />
          </span>
        </div>

        {/* Rounded progress bar */}
        <div
          className="w-full rounded-full overflow-hidden"
          style={{
            height: 8,
            background: "rgba(0, 0, 0, 0.04)",
          }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background:
                isWinner
                  ? "linear-gradient(90deg, #C8963E, #D4A84E)"
                  : isSelected && isLeading
                    ? "linear-gradient(90deg, var(--color-accent), var(--color-accent-strong, var(--color-accent)))"
                    : barColor,
              boxShadow:
                isLeading && !isClosed && !isMutedLoser
                  ? "0 0 8px var(--color-accent)"
                  : isWinner
                    ? "0 0 8px rgba(200, 150, 62, 0.4)"
                    : "none",
            }}
            initial={false}
            animate={{ width: `${Math.max(percentage, 0)}%` }}
            transition={barTransition}
          />
        </div>
      </div>
    </motion.button>
  );
}
