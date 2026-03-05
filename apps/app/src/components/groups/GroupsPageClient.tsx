"use client";

import { Button } from "@mooch/ui";
import { useState } from "react";
import { CreateGroupModal } from "./CreateGroupModal";
import { GroupCard } from "./GroupCard";
import { JoinGroupModal } from "./JoinGroupModal";
import type { GroupSummary } from "./types";

type GroupsPageClientProps = {
  groups: GroupSummary[];
};

export function GroupsPageClient({ groups }: GroupsPageClientProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold text-[#1F2A23] font-sans">
          Your squads
        </h1>
        <p className="text-sm text-[#6F859B] font-sans">
          Create a squad or jump into one with an invite code.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
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

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D8C8BC] bg-[#FDFCFB] px-6 py-14 text-center shadow-[var(--shadow-elevated)]">
          <p className="text-lg font-medium text-[#4A3728] font-sans">
            You&apos;re not in any squads yet
          </p>
          <p className="mt-2 text-sm text-[#7A6E65] font-sans">
            Start one now or join with an invite code.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}

      <CreateGroupModal open={createOpen} onOpenChange={setCreateOpen} />
      <JoinGroupModal open={joinOpen} onOpenChange={setJoinOpen} />
    </section>
  );
}
