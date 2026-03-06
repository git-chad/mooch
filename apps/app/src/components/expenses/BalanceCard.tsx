"use client";

import { useExpenseStore } from "@mooch/stores";
import { Text } from "@mooch/ui";
import { formatCurrency } from "@/lib/expenses";

type Props = {
  currentUserId: string;
  currency: string;
  locale: string;
  global?: boolean;
};

export function BalanceCard({ currentUserId, currency, locale, global }: Props) {
  const tabBalances = useExpenseStore((s) => s.balances);
  const globalBalances = useExpenseStore((s) => s.globalBalances);
  const balances = global ? globalBalances : tabBalances;

  // net > 0 = owed money, net < 0 = owes money
  const net = balances.reduce((sum, b) => {
    if (b.to_user === currentUserId) return sum + Number(b.amount);
    if (b.from_user === currentUserId) return sum - Number(b.amount);
    return sum;
  }, 0);

  const isSettled = Math.abs(net) < 0.005;
  const isOwed = net > 0;

  return (
    <div
      className="rounded-2xl px-5 py-4"
      style={{
        background:
          "linear-gradient(in oklab 160deg, oklab(100% .0001 .0001 / 72%) 0%, oklab(95.1% 0.006 0.009 / 52%) 100%)",
        border: "1px solid #D8C8BC",
        boxShadow: "var(--shadow-elevated)",
      }}
    >
      <Text variant="overline" color="subtle" className="mb-1 block">
        {global ? "Overall balance" : "Your balance"}
      </Text>

      {isSettled ? (
        <div className="flex items-center gap-2">
          <Text
            variant="display"
            color="inherit"
            style={{ color: "#2d5a10", fontSize: 28 }}
          >
            All clear
          </Text>
          <span className="text-[20px]" aria-hidden="true">
            ✓
          </span>
        </div>
      ) : (
        <>
          <Text
            variant="display"
            color="inherit"
            style={{ color: isOwed ? "#2d5a10" : "#b24a3a", fontSize: 34 }}
          >
            {formatCurrency(Math.abs(net), currency, locale)}
          </Text>
          <Text variant="body" color="subtle" className="mt-1 block">
            {isOwed ? "the squad owes you" : "you owe the squad"}
            {global ? " (across all tabs)" : ""}
          </Text>
        </>
      )}
    </div>
  );
}
