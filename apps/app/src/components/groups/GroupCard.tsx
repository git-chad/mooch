import { Badge, cn } from "@mooch/ui";
import Link from "next/link";
import { GroupIcon } from "./group-icon";
import type { GroupSummary } from "./types";

type GroupCardProps = {
  group: GroupSummary;
  className?: string;
};

export function GroupCard({ group, className }: GroupCardProps) {
  return (
    <Link
      href={`/groups/${group.id}`}
      className={cn(
        "block rounded-2xl border border-[#EDE3DA] bg-[#FDFCFB] p-4 shadow-[var(--shadow-elevated)]",
        "transition-transform duration-150 hover:-translate-y-px active:translate-y-px",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl border border-[#D8C8BC] bg-[#F8F6F1] text-2xl text-[#4A3728]">
            <GroupIcon value={group.emoji} size={22} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-[#1F2A23] font-sans">
              {group.name}
            </h3>
            <p className="mt-1 text-xs text-[#6F859B] font-sans">
              {group.memberCount} member{group.memberCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <Badge label={group.currency} size="sm" color="#6AAE35" />
      </div>
    </Link>
  );
}
