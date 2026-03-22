"use client";

import type { PlanWithDetails } from "@mooch/stores";
import { Avatar, Text } from "@mooch/ui";
import { Calendar, Camera, GripVertical, Mic } from "lucide-react";
import { useRef } from "react";

type Props = {
  plan: PlanWithDetails;
  onClick: () => void;
  isDragging: boolean;
};

export function PlanCard({ plan, onClick, isDragging }: Props) {
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);
  const photoCount = plan.attachments.filter(
    (attachment) => attachment.type === "photo",
  ).length;
  const voiceCount = plan.attachments.filter(
    (attachment) => attachment.type === "voice",
  ).length;
  const isDone = plan.status === "done";

  const formattedDate = plan.date
    ? new Date(plan.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
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
      className={`w-full rounded-[1.6rem] border bg-[var(--color-surface)] p-4 text-left transition-[border-color,box-shadow,opacity,transform] duration-150 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      style={{
        background: isDone
          ? "linear-gradient(180deg, rgba(150, 145, 138, 0.08) 0%, rgba(253, 252, 251, 0.92) 100%)"
          : "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, var(--color-surface) 100%)",
        borderColor: isDragging
          ? "rgba(214, 170, 105, 0.48)"
          : "var(--color-edge)",
        boxShadow: isDragging
          ? "0 18px 38px rgba(46, 35, 24, 0.14)"
          : "0 1px 0 rgba(255, 255, 255, 0.72) inset, 0 10px 22px rgba(132, 102, 79, 0.08)",
        opacity: isDone ? 0.72 : 1,
        transform: isDragging ? "rotate(1deg)" : undefined,
      }}
    >
      <div className="min-w-0 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <Text
            variant="body"
            className="font-medium leading-tight line-clamp-2"
            color={isDone ? "subtle" : "default"}
          >
            {plan.title}
          </Text>

          <span className="mt-0.5 inline-flex shrink-0 items-center justify-center rounded-full border border-[var(--color-edge-subtle)] bg-[rgba(255,255,255,0.82)] p-1 text-[var(--color-ink-placeholder)]">
            <GripVertical className="h-3.5 w-3.5" />
          </span>
        </div>

        {plan.description && (
          <Text
            variant="caption"
            color="subtle"
            className="line-clamp-2 leading-5"
          >
            {plan.description}
          </Text>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {formattedDate && (
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-edge)] bg-[rgba(255,255,255,0.7)] px-2.5 py-1 text-[11px] text-[var(--color-ink-sub)]">
            <Calendar className="h-3.5 w-3.5" />
            {formattedDate}
          </span>
        )}

        {photoCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-ink-sub)]">
            <Camera className="h-3.5 w-3.5" />
            {photoCount}
          </span>
        )}

        {voiceCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-ink-sub)]">
            <Mic className="h-3.5 w-3.5" />
            {voiceCount}
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
    </button>
  );
}
