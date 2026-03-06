"use client";

import type { Group, GroupMember, Profile } from "@mooch/types";
import { Button, Text } from "@mooch/ui";
import { useState } from "react";
import { AddExpenseModal } from "./AddExpenseModal";
import { BalanceCard } from "./BalanceCard";
import { BalanceMatrix } from "./BalanceMatrix";
import { ExpenseList } from "./ExpenseList";

type Member = GroupMember & { profile: Profile };
type GroupWithMembers = Group & { members: Member[] };

type Props = {
  groupId: string;
  group: GroupWithMembers;
  currentUserId: string;
};

type Tab = "activity" | "balances";

export function ExpensesClient({ groupId, group, currentUserId }: Props) {
  const [tab, setTab] = useState<Tab>("activity");
  const [addOpen, setAddOpen] = useState(false);

  return (
    <section className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
      {/* Page header */}
      <header className="flex items-center justify-between gap-3">
        <Text variant="title">Expenses</Text>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => setAddOpen(true)}
        >
          + Add expense
        </Button>
      </header>

      {/* Tab switcher */}
      <div
        className="inline-flex rounded-full p-1 gap-1"
        style={{ background: "#F7F2ED", border: "1px solid #DCCBC0" }}
      >
        {(["activity", "balances"] as const).map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className="px-3 py-1.5 rounded-full text-[12px] leading-4 font-medium transition-all"
              style={
                active
                  ? {
                      background: "var(--action-gradient)",
                      border: "1px solid var(--color-accent-strong)",
                      boxShadow:
                        "#E2FBC2C7 0px 1px 0px inset, #527F2B 0px 2px 0px",
                      color: "var(--color-btn-primary-fg)",
                    }
                  : {
                      border: "1px solid transparent",
                      color: "#5B6F87",
                    }
              }
            >
              {t === "activity" ? "Activity" : "Balances"}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {tab === "activity" ? (
        <ExpenseList
          groupId={groupId}
          members={group.members}
          currentUserId={currentUserId}
          currency={group.currency}
          locale={group.locale}
        />
      ) : (
        <div className="space-y-4">
          <BalanceCard
            currentUserId={currentUserId}
            currency={group.currency}
            locale={group.locale}
          />
          <BalanceMatrix
            groupId={groupId}
            members={group.members}
            currentUserId={currentUserId}
            currency={group.currency}
            locale={group.locale}
          />
        </div>
      )}

      <AddExpenseModal
        open={addOpen}
        onOpenChange={setAddOpen}
        groupId={groupId}
        members={group.members}
        currentUserId={currentUserId}
        groupCurrency={group.currency}
        locale={group.locale}
      />
    </section>
  );
}
