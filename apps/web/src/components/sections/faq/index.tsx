"use client";

import { Container, Text } from "@mooch/ui";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { TitleReveal } from "../common/TitleReveal";
import {
  defaultStickerOffsets,
  defaultStickerPoses,
  faqItems,
  stickerConfigs,
} from "./data";
import { FAQItem } from "./FAQItem";
import { StickerLayer } from "./StickerLayer";
import type {
  StickerOffset,
  StickerOffsetMap,
  StickerPose,
  StickerPoseMap,
} from "./types";

const DEFAULT_FAQ_ID = faqItems[0]?.id ?? "";

export function FAQ() {
  const [openId, setOpenId] = useState(DEFAULT_FAQ_ID);
  const reduceMotion = useReducedMotion() === true;
  const searchParams = useSearchParams();
  const layoutMode = searchParams.get("stickers") === "layout";
  const sectionRef = useRef<HTMLDivElement>(null);
  const stickersVisible = useInView(sectionRef, { amount: 0.2, once: true });
  const showStickers = stickersVisible || layoutMode;
  const stickerLayoutSignature = stickerConfigs
    .map(
      (sticker) =>
        `${sticker.id}:${sticker.placement.centerX},${sticker.placement.centerY}`,
    )
    .join("|");

  const [stickerOffsets, setStickerOffsets] = useState<StickerOffsetMap>(
    defaultStickerOffsets,
  );
  const [stickerPoses, setStickerPoses] =
    useState<StickerPoseMap>(defaultStickerPoses);
  const prevLayoutModeRef = useRef(layoutMode);

  const handleStickerOffsetChange = (id: string, nextOffset: StickerOffset) => {
    setStickerOffsets((current) => ({
      ...current,
      [id]: nextOffset,
    }));
  };

  const handleStickerPoseChange = (id: string, nextPose: StickerPose) => {
    setStickerPoses((current) => ({
      ...current,
      [id]: nextPose,
    }));
  };

  useEffect(() => {
    // Reset transient drag state whenever layout mode is toggled on/off.
    if (prevLayoutModeRef.current !== layoutMode) {
      setStickerOffsets(defaultStickerOffsets);
      setStickerPoses(defaultStickerPoses);
      prevLayoutModeRef.current = layoutMode;
    }
  }, [layoutMode]);

  useEffect(() => {
    // Reset while in layout mode when placement config changes (hot reload edits).
    if (!layoutMode || !stickerLayoutSignature) return;
    setStickerOffsets(defaultStickerOffsets);
    setStickerPoses(defaultStickerPoses);
  }, [layoutMode, stickerLayoutSignature]);

  return (
    <div
      ref={sectionRef}
      className="relative min-h-[760px] bg-[#FCFCFB] py-28 md:min-h-[1341px]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(to_bottom,rgba(199,212,225,0.18),rgba(252,252,251,0))]" />

      {layoutMode ? (
        <div className="fixed right-4 top-20 z-[60] max-h-[70vh] w-[320px] overflow-auto rounded-xl border border-[#D0DCE8] bg-white/95 p-3 text-[11px] text-[#334a61] shadow-[0_12px_30px_rgba(70,90,110,0.2)] backdrop-blur-sm">
          <p className="mb-2 font-semibold">Sticker Layout Mode</p>
          <p className="mb-2 text-[#5A7086]">
            Drag stickers, then copy these into `stickerConfigs[].placement`.
          </p>
          {stickerConfigs.map((sticker) => {
            const offset = stickerOffsets[sticker.id] ?? { x: 0, y: 0 };
            return (
              <div
                key={sticker.id}
                className="mb-2 rounded-md bg-[#F4F8FC] p-2"
              >
                <p className="font-medium text-[#2E455C]">{sticker.id}</p>
                <p className="font-mono">
                  {`{ centerX: ${Math.round(sticker.placement.centerX + offset.x)}, centerY: ${Math.round(sticker.placement.centerY + offset.y)} }`}
                </p>
              </div>
            );
          })}
        </div>
      ) : null}

      <Container variant="site" className="relative z-10">
        <div className="col-span-6 col-start-1 sm:col-span-6 sm:col-start-2">
          <div className="flex flex-col items-center">
            <TitleReveal
              as="h2"
              variant="web-section"
              className="mt-6 text-center text-pretty"
              wrapperClassName="max-w-[700px]"
              trigger="inView"
              delay={0.12}
            >
              Questions, answers, and a little desk-chaos energy.
            </TitleReveal>

            <Text
              as="p"
              variant="web-lead"
              color="web-description"
              className="mt-5 max-w-[560px] text-center"
            >
              A playful FAQ stack with big tap targets, layered paper cards, and
              motion that feels light instead of ornamental.
            </Text>
          </div>

          <div className="relative mt-16">
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={
                    reduceMotion
                      ? { opacity: 0 }
                      : {
                          opacity: 0,
                          y: 22,
                          rotate: index % 2 === 0 ? -1.2 : 1.2,
                        }
                  }
                  whileInView={
                    reduceMotion
                      ? { opacity: 1 }
                      : { opacity: 1, y: 0, rotate: 0 }
                  }
                  viewport={{ once: true, amount: 0.28 }}
                  transition={{
                    type: "spring",
                    stiffness: 220,
                    damping: 20,
                    mass: 0.85,
                    delay: 0.05 * index,
                  }}
                >
                  <FAQItem
                    item={item}
                    isOpen={openId === item.id}
                    onToggle={() =>
                      setOpenId((current) =>
                        current === item.id ? DEFAULT_FAQ_ID : item.id,
                      )
                    }
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Container>

      <StickerLayer
        key={`${showStickers ? "visible" : "hidden"}:${layoutMode ? "layout" : "live"}:${stickerLayoutSignature}`}
        reduceMotion={reduceMotion}
        isVisible={showStickers}
        stickerOffsets={stickerOffsets}
        stickerPoses={stickerPoses}
        onOffsetChange={handleStickerOffsetChange}
        onPoseChange={handleStickerPoseChange}
      />
    </div>
  );
}
