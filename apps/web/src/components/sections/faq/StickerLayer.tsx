"use client";

import { cn } from "@mooch/ui";
import { motion } from "motion/react";
import Image from "next/image";
import { useRef } from "react";
import { defaultStickerPose, stickerConfigs } from "./data";
import type {
  StickerOffset,
  StickerOffsetMap,
  StickerPose,
  StickerPoseMap,
} from "./types";

type StickerLayerProps = {
  reduceMotion: boolean;
  stickerOffsets: StickerOffsetMap;
  stickerPoses: StickerPoseMap;
  onOffsetChange: (id: string, nextOffset: StickerOffset) => void;
  onPoseChange: (id: string, nextPose: StickerPose) => void;
};

export function StickerLayer({
  reduceMotion,
  stickerOffsets,
  stickerPoses,
  onOffsetChange,
  onPoseChange,
}: StickerLayerProps) {
  const stickerLayerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={stickerLayerRef}
      className="absolute inset-y-0 left-0 right-0 z-0 hidden [perspective:1400px] lg:block"
    >
      {stickerConfigs.map((sticker) => (
        <motion.div
          key={sticker.id}
          tabIndex={-1}
          aria-hidden="true"
          drag
          dragConstraints={stickerLayerRef}
          dragElastic={0.08}
          dragMomentum={false}
          onDrag={(_, info) => {
            if (reduceMotion) return;

            const rotateY = Math.max(Math.min(info.offset.x * 0.03, 5), -5);
            const rotateX = Math.max(Math.min(-info.offset.y * 0.025, 4), -4);
            const twist = Math.max(Math.min(info.offset.x * 0.06, 10), -10);

            onPoseChange(sticker.id, { rotateX, rotateY, twist });
          }}
          onDragEnd={(_, info) => {
            const currentOffset = stickerOffsets[sticker.id] ?? { x: 0, y: 0 };
            onOffsetChange(sticker.id, {
              x: currentOffset.x + info.offset.x,
              y: currentOffset.y + info.offset.y,
            });
            onPoseChange(sticker.id, defaultStickerPose);
          }}
          style={{
            x: stickerOffsets[sticker.id]?.x ?? 0,
            y: stickerOffsets[sticker.id]?.y ?? 0,
          }}
          animate={{
            rotateX: stickerPoses[sticker.id]?.rotateX ?? 0,
            rotateY: stickerPoses[sticker.id]?.rotateY ?? 0,
            rotateZ:
              sticker.baseRotate + (stickerPoses[sticker.id]?.twist ?? 0),
          }}
          whileHover={
            reduceMotion
              ? undefined
              : {
                  scale: 1.012,
                }
          }
          whileTap={reduceMotion ? undefined : { scale: 1.08 }}
          whileDrag={
            reduceMotion
              ? undefined
              : {
                  scale: 1.1,
                  z: 22,
                }
          }
          transition={{
            type: "spring",
            stiffness: 320,
            damping: 34,
            mass: 0.48,
          }}
          className={cn(
            "absolute z-0 touch-none cursor-grab active:cursor-grabbing [transform-style:preserve-3d] [will-change:transform]",
            sticker.positionClass,
          )}
        >
          <Image
            src={sticker.src}
            alt={sticker.alt}
            width={sticker.width}
            height={sticker.height}
            draggable={false}
            className="pointer-events-none select-none drop-shadow-[0_14px_24px_rgba(65,80,95,0.18)]"
          />
        </motion.div>
      ))}
    </div>
  );
}
