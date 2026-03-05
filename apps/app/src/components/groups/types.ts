import type { Group, GroupMember, Profile } from "@mooch/types";

export type GroupSummary = Group & {
  memberCount: number;
};

export type GroupWithMembers = Group & {
  members: (GroupMember & { profile: Profile })[];
};
