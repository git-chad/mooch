"use client";

import { Button, Sheet, Text } from "@mooch/ui";
import { Mic, Pause, Play, RotateCcw, Square } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
// biome-ignore lint/style/noRestrictedImports: useEffect needed for reactive cleanup on open/previewUrl changes — not mount-only.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useWebHaptics } from "web-haptics/react";
import { getSurfaceTransition, motionDuration } from "@/lib/motion";
import { LinkSelectors } from "./LinkSelectors";
import { LocationInput } from "./LocationInput";
import type { MentionMember } from "./MentionInput";
import { MentionSuggestions, useMentionInput } from "./MentionInput";
import type { FeedLinkOption } from "./types";

const MAX_SECONDS = 60;
const CAPTION_MAX = 200;
const RING_BUFFER_SIZE = 80;
const RMS_INTERVAL_MS = 50;
const PEAK_COUNT = 48;

type RecordingPhase = "idle" | "recording" | "playback";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  posting: boolean;
  groupId: string;
  pollOptions: FeedLinkOption[];
  expenseOptions: FeedLinkOption[];
  members: MentionMember[];
  onSubmit: (data: {
    blob: Blob;
    caption: string;
    duration_seconds: number;
    linked_expense_id: string | null;
    linked_poll_id: string | null;
    location_name: string | null;
  }) => Promise<boolean>;
};

export function RecordVoiceSheet({
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
  const haptic = useWebHaptics();

  const [phase, setPhase] = useState<RecordingPhase>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewDuration, setPreviewDuration] = useState(0);
  const [caption, setCaption] = useState("");
  const mention = useMentionInput(caption, setCaption, members);
  const [linkedPoll, setLinkedPoll] = useState("");
  const [linkedExpense, setLinkedExpense] = useState("");
  const [locationName, setLocationName] = useState("");
  const [showLocation, setShowLocation] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [peaks, setPeaks] = useState<number[]>([]);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ringBufferRef = useRef<number[]>(new Array(RING_BUFFER_SIZE).fill(0));
  const ringIndexRef = useRef(0);
  const rmsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const playRafRef = useRef<number | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: teardownRecorder/stopPlayback/resetState only reference refs and state setters — stable across renders.
  useEffect(() => {
    if (open === false) {
      teardownRecorder();
      stopPlayback();
      resetState();
    }

    return () => {
      teardownRecorder();
      stopPlayback();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [open, previewUrl]);

  const canPost = useMemo(
    () => !posting && phase !== "recording" && previewBlob !== null,
    [posting, phase, previewBlob],
  );

  function resetState() {
    setPhase("idle");
    setElapsedMs(0);
    elapsedRef.current = 0;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewBlob(null);
    setPreviewUrl(null);
    setPreviewDuration(0);
    setCaption("");
    setLinkedPoll("");
    setLinkedExpense("");
    setLocationName("");
    setShowLocation(false);
    setPlaying(false);
    setPlayProgress(0);
    setPeaks([]);
    ringBufferRef.current = new Array(RING_BUFFER_SIZE).fill(0);
    ringIndexRef.current = 0;
    mention.reset();
  }

  function teardownRecorder() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (rmsIntervalRef.current) {
      clearInterval(rmsIntervalRef.current);
      rmsIntervalRef.current = null;
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
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
    analyserRef.current = null;
    if (audioCtxRef.current) {
      void audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  }

  function stopPlayback() {
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.src = "";
      audioElRef.current = null;
    }
    if (playRafRef.current !== null) {
      cancelAnimationFrame(playRafRef.current);
      playRafRef.current = null;
    }
    setPlaying(false);
  }

  // --- Canvas waveform drawing ---
  const drawWaveform = useCallback(
    (canvas: HTMLCanvasElement, buffer: number[]) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const centerY = h / 2;
      const len = buffer.length;
      const step = w / (len - 1);

      // Draw mirrored curves
      const gradient = ctx.createLinearGradient(0, 0, w, 0);
      gradient.addColorStop(0, "rgba(90, 150, 41, 0.35)");
      gradient.addColorStop(0.5, "rgba(127, 190, 68, 0.45)");
      gradient.addColorStop(1, "rgba(90, 150, 41, 0.35)");

      for (const mirror of [1, -1]) {
        ctx.beginPath();
        ctx.moveTo(0, centerY);

        for (let i = 0; i < len; i++) {
          const x = i * step;
          const amplitude = buffer[(ringIndexRef.current + i) % len];
          const y = centerY + mirror * amplitude * (centerY - 2) * 2.5;

          if (i === 0) {
            ctx.lineTo(x, y);
          } else {
            const prevX = (i - 1) * step;
            const prevAmplitude = buffer[(ringIndexRef.current + i - 1) % len];
            const prevY =
              centerY + mirror * prevAmplitude * (centerY - 2) * 2.5;
            const cpX = (prevX + x) / 2;
            ctx.quadraticCurveTo(cpX, prevY, (cpX + x) / 2, (prevY + y) / 2);
          }
        }

        ctx.lineTo(w, centerY);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = `rgba(90, 150, 41, 0.7)`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    },
    [],
  );

  function startLevelMeter(stream: MediaStream) {
    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    const data = new Uint8Array(analyser.fftSize);
    audioCtxRef.current = audioCtx;
    analyserRef.current = analyser;

    // Sample RMS at fixed interval into ring buffer
    rmsIntervalRef.current = setInterval(() => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const sample = (data[i] - 128) / 128;
        sum += sample * sample;
      }
      const rms = Math.sqrt(sum / data.length);
      const buf = ringBufferRef.current;
      buf[ringIndexRef.current % RING_BUFFER_SIZE] = rms;
      ringIndexRef.current = (ringIndexRef.current + 1) % RING_BUFFER_SIZE;
    }, RMS_INTERVAL_MS);

    // Animate canvas
    if (!reducedMotion) {
      const tick = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        drawWaveform(canvas, ringBufferRef.current);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } else {
      // Draw a single static gentle sine for reduced motion
      const canvas = canvasRef.current;
      if (canvas) {
        const buf = new Array(RING_BUFFER_SIZE).fill(0).map((_, i) => {
          return 0.05 + Math.sin((i / RING_BUFFER_SIZE) * Math.PI * 4) * 0.03;
        });
        drawWaveform(canvas, buf);
      }
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      chunksRef.current = [];
      setPreviewBlob(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setPreviewDuration(0);
      setElapsedMs(0);
      elapsedRef.current = 0;
      setPeaks([]);
      setPlayProgress(0);
      ringBufferRef.current = new Array(RING_BUFFER_SIZE).fill(0);
      ringIndexRef.current = 0;

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
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const nextBlob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const nextUrl = URL.createObjectURL(nextBlob);
        const duration = Math.max(
          1,
          Math.min(MAX_SECONDS, Math.round(elapsedRef.current / 1000)),
        );

        setPreviewBlob(nextBlob);
        setPreviewUrl(nextUrl);
        setPreviewDuration(duration);
        setPhase("playback");

        // Extract peaks from recorded audio
        void extractPeaks(nextBlob);
      };

      recorder.start(240);
      setPhase("recording");
      haptic.trigger("medium");
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
    if (rmsIntervalRef.current) {
      clearInterval(rmsIntervalRef.current);
      rmsIntervalRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
    analyserRef.current = null;
    if (audioCtxRef.current) {
      void audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    haptic.trigger("light");
  }

  async function extractPeaks(blob: Blob) {
    try {
      const arrayBuf = await blob.arrayBuffer();
      const offlineCtx = new AudioContext();
      const audioBuffer = await offlineCtx.decodeAudioData(arrayBuf);
      const channelData = audioBuffer.getChannelData(0);
      const blockSize = Math.floor(channelData.length / PEAK_COUNT);
      const extracted: number[] = [];

      for (let i = 0; i < PEAK_COUNT; i++) {
        let max = 0;
        const start = i * blockSize;
        const end = Math.min(start + blockSize, channelData.length);
        for (let j = start; j < end; j++) {
          const abs = Math.abs(channelData[j]);
          if (abs > max) max = abs;
        }
        extracted.push(max);
      }

      // Normalize
      const peakMax = Math.max(...extracted, 0.01);
      setPeaks(extracted.map((v) => v / peakMax));
      void offlineCtx.close();
    } catch {
      // Fallback: deterministic pseudo-peaks
      const fallback = Array.from({ length: PEAK_COUNT }, (_, i) => {
        return 0.2 + Math.abs(Math.sin(i * 0.7)) * 0.6 + ((i * 17) % 7) / 14;
      });
      const max = Math.max(...fallback);
      setPeaks(fallback.map((v) => v / max));
    }
  }

  function togglePlayback() {
    if (!previewUrl) return;

    if (playing) {
      audioElRef.current?.pause();
      setPlaying(false);
      if (playRafRef.current !== null) {
        cancelAnimationFrame(playRafRef.current);
        playRafRef.current = null;
      }
      return;
    }

    let audio = audioElRef.current;
    if (!audio) {
      audio = new Audio(previewUrl);
      audioElRef.current = audio;
    }

    audio.onended = () => {
      setPlaying(false);
      setPlayProgress(1);
      if (playRafRef.current !== null) {
        cancelAnimationFrame(playRafRef.current);
        playRafRef.current = null;
      }
    };

    void audio.play();
    setPlaying(true);

    const duration = previewDuration; // seconds, from recording timer

    const tick = () => {
      if (audio) {
        // Use previewDuration as fallback when audio.duration is NaN/Infinity (common with webm blobs)
        const dur =
          audio.duration && Number.isFinite(audio.duration)
            ? audio.duration
            : duration;
        if (dur > 0) {
          setPlayProgress(audio.currentTime / dur);
        }
      }
      playRafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }

  function seekPlayback(ratio: number) {
    const audio = audioElRef.current;
    if (!audio) return;
    const dur =
      audio.duration && Number.isFinite(audio.duration)
        ? audio.duration
        : previewDuration;
    if (dur > 0) {
      audio.currentTime = ratio * dur;
    }
    setPlayProgress(ratio);
  }

  function handleRecordAgain() {
    stopPlayback();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewBlob(null);
    setPreviewUrl(null);
    setPreviewDuration(0);
    setPhase("idle");
    setPlayProgress(0);
    setPeaks([]);
    ringBufferRef.current = new Array(RING_BUFFER_SIZE).fill(0);
    ringIndexRef.current = 0;
    // Clear the canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  async function handlePost() {
    if (!canPost || !previewBlob) return;
    stopPlayback();

    const success = await onSubmit({
      blob: previewBlob,
      caption: mention.encode(caption.trim()),
      duration_seconds: previewDuration,
      linked_expense_id: linkedExpense || null,
      linked_poll_id: linkedPoll || null,
      location_name: locationName.trim() || null,
    });

    if (success) resetState();
  }

  const surfaceTransition = useMemo(
    () => getSurfaceTransition(reducedMotion, motionDuration.standard),
    [reducedMotion],
  );

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Drop a voice bomb"
      description="Yell into the void (60s max)"
    >
      <div className="space-y-4">
        {/* Recorder area */}
        <div className="rounded-xl border border-[#DCCBC0] bg-[#F8F4EE] p-4">
          <AnimatePresence mode="wait" initial={false}>
            {phase === "playback" ? (
              <motion.div
                key="playback"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={surfaceTransition}
                className="space-y-3"
              >
                {/* Playback controls row */}
                <div className="flex items-center gap-3">
                  <motion.button
                    type="button"
                    layoutId="main-action-btn"
                    onClick={togglePlayback}
                    className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full btn-primary shadow-[0_4px_14px_rgba(90,150,41,0.35)]"
                    transition={surfaceTransition}
                  >
                    {playing ? (
                      <Pause className="h-5 w-5 text-white" fill="white" />
                    ) : (
                      <Play className="h-5 w-5 text-white" fill="white" />
                    )}
                  </motion.button>

                  <div className="min-w-0 flex-1">
                    <Text
                      variant="caption"
                      color="subtle"
                      className="mb-1 block tabular-nums"
                    >
                      {formatTimer(playProgress * previewDuration * 1000)} /{" "}
                      {formatTimer(previewDuration * 1000)}
                    </Text>

                    {/* Peak waveform bars */}
                    <PeakBars
                      peaks={peaks}
                      progress={playProgress}
                      onSeek={seekPlayback}
                    />
                  </div>
                </div>

                {/* Record again */}
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1.5"
                  onClick={handleRecordAgain}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Record again
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="record"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={surfaceTransition}
                className="space-y-3"
              >
                {/* Timer + progress bar */}
                <div className="flex items-center justify-between">
                  <Text
                    variant="caption"
                    color="subtle"
                    className="tabular-nums"
                  >
                    {formatTimer(elapsedMs)} / 1:00
                  </Text>
                  <div className="h-1 flex-1 mx-3 rounded-full bg-[#E7D9CD] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-[#5A9629]"
                      style={{
                        width: `${(elapsedMs / (MAX_SECONDS * 1000)) * 100}%`,
                      }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                </div>

                {/* Live canvas waveform */}
                <div className="relative h-16 w-full overflow-hidden rounded-lg border border-[#E7D9CD] bg-[#FFFDFB]">
                  <canvas ref={canvasRef} className="h-full w-full" />
                  {phase === "idle" && <IdleSineCanvas />}
                </div>

                {/* Mic button */}
                <div className="flex justify-center">
                  {phase === "recording" ? (
                    <div className="relative inline-flex items-center justify-center">
                      <motion.span
                        className="absolute h-[90px] w-[90px] rounded-full bg-[#b8e986] blur-xl"
                        animate={
                          reducedMotion
                            ? { opacity: 0.35 }
                            : {
                                opacity: [0.25, 0.5, 0.25],
                                scale: [0.9, 1.1, 0.9],
                              }
                        }
                        transition={
                          reducedMotion
                            ? undefined
                            : {
                                duration: 1.6,
                                repeat: Number.POSITIVE_INFINITY,
                                ease: "easeInOut",
                              }
                        }
                      />
                      <motion.button
                        type="button"
                        layoutId="main-action-btn"
                        onClick={() => void stopRecording()}
                        className="relative inline-flex h-[68px] w-[68px] items-center justify-center rounded-full btn-primary shadow-[0_6px_20px_rgba(90,150,41,0.4)]"
                        transition={surfaceTransition}
                      >
                        <Square className="h-6 w-6 text-white" fill="white" />
                      </motion.button>
                    </div>
                  ) : (
                    <motion.button
                      type="button"
                      layoutId="main-action-btn"
                      onClick={() => void startRecording()}
                      className="inline-flex h-[68px] w-[68px] items-center justify-center rounded-full btn-primary shadow-[0_6px_20px_rgba(90,150,41,0.4)]"
                      transition={surfaceTransition}
                    >
                      <Mic className="h-7 w-7 text-white" />
                    </motion.button>
                  )}
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
        <LinkSelectors
          groupId={groupId}
          linkedExpense={linkedExpense}
          linkedPoll={linkedPoll}
          setLinkedExpense={setLinkedExpense}
          setLinkedPoll={setLinkedPoll}
          expenseOptions={expenseOptions}
          pollOptions={pollOptions}
        />

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

// --- Helpers ---

function formatTimer(ms: number): string {
  const total = Math.max(0, Math.min(MAX_SECONDS, Math.floor(ms / 1000)));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function IdleSineCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const centerY = h / 2;
    ctx.clearRect(0, 0, w, h);

    ctx.beginPath();
    ctx.moveTo(0, centerY);
    for (let x = 0; x <= w; x++) {
      const y = centerY + Math.sin((x / w) * Math.PI * 6) * 3;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "rgba(192, 176, 164, 0.5)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}

function PeakBars({
  peaks,
  progress,
  onSeek,
}: {
  peaks: number[];
  progress: number;
  onSeek: (ratio: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const barCount = peaks.length || PEAK_COUNT;
  const displayPeaks =
    peaks.length > 0 ? peaks : Array.from({ length: PEAK_COUNT }, () => 0.15);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width),
    );
    onSeek(ratio);

    function onMove(ev: PointerEvent) {
      const r = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      onSeek(r);
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  const playedIndex = Math.floor(progress * barCount);

  return (
    <div
      ref={containerRef}
      className="flex h-8 cursor-pointer items-end gap-[2px] rounded"
      onPointerDown={handlePointerDown}
    >
      {displayPeaks.map((peak, idx) => {
        const h = Math.max(3, peak * 28);
        const played = idx <= playedIndex;
        return (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: deterministic peaks
            key={idx}
            className="block flex-1 rounded-sm transition-colors duration-100"
            style={{
              height: h,
              backgroundColor: played ? "#5A9629" : "#C0B0A4",
            }}
          />
        );
      })}
    </div>
  );
}
