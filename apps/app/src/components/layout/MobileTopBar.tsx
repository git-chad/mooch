"use client";

import { useGroupStore } from "@mooch/stores";
import { Avatar, Sheet, cn } from "@mooch/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GroupIcon } from "@/components/groups/group-icon";

type MobileTopBarProfile = {
  display_name: string;
  photo_url: string | null;
} | null;

type MobileTopBarProps = {
  className?: string;
  profile: MobileTopBarProfile;
};

export function MobileTopBar({ className, profile }: MobileTopBarProps) {
  const [groupPickerOpen, setGroupPickerOpen] = useState(false);
  const router = useRouter();

  const groups = useGroupStore((state) => state.groups);
  const activeGroupId = useGroupStore((state) => state.activeGroupId);
  const setActiveGroup = useGroupStore((state) => state.setActiveGroup);
  const activeGroup = groups.find((g) => g.id === activeGroupId);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 border-b border-[#EDE3DA] bg-[#FDFCFB]/95 backdrop-blur-sm",
          className,
        )}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={() => setGroupPickerOpen(true)}
            className="flex min-w-0 items-center gap-2"
          >
            {activeGroup ? (
              <>
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-[#D8C8BC] bg-[#F8F6F1] text-xs">
                  <GroupIcon value={activeGroup.emoji} size={14} />
                </span>
                <span className="truncate text-sm font-semibold text-[#1F2A23] font-sans">
                  {activeGroup.name}
                </span>
                <span className="shrink-0 text-[10px] text-[#A19184]">▾</span>
              </>
            ) : (
              <span className="text-sm font-semibold text-[#1F2A23] font-sans">
                mooch
              </span>
            )}
          </button>

          <Link href="/profile">
            <Avatar
              name={profile?.display_name ?? "User"}
              src={profile?.photo_url}
              size="sm"
              tooltip={false}
            />
          </Link>
        </div>
      </header>

      <Sheet
        open={groupPickerOpen}
        onOpenChange={setGroupPickerOpen}
        title="Your squads"
      >
        <div className="space-y-1">
          {groups.map((group) => {
            const isActive = group.id === activeGroupId;
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => {
                  setActiveGroup(group.id);
                  setGroupPickerOpen(false);
                  router.push(`/${group.id}`);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors",
                  isActive
                    ? "bg-[#F1F9E8] text-[#2D5A0E]"
                    : "text-[#4A3728] hover:bg-[#F8F4EF]",
                )}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#D8C8BC] bg-[#F8F6F1]">
                  <GroupIcon value={group.emoji} size={16} />
                </span>
                <span className="text-sm font-medium font-sans">
                  {group.name}
                </span>
                {isActive && (
                  <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-[#5A9629]" />
                )}
              </button>
            );
          })}

          {groups.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-[#A19184] font-sans">
              No squads yet
            </p>
          )}
        </div>
      </Sheet>
    </>
  );
}
