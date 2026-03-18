"use client";

import { Button, Sheet, Text } from "@mooch/ui";
import { Camera, Loader2, RefreshCw, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import * as React from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { getSurfaceTransition, motionDuration } from "@/lib/motion";
import { LinkSelectors } from "./LinkSelectors";
import { LocationInput } from "./LocationInput";
import type { MentionMember } from "./MentionInput";
import { MentionSuggestions, useMentionInput } from "./MentionInput";
import type { FeedLinkOption } from "./types";

const CAPTION_MAX = 200;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  posting: boolean;
  groupId: string;
  pollOptions: FeedLinkOption[];
  expenseOptions: FeedLinkOption[];
  members: MentionMember[];
  onSubmit: (data: {
    file: File;
    caption: string;
    linked_expense_id: string | null;
    linked_poll_id: string | null;
    location_name: string | null;
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
  members,
  onSubmit,
}: Props) {
  const reducedMotion = useReducedMotion() ?? false;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const mention = useMentionInput(caption, setCaption, members);
  const [linkedPoll, setLinkedPoll] = useState("");
  const [linkedExpense, setLinkedExpense] = useState("");
  const [locationName, setLocationName] = useState("");
  const [showLocation, setShowLocation] = useState(false);
  const [dragging, setDragging] = useState(false);

  React.useEffect(() => {
    if (!open) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(null);
      setPreviewUrl(null);
      setCaption("");
      setLinkedPoll("");
      setLinkedExpense("");
      setLocationName("");
      setShowLocation(false);
      setDragging(false);
      mention.reset();
    }
  }, [open, previewUrl, mention.reset]);

  const canPost = useMemo(
    () => !posting && !!file && !!previewUrl,
    [posting, file, previewUrl],
  );
  const phase = posting ? "posting" : previewUrl ? "selected" : "empty";
  const filenameLabel = useMemo(() => {
    if (!file?.name) return "Selected image";
    if (file.name.length <= 36) return file.name;
    const dot = file.name.lastIndexOf(".");
    if (dot <= 0) return `${file.name.slice(0, 33)}...`;
    const ext = file.name.slice(dot);
    return `${file.name.slice(0, 29)}...${ext}`;
  }, [file]);
  const surfaceTransition = useMemo(
    () => getSurfaceTransition(reducedMotion, motionDuration.standard),
    [reducedMotion],
  );

  function openPicker() {
    fileInputRef.current?.click();
  }

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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type.startsWith("image/")) {
      setFile(droppedFile);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(droppedFile);
      });
    }
  }, []);

  async function handlePost() {
    if (!canPost || !file || !previewUrl) return;

    const success = await onSubmit({
      file,
      caption: mention.encode(caption.trim()),
      linked_expense_id: linkedExpense || null,
      linked_poll_id: linkedPoll || null,
      location_name: locationName.trim() || null,
      preview_url: previewUrl,
    });

    if (success) {
      setFile(null);
      setPreviewUrl(null);
      setCaption("");
      setLinkedPoll("");
      setLinkedExpense("");
      setLocationName("");
      setShowLocation(false);
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          capture="environment"
          className="sr-only"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />

        {/* Photo area — mirrors voice sheet's recorder container */}
        <div className="rounded-xl border border-[#DCCBC0] bg-[#F8F4EE] p-4">
          <AnimatePresence mode="wait" initial={false}>
            {phase === "empty" ? (
              <motion.div
                key="photo-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={surfaceTransition}
                className="space-y-3"
              >
                {/* Drop zone */}
                <button
                  type="button"
                  onClick={openPicker}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className="block w-full rounded-lg border border-dashed bg-[#FFFDFB] p-2 transition-colors"
                  style={{
                    borderColor: dragging ? "#93BB6D" : "#E7D9CD",
                    backgroundColor: dragging ? "#F4F9EE" : "#FFFDFB",
                  }}
                >
                  <div className="grid place-items-center py-4 text-center">
                    <Text variant="caption" color="subtle">
                      Tap to browse or drop an image
                    </Text>
                  </div>
                </button>

                {/* Camera button */}
                <div className="flex justify-center">
                  <motion.button
                    type="button"
                    layoutId="photo-action-btn"
                    onClick={openPicker}
                    className="inline-flex h-[68px] w-[68px] items-center justify-center rounded-full btn-primary shadow-[0_6px_20px_rgba(90,150,41,0.4)]"
                    transition={surfaceTransition}
                  >
                    <Camera className="h-7 w-7 text-white" />
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="photo-preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={surfaceTransition}
                className="space-y-3"
              >
                {/* Preview image */}
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg border border-[#E7D9CD] bg-[#F5F0EA]">
                  {/* biome-ignore lint/performance/noImgElement: local object URLs are only available at runtime for pre-upload preview. */}
                  <img
                    src={previewUrl ?? ""}
                    alt="Preview"
                    className="absolute inset-0 h-full w-full object-cover"
                  />

                  {phase === "posting" ? (
                    <div className="absolute inset-0 flex items-end">
                      <div className="w-full bg-gradient-to-t from-[#2A211A]/40 to-transparent px-3 pb-3 pt-8">
                        <div className="flex items-center gap-2">
                          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
                            <motion.div
                              className="h-full rounded-full bg-white"
                              initial={{ width: "0%" }}
                              animate={{ width: "100%" }}
                              transition={{
                                duration: 8,
                                ease: "linear",
                              }}
                            />
                          </div>
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-white/90" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onFileChange(null)}
                      className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#DCCBC0] bg-[#F9F2EB]/95 text-[#7B6656] transition-colors hover:bg-[#F0E8DF]"
                      aria-label="Remove photo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* File info + change */}
                <div className="flex items-center gap-2">
                  <div className="inline-flex min-w-0 flex-1 items-center gap-1.5 rounded-full border border-[#E7D9CD] bg-[#FFFDFB] px-2.5 py-1">
                    <Camera className="h-3.5 w-3.5 shrink-0 text-[#7C6758]" />
                    <Text
                      variant="caption"
                      className="truncate font-medium text-[#7C6758]"
                    >
                      {filenameLabel}
                    </Text>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={posting}
                    onClick={openPicker}
                    className="shrink-0 [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Change
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Caption */}
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

          <div className="relative">
            <MentionSuggestions
              suggestions={mention.suggestions}
              highlightIndex={mention.highlightIndex}
              onSelect={mention.selectMention}
            />
            <textarea
              value={caption}
              onChange={(e) => mention.handleChange(e.target.value)}
              onKeyDown={mention.handleKeyDown}
              maxLength={CAPTION_MAX}
              rows={3}
              placeholder="Optional caption... (@ to mention)"
              disabled={posting}
              className="w-full rounded-xl border border-[#DECFC2] bg-[#FFFEFD] px-3 py-2.5 text-[14px] leading-relaxed text-ink outline-none transition-colors placeholder:text-[#AF9F93] focus:border-[#93BB6D]"
            />
          </div>
        </div>

        {/* Location */}
        <LocationInput
          show={showLocation}
          value={locationName}
          onChange={setLocationName}
          onToggle={() => {
            if (showLocation) setLocationName("");
            setShowLocation(!showLocation);
          }}
          disabled={posting}
        />

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
          disabled={!canPost}
          onClick={handlePost}
        >
          {posting ? (
            <>
              <Camera className="h-3.5 w-3.5" />
              Posting...
            </>
          ) : (
            <>
              <Camera className="h-3.5 w-3.5" />
              Post photo
            </>
          )}
        </Button>
      </div>
    </Sheet>
  );
}
