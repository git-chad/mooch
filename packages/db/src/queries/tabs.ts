import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tab } from "@mooch/types";

export type TabWithStats = Tab & {
  expense_count: number;
  total_amount: number;
};

export async function getTabs(
  supabase: SupabaseClient,
  groupId: string,
): Promise<TabWithStats[]> {
  // Fetch tabs with expense count and total via a single query
  const { data, error } = await supabase
    .from("tabs")
    .select("*, expenses(amount)")
    .eq("group_id", groupId)
    .order("status", { ascending: true }) // open first, closed second
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((tab) => {
    const expenses = (tab.expenses ?? []) as { amount: number }[];
    return {
      ...tab,
      expenses: undefined,
      expense_count: expenses.length,
      total_amount: expenses.reduce((sum, e) => sum + Number(e.amount), 0),
    } as TabWithStats;
  });
}

export async function getTabById(
  supabase: SupabaseClient,
  tabId: string,
): Promise<TabWithStats | null> {
  const { data, error } = await supabase
    .from("tabs")
    .select("*, expenses(amount)")
    .eq("id", tabId)
    .single();

  if (error || !data) return null;

  const expenses = (data.expenses ?? []) as { amount: number }[];
  return {
    ...data,
    expenses: undefined,
    expense_count: expenses.length,
    total_amount: expenses.reduce((sum, e) => sum + Number(e.amount), 0),
  } as TabWithStats;
}
