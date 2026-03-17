import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Poll,
  PollOption,
  PollVote,
  PollTokenAction,
  Profile,
} from "@mooch/types";

export type PollOptionWithVotes = PollOption & {
  vote_count: number;
  weighted_count: number;
  voters: Profile[];
};

export type PollTokenActionWithProfile = PollTokenAction & {
  user: Profile;
};

export type PollWithOptions = Poll & {
  options: PollOptionWithVotes[];
  token_actions: PollTokenActionWithProfile[];
  created_by_profile: Profile;
  total_votes: number;
};

export async function getPolls(
  supabase: SupabaseClient,
  groupId: string,
): Promise<PollWithOptions[]> {
  const { data, error } = await supabase
    .from("polls")
    .select(
      "*, created_by_profile:profiles!created_by(*), poll_options(*), poll_votes(*, voter:profiles!user_id(*)), poll_token_actions(*, user:profiles!user_id(*))",
    )
    .eq("group_id", groupId)
    .order("is_closed", { ascending: true })
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("[getPolls] query failed:", error?.message);
    return [];
  }

  return data.map((poll) => {
    const options = (poll.poll_options ?? []) as PollOption[];
    const votes = (poll.poll_votes ?? []) as (PollVote & { voter: Profile })[];
    const tokenActions = (poll.poll_token_actions ?? []) as PollTokenActionWithProfile[];
    const activeVotes = votes.filter((v) => !v.is_vetoed);

    return {
      ...poll,
      poll_options: undefined,
      poll_votes: undefined,
      poll_token_actions: undefined,
      created_by_profile: poll.created_by_profile as Profile,
      token_actions: tokenActions,
      total_votes: activeVotes.reduce((sum, v) => sum + v.weight, 0),
      options: options
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((opt) => {
          const optVotes = activeVotes.filter((v) => v.option_id === opt.id);
          const visibleVoters = poll.is_anonymous
            ? []
            : optVotes.filter((v) => !v.is_ghost).map((v) => v.voter);
          return {
            ...opt,
            vote_count: optVotes.length,
            weighted_count: optVotes.reduce((sum, v) => sum + v.weight, 0),
            voters: visibleVoters,
          };
        }),
    } as PollWithOptions;
  });
}

export async function getPollById(
  supabase: SupabaseClient,
  pollId: string,
): Promise<PollWithOptions | null> {
  const { data, error } = await supabase
    .from("polls")
    .select(
      "*, created_by_profile:profiles!created_by(*), poll_options(*), poll_votes(*, voter:profiles!user_id(*)), poll_token_actions(*, user:profiles!user_id(*))",
    )
    .eq("id", pollId)
    .single();

  if (error || !data) return null;

  const options = (data.poll_options ?? []) as PollOption[];
  const votes = (data.poll_votes ?? []) as (PollVote & { voter: Profile })[];
  const tokenActions = (data.poll_token_actions ?? []) as PollTokenActionWithProfile[];
  const activeVotes = votes.filter((v) => !v.is_vetoed);

  return {
    ...data,
    poll_options: undefined,
    poll_votes: undefined,
    poll_token_actions: undefined,
    created_by_profile: data.created_by_profile as Profile,
    token_actions: tokenActions,
    total_votes: activeVotes.reduce((sum, v) => sum + v.weight, 0),
    options: options
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((opt) => {
        const optVotes = activeVotes.filter((v) => v.option_id === opt.id);
        // In anonymous polls, don't expose voters. Ghost votes are never exposed.
        const visibleVoters = data.is_anonymous
          ? []
          : optVotes.filter((v) => !v.is_ghost).map((v) => v.voter);
        return {
          ...opt,
          vote_count: optVotes.length,
          weighted_count: optVotes.reduce((sum, v) => sum + v.weight, 0),
          voters: visibleVoters,
        };
      }),
  } as PollWithOptions;
}

export async function getUserVotes(
  supabase: SupabaseClient,
  pollId: string,
  userId: string,
): Promise<PollVote[]> {
  const { data, error } = await supabase
    .from("poll_votes")
    .select("*")
    .eq("poll_id", pollId)
    .eq("user_id", userId);

  if (error || !data) return [];
  return data as PollVote[];
}

export async function getPollTokenActions(
  supabase: SupabaseClient,
  pollId: string,
): Promise<PollTokenAction[]> {
  const { data, error } = await supabase
    .from("poll_token_actions")
    .select("*")
    .eq("poll_id", pollId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data as PollTokenAction[];
}
