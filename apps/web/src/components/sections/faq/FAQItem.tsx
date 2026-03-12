"use client";

import { cn, Text } from "@mooch/ui";
import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";
import type { FAQItemData } from "./types";

type FAQItemProps = {
  item: FAQItemData;
  isOpen: boolean;
  onToggle: () => void;
};

export function FAQItem({ item, isOpen, onToggle }: FAQItemProps) {
  const panelId = useId();
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      initial={false}
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: -3,
              rotate: isOpen ? 0 : -0.35,
            }
      }
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 24,
        mass: 0.8,
      }}
      className={cn(
        "relative overflow-hidden rounded-[28px] p-2",
        isOpen
          ? "bg-white shadow-[0_22px_40px_rgba(95,123,146,0.16)]"
          : "bg-[#FFFFFFCC] shadow-[0_12px_24px_rgba(95,123,146,0.08)]",
      )}
    >
      <div className="pointer-events-none absolute left-6 top-0 h-5 w-16 -translate-y-1/2 rotate-[-5deg] rounded-[6px] bg-[#FFF7D9]/85 shadow-[0_2px_10px_rgba(122,110,32,0.12)]" />

      <motion.button
        type="button"
        whileTap={reduceMotion ? undefined : { scale: 0.992 }}
        className="block w-full rounded-[22px] px-4 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#7FBE44] focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:px-5"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <div
              className={cn(
                "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em]",
                item.accent,
              )}
            >
              FAQ
            </div>
            <Text
              as="h3"
              className="mt-3 text-[20px] leading-[24px] text-[#20303C] sm:text-[22px] sm:leading-[26px]"
            >
              {item.question}
            </Text>
          </div>

          <motion.span
            animate={{ rotate: isOpen ? 45 : 0, scale: isOpen ? 1.06 : 1 }}
            transition={{
              type: "spring",
              stiffness: 340,
              damping: 22,
              mass: 0.7,
            }}
            className="mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-[#D7E1EA] bg-[#F6FAFD] text-[26px] leading-none text-[#587089] shadow-[0_6px_14px_rgba(95,123,146,0.10)]"
          >
            +
          </motion.span>
        </div>

        <motion.div
          id={panelId}
          initial={false}
          animate={
            isOpen
              ? {
                  gridTemplateRows: "1fr",
                  opacity: 1,
                  y: 0,
                }
              : {
                  gridTemplateRows: "0fr",
                  opacity: reduceMotion ? 0 : 0.2,
                  y: reduceMotion ? 0 : -4,
                }
          }
          transition={
            reduceMotion
              ? { duration: 0.16, ease: "easeOut" }
              : {
                  type: "spring",
                  stiffness: 280,
                  damping: 28,
                  mass: 0.72,
                }
          }
          className={cn(
            "grid overflow-hidden",
            !isOpen && "pointer-events-none",
          )}
        >
          <div className="min-h-0 px-0 pt-4 pb-1">
            <div className="rounded-[22px] py-4">
              <Text
                as="p"
                className="max-w-[42ch] text-[15px] leading-[24px] text-[#5B7188]"
              >
                {item.answer}
              </Text>
            </div>
          </div>
        </motion.div>
      </motion.button>
    </motion.article>
  );
}
