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

export async function recalculateBalances(groupId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: group } = await admin
    .from("groups")
    .select("currency")
    .eq("id", groupId)
    .single();

  if (!group) return;
  const groupCurrency = group.currency as string;

  const { data: expenses } = await admin
    .from("expenses")
    .select(
      "paid_by, amount, currency, exchange_rate, converted_amount, expense_participants(user_id, share_amount)",
    )
    .eq("group_id", groupId);

  const { data: settlements } = await admin
    .from("settlement_payments")
    .select("from_user, to_user, amount, currency, exchange_rate, converted_amount")
    .eq("group_id", groupId);

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
      // Unconverted foreign-currency expense — excluded from balances until converted.
      console.warn(
        `[recalculateBalances] Skipping unconverted expense in ${expense.currency} for group ${groupId}`,
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
        // Prorate: share / total * converted_amount
        shareInGroupCurrency =
          (Number(p.share_amount) / Number(expense.amount)) * effectiveTotal;
      }

      // Each participant owes their share.
      add(p.user_id, -shareInGroupCurrency);
    }
  }

  for (const s of settlements ?? []) {
    const effective = toGroupCurrency(
      Number(s.amount),
      s.currency,
      groupCurrency,
      s.exchange_rate !== null ? Number(s.exchange_rate) : null,
      s.converted_amount !== null ? Number(s.converted_amount) : null,
    );

    if (effective === null) continue;

    // from_user paid → reduces their debt (increases their net)
    add(s.from_user, effective);
    // to_user received → reduces what they're owed (decreases their net)
    add(s.to_user, -effective);
  }

  const transactions = simplify(net);

  // Replace all existing balances for this group atomically.
  await admin.from("balances").delete().eq("group_id", groupId);

  if (transactions.length > 0) {
    await admin.from("balances").insert(
      transactions.map((t) => ({
        group_id: groupId,
        from_user: t.from,
        to_user: t.to,
        amount: t.amount,
      })),
    );
  }
}
