"use client";

import { Tooltip } from "@base-ui-components/react";
import { ACTION_COSTS } from "@mooch/db";
import type { PollWithOptions } from "@mooch/stores";
import type { CorruptionAction } from "@mooch/types";
import { ConfirmDialog, Text } from "@mooch/ui";
import { Ban, Check, Crown, Dices, Eye, EyeOff, UserX } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
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

/** Map raw server error strings to clear, user-friendly messages. */
function friendlyError(raw: string, actionLabel: string): string {
  if (raw === "INSUFFICIENT_TOKENS" || raw.includes("INSUFFICIENT_TOKENS")) {
    return `Not enough tokens for ${actionLabel}. Buy more in Settings.`;
  }
  if (raw === "Not authenticated") {
    return "You need to be logged in to use corruption tokens.";
  }
  if (raw.includes("already used")) {
    return `You already used ${actionLabel} on this poll.`;
  }
  if (raw.includes("Poll is closed") || raw.includes("already closed")) {
    return "This poll is already closed.";
  }
  if (raw.includes("Cannot use")) {
    return raw; // already human-readable (e.g. "Cannot use Double Down and Ghost Vote...")
  }
  if (raw.includes("only works on anonymous")) {
    return "The Leak only works on anonymous polls.";
  }
  if (raw.includes("Not a member")) {
    return "You're not a member of this group.";
  }
  if (raw.includes("coming soon")) {
    return raw;
  }
  // Fallback — still make it presentable
  return `Something went wrong using ${actionLabel}. Try again.`;
}

type Props = {
  poll: PollWithOptions;
  currentUserId: string;
  groupId: string;
};

const ACTIONS: {
  action: CorruptionAction;
  icon: React.ReactNode;
  label: string;
  description: string;
}[] = [
  {
    action: "double_down",
    icon: <Dices className="w-3.5 h-3.5" />,
    label: "Double Down",
    description: "Your vote counts double",
  },
  {
    action: "the_leak",
    icon: <Eye className="w-3.5 h-3.5" />,
    label: "The Leak",
    description: "Reveal who voted what in anonymous polls",
  },
  {
    action: "ghost_vote",
    icon: <EyeOff className="w-3.5 h-3.5" />,
    label: "Ghost Vote",
    description: "Cast an invisible vote nobody can see",
  },
  {
    action: "hail_mary",
    icon: <Ban className="w-3.5 h-3.5" />,
    label: "Hail Mary",
    description: "Block anyone who owes money from voting",
  },
  {
    action: "the_veto",
    icon: <UserX className="w-3.5 h-3.5" />,
    label: "The Veto",
    description: "Nullify someone's vote entirely",
  },
  {
    action: "the_coup",
    icon: <Crown className="w-3.5 h-3.5" />,
    label: "The Coup",
    description: "Force-close this poll immediately",
  },
];

export function CorruptionActionsBar({ poll, currentUserId }: Props) {
  const reducedMotion = useReducedMotion() ?? false;
  const [pending, setPending] = useState<CorruptionAction | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [leakedData, setLeakedData] = useState<
    | {
        option_id: string;
        option_text: string;
        voters: { id: string; display_name: string }[];
      }[]
    | null
  >(null);

  const usedActions = new Set(
    poll.token_actions
      .filter((a) => a.user_id === currentUserId)
      .map((a) => a.action),
  );

  function isActionAvailable(action: CorruptionAction): boolean {
    if (usedActions.has(action)) return false;
    if (action === "the_leak" && !poll.is_anonymous) return false;
    if (action === "ghost_vote" && usedActions.has("double_down")) return false;
    if (action === "double_down" && usedActions.has("ghost_vote")) return false;
    return true;
  }

  function handleActionClick(action: CorruptionAction) {
    setPending(action);
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    if (!pending) return;
    const actionLabel =
      ACTIONS.find((a) => a.action === pending)?.label ?? pending;
    setConfirmOpen(false);

    let result:
      | { success: true; remainingBalance: number }
      | { error: string }
      | {
          success: true;
          remainingBalance: number;
          leaked: typeof leakedData;
        }
      | {
          success: true;
          remainingBalance: number;
          blockedUsers: string[];
        };

    switch (pending) {
      case "double_down":
        result = await doubleDown(poll.id, poll.options[0]?.id ?? "");
        break;
      case "the_leak":
        result = await theLeak(poll.id);
        if ("leaked" in result && result.leaked) {
          setLeakedData(result.leaked);
        }
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
      toast.error(friendlyError(result.error, actionLabel));
    } else {
      toast.success(`${actionLabel} activated`);
    }

    setPending(null);
  }

  const pendingAction = ACTIONS.find((a) => a.action === pending);

  return (
    <>
      <div
        className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-none"
        style={{
          borderTop: "1px solid var(--color-edge)",
          background: "#FDFCFB",
        }}
      >
        {ACTIONS.map((item, i) => {
          const used = usedActions.has(item.action);
          const available = isActionAvailable(item.action);
          const cost = ACTION_COSTS[item.action];

          return (
            <Tooltip.Root key={item.action}>
              <Tooltip.Trigger
                render={
                  <motion.button
                    type="button"
                    onClick={() => available && handleActionClick(item.action)}
                    disabled={!available}
                    initial={
                      reducedMotion ? false : { opacity: 0, scale: 0.92 }
                    }
                    animate={{
                      opacity: available || used ? 1 : 0.5,
                      scale: 1,
                    }}
                    transition={{
                      duration: motionDuration.fast,
                      ease: motionEase.out,
                      delay: reducedMotion ? 0 : i * 0.03,
                    }}
                    whileTap={
                      available && !reducedMotion ? { scale: 0.93 } : undefined
                    }
                    className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-colors select-none"
                    style={{
                      background: used
                        ? "var(--color-accent-bg)"
                        : available
                          ? "#F7F2ED"
                          : "#F7F4F0",
                      border: used
                        ? "1px solid var(--color-accent-edge)"
                        : "1px solid #DCCBC0",
                      color: used
                        ? "var(--color-accent-fg)"
                        : available
                          ? "#5a3e2b"
                          : "#B0A296",
                      cursor: available ? "pointer" : "default",
                    }}
                  />
                }
              >
                {item.icon}
                <span>{used ? <Check className="w-3 h-3" /> : cost}</span>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Positioner sideOffset={6}>
                  <Tooltip.Popup
                    className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium shadow-md"
                    style={{
                      background: "#3D2E22",
                      color: "#F7F2ED",
                    }}
                  >
                    <span className="font-semibold">{item.label}</span>
                    <span className="opacity-70"> · {item.description}</span>
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </Tooltip.Root>
          );
        })}
      </div>

      {/* Leaked data display */}
      <AnimatePresence>
        {leakedData && (
          <motion.div
            className="px-4 pb-3 space-y-2"
            initial={
              reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -6, filter: "blur(4px)" }
            }
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0 }}
            transition={{
              duration: motionDuration.standard,
              ease: motionEase.out,
            }}
          >
            <Text variant="label" className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              Leaked results
            </Text>
            {leakedData.map((opt) => (
              <div key={opt.option_id} className="text-[12px]">
                <Text variant="caption" color="default" className="font-medium">
                  {opt.option_text}
                </Text>
                <Text variant="caption" color="subtle">
                  {opt.voters.length === 0
                    ? " — no votes"
                    : ` — ${opt.voters.map((v) => v.display_name).join(", ")}`}
                </Text>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Use ${pendingAction?.label ?? ""}?`}
        description={`${pendingAction?.description ?? ""}. This costs ${pendingAction ? ACTION_COSTS[pendingAction.action] : 0} token${(pendingAction ? ACTION_COSTS[pendingAction.action] : 0) === 1 ? "" : "s"}. Everyone will see you used it.`}
        confirmLabel={`Spend ${pendingAction ? ACTION_COSTS[pendingAction.action] : 0} ${(pendingAction ? ACTION_COSTS[pendingAction.action] : 0) === 1 ? "token" : "tokens"}`}
        onConfirm={handleConfirm}
        onCancel={() => {
          setConfirmOpen(false);
          setPending(null);
        }}
      />
    </>
  );
}
