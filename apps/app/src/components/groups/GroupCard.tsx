import { Badge, cn } from "@mooch/ui";
import { ArrowUpRight, Users } from "lucide-react";
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
        "group block h-full rounded-2xl border border-[#E4D3C7] bg-[#FDFCFB] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_6px_14px_rgba(92,63,42,0.07)]",
        "transition-[border-color,box-shadow] duration-200 ease-out hover:border-[#D9C7BA] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_18px_rgba(92,63,42,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8FB2D4]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8F6F1]",
        className,
      )}
    >
      <div className="relative m-1 mb-4 aspect-[16/7] min-h-[6.5rem] overflow-hidden rounded-[12px] border border-[#E3D3C7] bg-[linear-gradient(120deg,#DCE6F2_0%,#E8EEF5_52%,#CCE5F3_100%)]">
        {group.cover_photo_url ? (
          // biome-ignore lint/performance/noImgElement: dynamic storage host may vary by env
          <img
            src={group.cover_photo_url}
            alt={`${group.name} cover`}
            className="h-full w-full object-cover object-[center_35%] transition-transform duration-300 ease-out group-hover:scale-[1.012]"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : null}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.40)_0%,transparent_42%)]" />
      </div>

      <div className="px-3.5 pb-3.5">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#D8C8BC] bg-[#F8F6F1] text-xl text-[#4A3728] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              <GroupIcon value={group.emoji} size={22} />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-[#1F2A23] font-sans leading-tight">
                {group.name}
              </h3>
              <div className="mt-1 inline-flex items-center gap-1 text-xs text-[#6F859B] font-sans">
                <Users className="h-3 w-3" />
                {group.memberCount} member{group.memberCount === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          <Badge label={group.currency} size="sm" color="#6AAE35" />
        </div>

        <div className="mt-auto border-t border-[#EEE3DA] pt-2">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#5E7288] transition-colors duration-150 ease-out group-hover:text-[#3D5876]">
            Open squad
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
