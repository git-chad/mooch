"use client";

import type { PlanStatus } from "@mooch/types";
import { Button, Input, Sheet, Text } from "@mooch/ui";
import { useEffect, useState, useTransition } from "react";
import { createPlan } from "@/app/actions/plans";
import { PLAN_STATUS_CONFIG } from "./plan-status";

type Props = {
  open: boolean;
  onClose: () => void;
  groupId: string;
  initialStatus: PlanStatus;
};

export function CreatePlanSheet({
  open,
  onClose,
  groupId,
  initialStatus,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<PlanStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setStatus(initialStatus);
    }
  }, [initialStatus, open]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate("");
    setStatus(initialStatus);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
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
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          resetForm();
          onClose();
        }
      }}
      title="New Plan"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Title"
          id="plan-title"
          placeholder="What's the plan?"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          autoFocus
          required
        />

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="plan-description"
            className="text-xs font-medium text-ink-label font-sans select-none"
          >
            Description
          </label>
          <textarea
            id="plan-description"
            placeholder="Add context, timing, or who should take the lead."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="w-full resize-none rounded-[14px] border border-edge bg-surface px-3.5 py-2.5 text-sm font-sans text-ink placeholder:text-ink-placeholder outline-none shadow-[inset_0_2px_0_rgba(132,100,79,0.07)] focus:border-accent focus:ring-2 focus:ring-accent/15 focus:ring-offset-0 focus:-translate-y-px transition-[border-color,box-shadow,transform] duration-120"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="plan-date"
            className="text-xs font-medium text-ink-label font-sans select-none"
          >
            Date
          </label>
          <input
            id="plan-date"
            type="datetime-local"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="w-full rounded-[14px] border border-edge bg-surface px-3.5 py-2.5 text-sm font-sans text-ink outline-none shadow-[inset_0_2px_0_rgba(132,100,79,0.07)] focus:border-accent focus:ring-2 focus:ring-accent/15 focus:ring-offset-0 focus:-translate-y-px transition-[border-color,box-shadow,transform] duration-120"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Text variant="label">Status</Text>
          <div className="grid grid-cols-2 gap-1.5 rounded-[14px] border border-edge bg-[#F7F2ED] p-1.5">
            {PLAN_STATUS_CONFIG.map((option) => {
              const Icon = option.icon;
              const isActive = status === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setStatus(option.id)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-[10px] px-3 py-2 text-xs font-medium transition-all"
                  style={{
                    background: isActive
                      ? "rgba(255,255,255,0.92)"
                      : "transparent",
                    boxShadow: isActive
                      ? "0 1px 3px rgba(132,102,79,0.12), 0 1px 0 rgba(255,255,255,0.7) inset"
                      : "none",
                    color: isActive
                      ? "var(--color-ink)"
                      : "var(--color-ink-sub)",
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {option.shortTitle}
                </button>
              );
            })}
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={!title.trim() || isPending}
          className="mt-2"
        >
          {isPending ? "Creating..." : "Create plan"}
        </Button>
      </form>
    </Sheet>
  );
}
