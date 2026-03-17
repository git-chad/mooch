"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSurfaceTransition, motionDuration } from "@/lib/motion";

type LightboxPhoto = {
  id: string;
  url: string;
  caption: string | null;
  author: string;
  createdAt: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: LightboxPhoto[];
  initialItemId: string | null;
};

const MIN_SCALE = 1;
const MAX_SCALE = 3.2;

function clampScale(value: number): number {
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, value));
}

type TouchLikeList = {
  length: number;
  item: (index: number) => { clientX: number; clientY: number } | null;
};

function distanceBetweenTouches(touches: TouchLikeList): number {
  if (touches.length < 2) return 0;
  const first = touches.item(0);
  const second = touches.item(1);
  if (!first || !second) return 0;
  const dx = second.clientX - first.clientX;
  const dy = second.clientY - first.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

export function ImageLightbox({
  open,
  onOpenChange,
  photos,
  initialItemId,
}: Props) {
  const reducedMotion = useReducedMotion() ?? false;
  const [index, setIndex] = useState(0);
  const [scale, setScale] = useState(1);

  const pinchDistanceRef = useRef(0);
  const pinchScaleRef = useRef(1);

  const activePhoto = useMemo(
    () => (photos.length > 0 ? photos[index] : null),
    [photos, index],
  );

  const canGoPrev = index > 0;
  const canGoNext = index < photos.length - 1;

  useEffect(() => {
    if (!open) return;

    if (initialItemId) {
      const idx = photos.findIndex((p) => p.id === initialItemId);
      if (idx >= 0) setIndex(idx);
    } else {
      setIndex(0);
    }

    setScale(1);
  }, [open, initialItemId, photos]);

  const goPrev = useCallback(() => {
    setIndex((prev) => {
      const next = Math.max(0, prev - 1);
      return next;
    });
    setScale(1);
  }, []);

  const goNext = useCallback(() => {
    setIndex((prev) => {
      const next = Math.min(photos.length - 1, prev + 1);
      return next;
    });
    setScale(1);
  }, [photos.length]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
        return;
      }
      if (event.key === "ArrowLeft") {
        if (canGoPrev) goPrev();
        return;
      }
      if (event.key === "ArrowRight") {
        if (canGoNext) goNext();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange, canGoPrev, canGoNext, goPrev, goNext]);

  return (
    <AnimatePresence initial={false}>
      {open && activePhoto ? (
        <motion.div
          className="fixed inset-0 z-[80] flex flex-col bg-black/90"
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={getSurfaceTransition(reducedMotion, motionDuration.fast)}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              onOpenChange(false);
            }
          }}
        >
          <div className="flex items-center justify-between gap-2 px-3 py-2.5 sm:px-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 text-[12px] text-white/90">
              <span className="tabular-nums">{index + 1}</span>
              <span>/</span>
              <span className="tabular-nums">{photos.length}</span>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Close image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-3 sm:px-6 sm:pb-5">
            {photos.length > 1 ? (
              <button
                type="button"
                onClick={goPrev}
                disabled={!canGoPrev}
                className="absolute left-2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors disabled:opacity-25 sm:left-4"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : null}

            <motion.img
              key={activePhoto.id}
              src={activePhoto.url}
              alt={activePhoto.caption || "Feed image"}
              className="max-h-full w-auto max-w-full select-none object-contain touch-none"
              draggable={false}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale }}
              exit={{ opacity: 0 }}
              transition={getSurfaceTransition(reducedMotion, motionDuration.fast)}
              onDoubleClick={() => setScale((prev) => (prev > 1 ? 1 : 2))}
              onWheel={(event) => {
                if (event.ctrlKey || event.metaKey) {
                  event.preventDefault();
                  const delta = event.deltaY < 0 ? 0.12 : -0.12;
                  setScale((prev) => clampScale(prev + delta));
                }
              }}
              onTouchStart={(event) => {
                if (event.touches.length === 2) {
                  pinchDistanceRef.current = distanceBetweenTouches(event.touches);
                  pinchScaleRef.current = scale;
                }
              }}
              onTouchMove={(event) => {
                if (event.touches.length !== 2) return;
                const currentDistance = distanceBetweenTouches(event.touches);
                if (pinchDistanceRef.current <= 0) return;
                event.preventDefault();
                const ratio = currentDistance / pinchDistanceRef.current;
                setScale(clampScale(pinchScaleRef.current * ratio));
              }}
              onTouchEnd={(event) => {
                if (event.touches.length < 2) {
                  pinchDistanceRef.current = 0;
                  pinchScaleRef.current = scale;
                }
              }}
            />

            {photos.length > 1 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={!canGoNext}
                className="absolute right-2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors disabled:opacity-25 sm:right-4"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : null}
          </div>

          <div className="px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-white/95">
              <p className="text-[13px] font-medium">{activePhoto.author}</p>
              {activePhoto.caption ? (
                <p className="mt-0.5 text-[13px] leading-relaxed text-white/85">
                  {activePhoto.caption}
                </p>
              ) : null}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
