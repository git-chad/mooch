import { createAdminClient } from "@/lib/supabase-admin";

// Returns the effective amount in group currency, or null if the expense
// is in a foreign currency and has not been converted yet (excluded from calc).
function toGroupCurrency(
  amount: number,
  currency: string,
  groupCurrency: string,
  exchangeRate: number | null,
  convertedAmount: number | null,
): number | null {
  if (currency === groupCurrency) return amount;
  if (convertedAmount !== null) return convertedAmount;
  if (exchangeRate !== null) return amount * exchangeRate;
  return null;
}

// Greedy debt simplification.
// Input: a net map where positive = owed to this user, negative = this user owes.
// Output: minimal set of (from → to, amount) transfers that settle all debts.
function simplify(
  netMap: Map<string, number>,
): { from: string; to: string; amount: number }[] {
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  for (const [id, net] of netMap) {
    const rounded = Math.round(net * 100) / 100;
    if (rounded > 0.009) creditors.push({ id, amount: rounded });
    else if (rounded < -0.009) debtors.push({ id, amount: Math.abs(rounded) });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions: { from: string; to: string; amount: number }[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const transfer = Math.min(creditors[ci].amount, debtors[di].amount);
    const rounded = Math.round(transfer * 100) / 100;

    if (rounded >= 0.01) {
      transactions.push({
        from: debtors[di].id,
        to: creditors[ci].id,
        amount: rounded,
      });
    }

    creditors[ci].amount = Math.round((creditors[ci].amount - transfer) * 100) / 100;
    debtors[di].amount = Math.round((debtors[di].amount - transfer) * 100) / 100;

    if (creditors[ci].amount < 0.01) ci++;
    if (debtors[di].amount < 0.01) di++;
  }

  return transactions;
}

/**
 * Recalculate balances for a single tab.
 * Fetches all expenses in the tab + tab-scoped settlements, computes net
 * balances, simplifies debts, and replaces the balance rows for that tab.
 */
export async function recalculateBalances(
  groupId: string,
  tabId: string,
): Promise<void> {
  const admin = createAdminClient();

  const { data: group } = await admin
    .from("groups")
    .select("currency")
    .eq("id", groupId)
    .single();

  if (!group) return;
  const groupCurrency = group.currency as string;

  // Fetch expenses scoped to this tab
  const { data: expenses } = await admin
    .from("expenses")
    .select(
      "paid_by, amount, currency, exchange_rate, converted_amount, expense_participants(user_id, share_amount)",
    )
    .eq("tab_id", tabId);

  // Fetch settlements scoped to this tab (tab_id match) + global settlements
  // that affect this group (tab_id is null)
  const { data: settlements } = await admin
    .from("settlement_payments")
    .select("tab_id, from_user, to_user, amount, currency, exchange_rate, converted_amount")
    .eq("group_id", groupId)
    .or(`tab_id.eq.${tabId},tab_id.is.null`);

  const net = new Map<string, number>();
  const add = (userId: string, delta: number) =>
    net.set(userId, (net.get(userId) ?? 0) + delta);

  for (const expense of expenses ?? []) {
    const effectiveTotal = toGroupCurrency(
      Number(expense.amount),
      expense.currency,
      groupCurrency,
      expense.exchange_rate !== null ? Number(expense.exchange_rate) : null,
      expense.converted_amount !== null ? Number(expense.converted_amount) : null,
    );

    if (effectiveTotal === null) {
      console.warn(
        `[recalculateBalances] Skipping unconverted expense in ${expense.currency} for tab ${tabId}`,
      );
      continue;
    }

    // The payer fronted the full amount — credit them.
    add(expense.paid_by, effectiveTotal);

    for (const p of (expense.expense_participants as { user_id: string; share_amount: number }[]) ?? []) {
      let shareInGroupCurrency: number;

      if (expense.currency === groupCurrency) {
        shareInGroupCurrency = Number(p.share_amount);
      } else if (expense.exchange_rate !== null) {
        shareInGroupCurrency = Number(p.share_amount) * Number(expense.exchange_rate);
      } else {
        shareInGroupCurrency =
          (Number(p.share_amount) / Number(expense.amount)) * effectiveTotal;
      }

      add(p.user_id, -shareInGroupCurrency);
    }
  }

  // Only apply tab-scoped settlements to per-tab balances.
  // Global settlements (tab_id = null) are excluded from individual tab
  // balance calc — they only affect the global aggregated view.
  for (const s of (settlements ?? []).filter((s) => s.tab_id !== null)) {
    const effective = toGroupCurrency(
      Number(s.amount),
      s.currency,
      groupCurrency,
      s.exchange_rate !== null ? Number(s.exchange_rate) : null,
      s.converted_amount !== null ? Number(s.converted_amount) : null,
    );

    if (effective === null) continue;

    add(s.from_user, effective);
    add(s.to_user, -effective);
  }

  const transactions = simplify(net);

  // Replace all existing balances for this tab atomically.
  await admin.from("balances").delete().eq("tab_id", tabId);

  if (transactions.length > 0) {
    await admin.from("balances").insert(
      transactions.map((t) => ({
        group_id: groupId,
        tab_id: tabId,
        from_user: t.from,
        to_user: t.to,
        amount: t.amount,
      })),
    );
  }
}

/**
 * Recalculate balances for ALL open tabs in a group.
 * Used after a global settlement payment that affects multiple tabs.
 */
export async function recalculateAllBalances(groupId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: tabs } = await admin
    .from("tabs")
    .select("id")
    .eq("group_id", groupId)
    .eq("status", "open");

  if (!tabs || tabs.length === 0) return;

  await Promise.all(tabs.map((tab) => recalculateBalances(groupId, tab.id)));
}
