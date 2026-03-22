"use client";

import type { PlanWithDetails } from "@mooch/stores";
import { Avatar, Badge, Text } from "@mooch/ui";
import { Calendar, Camera, Mic } from "lucide-react";
import { PLAN_STATUS_MAP } from "./plan-status";

type Props = {
  plan: PlanWithDetails;
  onClick: () => void;
  isDragging: boolean;
};

export function PlanCard({ plan, onClick, isDragging }: Props) {
  const photoCount = plan.attachments.filter((attachment) => attachment.type === "photo").length;
  const voiceCount = plan.attachments.filter((attachment) => attachment.type === "voice").length;
  const status = PLAN_STATUS_MAP[plan.status];
  const StatusIcon = status.icon;
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
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left transition-all duration-150 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      style={{
        background: isDone ? "rgba(150, 145, 138, 0.08)" : "var(--color-surface)",
        borderColor: isDragging ? "rgba(214, 170, 105, 0.48)" : "var(--color-edge)",
        boxShadow: isDragging
          ? "0 12px 24px rgba(46, 35, 24, 0.1)"
          : "0 1px 0 rgba(0, 0, 0, 0.02)",
        opacity: isDone ? 0.72 : 1,
      }}
    >
      <div className="min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <Badge label={status.shortTitle} size="sm" />
          <div className="inline-flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
            <StatusIcon className="h-3.5 w-3.5" />
            Status
          </div>
        </div>

        <Text
          variant="body"
          className="font-medium leading-tight line-clamp-2"
          color={isDone ? "subtle" : "default"}
        >
          {plan.title}
        </Text>

        {plan.description && (
          <Text variant="caption" color="subtle" className="line-clamp-2">
            {plan.description}
          </Text>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {formattedDate && (
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-edge)] bg-[var(--color-surface-secondary)] px-2 py-1 text-[11px] text-[var(--color-text-muted)]">
            <Calendar className="h-3.5 w-3.5" />
            {formattedDate}
          </span>
        )}

        {photoCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
            <Camera className="h-3.5 w-3.5" />
            {photoCount}
          </span>
        )}

        {voiceCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
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
