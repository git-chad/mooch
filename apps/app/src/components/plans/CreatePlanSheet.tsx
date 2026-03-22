"use client";

import type { PlanStatus } from "@mooch/types";
import { Button, Input, Select, Sheet } from "@mooch/ui";
import type { SelectOption } from "@mooch/ui";
import { useEffect, useMemo, useState, useTransition } from "react";
import { createPlan } from "@/app/actions/plans";
import { DateTimePicker } from "@/components/shared/DateTimePicker";
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
  const [date, setDate] = useState<Date | null>(null);
  const [status, setStatus] = useState<PlanStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();

  const statusOptions: SelectOption[] = useMemo(
    () => PLAN_STATUS_CONFIG.map((s) => ({ value: s.id, label: s.title })),
    [],
  );

  useEffect(() => {
    if (open) {
      setStatus(initialStatus);
    }
  }, [initialStatus, open]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate(null);
    setStatus(initialStatus);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;

    startTransition(async () => {
      const result = await createPlan(groupId, {
        title: title.trim(),
        description: description.trim() || undefined,
        date: date ? date.toISOString() : null,
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

        <DateTimePicker
          label="Date"
          value={date}
          onChange={setDate}
          placeholder="Pick a date & time"
          minDate={new Date()}
        />

        <Select
          label="Status"
          options={statusOptions}
          value={status}
          onValueChange={(v) => setStatus(v as PlanStatus)}
        />

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
