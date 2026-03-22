"use client";

import type { LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import { getSurfaceTransition, motionDuration } from "@/lib/motion";

export type ComposerDockItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
};

type Props = {
  items: ComposerDockItem[];
};

const MAX_DISTANCE = 132;

function getDockScale(distance: number, reducedMotion: boolean): number {
  if (reducedMotion) return 1;
  if (distance <= 30) return 1.17;
  if (distance <= 72) {
    const t = (distance - 30) / 42;
    return 1.17 - t * 0.09;
  }
  if (distance <= MAX_DISTANCE) {
    const t = (distance - 72) / (MAX_DISTANCE - 72);
    return 1.08 - t * 0.08;
  }
  return 1;
}

export function ComposerDock({ items }: Props) {
  const reducedMotion = useReducedMotion() ?? false;
  const [pointerX, setPointerX] = useState<number | null>(null);

  return (
    <div
      className="pointer-events-auto w-fit rounded-[24px] border border-[#DDCFC2] bg-[linear-gradient(165deg,rgba(255,255,255,0.95)_0%,rgba(248,241,232,0.95)_100%)] px-2 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_14px_28px_rgba(80,57,41,0.18)] backdrop-blur"
      onMouseMove={(event) => setPointerX(event.clientX)}
      onMouseLeave={() => setPointerX(null)}
    >
      <div className="flex items-end gap-1.5 sm:gap-2">
        {items.map((item) => (
          <DockItemButton
            key={item.key}
            item={item}
            pointerX={pointerX}
            reducedMotion={reducedMotion}
          />
        ))}
      </div>
    </div>
  );
}

function DockItemButton({
  item,
  pointerX,
  reducedMotion,
}: {
  item: ComposerDockItem;
  pointerX: number | null;
  reducedMotion: boolean;
}) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const Icon = item.icon;

  const centerX = buttonRef.current
    ? buttonRef.current.getBoundingClientRect().left +
      buttonRef.current.getBoundingClientRect().width / 2
    : null;

  const distance =
    pointerX == null || centerX == null
      ? MAX_DISTANCE + 1
      : Math.abs(pointerX - centerX);
  const scale = getDockScale(distance, reducedMotion);
  const y = reducedMotion ? 0 : -(scale - 1) * 10;
  const active = pointerX != null && distance < 68;
  const palette = getPalette(item.key, active);

  return (
    <motion.button
      ref={buttonRef}
      type="button"
      onClick={item.onClick}
      whileTap={reducedMotion ? undefined : { scale: 0.97 }}
      animate={{ scale, y }}
      transition={
        reducedMotion
          ? getSurfaceTransition(true, motionDuration.fast)
          : { type: "spring", stiffness: 250, damping: 16, mass: 0.72 }
      }
      className="group relative flex min-w-[54px] flex-col items-center rounded-2xl px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-[#8AB861]"
      aria-label={item.label}
      title={item.label}
    >
      <span
        className="relative grid h-12 w-12 place-items-center overflow-hidden rounded-2xl border transition-colors"
        style={{
          borderColor: palette.border,
          background: palette.background,
          color: "#F7FBFF",
          boxShadow: [
            "inset 0 1px 0 rgba(255,255,255,0.42)",
            "inset 0 -2px 3px rgba(0,0,0,0.22)",
            "0 2px 0 rgba(0,0,0,0.22)",
            `0 8px 14px ${palette.dropShadow}`,
          ].join(", "),
        }}
      >
        <span
          className="pointer-events-none absolute inset-[1.5px] rounded-[12px] border"
          style={{ borderColor: "rgba(255,255,255,0.28)" }}
        />
        <span
          className="pointer-events-none absolute inset-[2px] rounded-[11px]"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 46%, rgba(0,0,0,0.12) 100%)",
          }}
        />
        <Icon className="h-5 w-5" />
      </span>
    </motion.button>
  );
}

function getPalette(key: string, active: boolean) {
  if (key === "text") {
    return {
      border: active ? "#5B92E8" : "#6AA5F1",
      background: active
        ? "linear-gradient(165deg,#63AFFF 0%,#2F69D9 100%)"
        : "linear-gradient(165deg,#73BBFF 0%,#3E7BE8 100%)",
      dropShadow: active ? "rgba(40,94,191,0.40)" : "rgba(51,108,205,0.34)",
    };
  }

  if (key === "photo") {
    return {
      border: active ? "#E08A3B" : "#E79A4F",
      background: active
        ? "linear-gradient(165deg,#FFB35E 0%,#E06B22 100%)"
        : "linear-gradient(165deg,#FFC070 0%,#E97D31 100%)",
      dropShadow: active ? "rgba(189,97,24,0.36)" : "rgba(202,109,34,0.32)",
    };
  }

  return {
    border: active ? "#72B741" : "#80C34E",
    background: active
      ? "linear-gradient(165deg,#9CDA5D 0%,#4E9827 100%)"
      : "linear-gradient(165deg,#A9DF67 0%,#5EAE34 100%)",
    dropShadow: active ? "rgba(61,125,26,0.34)" : "rgba(74,136,33,0.30)",
  };
}
