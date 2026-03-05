"use client";

import Link from "next/link";
import { useState } from "react";
import { CreateGroupModal } from "@/components/groups/CreateGroupModal";
import { GroupSwitcher } from "@/components/groups/GroupSwitcher";

export function ShellTopNav() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[#EDE3DA] bg-[#FDFCFB]/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/groups"
            className="shrink-0 text-sm font-semibold tracking-wide text-[#1F2A23] font-sans"
          >
            mooch
          </Link>

          <div className="min-w-0 flex-1">
            <GroupSwitcher
              className="w-full"
              onCreateClick={() => setCreateOpen(true)}
            />
          </div>

          <div className="shrink-0">
            <Link
              href="/profile"
              className="inline-flex items-center justify-center rounded-full border border-[#D8C8BC] bg-[#F1F9E8] px-3 py-2 text-xs font-medium text-[#4F7330] font-sans"
            >
              Profile
            </Link>
          </div>
        </div>
      </header>

      <CreateGroupModal open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
