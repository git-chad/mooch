"use client";

import type { UserPlan } from "@mooch/db";
import { Button, Text } from "@mooch/ui";
import {
  Coins,
  Crown,
  Gem,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  createCheckoutSession,
  createPortalSession,
  createTokenPurchaseSession,
} from "@/app/actions/billing";
import { motionDuration, motionEase } from "@/lib/motion";

const TOKEN_PACKS = [
  { id: "starter" as const, name: "Starter", tokens: 1, price: "$0.99" },
  {
    id: "popular" as const,
    name: "Popular",
    tokens: 3,
    price: "$1.99",
    highlight: true,
  },
  { id: "power" as const, name: "Power", tokens: 9, price: "$4.99" },
] as const;

function formatCycleLabel(cycle: string | null) {
  if (!cycle) return null;
  if (cycle === "monthly") return "Monthly billing";
  if (cycle === "annual") return "Annual billing";
  return cycle;
}

export default function BillingClient({
  plan,
  tokenBalance,
}: {
  plan: UserPlan;
  tokenBalance: number;
}) {
  const reducedMotion = useReducedMotion() ?? false;
  const isFree = plan.planId === "free";

  const containerVariants = reducedMotion
    ? undefined
    : {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.06,
            delayChildren: 0.04,
          },
        },
      };

  const itemVariants = reducedMotion
    ? undefined
    : {
        hidden: { opacity: 0, y: 10, filter: "blur(2px)" },
        visible: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: {
            duration: motionDuration.standard,
            ease: motionEase.out,
          },
        },
      };

  return (
    <motion.div
      variants={containerVariants}
      initial={reducedMotion ? undefined : "hidden"}
      animate={reducedMotion ? undefined : "visible"}
      className="space-y-5"
    >
      <motion.div
        variants={itemVariants}
        className="rounded-2xl border border-[#E7D8CC] bg-[linear-gradient(180deg,#FDFCFB_0%,#F7F1EA_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_14px_30px_rgba(92,63,42,0.09)] sm:p-6"
      >
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#DCCBC0] bg-[#F7EFE7] px-3 py-1">
          <Sparkles className="h-3.5 w-3.5 text-[#806D5E]" />
          <Text variant="caption" className="font-medium text-[#806D5E]">
            Billing settings
          </Text>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Text variant="title">Billing</Text>
            <Text variant="body" color="subtle" className="mt-1">
              Manage your subscription and corruption tokens.
            </Text>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DCCBC0] bg-[#F5ECE4] px-3 py-1.5">
            <Crown className="h-3.5 w-3.5 text-[#8C7463]" />
            <Text
              variant="caption"
              className="font-medium text-[#604D3F] capitalize"
            >
              {plan.planId}
            </Text>
          </div>
        </div>
      </motion.div>

      {plan.status === "past_due" && (
        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3"
        >
          <Text variant="body" className="text-amber-800 font-medium">
            Payment failed. Update your payment method to keep your plan active.
          </Text>
          <form action={createPortalSession} className="mt-2">
            <Button variant="primary" size="sm" type="submit">
              Update payment method
            </Button>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <motion.section
          variants={itemVariants}
          className="rounded-2xl border border-[#E7D8CC] bg-[#FDFCFB] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_10px_24px_rgba(92,63,42,0.07)]"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <Text variant="subheading">Current plan</Text>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D7E9C2] bg-[#EEF8E1] px-3 py-1">
              <ShieldCheck className="h-3.5 w-3.5 text-[#4F7B2C]" />
              <Text
                variant="caption"
                className="font-medium text-[#3E6B1A] capitalize"
              >
                {plan.planId}
              </Text>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
            <Stat label="Groups" value={plan.limits.maxGroups ?? "Unlimited"} />
            <Stat
              label="Members/group"
              value={plan.limits.maxMembersPerGroup}
            />
            <Stat
              label="History"
              value={
                plan.limits.expenseHistoryMonths
                  ? `${plan.limits.expenseHistoryMonths} months`
                  : "Unlimited"
              }
            />
            <Stat
              label="Monthly tokens"
              value={plan.limits.tokensMonthlyGrant}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#EDE2D8] pt-4">
            <Text variant="caption" color="subtle">
              {formatCycleLabel(plan.billingCycle) ?? "No active billing cycle"}
            </Text>

            <div className="flex flex-wrap gap-2">
              {isFree && (
                <>
                  <form
                    action={createCheckoutSession.bind(null, "pro", "monthly")}
                  >
                    <Button variant="secondary" size="sm" type="submit">
                      Upgrade to Pro
                    </Button>
                  </form>
                  <form
                    action={createCheckoutSession.bind(null, "club", "monthly")}
                  >
                    <Button variant="primary" size="sm" type="submit">
                      Upgrade to Club
                    </Button>
                  </form>
                </>
              )}

              {plan.stripeCustomerId && (
                <form action={createPortalSession}>
                  <Button variant="secondary" size="sm" type="submit">
                    Manage subscription
                  </Button>
                </form>
              )}
              {plan.planId === "pro" && (
                <form
                  action={createCheckoutSession.bind(null, "club", "monthly")}
                >
                  <Button variant="primary" size="sm" type="submit">
                    Upgrade to Club
                  </Button>
                </form>
              )}
            </div>
          </div>
        </motion.section>

        <motion.section
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-[#DCE8C7] bg-[linear-gradient(160deg,#F7FBEF_0%,#EEF8E1_45%,#F8FBF1_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_24px_rgba(69,117,32,0.10)]"
        >
          <motion.div
            className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#D6EDBD]/80 blur-2xl"
            animate={
              reducedMotion ? undefined : { y: [0, 8, 0], x: [0, -6, 0] }
            }
            transition={
              reducedMotion
                ? undefined
                : {
                    duration: 7,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }
            }
          />
          <div className="relative">
            <div className="mb-3 inline-flex items-center gap-1 rounded-full border border-[#CFE5B7] bg-[#EAF6D7] px-2.5 py-1">
              <Coins className="h-3.5 w-3.5 text-[#4A7627]" />
              <Text variant="caption" className="font-medium text-[#4A7627]">
                Token wallet
              </Text>
            </div>

            <div className="mb-1 flex items-end gap-2">
              <Text as="p" variant="title" className="text-[#1F2A23]">
                {tokenBalance}
              </Text>
              <Text variant="caption" className="pb-1 text-[#4F6B38]">
                tokens available
              </Text>
            </div>
            <Text variant="caption" className="text-[#4F6B38]">
              +{plan.limits.tokensMonthlyGrant} tokens granted monthly on your{" "}
              {plan.planId} plan
            </Text>
          </div>
        </motion.section>
      </div>

      <motion.section variants={itemVariants}>
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#6E8E4A]" />
          <Text variant="heading">Buy more tokens</Text>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {TOKEN_PACKS.map((pack) => (
            <motion.form
              key={pack.id}
              action={createTokenPurchaseSession.bind(null, pack.id)}
              whileHover={
                reducedMotion
                  ? undefined
                  : {
                      y: -4,
                      transition: { duration: 0.18, ease: motionEase.out },
                    }
              }
            >
              <button
                type="submit"
                className={`group relative h-full w-full rounded-2xl border p-4 text-left transition-[border-color,background-color,box-shadow] duration-150 ${
                  "highlight" in pack && pack.highlight
                    ? "border-[#7EB450] bg-[#EEF8E1] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_20px_rgba(86,133,38,0.10)]"
                    : "border-[#E7D8CC] bg-[#FDFCFB] hover:border-[#D8C6B8] hover:bg-[#FCFAF8]"
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Text variant="body" className="font-semibold">
                    {pack.name}
                  </Text>
                  {"highlight" in pack && pack.highlight && (
                    <motion.span
                      className="inline-flex items-center rounded-full border border-[#B9D99A] bg-[#DDF1C7] px-2 py-0.5 text-[11px] font-medium text-[#3F6C1C]"
                      animate={
                        reducedMotion
                          ? undefined
                          : {
                              scale: [1, 1.03, 1],
                            }
                      }
                      transition={
                        reducedMotion
                          ? undefined
                          : {
                              duration: 2.2,
                              repeat: Number.POSITIVE_INFINITY,
                              ease: "easeInOut",
                            }
                      }
                    >
                      Best value
                    </motion.span>
                  )}
                </div>
                <Text as="p" variant="title" className="mb-0.5 text-[#1F2A23]">
                  {pack.tokens} token{pack.tokens !== 1 ? "s" : ""}
                </Text>
                <div className="flex items-center justify-between">
                  <Text variant="caption" color="subtle">
                    {pack.price}
                  </Text>
                  <Gem className="h-3.5 w-3.5 text-[#7F6A59] opacity-70 transition-opacity group-hover:opacity-100" />
                </div>
              </button>
            </motion.form>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[#EFE4DB] bg-[#FBF8F5] px-3 py-2.5">
      <Text variant="caption" color="subtle" className="mb-0.5 block">
        {label}
      </Text>
      <Text variant="body" className="font-semibold text-[#2E2E2E]">
        {value}
      </Text>
    </div>
  );
}
