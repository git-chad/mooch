"use client";

import { Button } from "@mooch/ui";
import Link from "next/link";
import { useMemo, useState } from "react";
import { GroupIcon } from "./group-icon";
import { InviteSheet } from "./InviteSheet";
import { MemberList } from "./MemberList";
import type { GroupWithMembers } from "./types";

type GroupDetailClientProps = {
  group: GroupWithMembers;
  currentUserId: string;
};

export function GroupDetailClient({
  group,
  currentUserId,
}: GroupDetailClientProps) {
  const [inviteOpen, setInviteOpen] = useState(false);

  const tabs = useMemo(
    () => [
      { label: "Overview", href: `/groups/${group.id}`, enabled: true },
      { label: "Expenses", enabled: false },
      { label: "Polls", enabled: false },
      { label: "Plans", enabled: false },
      { label: "Feed", enabled: false },
      { label: "Events", enabled: false },
      { label: "Insights", enabled: false },
      {
        label: "Settings",
        href: `/groups/${group.id}/settings`,
        enabled: true,
      },
    ],
    [group.id],
  );

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-[#EDE3DA] bg-[#FDFCFB] p-5 shadow-[var(--shadow-elevated)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-2xl border border-[#D8C8BC] bg-[#F8F6F1] text-3xl text-[#4A3728]">
            <GroupIcon value={group.emoji} size={30} />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold text-[#1F2A23] font-sans">
              {group.name}
            </h1>
            <p className="text-sm text-[#6F859B] font-sans">
              {group.members.length} member
              {group.members.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={() => setInviteOpen(true)}
        >
          Invite
        </Button>
      </header>

      <nav className="flex gap-2 overflow-x-auto rounded-xl border border-[#EDE3DA] bg-[#F8F6F1] p-2">
        {tabs.map((tab) =>
          tab.enabled && tab.href ? (
            <Link
              key={tab.label}
              href={tab.href}
              className={[
                "shrink-0 rounded-full border px-3 py-2 text-xs font-medium font-sans",
                tab.label === "Overview"
                  ? "border-[#5A9629] bg-[var(--action-gradient)] text-[#F4FBFF]"
                  : "border-[#D8C8BC] bg-[#FFFFFF] text-[#4D6480]",
              ].join(" ")}
            >
              {tab.label}
            </Link>
          ) : (
            <span
              key={tab.label}
              className="shrink-0 rounded-full border border-[#E5DED7] bg-[#F3EEE8] px-3 py-2 text-xs font-medium text-[#A19184] font-sans"
              aria-disabled="true"
            >
              {tab.label}
            </span>
          ),
        )}
      </nav>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-[#1F2A23] font-sans">
          Members
        </h2>
        <MemberList members={group.members} currentUserId={currentUserId} />
      </div>

      <InviteSheet
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        inviteCode={group.invite_code}
        groupName={group.name}
      />
    </section>
  );
}
