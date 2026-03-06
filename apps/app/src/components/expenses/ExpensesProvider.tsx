"use client";

import { createBrowserClient, getBalances } from "@mooch/db";
import { type BalanceWithProfiles, useExpenseStore } from "@mooch/stores";
import type { Expense } from "@mooch/types";
import { useEffect } from "react";

type Props = {
  groupId: string;
  initialExpenses: Expense[];
  initialBalances: BalanceWithProfiles[];
  children: React.ReactNode;
};

export function ExpensesProvider({
  groupId,
  initialExpenses,
  initialBalances,
  children,
}: Props) {
  const setExpenses = useExpenseStore((s) => s.setExpenses);
  const setBalances = useExpenseStore((s) => s.setBalances);
  const upsertExpense = useExpenseStore((s) => s.upsertExpense);
  const removeExpense = useExpenseStore((s) => s.removeExpense);
  const clear = useExpenseStore((s) => s.clear);

  // Hydrate from server-fetched data whenever the group changes.
  useEffect(() => {
    setExpenses(initialExpenses);
    setBalances(initialBalances);
    return () => clear();
  }, [initialExpenses, initialBalances, setExpenses, setBalances, clear]);

  // Realtime subscriptions for expenses and balances.
  useEffect(() => {
    const supabase = createBrowserClient();

    const channel = supabase
      .channel(`expenses-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expenses",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            removeExpense((payload.old as { id: string }).id);
          } else {
            // INSERT or UPDATE — upsert into store.
            // Note: payload.new contains only the raw expense row (no joins).
            upsertExpense(payload.new as Expense);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "balances",
          filter: `group_id=eq.${groupId}`,
        },
        async () => {
          // Balance rows don't carry profile joins in realtime payloads,
          // so we refetch the full balance list with profiles.
          const fresh = await getBalances(supabase, groupId);
          setBalances(fresh as BalanceWithProfiles[]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, setBalances, upsertExpense, removeExpense]);

  return <>{children}</>;
}
