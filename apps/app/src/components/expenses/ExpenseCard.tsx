"use client";

import type { Expense, GroupMember, Profile } from "@mooch/types";
import { Avatar, LucideIconByName, Text } from "@mooch/ui";
import { CATEGORY_CONFIG, formatCurrency, relativeTime } from "@/lib/expenses";

type Member = GroupMember & { profile: Profile };

type Props = {
  expense: Expense;
  members: Member[];
  currentUserId: string;
  currency: string;
  locale: string;
};

export function ExpenseCard({
  expense,
  members,
  currentUserId,
  currency,
  locale,
}: Props) {
  const payer = members.find((m) => m.user_id === expense.paid_by)?.profile;
  const isCurrentUserPayer = expense.paid_by === currentUserId;

  const displayAmount = expense.converted_amount ?? expense.amount;
  const displayCurrency =
    expense.converted_amount != null ? currency : expense.currency;

  const categoryConfig =
    expense.category !== "other"
      ? CATEGORY_CONFIG[expense.category]
      : { emoji: "📦", label: "Other" };

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors cursor-pointer"
      style={{
        background:
          "linear-gradient(in oklab 160deg, oklab(100% .0001 .0001 / 72%) 0%, oklab(95.1% 0.006 0.009 / 52%) 100%)",
        border: "1px solid #D8C8BC",
        boxShadow: "var(--shadow-elevated)",
      }}
    >
      {/* Category icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "#F7F2ED", border: "1px solid #DCCBC0" }}
      >
        {expense.category === "other" && expense.custom_category ? (
          <LucideIconByName
            name={expense.custom_category}
            className="w-5 h-5 text-ink-sub"
          />
        ) : (
          <span className="text-[20px] leading-none">
            {categoryConfig.emoji}
          </span>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <Text variant="label" color="default" className="truncate block">
          {expense.description}
        </Text>
        <Text variant="caption" color="subtle" className="mt-0.5 block">
          {isCurrentUserPayer
            ? "You paid"
            : `Paid by ${payer?.display_name ?? "someone"}`}
          {" · "}
          <span className="text-ink-dim">
            {relativeTime(expense.created_at)}
          </span>
        </Text>
      </div>

      {/* Amount + payer avatar */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
          <Text
            variant="label"
            color="inherit"
            className="block font-semibold"
            style={{ color: isCurrentUserPayer ? "#2d5a10" : "#1F2A23" }}
          >
            {formatCurrency(displayAmount, displayCurrency, locale)}
          </Text>
          {expense.currency !== currency &&
            expense.converted_amount == null && (
              <Text variant="caption" color="subtle" className="block">
                {expense.currency}
              </Text>
            )}
        </div>
        <Avatar
          src={payer?.photo_url ?? undefined}
          name={payer?.display_name ?? "?"}
          size="sm"
        />
      </div>
    </div>
  );
}
