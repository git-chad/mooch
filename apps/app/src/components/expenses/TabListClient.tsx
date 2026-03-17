"use client";

import { useExpenseStore } from "@mooch/stores";
import type { Group, GroupMember, Profile } from "@mooch/types";
import { Button, Container, Text } from "@mooch/ui";
import { useState } from "react";
import { TransitionSlot } from "@/components/TransitionSlot";
import { BalanceCard } from "./BalanceCard";
import { CreateTabModal } from "./CreateTabModal";
import { TabCard } from "./TabCard";

type Member = GroupMember & { profile: Profile };
type GroupWithMembers = Group & { members: Member[] };

type Props = {
  groupId: string;
  group: GroupWithMembers;
  currentUserId: string;
};

export function TabListClient({ groupId, group, currentUserId }: Props) {
  const tabs = useExpenseStore((s) => s.tabs);
  const [createOpen, setCreateOpen] = useState(false);

  const openTabs = tabs.filter((t) => t.status === "open");
  const closedTabs = tabs.filter((t) => t.status === "closed");

  return (
    <Container as="section" className="py-4 sm:py-6">
      <TransitionSlot
        className="col-span-6 sm:col-span-12 mx-auto w-full max-w-2xl space-y-5"
        variant="context"
      >
        {/* Page header */}
        <header className="flex items-center justify-between gap-3">
          <Text variant="title">Expenses</Text>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setCreateOpen(true)}
          >
            + New tab
          </Button>
        </header>

        {/* Global balance overview */}
        <BalanceCard
          currentUserId={currentUserId}
          currency={group.currency}
          locale={group.locale}
          global
        />

        {/* Tabs grid — open & closed side by side on sm+ */}
        {tabs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Open tabs */}
            {openTabs.length > 0 && (
              <div className="space-y-0.5">
                <Text
                  variant="overline"
                  color="subtle"
                  className="block px-3 mb-1"
                >
                  Open
                </Text>
                {openTabs.map((tab) => (
                  <TabCard
                    key={tab.id}
                    tab={tab}
                    groupId={groupId}
                    currency={tab.currency || group.currency}
                    locale={group.locale}
                  />
                ))}
              </div>
            )}

            {/* Closed tabs */}
            {closedTabs.length > 0 && (
              <div className="space-y-0.5">
                <Text
                  variant="overline"
                  color="subtle"
                  className="block px-3 mb-1"
                >
                  Closed
                </Text>
                {closedTabs.map((tab) => (
                  <TabCard
                    key={tab.id}
                    tab={tab}
                    groupId={groupId}
                    currency={tab.currency || group.currency}
                    locale={group.locale}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {tabs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-5xl mb-4">🧾</p>
            <Text variant="heading" className="mb-1">
              No tabs yet
            </Text>
            <Text variant="body" color="subtle" className="mb-4">
              Create a tab to start tracking expenses.
            </Text>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setCreateOpen(true)}
            >
              + New tab
            </Button>
          </div>
        )}

        <CreateTabModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          groupId={groupId}
          groupCurrency={group.currency}
        />
      </TransitionSlot>
    </Container>
  );
}
