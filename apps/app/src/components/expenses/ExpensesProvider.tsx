"use client";

import { createBrowserClient, getBalances, getGlobalBalances } from "@mooch/db";
import { type BalanceWithProfiles, useExpenseStore } from "@mooch/stores";
import type { Expense, Tab } from "@mooch/types";
import { useEffect } from "react";

// ── Group-level provider ────────────────────────────────────────────────────
// Manages tabs list + global balances. Used on the expenses landing page.

type GroupProviderProps = {
  groupId: string;
  initialTabs: Tab[];
  initialGlobalBalances: BalanceWithProfiles[];
  children: React.ReactNode;
};

export function ExpensesGroupProvider({
  groupId,
  initialTabs,
  initialGlobalBalances,
  children,
}: GroupProviderProps) {
  const setTabs = useExpenseStore((s) => s.setTabs);
  const upsertTab = useExpenseStore((s) => s.upsertTab);
  const removeTab = useExpenseStore((s) => s.removeTab);
  const setGlobalBalances = useExpenseStore((s) => s.setGlobalBalances);
  const clear = useExpenseStore((s) => s.clear);

  useEffect(() => {
    setTabs(initialTabs);
    setGlobalBalances(initialGlobalBalances);
    return () => clear();
  }, [initialTabs, initialGlobalBalances, setTabs, setGlobalBalances, clear]);

  useEffect(() => {
    const supabase = createBrowserClient();

    const channel = supabase
      .channel(`tabs-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tabs",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            removeTab((payload.old as { id: string }).id);
          } else {
            upsertTab(payload.new as Tab);
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
          const fresh = await getGlobalBalances(supabase, groupId);
          setGlobalBalances(fresh as BalanceWithProfiles[]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, upsertTab, removeTab, setGlobalBalances]);

  return <>{children}</>;
}

// ── Tab-level provider ──────────────────────────────────────────────────────
// Manages expenses + per-tab balances. Used on the tab detail page.

type TabProviderProps = {
  tabId: string;
  initialExpenses: Expense[];
  initialBalances: BalanceWithProfiles[];
  children: React.ReactNode;
};

export function ExpensesTabProvider({
  tabId,
  initialExpenses,
  initialBalances,
  children,
}: TabProviderProps) {
  const setExpenses = useExpenseStore((s) => s.setExpenses);
  const setBalances = useExpenseStore((s) => s.setBalances);
  const upsertExpense = useExpenseStore((s) => s.upsertExpense);
  const removeExpense = useExpenseStore((s) => s.removeExpense);

  useEffect(() => {
    setExpenses(initialExpenses);
    setBalances(initialBalances);
    return () => {
      setExpenses([]);
      setBalances([]);
    };
  }, [initialExpenses, initialBalances, setExpenses, setBalances]);

  useEffect(() => {
    const supabase = createBrowserClient();

    const channel = supabase
      .channel(`tab-expenses-${tabId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expenses",
          filter: `tab_id=eq.${tabId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            removeExpense((payload.old as { id: string }).id);
          } else {
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
          filter: `tab_id=eq.${tabId}`,
        },
        async () => {
          const fresh = await getBalances(supabase, tabId);
          setBalances(fresh as BalanceWithProfiles[]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tabId, setBalances, upsertExpense, removeExpense]);

  return <>{children}</>;
}
