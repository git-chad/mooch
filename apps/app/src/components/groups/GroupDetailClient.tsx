"use client";

import { Tooltip } from "@base-ui-components/react";
import { Button } from "@mooch/ui";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { GroupIcon } from "./group-icon";
import { InviteSheet } from "./InviteSheet";
import { MemberList } from "./MemberList";
import type { GroupWithMembers } from "./types";
import { Settings } from "lucide-react";

type GroupDetailClientProps = {
  group: GroupWithMembers;
  currentUserId: string;
};

const NAV_TABS = [
  { label: "Overview", slug: "" },
  { label: "Expenses", slug: "expenses" },
  { label: "Polls", slug: "polls" },
  { label: "Plans", slug: "plans" },
  { label: "Feed", slug: "feed" },
  { label: "Events", slug: "events" },
  { label: "Insights", slug: "insights" },
] as const;

const ENABLED_SLUGS = new Set([""]);

export function GroupDetailClient({
  group,
  currentUserId,
}: GroupDetailClientProps) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const pathname = usePathname();

  const activeSlug = useMemo(() => {
    const after = pathname.replace(`/${group.id}`, "").replace(/^\//, "");
    return after;
  }, [pathname, group.id]);

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

      <nav className="flex items-center gap-0.5 overflow-x-auto rounded-[14px] border border-edge-subtle bg-[#F2EDE7] p-1">
        {NAV_TABS.map((tab) => {
          const isActive = activeSlug === tab.slug;
          const isEnabled = ENABLED_SLUGS.has(tab.slug);
          const href = tab.slug ? `/${group.id}/${tab.slug}` : `/${group.id}`;

          return (
            <div key={tab.label} className="relative shrink-0">
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute inset-0 rounded-[10px] bg-surface"
                  style={{
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.8), 0 2px 0 rgba(200,184,168,0.45), 0 1px 3px rgba(0,0,0,0.07)",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              {isEnabled ? (
                <Link
                  href={href}
                  className={[
                    "relative z-10 block rounded-[10px] px-3.5 py-1.5 text-xs font-medium font-sans transition-colors duration-150",
                    isActive ? "text-ink" : "text-ink-sub hover:text-ink-label",
                  ].join(" ")}
                >
                  {tab.label}
                </Link>
              ) : (
                <span className="relative z-10 block rounded-[10px] px-3.5 py-1.5 text-xs font-medium font-sans text-ink-placeholder cursor-default select-none">
                  {tab.label}
                </span>
              )}
            </div>
          );
        })}

        {/* Spacer pushes settings to the right */}
        <div className="flex-1" />

        {/* Settings — cog icon with tooltip */}
        <div className="relative shrink-0">
          {activeSlug === "settings" && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute inset-0 rounded-[10px] bg-surface"
              style={{
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.8), 0 2px 0 rgba(200,184,168,0.45), 0 1px 3px rgba(0,0,0,0.07)",
              }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            />
          )}
          <Tooltip.Root>
            <Tooltip.Trigger
              render={
                <Link
                  href={`/groups/${group.id}/settings`}
                  className={[
                    "relative z-10 flex items-center justify-center rounded-[10px] w-8 h-8 transition-colors duration-150",
                    activeSlug === "settings"
                      ? "text-ink"
                      : "text-ink-sub hover:text-ink-label",
                  ].join(" ")}
                  aria-label="Settings"
                >
                  <Settings size={16} className="shrink-0" />
                </Link>
              }
            />
            <Tooltip.Portal>
              <Tooltip.Positioner sideOffset={6}>
                <Tooltip.Popup className="avatar-tooltip">
                  Settings
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>
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
