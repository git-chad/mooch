"use client";

import type { PollOptionWithVotes, PollWithOptions } from "@mooch/stores";
import { usePollStore } from "@mooch/stores";
import { Badge, Text } from "@mooch/ui";
import { Ban, BarChart3, Crown, EyeOff, Flame, ListChecks, Pin } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { togglePinPoll, vote } from "@/app/actions/polls";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { relativeTime } from "@/lib/expenses";
import { getSurfaceTransition, motionDuration, motionEase } from "@/lib/motion";
import { CorruptionActionsBar } from "./CorruptionActionsBar";
import { CorruptionActivityLog } from "./CorruptionActivityLog";
import { PollCountdown } from "./PollCountdown";
import { PollOptionTile } from "./PollOptionTile";
import { PollResultsSheet } from "./PollResultsSheet";

type Props = {
  poll: PollWithOptions;
  currentUserId: string;
  groupId: string;
};

/**
 * Derive the set of option IDs the current user voted on from poll data.
 */
function deriveSelectedIds(
  options: PollOptionWithVotes[],
  userId: string,
): Set<string> {
  const ids = new Set<string>();
  for (const opt of options) {
    if (opt.voters.some((v) => v.id === userId)) {
      ids.add(opt.id);
    }
  }
  return ids;
}

export function PollCard({ poll, currentUserId, groupId }: Props) {
  const reducedMotion = useReducedMotion() ?? false;
  const [resultsOpen, setResultsOpen] = useState(false);
  const upsertPoll = usePollStore((s) => s.upsertPoll);

  // Optimistic pin state — null means "use server data"
  const [optimisticPinned, setOptimisticPinned] = useState<boolean | null>(null);
  const isPinned = optimisticPinned ?? poll.is_pinned;

  // Clear optimistic pin when server catches up
  useEffect(() => {
    if (optimisticPinned !== null && poll.is_pinned === optimisticPinned) {
      setOptimisticPinned(null);
    }
  }, [poll.is_pinned, optimisticPinned]);

  const transition = useMemo(
    () => getSurfaceTransition(reducedMotion, motionDuration.fast),
    [reducedMotion],
  );

  // Server-derived selection (from store/realtime)
  const serverSelectedIds = useMemo(
    () => deriveSelectedIds(poll.options, currentUserId),
    [poll.options, currentUserId],
  );

  // Local optimistic state — null means "use server data"
  const [optimistic, setOptimistic] = useState<{
    selectedIds: Set<string>;
    options: PollOptionWithVotes[];
    totalVotes: number;
  } | null>(null);

  // Track which vote we're waiting on so we can clear optimistic when server catches up
  const pendingVoteRef = useRef<string | null>(null);

  // When server data updates and matches our optimistic vote, clear optimistic state
  useEffect(() => {
    if (!optimistic || !pendingVoteRef.current) return;

    const serverIds = deriveSelectedIds(poll.options, currentUserId);
    const optimisticIds = optimistic.selectedIds;

    const serverArr = [...serverIds].sort();
    const optimisticArr = [...optimisticIds].sort();

    if (
      serverArr.length === optimisticArr.length &&
      serverArr.every((id, i) => id === optimisticArr[i])
    ) {
      setOptimistic(null);
      pendingVoteRef.current = null;
    }
  }, [poll.options, currentUserId, optimistic]);

  // Display data: optimistic if active, otherwise server
  const displayOptions = optimistic ? optimistic.options : poll.options;
  const displayTotal = optimistic ? optimistic.totalVotes : poll.total_votes;
  const displaySelectedIds = optimistic
    ? optimistic.selectedIds
    : serverSelectedIds;

  // Find coup action for badge
  const coupAction = poll.token_actions.find((a) => a.action === "the_coup");
  const hailMaryActive = poll.token_actions.some(
    (a) => a.action === "hail_mary",
  );

  // Leading option (highest weighted_count)
  const maxWeighted = Math.max(
    ...displayOptions.map((o) => o.weighted_count),
    0,
  );

  // Winner(s) for closed polls
  const winnerIds = useMemo(() => {
    if (!poll.is_closed || displayTotal === 0) return new Set<string>();
    return new Set(
      displayOptions
        .filter((o) => o.weighted_count === maxWeighted && maxWeighted > 0)
        .map((o) => o.id),
    );
  }, [poll.is_closed, displayOptions, displayTotal, maxWeighted]);

  // Hot poll heuristic: open + has corruption actions + 5+ votes
  const isHot =
    !poll.is_closed &&
    poll.token_actions.length > 0 &&
    displayTotal >= 5;

  // Derive badges
  const badges: { label: string; icon: React.ReactNode; color?: string }[] = [];
  if (poll.is_anonymous) {
    badges.push({
      label: "Anonymous",
      icon: <EyeOff className="h-3 w-3" />,
      color: "#546B7E",
    });
  }
  if (poll.is_multi_choice) {
    badges.push({
      label: "Multi-choice",
      icon: <ListChecks className="h-3 w-3" />,
      color: "#7A6A5A",
    });
  }
  if (coupAction)
    badges.push({
      label: "Coup'd",
      icon: <Crown className="h-3 w-3" />,
      color: "#B24A3A",
    });
  if (hailMaryActive)
    badges.push({
      label: "Moochers blocked",
      icon: <Ban className="h-3 w-3" />,
      color: "#8B6914",
    });

  const handleVote = useCallback(
    (optionId: string) => {
      if (poll.is_closed) return;

      const currentIds = optimistic
        ? optimistic.selectedIds
        : serverSelectedIds;

      let nextIds: Set<string>;
      if (poll.is_multi_choice) {
        nextIds = new Set(currentIds);
        if (nextIds.has(optionId)) nextIds.delete(optionId);
        else nextIds.add(optionId);
      } else {
        nextIds = currentIds.has(optionId)
          ? new Set<string>()
          : new Set([optionId]);
      }

      const baseOptions = optimistic ? optimistic.options : poll.options;
      const fakeProfile = {
        id: currentUserId,
        display_name: "You",
        photo_url: null,
        locale: "",
        default_currency: "",
        created_at: "",
        updated_at: "",
      };

      const updatedOptions = baseOptions.map((opt) => {
        const wasSelected = currentIds.has(opt.id);
        const isNowSelected = nextIds.has(opt.id);

        if (wasSelected === isNowSelected) return opt;

        const delta = isNowSelected ? 1 : -1;
        return {
          ...opt,
          vote_count: Math.max(0, opt.vote_count + delta),
          weighted_count: Math.max(0, opt.weighted_count + delta),
          voters: isNowSelected
            ? [...opt.voters.filter((v) => v.id !== currentUserId), fakeProfile]
            : opt.voters.filter((v) => v.id !== currentUserId),
        };
      });

      const baseTotal = optimistic ? optimistic.totalVotes : poll.total_votes;
      const added = [...nextIds].filter((id) => !currentIds.has(id)).length;
      const removed = [...currentIds].filter((id) => !nextIds.has(id)).length;
      const newTotal = Math.max(0, baseTotal + added - removed);

      const voteKey = [...nextIds].sort().join(",");
      pendingVoteRef.current = voteKey;
      setOptimistic({
        selectedIds: nextIds,
        options: updatedOptions,
        totalVotes: newTotal,
      });

      vote(poll.id, [...nextIds]).then((result) => {
        if ("error" in result) {
          setOptimistic(null);
          pendingVoteRef.current = null;
        }
      });
    },
    [poll, serverSelectedIds, currentUserId, optimistic],
  );

  const handleTogglePin = useCallback(async () => {
    const next = !isPinned;
    // Optimistic update
    setOptimisticPinned(next);
    upsertPoll({ ...poll, is_pinned: next });

    const result = await togglePinPoll(poll.id);
    if ("error" in result) {
      // Revert
      setOptimisticPinned(null);
      upsertPoll(poll);
      toast.error(result.error);
    }
  }, [poll, isPinned, upsertPoll]);

  // Status dot color: green for open, muted for closed
  const statusDotColor = poll.is_closed ? "#C4B8AE" : "#5B8C5A";

  return (
    <>
      <motion.div
        layout="position"
        transition={transition}
        className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-edge)",
          boxShadow: isHot
            ? "0 0 20px rgba(255, 107, 53, 0.08)"
            : undefined,
        }}
      >
        <div className="px-5 pt-5 pb-4 space-y-3">
          {/* Header: question + meta + results button */}
          <div>
            <div className="flex items-start justify-between gap-2">
              {/* Status dot + question */}
              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 mt-[7px]"
                  style={{ background: statusDotColor }}
                />
                <Text variant="heading" className="flex-1 min-w-0">
                  {poll.question}
                </Text>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {/* Pin button */}
                <button
                  type="button"
                  onClick={handleTogglePin}
                  className="inline-flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-[#F0EDE8]"
                  style={{
                    color: isPinned ? "var(--color-accent)" : "var(--color-ink-subtle)",
                  }}
                  aria-label={isPinned ? "Unpin poll" : "Pin poll"}
                >
                  <Pin className="w-3.5 h-3.5" style={{ fill: isPinned ? "currentColor" : "none" }} />
                </button>
                {/* Results button */}
                <button
                  type="button"
                  onClick={() => setResultsOpen(true)}
                  className="inline-flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-[#F0EDE8]"
                  style={{ color: "var(--color-ink-subtle)" }}
                  aria-label="View results"
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
                {poll.is_closed && !coupAction && (
                  <Badge variant="closed" label="Closed" size="sm" />
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap ml-5">
              {poll.created_by_profile?.display_name && (
                <Text variant="caption" color="subtle">
                  {poll.created_by_profile.display_name}
                </Text>
              )}
              <Text variant="caption" color="subtle">
                · {relativeTime(poll.created_at)}
              </Text>
              <Text variant="caption" color="subtle">
                ·{" "}
                <AnimatedNumber
                  value={displayTotal}
                  className="tabular-nums"
                />{" "}
                {displayTotal === 1 ? "vote" : "votes"}
              </Text>
              {/* Countdown timer for polls with closes_at */}
              {poll.closes_at && !poll.is_closed && (
                <PollCountdown closesAt={poll.closes_at} />
              )}
            </div>

            {/* Badges */}
            <AnimatePresence initial={false}>
              {(badges.length > 0 || isHot) && (
                <motion.div
                  className="flex flex-wrap gap-1.5 mt-2 ml-5"
                  initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: motionDuration.fast,
                    ease: motionEase.out,
                  }}
                >
                  {isHot && (
                    <Badge
                      label="Hot"
                      icon={<Flame className="h-3 w-3" />}
                      size="sm"
                      color="#FF6B35"
                    />
                  )}
                  {badges.map((b) => (
                    <Badge
                      key={b.label}
                      label={b.label}
                      icon={b.icon}
                      size="sm"
                      color={b.color}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Options */}
          <div className="space-y-2">
            {displayOptions.map((option) => (
              <PollOptionTile
                key={option.id}
                option={option}
                totalWeightedVotes={displayTotal}
                isSelected={displaySelectedIds.has(option.id)}
                isClosed={poll.is_closed}
                isAnonymous={poll.is_anonymous}
                isMultiChoice={poll.is_multi_choice}
                isLeading={
                  !poll.is_closed &&
                  option.weighted_count === maxWeighted &&
                  maxWeighted > 0
                }
                isWinner={winnerIds.has(option.id)}
                onVote={() => handleVote(option.id)}
              />
            ))}
          </div>
        </div>

        {/* Corruption activity log — between options and card deck */}
        {poll.token_actions.length > 0 && (
          <CorruptionActivityLog tokenActions={poll.token_actions} />
        )}

        {/* Corruption actions bar — only for open polls */}
        {!poll.is_closed && (
          <CorruptionActionsBar
            poll={poll}
            currentUserId={currentUserId}
            groupId={groupId}
          />
        )}
      </motion.div>

      {/* Results sheet */}
      <PollResultsSheet
        open={resultsOpen}
        onOpenChange={setResultsOpen}
        poll={poll}
        displayOptions={displayOptions}
        displayTotal={displayTotal}
        winnerIds={winnerIds}
      />
    </>
  );
}
