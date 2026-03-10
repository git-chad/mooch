import type { SupabaseClient } from "@supabase/supabase-js";
import { PLAN_LIMITS, type PlanId, type PlanLimits } from "@mooch/types";
import { cache } from "react";

export type UserPlan = {
  planId: PlanId;
  limits: PlanLimits;
  status: string;
  billingCycle: string | null;
  stripeCustomerId: string | null;
};

export const getUserPlan = cache(
  async (supabase: SupabaseClient, userId: string): Promise<UserPlan> => {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("plan_id, status, billing_cycle, stripe_customer_id, plans(*)")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return {
        planId: "free",
        limits: PLAN_LIMITS.free,
        status: "active",
        billingCycle: null,
        stripeCustomerId: null,
      };
    }

    const planId = (data.plan_id as PlanId) || "free";

    return {
      planId,
      limits: PLAN_LIMITS[planId],
      status: data.status,
      billingCycle: data.billing_cycle,
      stripeCustomerId: data.stripe_customer_id,
    };
  },
);

export async function getUserTokenBalance(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("token_balances")
    .select("balance")
    .eq("user_id", userId)
    .single();

  if (error || !data) return 0;
  return data.balance;
}

export type ActionCheck = { allowed: boolean; reason?: string };

export async function canPerformAction(
  supabase: SupabaseClient,
  userId: string,
  action: "create_group" | "add_member" | "view_expense_history",
  context?: { groupId?: string },
): Promise<ActionCheck> {
  const plan = await getUserPlan(supabase, userId);

  switch (action) {
    case "create_group": {
      if (plan.limits.maxGroups === null) return { allowed: true };
      const { count } = await supabase
        .from("group_members")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      if ((count ?? 0) >= plan.limits.maxGroups) {
        return {
          allowed: false,
          reason: `Free plan allows up to ${plan.limits.maxGroups} group. Upgrade to Pro for unlimited groups.`,
        };
      }
      return { allowed: true };
    }

    case "add_member": {
      if (!context?.groupId) return { allowed: false, reason: "Missing group context" };
      const { count } = await supabase
        .from("group_members")
        .select("*", { count: "exact", head: true })
        .eq("group_id", context.groupId);
      if ((count ?? 0) >= plan.limits.maxMembersPerGroup) {
        return {
          allowed: false,
          reason: `Your plan allows up to ${plan.limits.maxMembersPerGroup} members per group. Upgrade for more.`,
        };
      }
      return { allowed: true };
    }

    case "view_expense_history": {
      // Always allowed — the limit is enforced at query time by filtering dates
      return { allowed: true };
    }

    default:
      return { allowed: true };
  }
}
