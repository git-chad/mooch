"use client";

import type { Tab } from "@mooch/types";
import { Text } from "@mooch/ui";
import { ChevronRight } from "lucide-react";
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
      className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-[#F7F2ED]/60"
      style={{ opacity: isClosed ? 0.65 : 1 }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: "#F7F2ED", border: "1px solid #DCCBC0" }}
      >
        <GroupIcon value={tab.emoji} size={16} />
      </div>

      <div className="flex-1 min-w-0">
        <Text variant="label" color="default" className="truncate block">
          {tab.name}
        </Text>
      </div>

      {tab.expense_count != null && (
        <Text variant="caption" color="subtle" className="shrink-0">
          {tab.expense_count} exp
        </Text>
      )}

      {tab.total_amount != null && tab.total_amount > 0 && (
        <Text
          variant="label"
          color="default"
          className="shrink-0 font-semibold tabular-nums"
        >
          {formatCurrency(tab.total_amount, currency, locale)}
        </Text>
      )}

      <ChevronRight className="w-4 h-4 shrink-0 text-ink-dim opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}
