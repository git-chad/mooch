"use server";

import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@mooch/db/server";
import { ACTION_COSTS, spendTokens } from "@mooch/db";
import type { CorruptionAction, PollTokenAction } from "@mooch/types";
import { revalidatePath } from "next/cache";

// ---------- helpers ----------

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function assertMember(admin: ReturnType<typeof createAdminClient>, groupId: string, userId: string) {
  const { data } = await admin
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .single();
  if (!data) throw new Error("Not a member of this group");
}

async function assertActionNotUsed(
  admin: ReturnType<typeof createAdminClient>,
  pollId: string,
  userId: string,
  action: CorruptionAction,
) {
  const { data } = await admin
    .from("poll_token_actions")
    .select("id")
    .eq("poll_id", pollId)
    .eq("user_id", userId)
    .eq("action", action)
    .limit(1)
    .single();
  if (data) throw new Error("You already used this action on this poll");
}

async function recordAction(
  admin: ReturnType<typeof createAdminClient>,
  pollId: string,
  userId: string,
  action: CorruptionAction,
  targetUserId?: string,
  metadata?: Record<string, unknown>,
) {
  await admin.from("poll_token_actions").insert({
    poll_id: pollId,
    user_id: userId,
    action,
    target_user_id: targetUserId ?? null,
    metadata: metadata ?? null,
  });
}

async function getPollOrThrow(admin: ReturnType<typeof createAdminClient>, pollId: string) {
  const { data } = await admin
    .from("polls")
    .select("*")
    .eq("id", pollId)
    .single();
  if (!data) throw new Error("Poll not found");
  return data;
}

// ---------- Double Down 🎰 (1 token) ----------

export async function doubleDown(
  pollId: string,
  optionId: string,
): Promise<{ success: true; remainingBalance: number } | { error: string }> {
  try {
    const user = await getAuthUser();
    if (!user) return { error: "Not authenticated" };

    const admin = createAdminClient();
    const poll = await getPollOrThrow(admin, pollId);
    if (poll.is_closed) return { error: "Poll is closed" };

    await assertMember(admin, poll.group_id, user.id);
    await assertActionNotUsed(admin, pollId, user.id, "double_down");

    // Cannot combine with Ghost Vote on the same poll
    const { data: ghostAction } = await admin
      .from("poll_token_actions")
      .select("id")
      .eq("poll_id", pollId)
      .eq("user_id", user.id)
      .eq("action", "ghost_vote")
      .limit(1)
      .single();
    if (ghostAction) return { error: "Cannot use Double Down and Ghost Vote on the same poll" };

    // Spend token
    const { remainingBalance } = await spendTokens(admin, user.id, "double_down", ACTION_COSTS.double_down);

    // Check if user already voted for this option
    const { data: existingVote } = await admin
      .from("poll_votes")
      .select("id, weight")
      .eq("poll_id", pollId)
      .eq("option_id", optionId)
      .eq("user_id", user.id)
      .single();

    if (existingVote) {
      // Update existing vote weight to 2
      await admin
        .from("poll_votes")
        .update({ weight: 2 })
        .eq("id", existingVote.id);
    } else {
      // Vote + double in one action
      await admin.from("poll_votes").insert({
        poll_id: pollId,
        option_id: optionId,
        user_id: user.id,
        weight: 2,
        is_ghost: false,
        is_vetoed: false,
      });
    }

    await recordAction(admin, pollId, user.id, "double_down", undefined, { option_id: optionId });
    revalidatePath(`/${poll.group_id}/polls`);

    return { success: true, remainingBalance };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

// ---------- The Leak 🕵️ (1 token) ----------

export async function theLeak(
  pollId: string,
): Promise<{ success: true; remainingBalance: number; leaked: { option_id: string; option_text: string; voters: { id: string; display_name: string }[] }[] } | { error: string }> {
  try {
    const user = await getAuthUser();
    if (!user) return { error: "Not authenticated" };

    const admin = createAdminClient();
    const poll = await getPollOrThrow(admin, pollId);
    if (!poll.is_anonymous) return { error: "The Leak only works on anonymous polls" };

    await assertMember(admin, poll.group_id, user.id);
    await assertActionNotUsed(admin, pollId, user.id, "the_leak");

    // Spend token
    const { remainingBalance } = await spendTokens(admin, user.id, "the_leak", ACTION_COSTS.the_leak);

    // Snapshot current votes with voter identities (excluding ghost votes)
    const { data: votes } = await admin
      .from("poll_votes")
      .select("option_id, user_id, voter:profiles!user_id(id, display_name)")
      .eq("poll_id", pollId)
      .eq("is_vetoed", false)
      .eq("is_ghost", false);

    const { data: options } = await admin
      .from("poll_options")
      .select("id, text")
      .eq("poll_id", pollId);

    const leaked = (options ?? []).map((opt) => ({
      option_id: opt.id as string,
      option_text: opt.text as string,
      voters: (votes ?? [])
        .filter((v) => v.option_id === opt.id)
        .map((v) => v.voter as unknown as { id: string; display_name: string }),
    }));

    await recordAction(admin, pollId, user.id, "the_leak", undefined, { leaked });
    revalidatePath(`/${poll.group_id}/polls`);

    return { success: true, remainingBalance, leaked };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

// ---------- The Coup 👑 (3 tokens) ----------

export async function theCoup(
  pollId: string,
): Promise<{ success: true; remainingBalance: number } | { error: string }> {
  try {
    const user = await getAuthUser();
    if (!user) return { error: "Not authenticated" };

    const admin = createAdminClient();
    const poll = await getPollOrThrow(admin, pollId);
    if (poll.is_closed) return { error: "Poll is already closed" };

    await assertMember(admin, poll.group_id, user.id);
    await assertActionNotUsed(admin, pollId, user.id, "the_coup");

    // Spend tokens
    const { remainingBalance } = await spendTokens(admin, user.id, "the_coup", ACTION_COSTS.the_coup);

    // Force-close the poll
    await admin
      .from("polls")
      .update({ is_closed: true, updated_at: new Date().toISOString() })
      .eq("id", pollId);

    await recordAction(admin, pollId, user.id, "the_coup");
    revalidatePath(`/${poll.group_id}/polls`);

    return { success: true, remainingBalance };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

// ---------- Ghost Vote 👻 (1 token) ----------

export async function ghostVote(
  pollId: string,
  optionIds: string[],
): Promise<{ success: true; remainingBalance: number } | { error: string }> {
  try {
    const user = await getAuthUser();
    if (!user) return { error: "Not authenticated" };

    const admin = createAdminClient();
    const poll = await getPollOrThrow(admin, pollId);
    if (poll.is_closed) return { error: "Poll is closed" };

    await assertMember(admin, poll.group_id, user.id);
    await assertActionNotUsed(admin, pollId, user.id, "ghost_vote");

    // Cannot combine with Double Down on the same poll
    const { data: doubleAction } = await admin
      .from("poll_token_actions")
      .select("id")
      .eq("poll_id", pollId)
      .eq("user_id", user.id)
      .eq("action", "double_down")
      .limit(1)
      .single();
    if (doubleAction) return { error: "Cannot use Ghost Vote and Double Down on the same poll" };

    if (!poll.is_multi_choice && optionIds.length > 1) {
      return { error: "Single-choice poll: pick one option" };
    }

    // Spend token
    const { remainingBalance } = await spendTokens(admin, user.id, "ghost_vote", ACTION_COSTS.ghost_vote);

    // Remove any existing votes
    await admin
      .from("poll_votes")
      .delete()
      .eq("poll_id", pollId)
      .eq("user_id", user.id);

    // Insert ghost votes — all options ghosted
    const voteRows = optionIds.map((optionId) => ({
      poll_id: pollId,
      option_id: optionId,
      user_id: user.id,
      weight: 1,
      is_ghost: true,
      is_vetoed: false,
    }));

    const { error: voteError } = await admin.from("poll_votes").insert(voteRows);
    if (voteError) return { error: voteError.message };

    await recordAction(admin, pollId, user.id, "ghost_vote");
    revalidatePath(`/${poll.group_id}/polls`);

    return { success: true, remainingBalance };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

// ---------- The Veto ☠️ (2 tokens) ----------

export async function theVeto(
  pollId: string,
  targetUserId: string,
): Promise<{ success: true; remainingBalance: number } | { error: string }> {
  try {
    const user = await getAuthUser();
    if (!user) return { error: "Not authenticated" };
    if (user.id === targetUserId) return { error: "You cannot veto yourself" };

    const admin = createAdminClient();
    const poll = await getPollOrThrow(admin, pollId);
    if (poll.is_closed) return { error: "Poll is closed" };

    await assertMember(admin, poll.group_id, user.id);
    await assertActionNotUsed(admin, pollId, user.id, "the_veto");

    // Spend tokens
    const { remainingBalance } = await spendTokens(admin, user.id, "the_veto", ACTION_COSTS.the_veto);

    // Veto all of the target's votes on this poll
    await admin
      .from("poll_votes")
      .update({ is_vetoed: true, vetoed_by: user.id })
      .eq("poll_id", pollId)
      .eq("user_id", targetUserId);

    await recordAction(admin, pollId, user.id, "the_veto", targetUserId);
    revalidatePath(`/${poll.group_id}/polls`);

    return { success: true, remainingBalance };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

// ---------- Hail Mary 🙏 (1 token) ----------

export async function hailMary(
  pollId: string,
): Promise<{ success: true; remainingBalance: number; blockedUsers: string[] } | { error: string }> {
  try {
    const user = await getAuthUser();
    if (!user) return { error: "Not authenticated" };

    const admin = createAdminClient();
    const poll = await getPollOrThrow(admin, pollId);
    if (poll.is_closed) return { error: "Poll is closed" };

    await assertMember(admin, poll.group_id, user.id);
    await assertActionNotUsed(admin, pollId, user.id, "hail_mary");

    // Spend token
    const { remainingBalance } = await spendTokens(admin, user.id, "hail_mary", ACTION_COSTS.hail_mary);

    // Find all users who owe money in this group (from_user with amount > 0)
    const { data: debts } = await admin
      .from("balances")
      .select("from_user")
      .eq("group_id", poll.group_id)
      .gt("amount", 0);

    const debtorIds = [...new Set((debts ?? []).map((d) => d.from_user as string))];

    // Nullify existing debtor votes — set is_vetoed = true
    if (debtorIds.length > 0) {
      await admin
        .from("poll_votes")
        .update({ is_vetoed: true, vetoed_by: user.id })
        .eq("poll_id", pollId)
        .in("user_id", debtorIds);
    }

    await recordAction(admin, pollId, user.id, "hail_mary", undefined, { blocked_users: debtorIds });
    revalidatePath(`/${poll.group_id}/polls`);

    return { success: true, remainingBalance, blockedUsers: debtorIds };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
