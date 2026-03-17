"use client";

import { Button, Container, Text } from "@mooch/ui";
import { Layers, Plus, Sparkles, TicketPlus, Users } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { motionDuration, motionEase } from "@/lib/motion";
import { CreateGroupModal } from "./CreateGroupModal";
import { GroupCard } from "./GroupCard";
import { JoinGroupModal } from "./JoinGroupModal";
import type { GroupSummary } from "./types";

type GroupsPageClientProps = {
  groups: GroupSummary[];
};

export function GroupsPageClient({ groups }: GroupsPageClientProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [animateStatsIn, setAnimateStatsIn] = useState(false);
  const reducedMotion = useReducedMotion() ?? false;
  const stats = useMemo(() => {
    const totalMembers = groups.reduce(
      (sum, group) => sum + group.memberCount,
      0,
    );
    const currencyCount = new Set(groups.map((group) => group.currency)).size;
    return {
      squads: groups.length,
      members: totalMembers,
      currencies: currencyCount,
    };
  }, [groups]);

  const containerVariants = reducedMotion
    ? undefined
    : {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.06,
            delayChildren: 0.04,
          },
        },
      };

  const itemVariants = reducedMotion
    ? undefined
    : {
        hidden: { opacity: 0, y: 10, filter: "blur(2px)" },
        visible: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: {
            duration: motionDuration.standard,
            ease: motionEase.out,
          },
        },
      };

  useEffect(() => {
    setAnimateStatsIn(true);
  }, []);

  return (
    <Container as="section" className="py-4 sm:py-6">
      <div className="col-span-6 sm:col-span-12 mx-auto w-full max-w-2xl space-y-6">
        <motion.div
          variants={containerVariants}
          initial={reducedMotion ? undefined : "hidden"}
          animate={reducedMotion ? undefined : "visible"}
          className="space-y-4"
        >
          <motion.header
            variants={itemVariants}
            className="rounded-2xl border border-[#E7D8CC] bg-[linear-gradient(180deg,#FDFCFB_0%,#FAF6F1_100%)] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_9px_20px_rgba(92,63,42,0.07)] sm:px-6"
          >
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#DCCBC0] bg-[#F7EFE7] px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 text-[#806D5E]" />
              <Text variant="caption" className="font-medium text-[#806D5E]">
                Squads hub
              </Text>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Text variant="title">Your squads</Text>
                <Text variant="body" color="subtle" className="mt-1">
                  Jump back into shared expenses, polls, and plans.
                </Text>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setCreateOpen(true)}
                  className="[&>span]:inline-flex [&>span]:flex-row [&>span]:items-center [&>span]:justify-center [&>span]:gap-1.5 [&>span]:whitespace-nowrap [&>span]:leading-none [&>span_svg]:inline-block [&>span_svg]:align-middle"
                >
                  <Plus className="h-3.5 w-3.5 shrink-0" />
                  Create squad
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setJoinOpen(true)}
                  className="border-[#DCCDBF] bg-[#FAF7F3] text-[#607790] hover:bg-[#F3ECE5] [&>span]:inline-flex [&>span]:flex-row [&>span]:items-center [&>span]:justify-center [&>span]:gap-1.5 [&>span]:whitespace-nowrap [&>span]:leading-none [&>span_svg]:inline-block [&>span_svg]:align-middle"
                >
                  <TicketPlus className="h-3.5 w-3.5 shrink-0" />
                  Join squad
                </Button>
              </div>
            </div>
          </motion.header>

          <motion.section
            variants={itemVariants}
            className="grid grid-cols-3 divide-x divide-[#E9DDD4] overflow-hidden rounded-xl border border-[#E9DDD4] bg-[#FBF8F4]"
          >
            <StatChip
              icon={<Layers className="h-3.5 w-3.5 text-[#5F7868]" />}
              label="Squads"
              value={animateStatsIn ? stats.squads : 0}
            />
            <StatChip
              icon={<Users className="h-3.5 w-3.5 text-[#5F7868]" />}
              label="Members"
              value={animateStatsIn ? stats.members : 0}
            />
            <StatChip
              icon={<Sparkles className="h-3.5 w-3.5 text-[#5F7868]" />}
              label="Currencies"
              value={animateStatsIn ? stats.currencies : 0}
            />
          </motion.section>

          {groups.length === 0 ? (
            <motion.div
              variants={itemVariants}
              className="rounded-2xl border border-dashed border-[#D8C8BC] bg-[#FDFCFB] px-6 py-12 text-center shadow-[var(--shadow-elevated)]"
            >
              <Text variant="body" className="font-medium text-[#4A3728]">
                You&apos;re not in any squads yet
              </Text>
              <Text variant="body" color="subtle" className="mt-2">
                Create one now or join with an invite code.
              </Text>
            </motion.div>
          ) : (
            <motion.section variants={itemVariants} className="space-y-2">
              <div className="flex items-center justify-between px-0.5">
                <Text variant="caption" color="subtle" className="font-medium">
                  Continue where you left off
                </Text>
                <Text variant="caption" color="subtle">
                  {groups.length} squad{groups.length === 1 ? "" : "s"}
                </Text>
              </div>
              <div className="grid auto-rows-fr gap-3 sm:grid-cols-2">
                {groups.map((group, index) => (
                  <motion.div
                    key={group.id}
                    initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
                    animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                    transition={
                      reducedMotion
                        ? undefined
                        : {
                            duration: motionDuration.standard,
                            ease: motionEase.out,
                            delay: 0.04 + index * 0.05,
                          }
                    }
                  >
                    <GroupCard group={group} />
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
        </motion.div>

        <CreateGroupModal open={createOpen} onOpenChange={setCreateOpen} />
        <JoinGroupModal open={joinOpen} onOpenChange={setJoinOpen} />
      </div>
    </Container>
  );
}

function StatChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="px-3 py-2.5">
      <div className="mb-1 inline-flex items-center gap-1.5">
        {icon}
        <Text variant="caption" color="subtle" className="text-[11px]">
          {label}
        </Text>
      </div>
      <Text as="p" variant="heading" className="font-semibold text-[#2E2E2E]">
        <AnimatedNumber value={value} />
      </Text>
    </div>
  );
}
