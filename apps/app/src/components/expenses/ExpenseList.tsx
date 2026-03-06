"use client";

import { createBrowserClient, getExpenses } from "@mooch/db";
import { useExpenseStore } from "@mooch/stores";
import type { GroupMember, Profile } from "@mooch/types";
import { Text } from "@mooch/ui";
import { useState } from "react";
import { ExpenseCard } from "./ExpenseCard";

type Member = GroupMember & { profile: Profile };

type Props = {
  tabId: string;
  members: Member[];
  currentUserId: string;
  currency: string;
  locale: string;
};

export function ExpenseList({
  tabId,
  members,
  currentUserId,
  currency,
  locale,
}: Props) {
  const expenses = useExpenseStore((s) => s.expenses);
  const appendExpenses = useExpenseStore((s) => s.appendExpenses);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(expenses.length === 20);

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

  if (expenses.length === 0) {
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
    <div className="space-y-2">
      {expenses.map((expense) => (
        <ExpenseCard
          key={expense.id}
          expense={expense}
          members={members}
          currentUserId={currentUserId}
          currency={currency}
          locale={locale}
        />
      ))}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="text-[13px] text-ink-sub hover:text-ink transition-colors px-4 py-2"
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
