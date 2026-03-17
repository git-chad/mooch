"use server";

import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@mooch/db/server";
import type { Poll, PollOption } from "@mooch/types";
import { revalidatePath } from "next/cache";

type CreatePollInput = {
  question: string;
  is_anonymous?: boolean;
  is_multi_choice?: boolean;
  closes_at?: string | null;
  options: string[];
};

export async function createPoll(
  groupId: string,
  data: CreatePollInput,
): Promise<{ poll: Poll; options: PollOption[] } | { error: string }> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify membership
  const { data: member } = await admin
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!member) return { error: "Not a member of this group" };

  if (data.options.length < 2) return { error: "At least 2 options required" };
  if (data.options.length > 8) return { error: "Maximum 8 options allowed" };

  // Create poll
  const { data: poll, error: pollError } = await admin
    .from("polls")
    .insert({
      group_id: groupId,
      question: data.question.trim(),
      is_anonymous: data.is_anonymous ?? false,
      is_multi_choice: data.is_multi_choice ?? false,
      closes_at: data.closes_at ?? null,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (pollError || !poll)
    return { error: pollError?.message ?? "Failed to create poll" };

  // Create options
  const optionRows = data.options.map((text, index) => ({
    poll_id: poll.id,
    text: text.trim(),
    sort_order: index,
  }));

  const { data: options, error: optError } = await admin
    .from("poll_options")
    .insert(optionRows)
    .select("*");

  if (optError || !options)
    return { error: optError?.message ?? "Failed to create poll options" };

  revalidatePath(`/${groupId}/polls`);

  return { poll: poll as Poll, options: options as PollOption[] };
}

export async function vote(
  pollId: string,
  optionIds: string[],
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Fetch poll
  const { data: poll } = await admin
    .from("polls")
    .select("id, group_id, is_multi_choice, is_closed")
    .eq("id", pollId)
    .single();

  if (!poll) return { error: "Poll not found" };
  if (poll.is_closed) return { error: "Poll is closed" };

  // Verify membership
  const { data: member } = await admin
    .from("group_members")
    .select("user_id")
    .eq("group_id", poll.group_id)
    .eq("user_id", user.id)
    .single();

  if (!member) return { error: "Not a member of this group" };

  // Check Hail Mary — if active, debtors cannot vote
  const { data: hailMary } = await admin
    .from("poll_token_actions")
    .select("id")
    .eq("poll_id", pollId)
    .eq("action", "hail_mary")
    .limit(1)
    .single();

  if (hailMary) {
    // Check if user owes money to anyone in the group
    const { data: debts } = await admin
      .from("balances")
      .select("amount")
      .eq("group_id", poll.group_id)
      .eq("from_user", user.id)
      .gt("amount", 0);

    if (debts && debts.length > 0) {
      return { error: "Moochers can't vote — pay your debts first!" };
    }
  }

  // Single-choice: only one option allowed
  if (!poll.is_multi_choice && optionIds.length > 1) {
    return { error: "Single-choice poll: pick one option" };
  }

  // Delete existing votes for this user on this poll
  await admin
    .from("poll_votes")
    .delete()
    .eq("poll_id", pollId)
    .eq("user_id", user.id);

  // Insert new votes
  const voteRows = optionIds.map((optionId) => ({
    poll_id: pollId,
    option_id: optionId,
    user_id: user.id,
    weight: 1,
    is_ghost: false,
    is_vetoed: false,
  }));

  const { error: voteError } = await admin
    .from("poll_votes")
    .insert(voteRows);

  if (voteError) return { error: voteError.message };

  // No revalidatePath — realtime handles sync, and revalidation
  // would overwrite the client's optimistic state before it settles.

  return { success: true };
}

export async function closePoll(
  pollId: string,
): Promise<{ poll: Poll } | { error: string }> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: poll } = await admin
    .from("polls")
    .select("id, group_id, created_by, is_closed")
    .eq("id", pollId)
    .single();

  if (!poll) return { error: "Poll not found" };
  if (poll.is_closed) return { error: "Poll is already closed" };

  // Check creator or admin
  const { data: member } = await admin
    .from("group_members")
    .select("role")
    .eq("group_id", poll.group_id)
    .eq("user_id", user.id)
    .single();

  if (poll.created_by !== user.id && member?.role !== "admin" && member?.role !== "owner")
    return { error: "Only the poll creator or an admin can close this poll" };

  const { data: updated, error } = await admin
    .from("polls")
    .update({ is_closed: true, updated_at: new Date().toISOString() })
    .eq("id", pollId)
    .select("*")
    .single();

  if (error || !updated) return { error: error?.message ?? "Failed to close poll" };

  revalidatePath(`/${poll.group_id}/polls`);

  return { poll: updated as Poll };
}

export async function deletePoll(
  pollId: string,
): Promise<{ success: true; groupId: string } | { error: string }> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: poll } = await admin
    .from("polls")
    .select("id, group_id, created_by")
    .eq("id", pollId)
    .single();

  if (!poll) return { error: "Poll not found" };

  // Check creator or admin
  const { data: member } = await admin
    .from("group_members")
    .select("role")
    .eq("group_id", poll.group_id)
    .eq("user_id", user.id)
    .single();

  if (poll.created_by !== user.id && member?.role !== "admin" && member?.role !== "owner")
    return { error: "Only the poll creator or an admin can delete this poll" };

  const { error } = await admin.from("polls").delete().eq("id", pollId);

  if (error) return { error: error.message };

  revalidatePath(`/${poll.group_id}/polls`);

  return { success: true, groupId: poll.group_id };
}

export async function togglePinPoll(
  pollId: string,
): Promise<{ poll: Poll } | { error: string }> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: poll } = await admin
    .from("polls")
    .select("id, group_id, created_by, is_pinned")
    .eq("id", pollId)
    .single();

  if (!poll) return { error: "Poll not found" };

  // Check creator or admin
  const { data: member } = await admin
    .from("group_members")
    .select("role")
    .eq("group_id", poll.group_id)
    .eq("user_id", user.id)
    .single();

  if (poll.created_by !== user.id && member?.role !== "admin" && member?.role !== "owner")
    return { error: "Only the poll creator or an admin can pin/unpin this poll" };

  const { data: updated, error } = await admin
    .from("polls")
    .update({ is_pinned: !poll.is_pinned, updated_at: new Date().toISOString() })
    .eq("id", pollId)
    .select("*")
    .single();

  if (error || !updated) return { error: error?.message ?? "Failed to toggle pin" };

  // No revalidatePath — realtime handles sync, and revalidation
  // would overwrite the client's optimistic state before it settles.

  return { poll: updated as Poll };
}
