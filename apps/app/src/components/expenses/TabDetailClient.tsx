"use client";

import type { TabWithStats } from "@mooch/db";
import type { Group, GroupMember, Profile } from "@mooch/types";
import { Badge, Button, Container, Text } from "@mooch/ui";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { GroupIcon } from "@/components/groups/group-icon";
import { TransitionSlot } from "@/components/TransitionSlot";
import {
  getLayoutTransition,
  getSurfaceTransition,
  motionDuration,
} from "@/lib/motion";
import { AddExpenseModal } from "./AddExpenseModal";
import { BalanceCard } from "./BalanceCard";
import { BalanceMatrix } from "./BalanceMatrix";
import { ExpenseList } from "./ExpenseList";
import { TabReceipt } from "./TabReceipt";

type Member = GroupMember & { profile: Profile };
type GroupWithMembers = Group & { members: Member[] };

type ViewTab = "activity" | "balances";

type Props = {
  groupId: string;
  tabId: string;
  tab: TabWithStats;
  group: GroupWithMembers;
  currentUserId: string;
};

export function TabDetailClient({
  groupId,
  tabId,
  tab,
  group,
  currentUserId,
}: Props) {
  const [view, setView] = useState<ViewTab>("activity");
  const [addOpen, setAddOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const reducedMotion = useReducedMotion() ?? false;

  const isClosed = tab.status === "closed";

  return (
    <Container as="section" className="py-4 sm:py-6">
      <TransitionSlot
        className="col-span-6 sm:col-span-12 mx-auto w-full max-w-5xl space-y-5"
        variant="context"
      >
        {/* Back link + header */}
        <Link
          href={`/${groupId}/expenses`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors"
          style={{ color: "#8c7463" }}
        >
          <span aria-hidden="true">&larr;</span>
          All tabs
        </Link>

        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "#F7F2ED", border: "1px solid #DCCBC0" }}
            >
              <GroupIcon value={tab.emoji} size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Text variant="title" className="truncate">
                  {tab.name}
                </Text>
                {isClosed && <Badge variant="closed" label="Closed" />}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setReceiptOpen(true)}
            >
              View receipt
            </Button>
            {!isClosed && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setAddOpen(true)}
              >
                + Add expense
              </Button>
            )}
          </div>
        </header>

        {/* Tab switcher */}
        <div
          className="inline-flex rounded-full p-1 gap-1"
          style={{ background: "#F7F2ED", border: "1px solid #DCCBC0" }}
        >
          {(["activity", "balances"] as const).map((t) => {
            const active = view === t;
            return (
              <div key={t} className="relative">
                {active && (
                  <motion.div
                    layoutId="expenses-view-indicator"
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: "var(--action-gradient)",
                      border: "1px solid var(--color-accent-strong)",
                      boxShadow:
                        "#E2FBC2C7 0px 1px 0px inset, #527F2B 0px 2px 0px",
                    }}
                    transition={getLayoutTransition(reducedMotion)}
                  />
                )}
                <button
                  type="button"
                  onClick={() => setView(t)}
                  className="relative z-10 px-3 py-1.5 rounded-full text-[12px] leading-4 font-medium transition-colors"
                  style={
                    active
                      ? {
                          color: "var(--color-btn-primary-fg)",
                        }
                      : {
                          color: "#5B6F87",
                        }
                  }
                >
                  {t === "activity" ? "Activity" : "Balances"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Content */}
        <div className="relative">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={view}
              initial={
                reducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 10, filter: "blur(6px)" }
              }
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={
                reducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -8, filter: "blur(4px)" }
              }
              transition={getSurfaceTransition(
                reducedMotion,
                motionDuration.fast,
              )}
            >
              {view === "activity" ? (
                <ExpenseList
                  groupId={groupId}
                  tabId={tabId}
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
                    tabId={tabId}
                    members={group.members}
                    currentUserId={currentUserId}
                    currency={group.currency}
                    locale={group.locale}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <AddExpenseModal
          open={addOpen}
          onOpenChange={setAddOpen}
          groupId={groupId}
          tabId={tabId}
          members={group.members}
          currentUserId={currentUserId}
          groupCurrency={group.currency}
          locale={group.locale}
        />
        <TabReceipt
          open={receiptOpen}
          onOpenChange={setReceiptOpen}
          tab={tab}
          members={group.members}
          groupCurrency={group.currency}
          locale={group.locale}
        />
      </TransitionSlot>
    </Container>
  );
}
