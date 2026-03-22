"use client";

import { Text } from "@mooch/ui";
import { Mic, Pause, Play } from "lucide-react";
import * as React from "react";
import { useRef, useState } from "react";

const VOICE_PEAK_COUNT = 48;

function defaultVoicePeaks(): number[] {
  return Array.from({ length: VOICE_PEAK_COUNT }, (_, i) => {
    return 0.1 + ((i * 17) % 5) * 0.015;
  });
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function VoicePlayer({
  src,
  durationHint,
}: {
  src: string;
  durationHint?: number;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const barsRef = useRef<HTMLDivElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(durationHint ?? 0);
  const [peaks, setPeaks] = useState<number[]>(() => defaultVoicePeaks());
  const [hasExtractedPeaks, setHasExtractedPeaks] = useState(false);

  // Extract real peaks from audio on mount
  React.useEffect(() => {
    let cancelled = false;

    async function extract() {
      try {
        const res = await fetch(src);
        const buf = await res.arrayBuffer();
        const ctx = new AudioContext();
        const decoded = await ctx.decodeAudioData(buf);
        const channel = decoded.getChannelData(0);
        const blockSize = Math.floor(channel.length / VOICE_PEAK_COUNT);
        const extracted: number[] = [];

        for (let i = 0; i < VOICE_PEAK_COUNT; i++) {
          let max = 0;
          const start = i * blockSize;
          const end = Math.min(start + blockSize, channel.length);
          for (let j = start; j < end; j++) {
            const abs = Math.abs(channel[j]);
            if (abs > max) max = abs;
          }
          extracted.push(max);
        }

        const peakMax = Math.max(...extracted, 0.01);
        if (!cancelled) {
          setPeaks(extracted.map((v) => v / peakMax));
          setHasExtractedPeaks(true);
          if (decoded.duration && Number.isFinite(decoded.duration)) {
            setDuration(decoded.duration);
          }
        }
        void ctx.close();
      } catch {
        // keep default baseline peaks
      }
    }

    void extract();
    return () => {
      cancelled = true;
    };
  }, [src]);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onEnded = () => {
      setPlaying(false);
      setProgress(1);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  function startProgressLoop() {
    const audio = audioRef.current;
    if (!audio) return;
    const tick = () => {
      const dur =
        audio.duration && Number.isFinite(audio.duration)
          ? audio.duration
          : duration;
      if (dur > 0) setProgress(audio.currentTime / dur);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }

  function stopProgressLoop() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }

  async function toggle() {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      stopProgressLoop();
      return;
    }

    try {
      await audio.play();
      setPlaying(true);
      startProgressLoop();
    } catch {
      setPlaying(false);
    }
  }

  function handleSeek(e: React.PointerEvent<HTMLDivElement>) {
    const container = barsRef.current;
    const audio = audioRef.current;
    if (!container || !audio) return;

    const rect = container.getBoundingClientRect();
    const seek = (clientX: number) => {
      const ratio = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width),
      );
      const dur =
        audio.duration && Number.isFinite(audio.duration)
          ? audio.duration
          : duration;
      if (dur > 0) audio.currentTime = ratio * dur;
      setProgress(ratio);
    };

    seek(e.clientX);

    const onMove = (ev: PointerEvent) => seek(ev.clientX);
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  const playedIndex = Math.floor(progress * peaks.length);
  const elapsed = progress * duration;

  return (
    <div
      className="rounded-xl border p-3"
      style={{ background: "#F8F4EF", borderColor: "#E7D8CC" }}
    >
      {/* biome-ignore lint/a11y/useMediaCaption: voice notes have no caption track */}
      <audio ref={audioRef} src={src} preload="metadata" />
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={toggle}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full btn-primary shadow-[0_3px_10px_rgba(90,150,41,0.3)]"
          aria-label={playing ? "Pause voice note" : "Play voice note"}
        >
          {playing ? (
            <Pause className="h-4 w-4 text-white" fill="white" />
          ) : (
            <Play
              className="h-4 w-4 text-white translate-x-[1px]"
              fill="white"
            />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div
            ref={barsRef}
            className="flex h-8 cursor-pointer items-end gap-[2px] rounded"
            onPointerDown={handleSeek}
          >
            {peaks.map((peak, idx) => {
              const h = Math.max(3, peak * 28);
              const played = idx <= playedIndex;
              return (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: deterministic peaks
                  key={idx}
                  className="block flex-1 rounded-sm motion-reduce:transition-none"
                  style={{
                    height: h,
                    backgroundColor: played ? "#5A9629" : "#C0B0A4",
                    transitionProperty: "height, background-color",
                    transitionDuration: hasExtractedPeaks
                      ? "240ms, 100ms"
                      : "100ms",
                    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                    transitionDelay: hasExtractedPeaks ? `${idx * 6}ms` : "0ms",
                  }}
                />
              );
            })}
          </div>
          <div className="mt-1 flex items-center justify-between">
            <Text variant="caption" color="subtle">
              <Mic className="mr-1 inline h-3 w-3 align-[-1px]" />
              Voice
            </Text>
            <Text variant="caption" color="subtle" className="tabular-nums">
              {formatTime(elapsed)} / {formatTime(duration)}
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}
