"use client";

import type { SettlementPaymentWithProfiles } from "@mooch/stores";
import { Text } from "@mooch/ui";
import { formatCurrency, relativeTime } from "@/lib/expenses";

type Props = {
  settlement: SettlementPaymentWithProfiles;
  currentUserId: string;
  locale: string;
};

export function SettlementCard({ settlement, currentUserId, locale }: Props) {
  const isFromCurrentUser = settlement.from_user === currentUserId;
  const isToCurrentUser = settlement.to_user === currentUserId;

  const fromName = isFromCurrentUser
    ? "You"
    : settlement.from_profile.display_name;
  const toName = isToCurrentUser
    ? "you"
    : settlement.to_profile.display_name;

  const displayAmount = settlement.converted_amount ?? settlement.amount;
  const displayCurrency = settlement.currency;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: "#E8F5D8", border: "1px solid #C7DEB0" }}
      >
        <span className="text-[14px]" aria-hidden="true">
          💸
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <Text variant="label" color="default" className="block">
          {fromName} paid {toName}
        </Text>
        <Text variant="caption" color="subtle" className="block">
          {relativeTime(settlement.created_at)}
          {settlement.notes ? ` · ${settlement.notes}` : ""}
          {settlement.tab_id === null ? " · Global" : ""}
        </Text>
      </div>

      <Text
        variant="label"
        color="accent"
        className="shrink-0 font-semibold tabular-nums"
      >
        {formatCurrency(displayAmount, displayCurrency, locale)}
      </Text>
    </div>
  );
}
