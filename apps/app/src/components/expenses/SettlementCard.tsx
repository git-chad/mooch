"use client";

import type { SettlementPaymentWithProfiles } from "@mooch/stores";
import { Avatar, Text } from "@mooch/ui";
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
    <div
      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
      style={{
        background:
          "linear-gradient(in oklab 160deg, oklab(97% 0.001 0.015 / 60%) 0%, oklab(94% -0.005 0.025 / 45%) 100%)",
        border: "1px solid #B8D8A8",
      }}
    >
      {/* Settlement icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "#E8F5D8", border: "1px solid #B8D8A8" }}
      >
        <span className="text-[18px]" aria-hidden="true">
          💸
        </span>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <Text variant="label" color="default" className="block">
          {fromName} paid {toName}
        </Text>
        <Text variant="caption" color="subtle" className="mt-0.5 block">
          {relativeTime(settlement.created_at)}
          {settlement.notes ? ` · ${settlement.notes}` : ""}
        </Text>
      </div>

      {/* Amount */}
      <div className="shrink-0 text-right">
        <Text
          variant="label"
          color="accent"
          className="block font-semibold"
        >
          {formatCurrency(displayAmount, displayCurrency, locale)}
        </Text>
        {settlement.tab_id === null && (
          <Text variant="caption" color="subtle" className="block">
            Global
          </Text>
        )}
      </div>
    </div>
  );
}
