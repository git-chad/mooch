export const SFX_EVENTS = {
  EXPENSE_ADDED: "/sounds/expense-added.mp3",
  VOTE_CAST: "/sounds/vote-cast.mp3",
  BALANCE_SETTLED: "/sounds/balance-settled.mp3",
  GROUP_JOINED: "/sounds/group-joined.mp3",
  REACTION_ADDED: "/sounds/reaction-added.mp3",
  NOTIFICATION: "/sounds/notification.mp3",
  ERROR: "/sounds/error.mp3",
} as const;

export type SfxKey = keyof typeof SFX_EVENTS;
