"use client";

import { Button, Select, Sheet, Text } from "@mooch/ui";
import { MessageSquareText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FeedLinkOption } from "./types";

const TEXT_MAX_CHARS = 500;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  posting: boolean;
  pollOptions: FeedLinkOption[];
  expenseOptions: FeedLinkOption[];
  onSubmit: (data: {
    caption: string;
    linked_expense_id: string | null;
    linked_poll_id: string | null;
  }) => Promise<boolean>;
};

export function PostTextSheet({
  open,
  onOpenChange,
  posting,
  pollOptions,
  expenseOptions,
  onSubmit,
}: Props) {
  const [text, setText] = useState("");
  const [linkedPoll, setLinkedPoll] = useState<string>("");
  const [linkedExpense, setLinkedExpense] = useState<string>("");

  useEffect(() => {
    if (!open) {
      setText("");
      setLinkedPoll("");
      setLinkedExpense("");
    }
  }, [open]);

  const trimmed = useMemo(() => text.trim(), [text]);
  const disabled = posting || trimmed.length === 0;

  async function handleSubmit() {
    if (disabled) return;

    await onSubmit({
      caption: trimmed,
      linked_expense_id: linkedExpense || null,
      linked_poll_id: linkedPoll || null,
    });
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Drop text"
      description="Quick thought, hot take, or squad update."
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-[#E5D8CC] bg-[#FCF9F6] p-3">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#DCCBC0] bg-[#F8F2EC] px-2.5 py-1">
            <MessageSquareText className="h-3.5 w-3.5 text-[#7B6556]" />
            <Text variant="caption" className="font-medium text-[#7B6556]">
              Text post
            </Text>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={TEXT_MAX_CHARS}
            rows={5}
            placeholder="Say it exactly how it happened..."
            className="w-full rounded-xl border border-[#DECFC2] bg-[#FFFEFD] px-3 py-2.5 text-[14px] leading-relaxed text-ink outline-none transition-colors placeholder:text-[#AF9F93] focus:border-[#93BB6D]"
          />

          <div className="mt-2 flex justify-end">
            <Text
              variant="caption"
              color={text.length > TEXT_MAX_CHARS - 40 ? "danger" : "subtle"}
              className="tabular-nums"
            >
              {text.length}/{TEXT_MAX_CHARS}
            </Text>
          </div>
        </div>

        <LinkSelectors
          linkedExpense={linkedExpense}
          linkedPoll={linkedPoll}
          setLinkedExpense={setLinkedExpense}
          setLinkedPoll={setLinkedPoll}
          expenseOptions={expenseOptions}
          pollOptions={pollOptions}
        />

        <Button
          type="button"
          variant="primary"
          className="w-full"
          loading={posting}
          disabled={disabled}
          onClick={handleSubmit}
        >
          {posting ? "Posting…" : "Post to feed"}
        </Button>
      </div>
    </Sheet>
  );
}

function LinkSelectors({
  linkedExpense,
  linkedPoll,
  setLinkedExpense,
  setLinkedPoll,
  expenseOptions,
  pollOptions,
}: {
  linkedExpense: string;
  linkedPoll: string;
  setLinkedExpense: (value: string) => void;
  setLinkedPoll: (value: string) => void;
  expenseOptions: FeedLinkOption[];
  pollOptions: FeedLinkOption[];
}) {
  const expenseSelectOptions = useMemo(
    () => [
      { value: "", label: "None" },
      ...expenseOptions.map((option) => ({
        value: option.id,
        label: option.label,
      })),
    ],
    [expenseOptions],
  );

  const pollSelectOptions = useMemo(
    () => [
      { value: "", label: "None" },
      ...pollOptions.map((option) => ({
        value: option.id,
        label: option.label,
      })),
    ],
    [pollOptions],
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Select
        label="Link expense"
        value={linkedExpense}
        onValueChange={setLinkedExpense}
        options={expenseSelectOptions}
      />
      <Select
        label="Link poll"
        value={linkedPoll}
        onValueChange={setLinkedPoll}
        options={pollSelectOptions}
      />
    </div>
  );
}
