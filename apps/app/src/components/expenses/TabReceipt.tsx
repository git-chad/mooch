"use client";

import type { TabWithStats } from "@mooch/db";
import { useExpenseStore } from "@mooch/stores";
import type { GroupMember, Profile } from "@mooch/types";
import { Button, Sheet, Text } from "@mooch/ui";
import { toPng } from "html-to-image";
import { useMemo, useRef, useState } from "react";
import { formatCurrency } from "@/lib/expenses";

type Member = GroupMember & { profile: Profile };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tab: TabWithStats;
  members: Member[];
  groupCurrency: string;
  locale: string;
};

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function TabReceipt({
  open,
  onOpenChange,
  tab,
  members,
  groupCurrency,
  locale,
}: Props) {
  const expenses = useExpenseStore((state) => state.expenses);
  const balances = useExpenseStore((state) => state.balances);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orderedExpenses = useMemo(
    () =>
      [...expenses].sort(
        (left, right) =>
          new Date(left.created_at).getTime() -
          new Date(right.created_at).getTime(),
      ),
    [expenses],
  );

  const paidTotals = useMemo(() => {
    const totals = new Map<string, number>();

    for (const expense of orderedExpenses) {
      const normalizedAmount =
        expense.converted_amount ??
        (expense.currency === groupCurrency ? Number(expense.amount) : 0);
      totals.set(
        expense.paid_by,
        (totals.get(expense.paid_by) ?? 0) + normalizedAmount,
      );
    }

    return members
      .map((member) => ({
        user_id: member.user_id,
        name: member.profile.display_name,
        total: totals.get(member.user_id) ?? 0,
      }))
      .filter((entry) => entry.total > 0);
  }, [groupCurrency, members, orderedExpenses]);

  const totalInGroupCurrency = useMemo(
    () =>
      orderedExpenses.reduce((sum, expense) => {
        if (expense.converted_amount != null) {
          return sum + Number(expense.converted_amount);
        }
        if (expense.currency === groupCurrency) {
          return sum + Number(expense.amount);
        }
        return sum;
      }, 0),
    [groupCurrency, orderedExpenses],
  );

  const hasMixedCurrencyItems = orderedExpenses.some(
    (expense) =>
      expense.converted_amount == null && expense.currency !== groupCurrency,
  );

  const dateRange =
    orderedExpenses.length > 0
      ? `${formatDate(orderedExpenses[0].created_at, locale)} - ${formatDate(
          orderedExpenses[orderedExpenses.length - 1].created_at,
          locale,
        )}`
      : formatDate(tab.created_at, locale);

  async function handleDownload() {
    if (!receiptRef.current) return;

    setDownloading(true);
    setError(null);

    try {
      const dataUrl = await toPng(receiptRef.current, {
        cacheBust: true,
        backgroundColor: "#f8f6f1",
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${tab.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "tab"}-receipt.png`;
      link.click();
    } catch {
      setError("Failed to generate receipt image.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Sheet
      variant="receipt"
      open={open}
      onOpenChange={onOpenChange}
      title="Receipt"
      description="Tab summary"
    >
      <div className="space-y-4">
        <div ref={receiptRef} className="space-y-4">
          <div className="text-center">
            <p className="geist-pixel text-[20px] uppercase tracking-[0.12em] text-[#1A1714]">
              {tab.name}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[#7A6E65]">
              {dateRange}
            </p>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between gap-3">
              <span className="text-[#7A6E65]">STATUS</span>
              <span className="font-semibold uppercase">{tab.status}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[#7A6E65]">EXPENSES</span>
              <span className="font-semibold">{orderedExpenses.length}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[#7A6E65]">CURRENCY</span>
              <span className="font-semibold">{groupCurrency}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-[var(--receipt-edge)] pt-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#7A6E65]">
              Expenses
            </p>
            {orderedExpenses.length === 0 ? (
              <p className="mt-2 text-[11px] text-[#7A6E65]">
                No expenses recorded yet.
              </p>
            ) : (
              <div className="mt-2 space-y-2.5">
                {orderedExpenses.map((expense) => {
                  const payer =
                    members.find((member) => member.user_id === expense.paid_by)
                      ?.profile.display_name ?? "Unknown";
                  const displayAmount =
                    expense.converted_amount ?? expense.amount;
                  const displayCurrency =
                    expense.converted_amount != null
                      ? groupCurrency
                      : expense.currency;

                  return (
                    <div key={expense.id} className="space-y-0.5">
                      <div className="flex justify-between gap-3">
                        <span className="truncate">{expense.description}</span>
                        <span className="font-semibold">
                          {formatCurrency(
                            displayAmount,
                            displayCurrency,
                            locale,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3 text-[10px] text-[#7A6E65]">
                        <span className="truncate">Paid by {payer}</span>
                        <span>{formatDate(expense.created_at, locale)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-[var(--receipt-edge)] pt-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#7A6E65]">
              Per-person totals
            </p>
            {paidTotals.length === 0 ? (
              <p className="mt-2 text-[11px] text-[#7A6E65]">
                Totals will appear after the first expense.
              </p>
            ) : (
              <div className="mt-2 space-y-1.5">
                {paidTotals.map((entry) => (
                  <div
                    key={entry.user_id}
                    className="flex justify-between gap-3"
                  >
                    <span>{entry.name}</span>
                    <span className="font-semibold">
                      {formatCurrency(entry.total, groupCurrency, locale)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-[var(--receipt-edge)] pt-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#7A6E65]">
              Balance summary
            </p>
            {balances.length === 0 ? (
              <p className="mt-2 text-[11px] text-[#7A6E65]">
                Everyone is settled up.
              </p>
            ) : (
              <div className="mt-2 space-y-1.5">
                {balances.map((balance) => (
                  <div key={balance.id} className="flex justify-between gap-3">
                    <span className="truncate">
                      {balance.from_profile.display_name} owes{" "}
                      {balance.to_profile.display_name}
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(
                        Number(balance.amount),
                        groupCurrency,
                        locale,
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-[var(--receipt-edge)] pt-3">
            <div className="flex justify-between gap-3 text-[12px]">
              <span className="font-semibold uppercase tracking-[0.16em]">
                Grand total
              </span>
              <span className="font-semibold">
                {hasMixedCurrencyItems
                  ? "Mixed currencies"
                  : formatCurrency(totalInGroupCurrency, groupCurrency, locale)}
              </span>
            </div>
            {hasMixedCurrencyItems && (
              <p className="mt-1 text-[10px] text-[#7A6E65]">
                Some foreign-currency items are excluded until converted.
              </p>
            )}
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? "Generating..." : "Download as image"}
        </Button>

        {error && (
          <Text variant="caption" color="danger" className="block text-center">
            {error}
          </Text>
        )}
      </div>
    </Sheet>
  );
}
