"use client";

import type { PlanWithDetails } from "@mooch/stores";
import { Avatar, Badge, Text } from "@mooch/ui";
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
  const createEventHref = isDone
    ? `/${groupId}/events/new?from_plan=${plan.id}`
    : null;

  const hasMetadata = formattedDate || plan.organizer;

  return (
    <div
      className={`group/card relative w-full rounded-[14px] border text-left transition-[border-color,box-shadow,transform] duration-150 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      style={{
        background: isDone
          ? "linear-gradient(165deg, rgba(240, 236, 232, 0.6) 0%, rgba(248, 245, 242, 0.85) 100%)"
          : "linear-gradient(165deg, rgba(255,255,255,0.96) 0%, var(--color-surface) 100%)",
        borderColor: isDragging
          ? "rgba(214, 170, 105, 0.48)"
          : "var(--color-edge)",
        boxShadow: isDragging
          ? "inset 0 1px 0 rgba(255,255,255,0.6), 0 18px 38px rgba(46, 35, 24, 0.16), 0 2px 0 rgba(200,180,160,0.2)"
          : "inset 0 1px 0 rgba(255,255,255,0.62), inset 0 -1px 2px rgba(0,0,0,0.03), 0 1px 0 rgba(200,180,160,0.18), 0 2px 5px rgba(132, 102, 79, 0.06)",
        opacity: isDone ? 0.65 : 1,
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
        className="absolute inset-0 rounded-[14px] transition-shadow duration-150 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.62),inset_0_-1px_2px_rgba(0,0,0,0.03),0_1px_0_rgba(200,180,160,0.18),0_4px_10px_rgba(132,102,79,0.1)]"
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
          className="absolute bottom-3 right-3 z-20 opacity-0 transition-opacity group-hover/card:opacity-100 group-focus-within/card:opacity-100"
        >
          <Badge
            label="Create event"
            icon={<ExternalLink className="h-3 w-3" />}
            variant="admin"
            size="sm"
          />
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
              <Badge
                label={formattedDate}
                icon={<Calendar className="h-3 w-3" />}
                variant="member"
                size="sm"
              />
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
