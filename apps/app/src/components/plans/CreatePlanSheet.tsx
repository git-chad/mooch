"use client";

import type { PlanStatus } from "@mooch/types";
import { Button, Input, Sheet, Text } from "@mooch/ui";
import { useState, useTransition } from "react";
import { createPlan } from "@/app/actions/plans";

type Props = {
    open: boolean;
    onClose: () => void;
    groupId: string;
    initialStatus: PlanStatus;
};

const STATUS_OPTIONS: { value: PlanStatus; label: string; emoji: string }[] = [
    { value: "ideas", label: "Ideas", emoji: "💡" },
    { value: "to_plan", label: "To Plan", emoji: "📋" },
    { value: "upcoming", label: "Upcoming", emoji: "📅" },
    { value: "done", label: "Done", emoji: "✅" },
];

export function CreatePlanSheet({ open, onClose, groupId, initialStatus }: Props) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [status, setStatus] = useState<PlanStatus>(initialStatus);
    const [isPending, startTransition] = useTransition();

    // Reset when initialStatus changes
    const resetForm = () => {
        setTitle("");
        setDescription("");
        setDate("");
        setStatus(initialStatus);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        startTransition(async () => {
            const result = await createPlan(groupId, {
                title: title.trim(),
                description: description.trim() || undefined,
                date: date || null,
                status,
            });

            if ("error" in result) {
                console.error("Failed to create plan:", result.error);
                return;
            }

            resetForm();
            onClose();
        });
    };

    return (
        <Sheet
            open={open}
            onOpenChange={(val) => {
                if (!val) {
                    resetForm();
                    onClose();
                }
            }}
            title="New Plan"
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Title */}
                <div>
                    <label htmlFor="plan-title" className="block mb-1">
                        <Text variant="label">Title *</Text>
                    </label>
                    <Input
                        id="plan-title"
                        placeholder="What's the plan?"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        autoFocus
                        required
                    />
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="plan-description" className="block mb-1">
                        <Text variant="label">Description</Text>
                    </label>
                    <textarea
                        id="plan-description"
                        placeholder="Add some details..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 resize-none"
                    />
                </div>

                {/* Date */}
                <div>
                    <label htmlFor="plan-date" className="block mb-1">
                        <Text variant="label">Date (optional)</Text>
                    </label>
                    <input
                        id="plan-date"
                        type="datetime-local"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                    />
                </div>

                {/* Column selector */}
                <div>
                    <Text variant="label" className="block mb-2">
                        Column
                    </Text>
                    <div className="flex gap-2 flex-wrap">
                        {STATUS_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setStatus(opt.value)}
                                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${status === opt.value
                                        ? "bg-amber-100 text-amber-800 ring-2 ring-amber-300/60"
                                        : "bg-stone-100 text-stone-600 hover:bg-stone-200/80"
                                    }
                `}
                            >
                                <span>{opt.emoji}</span>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Submit */}
                <Button
                    type="submit"
                    variant="primary"
                    disabled={!title.trim() || isPending}
                    className="mt-2"
                >
                    {isPending ? "Creating..." : "Create Plan"}
                </Button>
            </form>
        </Sheet>
    );
}
