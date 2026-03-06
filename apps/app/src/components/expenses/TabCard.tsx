"use client";

import type { Tab } from "@mooch/types";
import { Badge, Text } from "@mooch/ui";
import Link from "next/link";
import { GroupIcon } from "@/components/groups/group-icon";
import { formatCurrency } from "@/lib/expenses";

type Props = {
  tab: Tab & { expense_count?: number; total_amount?: number };
  groupId: string;
  currency: string;
  locale: string;
};

export function TabCard({ tab, groupId, currency, locale }: Props) {
  const isClosed = tab.status === "closed";

  return (
    <Link
      href={`/${groupId}/expenses/${tab.id}`}
      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-colors"
      style={{
        background: isClosed
          ? "#F5F2EF"
          : "linear-gradient(in oklab 160deg, oklab(100% .0001 .0001 / 72%) 0%, oklab(95.1% 0.006 0.009 / 52%) 100%)",
        border: `1px solid ${isClosed ? "#DDD5CC" : "#D8C8BC"}`,
        boxShadow: isClosed ? "none" : "var(--shadow-elevated)",
        opacity: isClosed ? 0.75 : 1,
      }}
    >
      {/* Tab icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "#F7F2ED", border: "1px solid #DCCBC0" }}
      >
        <GroupIcon value={tab.emoji} size={20} />
      </div>

      {/* Name + stats */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Text variant="label" color="default" className="truncate block">
            {tab.name}
          </Text>
          {isClosed && <Badge variant="closed" label="Closed" />}
        </div>
        {tab.expense_count != null && (
          <Text variant="caption" color="subtle" className="mt-0.5 block">
            {tab.expense_count} expense{tab.expense_count === 1 ? "" : "s"}
          </Text>
        )}
      </div>

      {/* Total */}
      {tab.total_amount != null && tab.total_amount > 0 && (
        <div className="shrink-0 text-right">
          <Text variant="label" color="default" className="block font-semibold">
            {formatCurrency(tab.total_amount, currency, locale)}
          </Text>
        </div>
      )}
    </Link>
  );
}
