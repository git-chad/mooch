"use client";

import { Button, Select, Sheet, Text } from "@mooch/ui";
import { Mic, Pause, Play, Square } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { getSurfaceTransition, motionDuration } from "@/lib/motion";
import type { FeedLinkOption } from "./types";

const MAX_SECONDS = 60;
const CAPTION_MAX = 200;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  posting: boolean;
  pollOptions: FeedLinkOption[];
  expenseOptions: FeedLinkOption[];
  onSubmit: (data: {
    blob: Blob;
    caption: string;
    duration_seconds: number;
    linked_expense_id: string | null;
    linked_poll_id: string | null;
  }) => Promise<boolean>;
};

export function RecordVoiceSheet({
  open,
  onOpenChange,
  posting,
  pollOptions,
  expenseOptions,
  onSubmit,
}: Props) {
  const reducedMotion = useReducedMotion() ?? false;
  const [recording, setRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [level, setLevel] = useState(0);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewDuration, setPreviewDuration] = useState(0);
  const [caption, setCaption] = useState("");
  const [linkedPoll, setLinkedPoll] = useState("");
  const [linkedExpense, setLinkedExpense] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (open === false) {
      teardownRecorder();
      resetState();
    }

    return () => {
      teardownRecorder();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [open, previewUrl]);

  const canPost = useMemo(() => {
    return posting === false && recording === false && previewBlob !== null;
  }, [posting, recording, previewBlob]);

  const bars = useMemo(() => {
    return Array.from({ length: 22 }, (_, idx) => {
      const modulation = 0.35 + (((idx * 17) % 9) + 1) / 14;
      const height = Math.round(7 + level * 30 * modulation + (idx % 4) * 1.7);
      const active = level > 0.015;
      return { height, active };
    });
  }, [level]);

  function resetState() {
    setRecording(false);
    setElapsedMs(0);
    elapsedRef.current = 0;
    setLevel(0);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewBlob(null);
    setPreviewUrl(null);
    setPreviewDuration(0);
    setCaption("");
    setLinkedPoll("");
    setLinkedExpense("");
  }

  function teardownRecorder() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
    }
    recorderRef.current = null;

    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }

    analyserRef.current = null;

    if (audioCtxRef.current) {
      void audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  }

  function startLevelMeter(stream: MediaStream) {
    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    const data = new Uint8Array(analyser.fftSize);

    audioCtxRef.current = audioCtx;
    analyserRef.current = analyser;

    const tick = () => {
      if (analyserRef.current === null) return;

      analyserRef.current.getByteTimeDomainData(data);

      let sum = 0;
      for (let i = 0; i < data.length; i += 1) {
        const sample = (data[i] - 128) / 128;
        sum += sample * sample;
      }
      const rms = Math.sqrt(sum / data.length);
      setLevel(rms);

      rafRef.current = requestAnimationFrame(tick);
    };

    tick();
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      chunksRef.current = [];
      setPreviewBlob(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setPreviewDuration(0);
      setElapsedMs(0);
      elapsedRef.current = 0;

      let mimeType = "";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const nextBlob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const nextUrl = URL.createObjectURL(nextBlob);

        setPreviewBlob(nextBlob);
        setPreviewUrl(nextUrl);
        setPreviewDuration(
          Math.max(1, Math.min(MAX_SECONDS, Math.round(elapsedRef.current / 1000))),
        );
      };

      recorder.start(240);
      setRecording(true);
      startLevelMeter(stream);

      timerRef.current = setInterval(() => {
        setElapsedMs((prev) => {
          const next = prev + 100;
          elapsedRef.current = next;
          if (next >= MAX_SECONDS * 1000) {
            void stopRecording();
            return MAX_SECONDS * 1000;
          }
          return next;
        });
      }, 100);
    } catch {
      toast.error("Microphone access was blocked.");
    }
  }

  async function stopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setRecording(false);
    setLevel(0);

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
    }

    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }

    analyserRef.current = null;

    if (audioCtxRef.current) {
      void audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  }

  async function handlePost() {
    if (canPost === false || previewBlob === null) return;

    const success = await onSubmit({
      blob: previewBlob,
      caption: caption.trim(),
      duration_seconds: previewDuration,
      linked_expense_id: linkedExpense || null,
      linked_poll_id: linkedPoll || null,
    });

    if (success) {
      resetState();
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Record voice"
      description="Capture a quick voice note (up to 60s)."
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-[#DCCBC0] bg-[#F8F4EE] p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#DCCBC0] bg-[#FDF9F5] px-2.5 py-1">
              <Mic className="h-3.5 w-3.5 text-[#7B6656]" />
              <Text variant="caption" className="font-medium text-[#7B6656]">
                {recording ? "Recording" : previewBlob ? "Preview ready" : "Ready"}
              </Text>
            </div>
            <Text variant="caption" color="subtle" className="tabular-nums">
              {formatTimer(elapsedMs)} / 1:00
            </Text>
          </div>

          <div className="flex h-12 items-end gap-[2px] rounded-lg border border-[#E7D9CD] bg-[#FFFDFB] px-2 py-1.5">
            {bars.map((bar, idx) => (
              <motion.span
                // biome-ignore lint/suspicious/noArrayIndexKey: deterministic decorative bars.
                key={idx}
                className="block w-full rounded-sm"
                initial={false}
                animate={{
                  height: bar.height,
                  opacity: bar.active ? 0.95 : 0.35,
                  backgroundColor: bar.active ? "#5A9629" : "#C0B0A4",
                }}
                transition={getSurfaceTransition(reducedMotion, motionDuration.fast)}
              />
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            {recording ? (
              <Button
                type="button"
                variant="secondary"
                className="w-full [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1.5"
                onClick={() => {
                  void stopRecording();
                }}
              >
                <Square className="h-3.5 w-3.5" />
                Stop recording
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                className="w-full [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1.5"
                onClick={() => {
                  void startRecording();
                }}
              >
                <Mic className="h-3.5 w-3.5" />
                {previewBlob ? "Record again" : "Start recording"}
              </Button>
            )}
          </div>

          {previewUrl ? (
            <div className="mt-3 rounded-xl border border-[#E8DACC] bg-[#FFFCF9] p-2.5">
              <audio src={previewUrl} controls className="w-full" />
              <Text variant="caption" color="subtle" className="mt-1 block">
                Duration: {previewDuration}s
              </Text>
            </div>
          ) : null}
        </div>

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
          className="w-full [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1.5"
          loading={posting}
          disabled={canPost === false}
          onClick={handlePost}
        >
          {posting ? (
            <>
              <Pause className="h-3.5 w-3.5" />
              Posting…
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5" />
              Post voice note
            </>
          )}
        </Button>
      </div>
    </Sheet>
  );
}

function formatTimer(ms: number): string {
  const total = Math.max(0, Math.min(MAX_SECONDS, Math.floor(ms / 1000)));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
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
