"use client";

import type { Expense, GroupMember, Profile } from "@mooch/types";
import { Avatar, LucideIconByName, Text } from "@mooch/ui";
import { motion, type Transition, useReducedMotion } from "motion/react";
import { TransitionLink } from "@/components/TransitionLink";
import { CATEGORY_CONFIG, formatCurrency, relativeTime } from "@/lib/expenses";
import { getSurfaceTransition, motionDuration } from "@/lib/motion";
import { getExpenseTransitionNames } from "@/lib/view-transition";

type Member = GroupMember & { profile: Profile };

type Props = {
  groupId: string;
  tabId: string;
  expense: Expense;
  members: Member[];
  currentUserId: string;
  currency: string;
  locale: string;
  layoutTransition?: Transition;
};

export function ExpenseCard({
  groupId,
  tabId,
  expense,
  members,
  currentUserId,
  currency,
  locale,
  layoutTransition,
}: Props) {
  const payer = members.find((m) => m.user_id === expense.paid_by)?.profile;
  const isCurrentUserPayer = expense.paid_by === currentUserId;
  const reducedMotion = useReducedMotion() ?? false;

  const displayAmount = expense.converted_amount ?? expense.amount;
  const displayCurrency =
    expense.converted_amount != null ? currency : expense.currency;

  const categoryConfig =
    expense.category !== "other"
      ? CATEGORY_CONFIG[expense.category]
      : { emoji: "📦", label: "Other" };
  const transitionNames = getExpenseTransitionNames(expense.id);

  return (
    <motion.div
      layout="position"
      transition={layoutTransition}
      whileTap={reducedMotion ? undefined : { scale: 0.988 }}
    >
      <TransitionLink
        href={`/${groupId}/expenses/${tabId}/${expense.id}`}
        className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-[transform,box-shadow,background-color] cursor-pointer active:scale-[0.985]"
        style={{
          background:
            "linear-gradient(in oklab 160deg, oklab(100% .0001 .0001 / 72%) 0%, oklab(95.1% 0.006 0.009 / 52%) 100%)",
          border: "1px solid #D8C8BC",
          boxShadow: "var(--shadow-elevated)",
        }}
      >
        {/* Category icon */}
        <motion.div
          layout="position"
          transition={
            layoutTransition ??
            getSurfaceTransition(reducedMotion, motionDuration.fast)
          }
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: "#F7F2ED",
            border: "1px solid #DCCBC0",
            viewTransitionName: transitionNames.icon,
          }}
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
        </motion.div>

        {/* Main content */}
        <motion.div
          layout="position"
          transition={layoutTransition}
          className="flex-1 min-w-0"
          style={{ viewTransitionName: transitionNames.title }}
        >
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
        </motion.div>

        {/* Amount + payer avatar */}
        <motion.div
          layout="position"
          transition={layoutTransition}
          className="flex items-center gap-2 shrink-0"
          style={{ viewTransitionName: transitionNames.amount }}
        >
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
        </motion.div>
      </TransitionLink>
    </motion.div>
  );
}
