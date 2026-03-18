"use client";

import { usePollStore } from "@mooch/stores";
import { Button, Container, Text } from "@mooch/ui";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { TransitionSlot } from "@/components/TransitionSlot";
import { getSurfaceTransition, motionDuration, motionEase } from "@/lib/motion";
import { CreatePollModal } from "./CreatePollModal";
import { PollCard } from "./PollCard";

type Props = {
  groupId: string;
  currentUserId: string;
};

const revealedGroups = new Set<string>();

export function PollListClient({ groupId, currentUserId }: Props) {
  const polls = usePollStore((s) => s.polls);
  const [createOpen, setCreateOpen] = useState(false);
  const reducedMotion = useReducedMotion() ?? false;
  const shouldAnimateIn = !revealedGroups.has(groupId);

  useEffect(() => {
    revealedGroups.add(groupId);
  }, [groupId]);

  const itemTransition = useMemo(
    () => getSurfaceTransition(reducedMotion, motionDuration.fast),
    [reducedMotion],
  );

  const activePolls = polls
    .filter((p) => !p.is_closed)
    .sort((a, b) => {
      // Pinned first, then by created_at desc
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  const closedPolls = polls.filter((p) => p.is_closed);

  return (
    <Container as="section" className="py-4 sm:py-6">
      <TransitionSlot
        className="col-span-6 sm:col-span-12 mx-auto w-full max-w-2xl space-y-5"
        variant="context"
      >
        {/* Page header */}
        <header className="flex items-center justify-between gap-3">
          <Text variant="title">Polls</Text>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setCreateOpen(true)}
          >
            + New poll
          </Button>
        </header>

        {/* Empty state */}
        <AnimatePresence>
          {polls.length === 0 && (
            <motion.div
              initial={
                reducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 12, filter: "blur(4px)" }
              }
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{
                duration: motionDuration.standard,
                ease: motionEase.out,
              }}
            >
              <EmptyState
                emoji="🗳️"
                title="No polls yet"
                description="Start a vote — ask the squad anything!"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active polls — staggered entrance on first load */}
        {activePolls.length > 0 && (
          <motion.div
            layout
            className="space-y-4"
            initial={shouldAnimateIn ? "hidden" : false}
            animate="show"
            variants={{
              hidden: {},
              show: {
                transition: reducedMotion
                  ? undefined
                  : { staggerChildren: 0.06, delayChildren: 0.04 },
              },
            }}
          >
            <AnimatePresence initial={false}>
              {activePolls.map((poll) => (
                <motion.div
                  key={poll.id}
                  layout="position"
                  variants={{
                    hidden: reducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 16, filter: "blur(6px)" },
                    show: { opacity: 1, y: 0, filter: "blur(0px)" },
                  }}
                  initial={
                    shouldAnimateIn
                      ? undefined
                      : reducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: 10, filter: "blur(4px)" }
                  }
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={
                    reducedMotion
                      ? { opacity: 0 }
                      : {
                          opacity: 0,
                          y: -10,
                          scale: 0.985,
                          filter: "blur(4px)",
                        }
                  }
                  transition={itemTransition}
                >
                  <PollCard
                    poll={poll}
                    currentUserId={currentUserId}
                    groupId={groupId}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Closed polls */}
        <AnimatePresence>
          {closedPolls.length > 0 && (
            <motion.div
              className="space-y-4"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: motionDuration.standard,
                ease: motionEase.out,
              }}
            >
              <Text
                variant="label"
                color="subtle"
                className="uppercase tracking-wide"
              >
                Closed
              </Text>
              <AnimatePresence initial={false}>
                {closedPolls.map((poll) => (
                  <motion.div
                    key={poll.id}
                    layout="position"
                    initial={
                      reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      reducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, scale: 0.98 }
                    }
                    transition={itemTransition}
                  >
                    <PollCard
                      poll={poll}
                      currentUserId={currentUserId}
                      groupId={groupId}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <CreatePollModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          groupId={groupId}
        />
      </TransitionSlot>
    </Container>
  );
}
