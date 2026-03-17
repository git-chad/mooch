"use client";

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
  isVisible: boolean;
  stickerOffsets: StickerOffsetMap;
  stickerPoses: StickerPoseMap;
  onOffsetChange: (id: string, nextOffset: StickerOffset) => void;
  onPoseChange: (id: string, nextPose: StickerPose) => void;
};

export function StickerLayer({
  reduceMotion,
  isVisible,
  stickerOffsets,
  stickerPoses,
  onOffsetChange,
  onPoseChange,
}: StickerLayerProps) {
  const stickerLayerRef = useRef<HTMLDivElement>(null);
  if (!isVisible) return null;

  return (
    <div
      ref={stickerLayerRef}
      className="absolute inset-y-0 left-0 right-0 z-0 hidden [perspective:1400px] lg:block"
    >
      {stickerConfigs.map((sticker) => {
        const offset = stickerOffsets[sticker.id] ?? { x: 0, y: 0 };
        const centerToLeft = sticker.placement.centerX - sticker.width / 2;
        const baseLeft = `calc(50% ${centerToLeft >= 0 ? "+" : "-"} ${Math.abs(centerToLeft)}px)`;
        const baseTop = `${sticker.placement.centerY - sticker.height / 2}px`;

        return (
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
              onOffsetChange(sticker.id, {
                x: offset.x + info.offset.x,
                y: offset.y + info.offset.y,
              });
              onPoseChange(sticker.id, defaultStickerPose);
            }}
            style={{
              left: baseLeft,
              top: baseTop,
              x: offset.x,
            }}
            initial={
              reduceMotion
                ? { opacity: 1, scale: 1, y: offset.y }
                : { opacity: 0, scale: 0.94, y: offset.y + 16 }
            }
            animate={{
              opacity: 1,
              scale: 1,
              y: offset.y,
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
              stiffness: 310,
              damping: 30,
              mass: 0.52,
            }}
            className="absolute z-0 touch-none cursor-grab active:cursor-grabbing [transform-style:preserve-3d] [will-change:transform]"
          >
            <Image
              src={sticker.src}
              alt={sticker.alt}
              width={sticker.width}
              height={sticker.height}
              draggable={false}
              className="pointer-events-none select-none drop-shadow-[0_1px_2px_rgba(65,80,95,0.16)]"
            />
          </motion.div>
        );
      })}
    </div>
  );
}
