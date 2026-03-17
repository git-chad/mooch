"use client";

import type { PollTokenActionWithProfile } from "@mooch/stores";
import { Avatar, Text } from "@mooch/ui";
import type { CorruptionAction } from "@mooch/types";
import { Ban, ChevronDown, Crown, Dices, Eye, EyeOff, UserX } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { relativeTime } from "@/lib/expenses";
import { motionDuration, motionEase } from "@/lib/motion";

type Props = {
  tokenActions: PollTokenActionWithProfile[];
};

const ACTION_META: Record<
  CorruptionAction,
  { icon: React.ReactNode; color: string; verb: string }
> = {
  double_down: {
    icon: <Dices className="w-3.5 h-3.5" />,
    color: "#C8963E",
    verb: "doubled down",
  },
  the_leak: {
    icon: <Eye className="w-3.5 h-3.5" />,
    color: "#1E3A5F",
    verb: "leaked the votes",
  },
  ghost_vote: {
    icon: <EyeOff className="w-3.5 h-3.5" />,
    color: "#9CA3AF",
    verb: "went ghost",
  },
  hail_mary: {
    icon: <Ban className="w-3.5 h-3.5" />,
    color: "#166534",
    verb: "blocked the debtors",
  },
  the_veto: {
    icon: <UserX className="w-3.5 h-3.5" />,
    color: "#6B21A8",
    verb: "vetoed a vote",
  },
  the_coup: {
    icon: <Crown className="w-3.5 h-3.5" />,
    color: "#DC2626",
    verb: "seized power",
  },
};

export function CorruptionActivityLog({ tokenActions }: Props) {
  const reducedMotion = useReducedMotion() ?? false;
  const [expanded, setExpanded] = useState(false);

  if (tokenActions.length === 0) return null;

  return (
    <div
      className="px-5"
      style={{ borderTop: "1px solid var(--color-edge)" }}
    >
      {/* Collapsible trigger */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between py-2.5 group"
      >
        <Text variant="caption" color="subtle" className="font-medium">
          {tokenActions.length} corruption{" "}
          {tokenActions.length === 1 ? "action" : "actions"} played
        </Text>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-[var(--color-ink-subtle)]"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.span>
      </button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            className="space-y-2.5 pb-3 overflow-hidden"
            initial={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{
              duration: motionDuration.standard,
              ease: motionEase.out,
            }}
          >
            {tokenActions.map((action) => {
              const meta = ACTION_META[action.action];
              const name = action.user?.display_name ?? "Someone";

              return (
                <div key={action.id} className="flex items-center gap-2.5">
                  {/* Avatar */}
                  <Avatar
                    src={action.user?.photo_url ?? undefined}
                    name={name}
                    size="sm"
                  />

                  {/* Icon */}
                  <span style={{ color: meta.color }}>{meta.icon}</span>

                  {/* Dramatic copy */}
                  <Text variant="caption" color="default" className="flex-1 min-w-0">
                    <span className="font-semibold">{name}</span>{" "}
                    <span className="text-[var(--color-ink-subtle)]">
                      {meta.verb}
                    </span>
                  </Text>

                  {/* Timestamp */}
                  <Text variant="caption" color="subtle" className="shrink-0">
                    {relativeTime(action.created_at)}
                  </Text>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
