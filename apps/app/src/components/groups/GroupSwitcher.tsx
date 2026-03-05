"use client";

import { useGroupStore } from "@mooch/stores";
import { Button, cn } from "@mooch/ui";
import Link from "next/link";
import { useEffect } from "react";
import { GroupIcon } from "./group-icon";
import type { GroupSummary } from "./types";

type GroupSwitcherProps = {
  groups: GroupSummary[];
  onCreateClick?: () => void;
  className?: string;
};

export function GroupSwitcher({
  groups,
  onCreateClick,
  className,
}: GroupSwitcherProps) {
  const activeGroupId = useGroupStore((state) => state.activeGroupId);
  const setGroups = useGroupStore((state) => state.setGroups);
  const setActiveGroup = useGroupStore((state) => state.setActiveGroup);

  useEffect(() => {
    setGroups(groups);

    if (groups.length === 0) {
      setActiveGroup(null);
      return;
    }

    const hasActive = activeGroupId
      ? groups.some((group) => group.id === activeGroupId)
      : false;

    if (!hasActive) {
      setActiveGroup(groups[0]?.id ?? null);
    }
  }, [groups, activeGroupId, setGroups, setActiveGroup]);

  if (groups.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex w-full items-center gap-2 overflow-x-auto rounded-xl border border-[#EDE3DA] bg-[#F8F6F1] p-2",
        className,
      )}
    >
      {groups.map((group) => {
        const isActive = group.id === activeGroupId;

        return (
          <Link
            key={group.id}
            href={`/groups/${group.id}`}
            onClick={() => setActiveGroup(group.id)}
            className={cn(
              "inline-flex max-w-[200px] shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-medium font-sans",
              "border transition-colors duration-150",
              isActive
                ? "border-[#5A9629] text-[#F4FBFF] bg-[var(--action-gradient)]"
                : "border-[#D8C8BC] bg-[#FFFFFF] text-[#4D6480] hover:bg-[#F7F4EF]",
            )}
          >
            <span className="grid h-4 w-4 place-items-center leading-none">
              <GroupIcon value={group.emoji} size={14} />
            </span>
            <span className="truncate">{group.name}</span>
          </Link>
        );
      })}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="shrink-0"
        onClick={onCreateClick}
      >
        +
      </Button>
    </div>
  );
}
