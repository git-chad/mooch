"use client";

import { Button, Container, Text } from "@mooch/ui";
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
    <Container as="section" className="py-4 sm:py-6">
      <div className="col-span-6 sm:col-span-12 mx-auto w-full max-w-2xl space-y-6">
        <header className="space-y-3">
          <Text variant="title">Your squads</Text>
          <Text variant="body" color="subtle">
            Create a squad or jump into one with an invite code.
          </Text>
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
            <Text variant="body" className="font-medium text-[#4A3728]">
              You&apos;re not in any squads yet
            </Text>
            <Text variant="body" color="subtle" className="mt-2">
              Start one now or join with an invite code.
            </Text>
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
      </div>
    </Container>
  );
}
