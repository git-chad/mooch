"use client";

import type { PollOptionWithVotes, PollWithOptions } from "@mooch/stores";
import { Badge, Text } from "@mooch/ui";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { vote } from "@/app/actions/polls";
import { relativeTime } from "@/lib/expenses";
import { getSurfaceTransition, motionDuration, motionEase } from "@/lib/motion";
import { CorruptionActionsBar } from "./CorruptionActionsBar";
import { PollOptionTile } from "./PollOptionTile";

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

    // Check if server data now reflects our optimistic vote
    const serverIds = deriveSelectedIds(poll.options, currentUserId);
    const optimisticIds = optimistic.selectedIds;

    const serverArr = [...serverIds].sort();
    const optimisticArr = [...optimisticIds].sort();

    if (
      serverArr.length === optimisticArr.length &&
      serverArr.every((id, i) => id === optimisticArr[i])
    ) {
      // Server caught up — clear optimistic state
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

  // Derive badges
  const badges: { label: string; emoji: string; color?: string }[] = [];
  if (poll.is_anonymous) badges.push({ label: "Anonymous", emoji: "🕶️" });
  if (poll.is_multi_choice) badges.push({ label: "Multi-choice", emoji: "☑️" });
  if (coupAction)
    badges.push({ label: "Coup'd", emoji: "👑", color: "#b24a3a" });
  if (hailMaryActive)
    badges.push({ label: "Moochers blocked", emoji: "🙏", color: "#8b6914" });

  const handleVote = useCallback(
    (optionId: string) => {
      if (poll.is_closed) return;

      // Use current display state as basis (handles rapid clicks)
      const currentIds = optimistic
        ? optimistic.selectedIds
        : serverSelectedIds;

      // Compute next selected option IDs
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

      // Build optimistic option data
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

      // Set optimistic state — this renders IMMEDIATELY, independent of store
      const voteKey = [...nextIds].sort().join(",");
      pendingVoteRef.current = voteKey;
      setOptimistic({
        selectedIds: nextIds,
        options: updatedOptions,
        totalVotes: newTotal,
      });

      // Fire server action in background
      vote(poll.id, [...nextIds]).then((result) => {
        if ("error" in result) {
          // Revert — clear optimistic, fall back to server data
          setOptimistic(null);
          pendingVoteRef.current = null;
        }
        // On success: realtime will sync and the useEffect above clears optimistic
      });
    },
    [poll, serverSelectedIds, currentUserId, optimistic],
  );

  return (
    <motion.div
      layout="position"
      transition={transition}
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-edge)",
        opacity: poll.is_closed ? 0.7 : 1,
      }}
    >
      <div className="px-4 pt-4 pb-3 space-y-3">
        {/* Header: question + meta */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <Text variant="heading" className="flex-1">
              {poll.question}
            </Text>
            {poll.is_closed && !coupAction && (
              <Badge variant="closed" label="Closed" size="sm" />
            )}
          </div>

          <div className="flex items-center gap-2 mt-1.5">
            {poll.created_by_profile?.display_name && (
              <Text variant="caption" color="subtle">
                {poll.created_by_profile.display_name}
              </Text>
            )}
            <Text variant="caption" color="subtle">
              · {relativeTime(poll.created_at)}
            </Text>
            <Text variant="caption" color="subtle">
              · {displayTotal} {displayTotal === 1 ? "vote" : "votes"}
            </Text>
          </div>

          {/* Badges */}
          <AnimatePresence initial={false}>
            {badges.length > 0 && (
              <motion.div
                className="flex flex-wrap gap-1.5 mt-2"
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: motionDuration.fast,
                  ease: motionEase.out,
                }}
              >
                {badges.map((b) => (
                  <Badge
                    key={b.label}
                    label={b.label}
                    emoji={b.emoji}
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
              onVote={() => handleVote(option.id)}
            />
          ))}
        </div>
      </div>

      {/* Corruption actions bar — only for open polls */}
      {!poll.is_closed && (
        <CorruptionActionsBar
          poll={poll}
          currentUserId={currentUserId}
          groupId={groupId}
        />
      )}
    </motion.div>
  );
}
