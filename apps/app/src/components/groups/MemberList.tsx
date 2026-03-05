import type { GroupMember, Profile } from "@mooch/types";
import { MemberRow } from "./MemberRow";

type MemberListProps = {
  members: (GroupMember & { profile: Profile })[];
  currentUserId?: string;
  isAdmin?: boolean;
  onToggleRole?: (member: GroupMember & { profile: Profile }) => void;
  onRemove?: (member: GroupMember & { profile: Profile }) => void;
};

export function MemberList({
  members,
  currentUserId,
  isAdmin,
  onToggleRole,
  onRemove,
}: MemberListProps) {
  return (
    <div className="space-y-2">
      {members.map((member) => (
        <MemberRow
          key={member.user_id}
          member={member}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onToggleRole={onToggleRole}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
