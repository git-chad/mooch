"use client";

import type { PlanWithDetails } from "@mooch/stores";
import { Avatar, Text } from "@mooch/ui";
import { Calendar, Camera, Mic } from "lucide-react";

type Props = {
    plan: PlanWithDetails;
    onClick: () => void;
    isDragging: boolean;
};

export function PlanCard({ plan, onClick, isDragging }: Props) {
    const photoCount = plan.attachments.filter((a) => a.type === "photo").length;
    const voiceCount = plan.attachments.filter((a) => a.type === "voice").length;

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
            className={`
        w-full text-left rounded-lg bg-white p-3 border border-stone-200/60
        hover:border-stone-300/80 transition-all duration-150 cursor-pointer
        ${isDragging ? "ring-2 ring-amber-300/60" : "hover:shadow-sm"}
      `}
        >
            {/* Title */}
            <Text variant="body" className="font-medium leading-tight mb-1 line-clamp-2">
                {plan.title}
            </Text>

            {/* Description preview */}
            {plan.description && (
                <Text variant="caption" color="subtle" className="line-clamp-2 mb-2">
                    {plan.description}
                </Text>
            )}

            {/* Metadata row */}
            <div className="flex items-center gap-2 flex-wrap mt-auto">
                {/* Date badge */}
                {formattedDate && (
                    <span className="inline-flex items-center gap-1 text-xs text-stone-500 bg-stone-100 rounded-md px-1.5 py-0.5">
                        <Calendar className="w-3 h-3" />
                        {formattedDate}
                    </span>
                )}

                {/* Attachment indicators */}
                {photoCount > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-stone-400">
                        <Camera className="w-3 h-3" />
                        {photoCount}
                    </span>
                )}
                {voiceCount > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-stone-400">
                        <Mic className="w-3 h-3" />
                        {voiceCount}
                    </span>
                )}

                {/* Spacer */}
                <span className="flex-1" />

                {/* Organizer avatar */}
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
