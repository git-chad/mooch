import type { Poll, PollOption, PollTokenAction, PollVote, Profile } from "@mooch/types";
import { create } from "zustand";

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

type PollStore = {
  polls: PollWithOptions[];
  setPolls: (polls: PollWithOptions[]) => void;
  upsertPoll: (poll: PollWithOptions) => void;
  removePoll: (id: string) => void;

  // User's votes for the currently viewed poll
  userVotes: PollVote[];
  setUserVotes: (votes: PollVote[]) => void;

  clear: () => void;
};

export const usePollStore = create<PollStore>((set) => ({
  polls: [],
  setPolls: (polls) => set({ polls }),
  upsertPoll: (poll) =>
    set((s) => {
      const idx = s.polls.findIndex((p) => p.id === poll.id);
      if (idx === -1) return { polls: [poll, ...s.polls] };
      const next = [...s.polls];
      next[idx] = poll;
      return { polls: next };
    }),
  removePoll: (id) =>
    set((s) => ({ polls: s.polls.filter((p) => p.id !== id) })),

  userVotes: [],
  setUserVotes: (userVotes) => set({ userVotes }),

  clear: () => set({ polls: [], userVotes: [] }),
}));
