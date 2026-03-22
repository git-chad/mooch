"use client";

import type { CorruptionAction } from "@mooch/types";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

type IconAsset = {
  blueprintFile: string;
  detailFile: string;
  alt: string;
};

type IconVariant = "blueprint" | "detail";

const BASE_DIRS = ["/icons", "/images/corruption"] as const;

const ACTION_SLUG: Record<CorruptionAction, string> = {
  double_down: "double-down",
  the_leak: "the-leak",
  ghost_vote: "ghost-vote",
  hail_mary: "hail-mary",
  the_veto: "the-veto",
  the_coup: "the-coup",
};

function makeAsset(action: CorruptionAction, alt: string): IconAsset {
  const slug = ACTION_SLUG[action];
  return {
    blueprintFile: `corruption-${slug}-blueprint.webp`,
    detailFile: `corruption-${slug}.webp`,
    alt,
  };
}

export const CORRUPTION_ICON_PACK: Record<CorruptionAction, IconAsset> = {
  double_down: makeAsset("double_down", "Double Down icon"),
  the_leak: makeAsset("the_leak", "The Leak icon"),
  ghost_vote: makeAsset("ghost_vote", "Ghost Vote icon"),
  hail_mary: makeAsset("hail_mary", "Hail Mary icon"),
  the_veto: makeAsset("the_veto", "The Veto icon"),
  the_coup: makeAsset("the_coup", "The Coup icon"),
};

type CorruptionIconImageProps = {
  action: CorruptionAction;
  variant: IconVariant;
  fallback?: React.ReactNode;
  className?: string;
};

function CorruptionIconImage({
  action,
  variant,
  fallback,
  className,
}: CorruptionIconImageProps) {
  const asset = CORRUPTION_ICON_PACK[action];
  const file = variant === "blueprint" ? asset.blueprintFile : asset.detailFile;
  const candidateSources = BASE_DIRS.map((dir) => `${dir}/${file}`);
  const [sourceIndex, setSourceIndex] = useState(0);
  const src = candidateSources[sourceIndex];
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    setSourceIndex(0);
  }, [file]);

  if (failed) {
    if (process.env.NODE_ENV !== "production") {
      return (
        <div className="relative grid h-full w-full place-items-center rounded-xl bg-[#F7E8DE] text-[#8A4A34]">
          {fallback ? (
            <span className="scale-[0.9] leading-none">{fallback}</span>
          ) : null}
          <span className="absolute bottom-1 rounded-full bg-[#E8C9B7] px-1.5 py-[1px] text-[8px] font-semibold uppercase tracking-wide">
            missing
          </span>
        </div>
      );
    }
    return (
      <div className="grid h-full w-full place-items-center rounded-xl">
        {fallback}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={asset.alt}
      className={className}
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => {
        if (sourceIndex < candidateSources.length - 1) {
          setSourceIndex((prev) => prev + 1);
          return;
        }
        setFailed(true);
      }}
    />
  );
}

type CorruptionIconTileProps = {
  action: CorruptionAction;
  variant: IconVariant;
  fallback?: React.ReactNode;
  className?: string;
  imageClassName?: string;
  tone?: "framed" | "fullbleed";
};

const TILE_CLASS_FRAMED =
  "relative overflow-hidden rounded-[14px] border border-[#DCCBC0] bg-[linear-gradient(180deg,#FFFDF9_0%,#F6EFE8_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_1px_0_rgba(198,177,159,0.88)]";
const TILE_CLASS_FULLBLEED = "relative overflow-hidden rounded-[inherit]";

export function CorruptionIconTile({
  action,
  variant,
  fallback,
  className,
  imageClassName,
  tone = "framed",
}: CorruptionIconTileProps) {
  const tileClass = tone === "fullbleed" ? TILE_CLASS_FULLBLEED : TILE_CLASS_FRAMED;
  return (
    <div className={`${tileClass} ${className ?? ""}`}>
      <CorruptionIconImage
        action={action}
        variant={variant}
        fallback={fallback}
        className={
          imageClassName ??
          (tone === "fullbleed"
            ? "h-full w-full object-cover"
            : "h-full w-full object-contain p-1.5")
        }
      />
    </div>
  );
}

type CorruptionRevealTileProps = {
  action: CorruptionAction;
  reducedMotion: boolean;
  fallback?: React.ReactNode;
  className?: string;
  imageClassName?: string;
  tone?: "framed" | "fullbleed";
  revealDelayMs?: number;
};

export function CorruptionRevealTile({
  action,
  reducedMotion,
  fallback,
  className,
  imageClassName,
  tone = "framed",
  revealDelayMs = 120,
}: CorruptionRevealTileProps) {
  const [showDetail, setShowDetail] = useState(reducedMotion);
  const tileClass = tone === "fullbleed" ? TILE_CLASS_FULLBLEED : TILE_CLASS_FRAMED;
  const defaultImageClass =
    tone === "fullbleed"
      ? "h-full w-full object-cover"
      : "h-full w-full object-contain p-2";

  useEffect(() => {
    if (reducedMotion) {
      setShowDetail(true);
      return;
    }

    setShowDetail(false);
    const timer = window.setTimeout(() => setShowDetail(true), revealDelayMs);
    return () => window.clearTimeout(timer);
  }, [action, reducedMotion, revealDelayMs]);

  return (
    <div className={`${tileClass} ${className ?? ""}`}>
      <motion.span
        className="absolute inset-0 block"
        animate={{
          opacity: showDetail ? 0 : 1,
          scale: showDetail ? 1.03 : 1,
          y: showDetail ? -2 : 0,
        }}
        transition={{
          duration: reducedMotion ? 0.01 : 0.32,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <CorruptionIconImage
          action={action}
          variant="blueprint"
          fallback={fallback}
          className={imageClassName ?? defaultImageClass}
        />
      </motion.span>
      <motion.span
        className="absolute inset-0 block"
        animate={{
          opacity: showDetail ? 1 : 0,
          scale: showDetail ? 1 : 1.08,
          y: showDetail ? 0 : 4,
        }}
        transition={{
          duration: reducedMotion ? 0.01 : 0.42,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <CorruptionIconImage
          action={action}
          variant="detail"
          fallback={fallback}
          className={imageClassName ?? defaultImageClass}
        />
      </motion.span>
    </div>
  );
}
