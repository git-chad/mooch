"use client";

import { useGroupStore } from "@mooch/stores";
import { Avatar, cn } from "@mooch/ui";
import {
  BarChart2,
  Calendar,
  Camera,
  Home,
  LayoutGrid,
  Receipt,
  Settings,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CreateGroupModal } from "@/components/groups/CreateGroupModal";
import { GroupIcon } from "@/components/groups/group-icon";
import { JoinGroupModal } from "@/components/groups/JoinGroupModal";

type SidebarProfile = {
  display_name: string;
  photo_url: string | null;
} | null;

type SidebarProps = {
  className?: string;
  profile: SidebarProfile;
};

const NAV_ITEMS = [
  { label: "Overview", icon: Home, path: "" },
  { label: "Feed", icon: Camera, path: "/feed" },
  { label: "Expenses", icon: Receipt, path: "/expenses" },
  { label: "Polls", icon: BarChart2, path: "/polls" },
  { label: "Plans", icon: LayoutGrid, path: "/plans" },
  { label: "Events", icon: Calendar, path: "/events" },
  { label: "Insights", icon: Sparkles, path: "/insights" },
] as const;

export function Sidebar({ className, profile }: SidebarProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const groups = useGroupStore((state) => state.groups);
  const activeGroupId = useGroupStore((state) => state.activeGroupId);
  const setActiveGroup = useGroupStore((state) => state.setActiveGroup);
  const pathname = usePathname();

  return (
    <>
      <aside
        className={cn(
          "flex flex-col h-full border-r border-[#EDE3DA] bg-[#FDFCFB]",
          className,
        )}
      >
        {/* Logo */}
        <div className="shrink-0 px-5 py-4">
          <Link
            href="/"
            className="text-sm font-semibold tracking-wide text-[#1F2A23] font-sans"
          >
            mooch
          </Link>
        </div>

        {/* Squads section */}
        <div className="shrink-0 px-3 pb-2">
          <p className="px-2 mb-1.5 text-[10px] font-semibold tracking-widest text-[#A19184] uppercase font-sans">
            Squads
          </p>

          <div className="space-y-0.5 max-h-40 overflow-y-auto">
            {groups.map((group) => {
              const isActive = group.id === activeGroupId;
              return (
                <Link
                  key={group.id}
                  href={`/${group.id}`}
                  onClick={() => setActiveGroup(group.id)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium font-sans transition-colors",
                    isActive
                      ? "bg-[#F1F9E8] text-[#2D5A0E]"
                      : "text-[#4A3728] hover:bg-[#F8F4EF]",
                  )}
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-[#D8C8BC] bg-[#F8F6F1] text-xs">
                    <GroupIcon value={group.emoji} size={14} />
                  </span>
                  <span className="truncate">{group.name}</span>
                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[#5A9629]" />
                  )}
                </Link>
              );
            })}

            {groups.length === 0 && (
              <p className="px-2 py-2 text-xs text-[#A19184] font-sans">
                No squads yet
              </p>
            )}
          </div>

          <div className="mt-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-dashed border-[#C8BAB0] px-2 py-1.5 text-xs text-[#8C7463] hover:bg-[#F8F4EF] hover:text-[#4A3728] transition-colors font-sans"
            >
              <span className="text-sm leading-none">+</span>
              Create
            </button>
            <button
              type="button"
              onClick={() => setJoinOpen(true)}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-dashed border-[#C8BAB0] px-2 py-1.5 text-xs text-[#8C7463] hover:bg-[#F8F4EF] hover:text-[#4A3728] transition-colors font-sans"
            >
              Join
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-3 my-1 h-px bg-[#EDE3DA]" />

        {/* This Squad nav */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {activeGroupId && (
            <p className="px-2 mb-1.5 text-[10px] font-semibold tracking-widest text-[#A19184] uppercase font-sans">
              This Squad
            </p>
          )}

          <nav className="space-y-0.5">
            {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
              const href = activeGroupId ? `/${activeGroupId}${path}` : null;
              const isActive = href
                ? path === ""
                  ? pathname === href
                  : pathname.startsWith(href)
                : false;

              if (!href) {
                return (
                  <span
                    key={label}
                    aria-disabled="true"
                    className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium font-sans text-[#C8BAB0] pointer-events-none select-none"
                  >
                    <Icon size={16} className="shrink-0" />
                    {label}
                  </span>
                );
              }

              return (
                <Link
                  key={label}
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium font-sans transition-colors",
                    isActive
                      ? "bg-[#F1F9E8] text-[#2D5A0E]"
                      : "text-[#4A3728] hover:bg-[#F8F4EF]",
                  )}
                >
                  <Icon size={16} className="shrink-0" />
                  {label}
                </Link>
              );
            })}

            {activeGroupId && (
              <Link
                href={`/groups/${activeGroupId}/settings`}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium font-sans transition-colors",
                  pathname === `/groups/${activeGroupId}/settings`
                    ? "bg-[#F1F9E8] text-[#2D5A0E]"
                    : "text-[#4A3728] hover:bg-[#F8F4EF]",
                )}
              >
                <Settings size={16} className="shrink-0" />
                Settings
              </Link>
            )}
          </nav>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[#EDE3DA] px-3 py-3">
          <Link
            href="/profile"
            className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium font-sans text-[#4A3728] hover:bg-[#F8F4EF] transition-colors"
          >
            <Avatar
              name={profile?.display_name ?? "User"}
              src={profile?.photo_url}
              size="sm"
              tooltip={false}
            />
            <span className="truncate">{profile?.display_name ?? "Profile"}</span>
          </Link>
        </div>
      </aside>

      <CreateGroupModal open={createOpen} onOpenChange={setCreateOpen} />
      <JoinGroupModal open={joinOpen} onOpenChange={setJoinOpen} />
    </>
  );
}
