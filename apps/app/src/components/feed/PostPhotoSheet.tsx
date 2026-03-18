"use client";

import { Button, Sheet, Text } from "@mooch/ui";
import { Camera, ImagePlus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { LinkSelectors } from "./LinkSelectors";
import type { FeedLinkOption } from "./types";

const CAPTION_MAX = 200;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  posting: boolean;
  groupId: string;
  pollOptions: FeedLinkOption[];
  expenseOptions: FeedLinkOption[];
  onSubmit: (data: {
    file: File;
    caption: string;
    linked_expense_id: string | null;
    linked_poll_id: string | null;
    preview_url: string;
  }) => Promise<boolean>;
};

export function PostPhotoSheet({
  open,
  onOpenChange,
  posting,
  groupId,
  pollOptions,
  expenseOptions,
  onSubmit,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [linkedPoll, setLinkedPoll] = useState("");
  const [linkedExpense, setLinkedExpense] = useState("");

  useEffect(() => {
    if (!open) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(null);
      setPreviewUrl(null);
      setCaption("");
      setLinkedPoll("");
      setLinkedExpense("");
    }
  }, [open, previewUrl]);

  const canPost = useMemo(
    () => !posting && !!file && !!previewUrl,
    [posting, file, previewUrl],
  );

  function onFileChange(nextFile: File | null) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (!nextFile) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
  }

  async function handlePost() {
    if (!canPost || !file || !previewUrl) return;

    const success = await onSubmit({
      file,
      caption: caption.trim(),
      linked_expense_id: linkedExpense || null,
      linked_poll_id: linkedPoll || null,
      preview_url: previewUrl,
    });

    if (success) {
      setFile(null);
      setPreviewUrl(null);
      setCaption("");
      setLinkedPoll("");
      setLinkedExpense("");
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Post photo"
      description="Pick a shot, add context, and send it to the feed."
    >
      <div className="space-y-4">
        <label className="block rounded-xl border border-dashed border-[#D8C8BC] bg-[#FDF9F4] p-4">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            capture="environment"
            className="sr-only"
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          />

          {!previewUrl ? (
            <div className="grid place-items-center gap-2 py-6 text-center">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#DCCBC0] bg-[#F8F2EC] text-[#7C6758]">
                <ImagePlus className="h-4 w-4" />
              </span>
              <div>
                <Text variant="label" className="block">
                  Choose a photo
                </Text>
                <Text variant="caption" color="subtle" className="mt-1 block">
                  We&apos;re too lazy to add a camera input or some shit
                </Text>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative overflow-hidden rounded-xl border border-[#E6D8CD] bg-[#fff]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-[320px] w-full object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onFileChange(null);
                  }}
                  className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#DCCBC0] bg-[#F9F2EB]/95 text-[#7B6656]"
                  aria-label="Remove photo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#DCCBC0] bg-[#F8F2EC] px-2.5 py-1">
                <Camera className="h-3.5 w-3.5 text-[#7C6758]" />
                <Text variant="caption" className="font-medium text-[#7C6758]">
                  {file?.name ?? "Selected image"}
                </Text>
              </div>
            </div>
          )}
        </label>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Text variant="overline" color="subtle">
              Caption
            </Text>
            <Text
              variant="caption"
              color={caption.length > CAPTION_MAX - 30 ? "danger" : "subtle"}
              className="tabular-nums"
            >
              {caption.length}/{CAPTION_MAX}
            </Text>
          </div>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={CAPTION_MAX}
            rows={3}
            placeholder="Optional caption..."
            className="w-full rounded-xl border border-[#DECFC2] bg-[#FFFEFD] px-3 py-2.5 text-[14px] leading-relaxed text-ink outline-none transition-colors placeholder:text-[#AF9F93] focus:border-[#93BB6D]"
          />
        </div>

        <LinkSelectors
          groupId={groupId}
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
          disabled={!canPost}
          onClick={handlePost}
        >
          {posting ? "Posting…" : "Post photo"}
        </Button>
      </div>
    </Sheet>
  );
}
