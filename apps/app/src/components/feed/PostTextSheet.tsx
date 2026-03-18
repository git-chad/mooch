"use client";

import { Button, Sheet, Text } from "@mooch/ui";
import { MessageSquareText } from "lucide-react";
// biome-ignore lint/style/noRestrictedImports: useEffect needed for open-reset cleanup and autofocus timing — not mount-only.
import { useEffect, useMemo, useRef, useState } from "react";
import { LinkSelectors } from "./LinkSelectors";
import type { FeedLinkOption } from "./types";

const TEXT_MAX_CHARS = 500;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  posting: boolean;
  groupId: string;
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
  groupId,
  pollOptions,
  expenseOptions,
  onSubmit,
}: Props) {
  const [text, setText] = useState("");
  const [linkedPoll, setLinkedPoll] = useState<string>("");
  const [linkedExpense, setLinkedExpense] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) {
      setText("");
      setLinkedPoll("");
      setLinkedExpense("");
    }
  }, [open]);

  // Autofocus textarea when sheet opens
  useEffect(() => {
    if (open) {
      // Small delay to let the sheet animation start
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
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
        {/* Text area container — matches voice/photo container style */}
        <div className="rounded-xl border border-[#DCCBC0] bg-[#F8F4EE] p-4">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#E7D9CD] bg-[#FFFDFB] px-2.5 py-1">
            <MessageSquareText className="h-3.5 w-3.5 text-[#7B6556]" />
            <Text variant="caption" className="font-medium text-[#7B6556]">
              Text post
            </Text>
          </div>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={TEXT_MAX_CHARS}
            rows={5}
            placeholder="Say it exactly how it happened..."
            disabled={posting}
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

        {/* Link selectors */}
        <div className={posting ? "pointer-events-none opacity-75" : undefined}>
          <LinkSelectors
            groupId={groupId}
            linkedExpense={linkedExpense}
            linkedPoll={linkedPoll}
            setLinkedExpense={setLinkedExpense}
            setLinkedPoll={setLinkedPoll}
            expenseOptions={expenseOptions}
            pollOptions={pollOptions}
          />
        </div>

        {/* Post button */}
        <Button
          type="button"
          variant="primary"
          className="w-full [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1.5"
          loading={posting}
          disabled={disabled}
          onClick={handleSubmit}
        >
          {posting ? (
            <>
              <MessageSquareText className="h-3.5 w-3.5" />
              Posting...
            </>
          ) : (
            <>
              <MessageSquareText className="h-3.5 w-3.5" />
              Post to feed
            </>
          )}
        </Button>
      </div>
    </Sheet>
  );
}
