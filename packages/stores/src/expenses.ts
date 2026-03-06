import type { Balance, Expense, Profile, Tab } from "@mooch/types";
import { create } from "zustand";

export type BalanceWithProfiles = Balance & {
  from_profile: Profile;
  to_profile: Profile;
};

type ExpenseStore = {
  // ── Tabs ──────────────────────────────────────────────────────────────────
  tabs: Tab[];
  setTabs: (tabs: Tab[]) => void;
  upsertTab: (tab: Tab) => void;
  removeTab: (id: string) => void;

  // ── Expenses (scoped to the active tab) ───────────────────────────────────
  expenses: Expense[];
  setExpenses: (expenses: Expense[]) => void;
  upsertExpense: (expense: Expense) => void;
  removeExpense: (id: string) => void;
  appendExpenses: (expenses: Expense[]) => void;

  // ── Balances (scoped to the active tab) ───────────────────────────────────
  balances: BalanceWithProfiles[];
  setBalances: (balances: BalanceWithProfiles[]) => void;

  // ── Global balances (across all tabs in a group) ──────────────────────────
  globalBalances: BalanceWithProfiles[];
  setGlobalBalances: (balances: BalanceWithProfiles[]) => void;

  clear: () => void;
};

export const useExpenseStore = create<ExpenseStore>((set) => ({
  // ── Tabs ──────────────────────────────────────────────────────────────────
  tabs: [],
  setTabs: (tabs) => set({ tabs }),
  upsertTab: (tab) =>
    set((s) => {
      const idx = s.tabs.findIndex((t) => t.id === tab.id);
      if (idx === -1) return { tabs: [tab, ...s.tabs] };
      const next = [...s.tabs];
      next[idx] = tab;
      return { tabs: next };
    }),
  removeTab: (id) =>
    set((s) => ({ tabs: s.tabs.filter((t) => t.id !== id) })),

  // ── Expenses ──────────────────────────────────────────────────────────────
  expenses: [],
  setExpenses: (expenses) => set({ expenses }),
  upsertExpense: (expense) =>
    set((s) => {
      const idx = s.expenses.findIndex((e) => e.id === expense.id);
      if (idx === -1) return { expenses: [expense, ...s.expenses] };
      const next = [...s.expenses];
      next[idx] = expense;
      return { expenses: next };
    }),
  removeExpense: (id) =>
    set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),
  appendExpenses: (expenses) =>
    set((s) => {
      const existingIds = new Set(s.expenses.map((e) => e.id));
      const fresh = expenses.filter((e) => !existingIds.has(e.id));
      return { expenses: [...s.expenses, ...fresh] };
    }),

  // ── Balances ──────────────────────────────────────────────────────────────
  balances: [],
  setBalances: (balances) => set({ balances }),

  // ── Global balances ───────────────────────────────────────────────────────
  globalBalances: [],
  setGlobalBalances: (globalBalances) => set({ globalBalances }),

  clear: () =>
    set({ tabs: [], expenses: [], balances: [], globalBalances: [] }),
}));
