"use client";

import { createBrowserClient, uploadPlanAttachment } from "@mooch/db";
import type { PlanStatus } from "@mooch/types";
import { Button, Input, Sheet, Text } from "@mooch/ui";
import { Camera, Mic, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { addPlanAttachment, createPlan } from "@/app/actions/plans";
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

  const [photo, setPhoto] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  useEffect(() => {
    if (open) {
      setStatus(initialStatus);
    }
  }, [initialStatus, open]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) setAudioBlob(event.data);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error("Microphone access denied", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate("");
    setStatus(initialStatus);
    setPhoto(null);
    setAudioBlob(null);

    if (isRecording) stopRecording();
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

      const supabase = createBrowserClient();

      if (photo) {
        try {
          const path = await uploadPlanAttachment(
            supabase,
            groupId,
            result.plan.id,
            photo,
            photo.name,
          );
          await addPlanAttachment(result.plan.id, "photo", path);
        } catch (error) {
          console.error("Photo upload failed", error);
        }
      }

      if (audioBlob) {
        try {
          const path = await uploadPlanAttachment(
            supabase,
            groupId,
            result.plan.id,
            audioBlob,
            "voice.webm",
          );
          await addPlanAttachment(result.plan.id, "voice", path);
        } catch (error) {
          console.error("Voice upload failed", error);
        }
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
        <div>
          <label htmlFor="plan-title" className="mb-1 block">
            <Text variant="label">Title *</Text>
          </label>
          <Input
            id="plan-title"
            placeholder="What's the plan?"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            autoFocus
            required
          />
        </div>

        <div>
          <label htmlFor="plan-description" className="mb-1 block">
            <Text variant="label">Description</Text>
          </label>
          <textarea
            id="plan-description"
            placeholder="Add context, timing, or who should take the lead."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="w-full resize-none rounded-2xl border border-[var(--color-edge)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[rgba(214,170,105,0.35)]"
          />
        </div>

        <div>
          <label htmlFor="plan-date" className="mb-1 block">
            <Text variant="label">Date</Text>
          </label>
          <input
            id="plan-date"
            type="datetime-local"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="w-full rounded-2xl border border-[var(--color-edge)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[rgba(214,170,105,0.35)]"
          />
        </div>

        <div>
          <Text variant="label" className="mb-2 block">
            Status
          </Text>
          <div className="flex flex-wrap gap-2">
            {PLAN_STATUS_CONFIG.map((option) => {
              const Icon = option.icon;
              const isActive = status === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setStatus(option.id)}
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors"
                  style={{
                    background: isActive
                      ? "rgba(214, 170, 105, 0.18)"
                      : "var(--color-surface-secondary)",
                    borderColor: isActive
                      ? "rgba(214, 170, 105, 0.45)"
                      : "var(--color-edge)",
                    color: isActive
                      ? "var(--color-text)"
                      : "var(--color-text-muted)",
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {option.title}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div
            className="rounded-2xl border p-3"
            style={{
              background: "var(--color-surface-secondary)",
              borderColor: "var(--color-edge)",
            }}
          >
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--color-text)]">
              <Camera className="h-4 w-4" />
              Add photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  if (event.target.files && event.target.files[0]) {
                    setPhoto(event.target.files[0]);
                  }
                }}
              />
            </label>
            {photo && (
              <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-[var(--color-edge)] bg-[var(--color-surface)] px-2 py-1.5">
                <Text variant="caption" className="truncate">
                  {photo.name}
                </Text>
                <button
                  type="button"
                  onClick={() => setPhoto(null)}
                  className="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                  aria-label="Remove selected photo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          <div
            className="rounded-2xl border p-3"
            style={{
              background: "var(--color-surface-secondary)",
              borderColor: "var(--color-edge)",
            }}
          >
            <button
              type="button"
              onClick={
                isRecording
                  ? stopRecording
                  : audioBlob
                    ? () => setAudioBlob(null)
                    : startRecording
              }
              className="flex items-center gap-2 text-sm font-medium text-[var(--color-text)]"
            >
              <Mic className={`h-4 w-4 ${isRecording ? "text-red-500" : ""}`} />
              {isRecording
                ? "Stop recording"
                : audioBlob
                  ? "Remove voice note"
                  : "Add voice note"}
            </button>
            {audioBlob && !isRecording && (
              <Text variant="caption" color="subtle" className="mt-2 block">
                Voice note ready to upload.
              </Text>
            )}
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
