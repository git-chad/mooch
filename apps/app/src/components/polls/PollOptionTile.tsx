"use client";

import type { PollOptionWithVotes } from "@mooch/stores";
import { Avatar, Text } from "@mooch/ui";
import { motion, useReducedMotion } from "motion/react";
import { useMemo } from "react";
import { motionDuration, motionEase } from "@/lib/motion";

type Props = {
  option: PollOptionWithVotes;
  totalWeightedVotes: number;
  isSelected: boolean;
  isClosed: boolean;
  isAnonymous: boolean;
  isMultiChoice: boolean;
  onVote: () => void;
};

export function PollOptionTile({
  option,
  totalWeightedVotes,
  isSelected,
  isClosed,
  isAnonymous,
  isMultiChoice,
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

  return (
    <motion.button
      type="button"
      onClick={isInteractive ? onVote : undefined}
      disabled={!isInteractive}
      whileTap={isInteractive && !reducedMotion ? { scale: 0.985 } : undefined}
      className="relative w-full text-left rounded-xl overflow-hidden transition-colors"
      style={{
        background: isSelected ? "#F0EDE8" : "#F7F4F0",
        border: isSelected
          ? "1.5px solid var(--color-accent)"
          : "1px solid var(--color-edge)",
        cursor: isInteractive ? "pointer" : "default",
      }}
    >
      {/* Content */}
      <div className="relative z-10 px-3 py-2.5 space-y-2">
        {/* Top row: indicator + text + avatars + percentage */}
        <div className="flex items-center gap-3">
          {/* Radio/checkbox indicator */}
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

          {/* Option text */}
          <Text variant="label" color="default" className="flex-1 min-w-0">
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

          {/* Percentage */}
          <Text
            variant="label"
            color={isSelected ? "default" : "subtle"}
            className="shrink-0 tabular-nums font-semibold w-10 text-right"
          >
            {percentage}%
          </Text>
        </div>

        {/* Rounded progress bar */}
        <div
          className="w-full rounded-full overflow-hidden"
          style={{
            height: 6,
            background: "rgba(0, 0, 0, 0.04)",
          }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: isSelected ? "var(--color-accent)" : "#C4B8AE",
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
