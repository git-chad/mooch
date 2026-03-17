"use client";

import { createBrowserClient, getExpenses } from "@mooch/db";
import { useExpenseStore } from "@mooch/stores";
import type { GroupMember, Profile } from "@mooch/types";
import { Text } from "@mooch/ui";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import {
  getLayoutTransition,
  getSurfaceTransition,
  motionDuration,
} from "@/lib/motion";
import { ExpenseCard } from "./ExpenseCard";
import { SettlementCard } from "./SettlementCard";

type Member = GroupMember & { profile: Profile };

type Props = {
  groupId: string;
  tabId: string;
  members: Member[];
  currentUserId: string;
  currency: string;
  locale: string;
};

type FeedItem =
  | { kind: "expense"; id: string; created_at: string }
  | { kind: "settlement"; id: string; created_at: string };

const revealedTabs = new Set<string>();

export function ExpenseList({
  groupId,
  tabId,
  members,
  currentUserId,
  currency,
  locale,
}: Props) {
  const expenses = useExpenseStore((s) => s.expenses);
  const settlementPayments = useExpenseStore((s) => s.settlementPayments);
  const appendExpenses = useExpenseStore((s) => s.appendExpenses);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(expenses.length === 20);
  const reducedMotion = useReducedMotion() ?? false;
  const shouldAnimateIn = !revealedTabs.has(tabId);

  useEffect(() => {
    revealedTabs.add(tabId);
  }, [tabId]);

  const itemTransition = useMemo(
    () => getSurfaceTransition(reducedMotion, motionDuration.fast),
    [reducedMotion],
  );
  const layoutTransition = useMemo(
    () => getLayoutTransition(reducedMotion),
    [reducedMotion],
  );

  // Interleave expenses and settlements by created_at descending
  const feedItems: FeedItem[] = useMemo(() => {
    const items: FeedItem[] = [
      ...expenses.map((e) => ({
        kind: "expense" as const,
        id: e.id,
        created_at: e.created_at,
      })),
      ...settlementPayments.map((s) => ({
        kind: "settlement" as const,
        id: s.id,
        created_at: s.created_at,
      })),
    ];
    items.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    return items;
  }, [expenses, settlementPayments]);

  async function handleLoadMore() {
    const last = expenses[expenses.length - 1];
    if (!last) return;
    setLoadingMore(true);
    try {
      const supabase = createBrowserClient();
      const older = await getExpenses(supabase, tabId, last.created_at);
      appendExpenses(older);
      setHasMore(older.length === 20);
    } finally {
      setLoadingMore(false);
    }
  }

  if (feedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-5xl mb-4">🍕</p>
        <Text variant="heading" className="mb-1">
          No expenses yet
        </Text>
        <Text variant="body" color="subtle">
          Split your first one and keep it fair.
        </Text>
      </div>
    );
  }

  return (
    <motion.div
      layout
      className="flex flex-col gap-2"
      initial={shouldAnimateIn ? "hidden" : false}
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: reducedMotion
            ? undefined
            : {
                staggerChildren: 0.04,
                delayChildren: 0.03,
              },
        },
      }}
    >
      <AnimatePresence initial={false}>
        {feedItems.map((item) => {
          if (item.kind === "expense") {
            const expense = expenses.find((e) => e.id === item.id);
            if (!expense) return null;
            return (
              <motion.div
                key={`expense-${expense.id}`}
                layout="position"
                variants={{
                  hidden: reducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: 12, filter: "blur(6px)" },
                  show: { opacity: 1, y: 0, filter: "blur(0px)" },
                }}
                initial={
                  shouldAnimateIn
                    ? undefined
                    : reducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 8 }
                }
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={
                  reducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: -10, scale: 0.985 }
                }
                transition={itemTransition}
                layoutDependency={feedItems.length}
              >
                <ExpenseCard
                  groupId={groupId}
                  tabId={tabId}
                  expense={expense}
                  members={members}
                  currentUserId={currentUserId}
                  currency={currency}
                  locale={locale}
                  layoutTransition={layoutTransition}
                />
              </motion.div>
            );
          }

          const settlement = settlementPayments.find(
            (s) => s.id === item.id,
          );
          if (!settlement) return null;
          return (
            <motion.div
              key={`settlement-${settlement.id}`}
              layout="position"
              variants={{
                hidden: reducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 12, filter: "blur(6px)" },
                show: { opacity: 1, y: 0, filter: "blur(0px)" },
              }}
              initial={
                shouldAnimateIn
                  ? undefined
                  : reducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: 8 }
              }
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={
                reducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -10, scale: 0.985 }
              }
              transition={itemTransition}
              layoutDependency={feedItems.length}
            >
              <SettlementCard
                settlement={settlement}
                currentUserId={currentUserId}
                locale={locale}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {hasMore && (
        <motion.div layout className="flex justify-center pt-2">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="text-[13px] text-ink-sub hover:text-ink transition-colors px-4 py-2"
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
