import { create } from "zustand";
import { PLAN_LIMITS, type PlanId, type PlanLimits } from "@mooch/types";
// biome-ignore lint: using any for supabase client compatibility
type SupabaseClient = any;

type PlanStore = {
  plan: PlanId;
  limits: PlanLimits;
  tokenBalance: number;
  setPlan: (plan: PlanId) => void;
  setTokenBalance: (balance: number) => void;
  reset: () => void;
};

export const usePlanStore = create<PlanStore>((set) => ({
  plan: "free",
  limits: PLAN_LIMITS.free,
  tokenBalance: 0,
  setPlan: (plan) => set({ plan, limits: PLAN_LIMITS[plan] }),
  setTokenBalance: (tokenBalance) => set({ tokenBalance }),
  reset: () => set({ plan: "free", limits: PLAN_LIMITS.free, tokenBalance: 0 }),
}));

/**
 * Subscribe to realtime updates on subscriptions and token_balances
 * for the current user. Call this once when the user is authenticated.
 * Returns an unsubscribe function.
 */
export function subscribeToPlanUpdates(
  supabase: SupabaseClient,
  userId: string,
) {
  const { setPlan, setTokenBalance } = usePlanStore.getState();

  const channel = supabase
    .channel(`plan-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "subscriptions",
        filter: `user_id=eq.${userId}`,
      },
      (payload: { new: Record<string, unknown> }) => {
        const row = payload.new as { plan_id?: string };
        if (row.plan_id) {
          setPlan(row.plan_id as PlanId);
        }
      },
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "token_balances",
        filter: `user_id=eq.${userId}`,
      },
      (payload: { new: Record<string, unknown> }) => {
        const row = payload.new as { balance?: number };
        if (row.balance !== undefined) {
          setTokenBalance(row.balance);
        }
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
