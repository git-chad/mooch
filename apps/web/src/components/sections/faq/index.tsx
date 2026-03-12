"use client";

import { Container, Text } from "@mooch/ui";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { TitleReveal } from "../common/TitleReveal";
import { defaultStickerOffsets, defaultStickerPoses, faqItems } from "./data";
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

  const [stickerOffsets, setStickerOffsets] = useState<StickerOffsetMap>(
    defaultStickerOffsets,
  );
  const [stickerPoses, setStickerPoses] =
    useState<StickerPoseMap>(defaultStickerPoses);

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

  return (
    <div className="relative min-h-[760px] bg-[#FCFCFB] py-28 md:min-h-[1341px]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(to_bottom,rgba(199,212,225,0.18),rgba(252,252,251,0))]" />

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
        reduceMotion={reduceMotion}
        stickerOffsets={stickerOffsets}
        stickerPoses={stickerPoses}
        onOffsetChange={handleStickerOffsetChange}
        onPoseChange={handleStickerPoseChange}
      />
    </div>
  );
}
