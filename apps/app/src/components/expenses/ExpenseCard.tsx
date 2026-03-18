"use client";

import type { Expense, GroupMember, Profile } from "@mooch/types";
import { Avatar, LucideIconByName, Text } from "@mooch/ui";
import { ImageIcon } from "lucide-react";
import { motion, type Transition, useReducedMotion } from "motion/react";
import { TransitionLink } from "@/components/TransitionLink";
import { usePrefetch } from "@/hooks/usePrefetch";
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
  const href = `/${groupId}/expenses/${tabId}/${expense.id}`;
  const prefetchRef = usePrefetch<HTMLDivElement>(href);

  return (
    <motion.div
      ref={prefetchRef}
      layout="position"
      transition={layoutTransition}
      whileTap={reducedMotion ? undefined : { scale: 0.988 }}
    >
      <TransitionLink
        href={href}
        className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-[#F7F2ED]/60"
      >
        {/* Category icon */}
        <motion.div
          layout="position"
          transition={
            layoutTransition ??
            getSurfaceTransition(reducedMotion, motionDuration.fast)
          }
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: "#F7F2ED",
            border: "1px solid #DCCBC0",
            viewTransitionName: transitionNames.icon,
          }}
        >
          {expense.category === "other" && expense.custom_category ? (
            <LucideIconByName
              name={expense.custom_category}
              className="w-4 h-4 text-ink-sub"
            />
          ) : (
            <span className="text-[16px] leading-none">
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
          <Text
            variant="caption"
            color="subtle"
            className="flex items-center gap-1"
          >
            {isCurrentUserPayer ? "You" : (payer?.display_name ?? "someone")}
            {" · "}
            <span className="text-ink-dim">
              {relativeTime(expense.created_at)}
            </span>
            {expense.photo_url && (
              <ImageIcon className="w-3 h-3 text-ink-dim ml-0.5" />
            )}
          </Text>
        </motion.div>

        {/* Amount */}
        <motion.div
          layout="position"
          transition={layoutTransition}
          className="flex items-center gap-2 shrink-0"
          style={{ viewTransitionName: transitionNames.amount }}
        >
          <Text
            variant="label"
            color="inherit"
            className="font-semibold tabular-nums"
            style={{ color: isCurrentUserPayer ? "#2d5a10" : "#1F2A23" }}
          >
            {formatCurrency(displayAmount, displayCurrency, locale)}
          </Text>
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
