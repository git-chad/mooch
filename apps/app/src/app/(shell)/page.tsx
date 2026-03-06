"use client";

import { useGroupStore } from "@mooch/stores";
import { Button, Container, Text } from "@mooch/ui";
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
        <Text variant="title" className="mb-2">
          No squads yet
        </Text>
        <Text variant="body" color="subtle" className="mb-8">
          Create a squad or join one with an invite code.
        </Text>
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
    <Container className="py-4 sm:py-6">
      <div className="col-span-6 sm:col-span-12 mx-auto w-full max-w-5xl space-y-6">
        <header className="space-y-1">
          <Text variant="title">Your squads</Text>
          <Text variant="body" color="subtle">
            Pick a squad from the list to get started.
          </Text>
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
                <Text variant="body" className="truncate font-semibold">
                  {group.name}
                </Text>
                <Text variant="caption" color="subtle">
                  {group.currency}
                </Text>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Container>
  );
}
