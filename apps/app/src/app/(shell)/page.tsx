"use client";

import { useGroupStore } from "@mooch/stores";
import { Button } from "@mooch/ui";
import Link from "next/link";
import { useState } from "react";
import { CreateGroupModal } from "@/components/groups/CreateGroupModal";
import { GroupIcon } from "@/components/groups/group-icon";
import { JoinGroupModal } from "@/components/groups/JoinGroupModal";

export default function DashboardPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const groups = useGroupStore((state) => state.groups);

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full py-24 px-6 text-center">
        <p className="text-4xl mb-4">🏕️</p>
        <h1 className="text-xl font-semibold text-[#1F2A23] font-sans mb-2">
          No squads yet
        </h1>
        <p className="text-sm text-[#8C7463] font-sans mb-8">
          Create a squad or join one with an invite code.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button
            type="button"
            variant="primary"
            onClick={() => setCreateOpen(true)}
          >
            Create a squad
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setJoinOpen(true)}
          >
            Join a squad
          </Button>
        </div>

        <CreateGroupModal open={createOpen} onOpenChange={setCreateOpen} />
        <JoinGroupModal open={joinOpen} onOpenChange={setJoinOpen} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-[#1F2A23] font-sans">
          Your squads
        </h1>
        <p className="text-sm text-[#8C7463] font-sans">
          Pick a squad from the list to get started.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <Link
            key={group.id}
            href={`/${group.id}`}
            className="flex items-center gap-3 rounded-2xl border border-[#EDE3DA] bg-[#FDFCFB] p-4 shadow-[var(--shadow-elevated)] hover:bg-[#F8F4EF] transition-colors"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[#D8C8BC] bg-[#F8F6F1] text-2xl">
              <GroupIcon value={group.emoji} size={24} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#1F2A23] font-sans">
                {group.name}
              </p>
              <p className="text-xs text-[#8C7463] font-sans">{group.currency}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
