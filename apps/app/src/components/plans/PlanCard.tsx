"use client";

import type { PlanWithDetails } from "@mooch/stores";
import { Avatar, Text } from "@mooch/ui";
import { Calendar, ExternalLink } from "lucide-react";
import { useRef } from "react";

type Props = {
  groupId: string;
  plan: PlanWithDetails;
  onClick: () => void;
  isDragging: boolean;
};

export function PlanCard({ groupId, plan, onClick, isDragging }: Props) {
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);
  const isDone = plan.status === "done";

  const formattedDate = plan.date
    ? new Date(plan.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;
  const createEventHref =
    plan.status === "done"
      ? `/${groupId}/events/new?from_plan=${plan.id}`
      : null;

  const hasMetadata = formattedDate || plan.organizer;

  return (
    <div
      className={`group/card relative w-full rounded-[14px] border text-left transition-[border-color,box-shadow,opacity,transform] duration-150 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      style={{
        background: isDone
          ? "linear-gradient(180deg, rgba(150, 145, 138, 0.06) 0%, rgba(253, 252, 251, 0.92) 100%)"
          : "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, var(--color-surface) 100%)",
        borderColor: isDragging
          ? "rgba(214, 170, 105, 0.48)"
          : "var(--color-edge)",
        boxShadow: isDragging
          ? "0 18px 38px rgba(46, 35, 24, 0.14)"
          : "0 1px 0 rgba(255, 255, 255, 0.72) inset, 0 10px 22px rgba(132, 102, 79, 0.08)",
        opacity: isDone ? 0.72 : 1,
        transform: "none",
      }}
    >
      <button
        type="button"
        onPointerDown={(event) => {
          pointerDownRef.current = { x: event.clientX, y: event.clientY };
        }}
        onClick={(event) => {
          const start = pointerDownRef.current;
          if (start) {
            const dx = Math.abs(event.clientX - start.x);
            const dy = Math.abs(event.clientY - start.y);
            if (dx > 4 || dy > 4) {
              return;
            }
          }
          onClick();
        }}
        className="absolute inset-0 rounded-[14px]"
        aria-label={`Open ${plan.title}`}
      />

      {createEventHref && (
        <a
          href={createEventHref}
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.stopPropagation();
          }}
          className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-1.5 rounded-[10px] border border-[var(--color-edge)] bg-[rgba(255,255,255,0.94)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-ink-label)] opacity-0 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_4px_8px_rgba(132,102,79,0.1)] transition-opacity hover:bg-white group-hover/card:opacity-100 group-focus-within/card:opacity-100"
        >
          <ExternalLink className="h-3 w-3" />
          Create event
        </a>
      )}

      <div className="pointer-events-none relative z-10 min-w-0 p-3.5">
        <Text
          variant="body"
          className="font-medium leading-tight line-clamp-2"
          color={isDone ? "subtle" : "default"}
        >
          {plan.title}
        </Text>

        {plan.description && (
          <Text
            variant="caption"
            color="subtle"
            className="mt-2 line-clamp-2 leading-5"
          >
            {plan.description}
          </Text>
        )}

        {hasMetadata && (
          <div className="mt-3 flex items-center gap-2">
            {formattedDate && (
              <span className="inline-flex items-center gap-1 rounded-[8px] border border-[var(--color-edge)] bg-[rgba(255,255,255,0.7)] px-2 py-0.5 text-[11px] text-[var(--color-ink-sub)]">
                <Calendar className="h-3 w-3" />
                {formattedDate}
              </span>
            )}

            <span className="flex-1" />

            {plan.organizer && (
              <Avatar
                src={plan.organizer.photo_url}
                name={plan.organizer.display_name}
                size="sm"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
