import type { SupabaseClient } from "@supabase/supabase-js";

export type CorruptionAction =
  | "double_down"
  | "the_leak"
  | "the_coup"
  | "ghost_vote"
  | "the_veto"
  | "hail_mary";

export const ACTION_COSTS: Record<CorruptionAction, number> = {
  double_down: 1,
  the_leak: 1,
  the_coup: 3,
  ghost_vote: 1,
  the_veto: 2,
  hail_mary: 1,
};

export type SpendResult = { ok: true; remainingBalance: number };

export async function spendTokens(
  supabase: SupabaseClient,
  userId: string,
  action: CorruptionAction,
  cost: number,
): Promise<SpendResult> {
  // Fetch current balance
  const { data: balance, error: fetchError } = await supabase
    .from("token_balances")
    .select("balance")
    .eq("user_id", userId)
    .single();

  if (fetchError || !balance) {
    throw new Error("INSUFFICIENT_TOKENS");
  }

  if (balance.balance < cost) {
    throw new Error("INSUFFICIENT_TOKENS");
  }

  // Atomically decrement — only succeeds if balance >= cost
  const { data: updated, error: updateError } = await supabase
    .rpc("spend_tokens", {
      p_user_id: userId,
      p_cost: cost,
      p_action: action,
    });

  if (updateError) {
    throw new Error("INSUFFICIENT_TOKENS");
  }

  return { ok: true, remainingBalance: updated as number };
}
