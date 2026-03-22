"use client";

import { Select, Text } from "@mooch/ui";
import { ArrowUpRight, X } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import type { FeedLinkOption } from "./types";

type Props = {
  groupId: string;
  linkedExpense: string;
  linkedPoll: string;
  setLinkedExpense: (value: string) => void;
  setLinkedPoll: (value: string) => void;
  expenseOptions: FeedLinkOption[];
  pollOptions: FeedLinkOption[];
};

export function LinkSelectors({
  groupId,
  linkedExpense,
  linkedPoll,
  setLinkedExpense,
  setLinkedPoll,
  expenseOptions,
  pollOptions,
}: Props) {
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

  const selectedExpense = expenseOptions.find((o) => o.id === linkedExpense);
  const selectedPoll = pollOptions.find((o) => o.id === linkedPoll);

  return (
    <div className="space-y-3">
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

      {(selectedExpense || selectedPoll) && (
        <div className="flex flex-wrap gap-2">
          {selectedExpense && (
            <LinkPill
              label={selectedExpense.label}
              href={`/${groupId}/expenses/${selectedExpense.tabId ?? ""}${selectedExpense.tabId ? `/${selectedExpense.id}` : ""}`}
              onRemove={() => setLinkedExpense("")}
            />
          )}
          {selectedPoll && (
            <LinkPill
              label={selectedPoll.label}
              href={`/${groupId}/polls#${selectedPoll.id}`}
              onRemove={() => setLinkedPoll("")}
            />
          )}
        </div>
      )}
    </div>
  );
}

function LinkPill({
  label,
  href,
  onRemove,
}: {
  label: string;
  href: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#D9CEC2] bg-[#F8F2EC] py-0.5 pl-2.5 pr-1">
      <Link
        href={href}
        className="inline-flex items-center gap-1 hover:underline"
      >
        <Text
          variant="caption"
          className="max-w-[18ch] truncate font-medium text-[#5A4A3C]"
        >
          {label}
        </Text>
        <ArrowUpRight className="h-3 w-3 text-[#7B6656]" />
      </Link>
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[#7B6656] hover:bg-[#EDE4DA]"
        aria-label={`Remove ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
