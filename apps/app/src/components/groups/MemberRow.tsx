"use client";

import type { GroupMember, Profile } from "@mooch/types";
import { Avatar, Badge, Button, cn, Text } from "@mooch/ui";

type MemberRowProps = {
  member: GroupMember & { profile: Profile };
  currentUserId?: string;
  isAdmin?: boolean;
  onToggleRole?: (member: GroupMember & { profile: Profile }) => void;
  onRemove?: (member: GroupMember & { profile: Profile }) => void;
  className?: string;
};

export function MemberRow({
  member,
  currentUserId,
  isAdmin,
  onToggleRole,
  onRemove,
  className,
}: MemberRowProps) {
  const isSelf = currentUserId === member.user_id;
  const canManage = !!isAdmin && !isSelf;
  const roleLabel = member.role === "owner" ? "owner" : member.role;
  const roleVariant = member.role === "member" ? "member" : "admin";
  const joinedAt = new Date(member.joined_at);
  const joinedLabel = Number.isNaN(joinedAt.getTime())
    ? "Joined recently"
    : `Joined ${joinedAt.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;

  return (
    <div
      className={cn(
        "rounded-2xl border border-[#E7D8CC] bg-[linear-gradient(180deg,#FEFCFA_0%,#F8F2EC_100%)] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_8px_14px_rgba(92,63,42,0.05)] sm:px-4",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar
            src={member.profile.photo_url}
            name={member.profile.display_name}
            size="sm"
          />
          <div className="min-w-0">
            <Text
              variant="body"
              className="truncate font-semibold text-[#26332C]"
            >
              {member.profile.display_name}
              {isSelf ? " (you)" : ""}
            </Text>
            <Text variant="caption" className="mt-0.5 text-[#7A6E65]">
              {joinedLabel}
            </Text>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Badge label={roleLabel} size="sm" variant={roleVariant} />
          {canManage && onToggleRole && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="text-[#5E7288]"
              onClick={() => onToggleRole(member)}
            >
              {member.role === "admin" ? "Set as member" : "Set as admin"}
            </Button>
          )}
          {canManage && onRemove && (
            <Button
              type="button"
              size="sm"
              variant="danger"
              className="border-[#D7857A]"
              onClick={() => onRemove(member)}
            >
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
