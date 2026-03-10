import { createClient } from "@mooch/db/server";
import { getUserPlan, getUserTokenBalance } from "@mooch/db";
import { PLAN_LIMITS } from "@mooch/types";
import { Container, Text, Button } from "@mooch/ui";
import { redirect } from "next/navigation";
import {
  createCheckoutSession,
  createTokenPurchaseSession,
  createPortalSession,
} from "@/app/actions/billing";

export const dynamic = "force-dynamic";

const TOKEN_PACKS = [
  { id: "starter" as const, name: "Starter", tokens: 1, price: "$0.99" },
  { id: "popular" as const, name: "Popular", tokens: 3, price: "$1.99", highlight: true },
  { id: "power" as const, name: "Power", tokens: 9, price: "$4.99" },
] as const;

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const plan = await getUserPlan(supabase, user.id);
  const tokenBalance = await getUserTokenBalance(supabase, user.id);

  return (
    <Container as="section" className="py-4 sm:py-6">
      <div className="col-span-6 sm:col-span-12 space-y-8">
        {/* Header */}
        <div>
          <Text variant="heading" className="mb-1">
            Billing
          </Text>
          <Text variant="body" color="subtle">
            Manage your subscription and corruption tokens
          </Text>
        </div>

        {/* Past Due Banner */}
        {plan.status === "past_due" && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
            <Text variant="body" className="text-amber-800 font-medium">
              Payment failed — please update your payment method to keep your
              plan active.
            </Text>
            <form action={createPortalSession} className="mt-2">
              <Button variant="primary" size="sm" type="submit">
                Update payment method
              </Button>
            </form>
          </div>
        )}

        {/* Current Plan */}
        <div className="rounded-xl border border-[#EDE3DA] bg-[#FDFCFB] p-6">
          <Text variant="subheading" className="mb-4">
            Current Plan
          </Text>
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center rounded-full bg-[#F1F9E8] px-3 py-1 text-sm font-semibold text-[#2D5A0E] capitalize">
              {plan.planId}
            </span>
            {plan.billingCycle && (
              <Text variant="caption" color="subtle">
                {plan.billingCycle} billing
              </Text>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <Text variant="caption" color="subtle">Groups</Text>
              <p className="font-medium font-sans">
                {plan.limits.maxGroups ?? "Unlimited"}
              </p>
            </div>
            <div>
              <Text variant="caption" color="subtle">Members/group</Text>
              <p className="font-medium font-sans">
                {plan.limits.maxMembersPerGroup}
              </p>
            </div>
            <div>
              <Text variant="caption" color="subtle">History</Text>
              <p className="font-medium font-sans">
                {plan.limits.expenseHistoryMonths
                  ? `${plan.limits.expenseHistoryMonths} months`
                  : "Unlimited"}
              </p>
            </div>
            <div>
              <Text variant="caption" color="subtle">Monthly tokens</Text>
              <p className="font-medium font-sans">
                {plan.limits.tokensMonthlyGrant}
              </p>
            </div>
          </div>

          {/* Upgrade / Manage */}
          <div className="mt-6 flex flex-wrap gap-3">
            {plan.planId === "free" && (
              <>
                <form
                  action={async () => {
                    "use server";
                    await createCheckoutSession("pro", "monthly");
                  }}
                >
                  <Button variant="primary" size="sm" type="submit">
                    Upgrade to Pro
                  </Button>
                </form>
                <form
                  action={async () => {
                    "use server";
                    await createCheckoutSession("club", "monthly");
                  }}
                >
                  <Button variant="secondary" size="sm" type="submit">
                    Upgrade to Club
                  </Button>
                </form>
              </>
            )}
            {plan.planId === "pro" && (
              <form
                action={async () => {
                  "use server";
                  await createCheckoutSession("club", "monthly");
                }}
              >
                <Button variant="primary" size="sm" type="submit">
                  Upgrade to Club
                </Button>
              </form>
            )}
            {plan.stripeCustomerId && (
              <form action={createPortalSession}>
                <Button variant="secondary" size="sm" type="submit">
                  Manage subscription
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Token Balance */}
        <div className="rounded-xl border border-[#EDE3DA] bg-[#FDFCFB] p-6">
          <Text variant="subheading" className="mb-4">
            Corruption Tokens
          </Text>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold font-sans text-[#1F2A23]">
              {tokenBalance}
            </span>
            <Text variant="caption" color="subtle">
              tokens available
            </Text>
          </div>
          <Text variant="caption" color="subtle">
            +{plan.limits.tokensMonthlyGrant} tokens granted monthly on your{" "}
            {plan.planId} plan
          </Text>
        </div>

        {/* Token Packs */}
        <div>
          <Text variant="subheading" className="mb-4">
            Buy More Tokens
          </Text>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TOKEN_PACKS.map((pack) => (
              <form
                key={pack.id}
                action={async () => {
                  "use server";
                  await createTokenPurchaseSession(pack.id);
                }}
              >
                <button
                  type="submit"
                  className={`w-full rounded-xl border p-5 text-left transition-colors hover:border-[#5A9629] ${
                    "highlight" in pack && pack.highlight
                      ? "border-[#5A9629] bg-[#F1F9E8]"
                      : "border-[#EDE3DA] bg-[#FDFCFB]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Text variant="body" className="font-semibold">
                      {pack.name}
                    </Text>
                    {"highlight" in pack && pack.highlight && (
                      <span className="text-xs font-medium text-[#2D5A0E] bg-[#D9F0C4] px-2 py-0.5 rounded-full">
                        Best value
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold font-sans text-[#1F2A23]">
                    {pack.tokens} token{pack.tokens !== 1 ? "s" : ""}
                  </p>
                  <Text variant="caption" color="subtle">
                    {pack.price}
                  </Text>
                </button>
              </form>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}
