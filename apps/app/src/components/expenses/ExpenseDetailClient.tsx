"use client";

import type { Group, GroupMember, Profile, SplitType } from "@mooch/types";
import {
  Avatar,
  Badge,
  Button,
  ConfirmDialog,
  Container,
  LucideIconByName,
  Text,
} from "@mooch/ui";
import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { deleteExpense } from "@/app/actions/expenses";
import { GroupIcon } from "@/components/groups/group-icon";
import { TransitionLink } from "@/components/TransitionLink";
import { TransitionSlot } from "@/components/TransitionSlot";
import { CATEGORY_CONFIG, formatCurrency, relativeTime } from "@/lib/expenses";
import {
  getExpenseTransitionNames,
  navigateWithViewTransition,
} from "@/lib/view-transition";
import {
  AddExpenseModal,
  type ExpenseEditorInitialData,
} from "./AddExpenseModal";

type Member = GroupMember & { profile: Profile };
type GroupWithMembers = Group & { members: Member[] };

type ExpenseDetail = ExpenseEditorInitialData & {
  id: string;
  group_id: string;
  tab_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  exchange_rate: number | null;
  converted_amount: number | null;
  rate_fetched_at: string | null;
  payer: Profile;
};

type Props = {
  groupId: string;
  tabId: string;
  tabName: string;
  expense: ExpenseDetail;
  group: GroupWithMembers;
  currentUserId: string;
  canManage: boolean;
};

function getSplitLabel(splitType: SplitType) {
  if (splitType === "equal") return "Equal split";
  if (splitType === "percentage") return "Percentage split";
  return "Exact split";
}

export function ExpenseDetailClient({
  groupId,
  tabId,
  tabName,
  expense,
  group,
  currentUserId,
  canManage,
}: Props) {
  const router = useRouter();
  const reducedMotion = useReducedMotion() ?? false;
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayAmount = expense.converted_amount ?? expense.amount;
  const displayCurrency =
    expense.converted_amount != null ? group.currency : expense.currency;
  const isCurrentUserPayer = expense.paid_by === currentUserId;
  const totalAmount = Number(expense.amount);
  const categoryConfig =
    expense.category === "other"
      ? { emoji: "📦", label: "Other" }
      : CATEGORY_CONFIG[expense.category];
  const transitionNames = getExpenseTransitionNames(expense.id);

  async function handleDelete() {
    setDeleting(true);
    setError(null);

    const result = await deleteExpense(expense.id);

    setDeleting(false);

    if (result && "error" in result) {
      setError(result.error);
      return;
    }

    setDeleteOpen(false);
    startTransition(() => {
      navigateWithViewTransition(router, `/${groupId}/expenses/${tabId}`, {
        reducedMotion,
      });
      router.refresh();
    });
  }

  return (
    <Container as="section" className="py-4 sm:py-6">
      <TransitionSlot
        className="col-span-6 sm:col-span-12 mx-auto w-full max-w-5xl space-y-5"
        variant="context"
      >
        <TransitionLink
          href={`/${groupId}/expenses/${tabId}`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors"
          style={{ color: "#8c7463" }}
        >
          <span aria-hidden="true">&larr;</span>
          Back to {tabName}
        </TransitionLink>

        <header className="flex flex-col gap-4 rounded-2xl border border-[#EDE3DA] bg-[#FDFCFB] p-5 shadow-[var(--shadow-elevated)] sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <motion.div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: "#F7F2ED",
                border: "1px solid #DCCBC0",
                viewTransitionName: transitionNames.icon,
              }}
            >
              {expense.category === "other" && expense.custom_category ? (
                <LucideIconByName
                  name={expense.custom_category}
                  className="w-6 h-6 text-ink-sub"
                />
              ) : expense.category === "other" ? (
                <span className="text-[24px] leading-none">📦</span>
              ) : (
                <span className="text-[24px] leading-none">
                  {categoryConfig.emoji}
                </span>
              )}
            </motion.div>
            <motion.div
              className="min-w-0"
              style={{ viewTransitionName: transitionNames.title }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Text variant="title" className="truncate">
                  {expense.description}
                </Text>
                <Badge variant="member" label={categoryConfig.label} />
              </div>
              <Text variant="body" color="subtle">
                {isCurrentUserPayer
                  ? "You paid"
                  : `Paid by ${expense.payer.display_name}`}
                {" · "}
                {relativeTime(expense.created_at)}
              </Text>
            </motion.div>
          </div>

          {canManage && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setEditOpen(true)}
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => setDeleteOpen(true)}
              >
                Delete
              </Button>
            </div>
          )}
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,1fr)]">
          <section
            className="rounded-2xl border border-[#D8C8BC] p-5 shadow-[var(--shadow-elevated)]"
            style={{
              background:
                "linear-gradient(in oklab 160deg, oklab(100% .0001 .0001 / 72%) 0%, oklab(95.1% 0.006 0.009 / 52%) 100%)",
            }}
          >
            <Text variant="overline" color="subtle">
              Breakdown
            </Text>
            <div className="mt-4 space-y-3">
              {expense.participants.map((participant) => {
                const member = group.members.find(
                  (entry) => entry.user_id === participant.user_id,
                );
                const share = Number(participant.share_amount);
                const percentage =
                  totalAmount > 0
                    ? Math.round((share / totalAmount) * 1000) / 10
                    : 0;

                return (
                  <div
                    key={participant.user_id}
                    className="flex items-center gap-3 rounded-xl border border-[#EDE3DA] bg-[#FDFCFB] px-4 py-3"
                  >
                    <Avatar
                      src={member?.profile.photo_url ?? undefined}
                      name={member?.profile.display_name ?? "Unknown"}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <Text variant="label" className="truncate block">
                        {participant.user_id === currentUserId
                          ? "You"
                          : (member?.profile.display_name ?? "Unknown")}
                      </Text>
                      <Text variant="caption" color="subtle">
                        {getSplitLabel(expense.split_type)}
                        {expense.split_type !== "equal"
                          ? ` · ${percentage}%`
                          : ""}
                      </Text>
                    </div>
                    <Text variant="label" className="font-semibold">
                      {formatCurrency(share, expense.currency, group.locale)}
                    </Text>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="space-y-4">
            <section
              className="rounded-2xl border border-[#D8C8BC] p-5 shadow-[var(--shadow-elevated)]"
              style={{
                background:
                  "linear-gradient(in oklab 160deg, oklab(100% .0001 .0001 / 72%) 0%, oklab(95.1% 0.006 0.009 / 52%) 100%)",
              }}
            >
              <Text variant="overline" color="subtle">
                Summary
              </Text>
              <div className="mt-3 flex items-start justify-between gap-3">
                <motion.div
                  style={{ viewTransitionName: transitionNames.amount }}
                >
                  <Text variant="caption" color="subtle">
                    Display amount
                  </Text>
                  <Text variant="title" className="mt-1">
                    {formatCurrency(
                      displayAmount,
                      displayCurrency,
                      group.locale,
                    )}
                  </Text>
                </motion.div>
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: "#F7F2ED", border: "1px solid #DCCBC0" }}
                >
                  <GroupIcon value={group.emoji} size={22} />
                </div>
              </div>

              <div className="mt-4 space-y-2 text-[13px]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-ink-sub">Original amount</span>
                  <span className="font-medium">
                    {formatCurrency(
                      expense.amount,
                      expense.currency,
                      group.locale,
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-ink-sub">Tab</span>
                  <span className="font-medium">{tabName}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-ink-sub">Split type</span>
                  <span className="font-medium">
                    {getSplitLabel(expense.split_type)}
                  </span>
                </div>
                {expense.photo_url && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-ink-sub">Receipt</span>
                    <span className="font-medium">Attached</span>
                  </div>
                )}
                {expense.converted_amount != null &&
                  expense.exchange_rate != null && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-ink-sub">Exchange rate</span>
                      <span className="font-medium">
                        {expense.exchange_rate}
                      </span>
                    </div>
                  )}
              </div>
            </section>

            {expense.notes && (
              <section
                className="rounded-2xl border border-[#D8C8BC] p-5 shadow-[var(--shadow-elevated)]"
                style={{
                  background:
                    "linear-gradient(in oklab 160deg, oklab(100% .0001 .0001 / 72%) 0%, oklab(95.1% 0.006 0.009 / 52%) 100%)",
                }}
              >
                <Text variant="overline" color="subtle">
                  Notes
                </Text>
                <Text variant="body" className="mt-3 whitespace-pre-wrap">
                  {expense.notes}
                </Text>
              </section>
            )}
          </div>
        </div>

        {error && (
          <Text variant="caption" color="danger">
            {error}
          </Text>
        )}

        <AddExpenseModal
          open={editOpen}
          onOpenChange={setEditOpen}
          groupId={groupId}
          tabId={tabId}
          members={group.members}
          currentUserId={currentUserId}
          groupCurrency={group.currency}
          locale={group.locale}
          mode="edit"
          expenseId={expense.id}
          initialExpense={expense}
          onSaved={() => {
            startTransition(() => {
              router.refresh();
            });
          }}
        />

        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title="Delete expense"
          description="This removes the expense and recalculates balances for the tab."
          confirmLabel={deleting ? "Deleting..." : "Delete"}
          cancelLabel="Cancel"
          variant="destructive"
          onConfirm={handleDelete}
          onCancel={() => setDeleteOpen(false)}
        />
      </TransitionSlot>
    </Container>
  );
}
