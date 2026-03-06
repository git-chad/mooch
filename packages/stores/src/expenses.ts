import type { Balance, Expense, Profile } from "@mooch/types";
import { create } from "zustand";

export type BalanceWithProfiles = Balance & {
  from_profile: Profile;
  to_profile: Profile;
};

type ExpenseStore = {
  expenses: Expense[];
  balances: BalanceWithProfiles[];

  setExpenses: (expenses: Expense[]) => void;
  setBalances: (balances: BalanceWithProfiles[]) => void;

  // Inserts or replaces a single expense (used for optimistic updates + realtime inserts/updates).
  upsertExpense: (expense: Expense) => void;
  removeExpense: (id: string) => void;

  clear: () => void;
};

export const useExpenseStore = create<ExpenseStore>((set) => ({
  expenses: [],
  balances: [],

  setExpenses: (expenses) => set({ expenses }),
  setBalances: (balances) => set({ balances }),

  upsertExpense: (expense) =>
    set((s) => {
      const idx = s.expenses.findIndex((e) => e.id === expense.id);
      if (idx === -1) {
        // Prepend so newest appears at top (matches desc sort order).
        return { expenses: [expense, ...s.expenses] };
      }
      const next = [...s.expenses];
      next[idx] = expense;
      return { expenses: next };
    }),

  removeExpense: (id) =>
    set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),

  clear: () => set({ expenses: [], balances: [] }),
}));
