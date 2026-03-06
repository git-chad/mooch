import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Balance,
  Expense,
  ExpenseParticipant,
  Profile,
  SettlementPayment,
} from "@mooch/types";

// ── Per-tab queries ─────────────────────────────────────────────────────────

export async function getExpenses(
  supabase: SupabaseClient,
  tabId: string,
  cursor?: string,
): Promise<Expense[]> {
  let query = supabase
    .from("expenses")
    .select("*")
    .eq("tab_id", tabId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;
  if (error) return [];
  return data as Expense[];
}

export async function getExpenseById(
  supabase: SupabaseClient,
  expenseId: string,
): Promise<
  | (Expense & {
      participants: (ExpenseParticipant & { profile: Profile })[];
      payer: Profile;
    })
  | null
> {
  const { data, error } = await supabase
    .from("expenses")
    .select(
      "*, payer:profiles!paid_by(*), participants:expense_participants(*, profile:profiles(*))",
    )
    .eq("id", expenseId)
    .single();

  if (error) return null;
  return data as Expense & {
    participants: (ExpenseParticipant & { profile: Profile })[];
    payer: Profile;
  };
}

export async function getBalances(
  supabase: SupabaseClient,
  tabId: string,
): Promise<(Balance & { from_profile: Profile; to_profile: Profile })[]> {
  const { data, error } = await supabase
    .from("balances")
    .select(
      "*, from_profile:profiles!from_user(*), to_profile:profiles!to_user(*)",
    )
    .eq("tab_id", tabId);

  if (error) return [];
  return data as (Balance & {
    from_profile: Profile;
    to_profile: Profile;
  })[];
}

export async function getSettlementPayments(
  supabase: SupabaseClient,
  tabId: string,
): Promise<(SettlementPayment & { from_profile: Profile; to_profile: Profile })[]> {
  const { data, error } = await supabase
    .from("settlement_payments")
    .select(
      "*, from_profile:profiles!from_user(*), to_profile:profiles!to_user(*)",
    )
    .eq("tab_id", tabId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data as (SettlementPayment & {
    from_profile: Profile;
    to_profile: Profile;
  })[];
}

// ── Global (cross-tab) queries ──────────────────────────────────────────────

export async function getGlobalBalances(
  supabase: SupabaseClient,
  groupId: string,
): Promise<(Balance & { from_profile: Profile; to_profile: Profile })[]> {
  const { data, error } = await supabase
    .from("balances")
    .select(
      "*, from_profile:profiles!from_user(*), to_profile:profiles!to_user(*)",
    )
    .eq("group_id", groupId);

  if (error) return [];
  return data as (Balance & {
    from_profile: Profile;
    to_profile: Profile;
  })[];
}

export async function getUserNetBalance(
  supabase: SupabaseClient,
  groupId: string,
  userId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("balances")
    .select("from_user, to_user, amount")
    .eq("group_id", groupId)
    .or(`from_user.eq.${userId},to_user.eq.${userId}`);

  if (error || !data) return 0;

  return data.reduce((net, row) => {
    if (row.to_user === userId) return net + Number(row.amount);
    if (row.from_user === userId) return net - Number(row.amount);
    return net;
  }, 0);
}
