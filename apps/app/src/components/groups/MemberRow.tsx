"use client";

import type { GroupMember, Profile } from "@mooch/types";
import { Avatar, Badge, Button, Text, cn } from "@mooch/ui";

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

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border border-[#EDE3DA] bg-[#FDFCFB] px-3 py-2.5",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <Avatar
          src={member.profile.photo_url}
          name={member.profile.display_name}
          size="sm"
        />
        <div className="min-w-0">
          <Text variant="body" className="truncate font-medium">
            {member.profile.display_name}
            {isSelf ? " (you)" : ""}
          </Text>
          <div className="mt-1">
            <Badge
              label={member.role}
              size="sm"
              variant={member.role === "admin" ? "admin" : "member"}
            />
          </div>
        </div>
      </div>

      {canManage && (onToggleRole || onRemove) && (
        <div className="flex items-center gap-2">
          {onToggleRole && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onToggleRole(member)}
            >
              {member.role === "admin" ? "Make member" : "Make admin"}
            </Button>
          )}
          {onRemove && (
            <Button
              type="button"
              size="sm"
              variant="danger"
              onClick={() => onRemove(member)}
            >
              Remove
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
