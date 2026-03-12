"use client";

import { Container, cn, Text } from "@mooch/ui";
import { motion, useReducedMotion } from "motion/react";
import { useId, useRef, useState } from "react";
import { TitleReveal } from "../common/TitleReveal";

const faqItems = [
  {
    id: "money",
    question: "Is mooch only for splitting expenses?",
    answer:
      "No. Expenses are one part of it, but the product is built for the whole group mess: plans, votes, reminders, and the tiny decisions nobody wants to coordinate manually.",
    accent: "bg-[#FFF0E5] border-[#E7BEA0] text-[#8F5732]",
  },
  {
    id: "free",
    question: "Is it free when it launches?",
    answer:
      "Yes, the current direction is to keep the barrier to entry basically nonexistent. The idea is fast setup, low friction, and no weird commitment just to try it with your people.",
    accent: "bg-[#EEF5FE] border-[#CCDDF0] text-[#5B7188]",
  },
  {
    id: "invite",
    question: "Do I need everyone to join at the same time?",
    answer:
      "No. One person can start, invite the others later, and keep the squad moving. The product should feel useful even when your group is half-organized.",
    accent: "bg-[#F1F9E8] border-[#C7DEB0] text-[#4F7330]",
  },
  {
    id: "chaos",
    question: "What kind of chaos is this actually good at?",
    answer:
      "Trips, house expenses, dinner planning, vote-heavy decisions, and any recurring friend-group admin that usually ends up scattered across six chats and one confused spreadsheet.",
    accent: "bg-[#F5EFFB] border-[#D4C8E3] text-[#6E5A88]",
  },
  {
    id: "serious",
    question: "Is this supposed to be playful or serious?",
    answer:
      "Both. The product voice can be playful, but the interaction model should still feel reliable when money, coordination, and shared decisions are involved.",
    accent: "bg-[#FFF6C9] border-[#E5D06A] text-[#746109]",
  },
] as const;

const scrapbookNotes = [
  {
    id: "tiny-wins",
    title: "tiny wins",
    body: "fast answers, less group-chat archaeology",
    className:
      "w-[170px] bg-[#FFF4D7] text-[#715A12] shadow-[0_18px_30px_rgba(140,108,24,0.14)]",
    positionClass: "left-[max(24px,calc(50%-660px))] top-[220px]",
  },
  {
    id: "social-glue",
    title: "social glue",
    body: "designed for chaos, not enterprise workflows",
    className:
      "w-[200px] bg-[#EAF4FF] text-[#49647E] shadow-[0_18px_34px_rgba(63,91,116,0.14)]",
    positionClass: "right-[max(20px,calc(50%-670px))] top-[360px]",
  },
  {
    id: "no-spreadsheet-era",
    title: "no spreadsheet era",
    body: "keep the vibe, remove the admin drag",
    className:
      "w-[180px] bg-[#F4EFFF] text-[#64527E] shadow-[0_18px_34px_rgba(94,76,120,0.14)]",
    positionClass: "left-[max(40px,calc(50%-610px))] bottom-[160px]",
  },
] as const;

const badgeSticker = {
  id: "ask-away",
  positionClass: "bottom-[190px] right-[max(36px,calc(50%-600px))]",
} as const;

type StickerOffset = { x: number; y: number };
type StickerOffsetMap = Record<string, StickerOffset>;
type StickerStateMap = Record<string, boolean>;

const defaultStickerOffsets: StickerOffsetMap = {
  "tiny-wins": { x: 0, y: 0 },
  "social-glue": { x: 0, y: 0 },
  "no-spreadsheet-era": { x: 0, y: 0 },
  "ask-away": { x: 0, y: 0 },
};

const defaultStickerDragState: StickerStateMap = {
  "tiny-wins": false,
  "social-glue": false,
  "no-spreadsheet-era": false,
  "ask-away": false,
};

function FAQItem({
  item,
  isOpen,
  onToggle,
}: {
  item: (typeof faqItems)[number];
  isOpen: boolean;
  onToggle: () => void;
}) {
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

export function FAQ() {
  const [openId, setOpenId] = useState<(typeof faqItems)[number]["id"]>(
    faqItems[0].id,
  );
  const reduceMotion = useReducedMotion();
  const stickerLayerRef = useRef<HTMLDivElement>(null);
  const [stickerOffsets, setStickerOffsets] = useState<StickerOffsetMap>(
    defaultStickerOffsets,
  );
  const [draggingStickers, setDraggingStickers] = useState<StickerStateMap>(
    defaultStickerDragState,
  );

  const updateStickerOffset = (id: string, nextOffset: StickerOffset) => {
    setStickerOffsets((current) => ({
      ...current,
      [id]: nextOffset,
    }));
  };

  const setStickerDragging = (id: string, isDragging: boolean) => {
    setDraggingStickers((current) => ({
      ...current,
      [id]: isDragging,
    }));
  };

  return (
    <div className="relative bg-[#FCFCFB] py-28">
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
                        current === item.id ? faqItems[0].id : item.id,
                      )
                    }
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Container>

      <div
        ref={stickerLayerRef}
        className="absolute inset-y-0 left-0 right-0 z-0 hidden lg:block"
      >
        {scrapbookNotes.map((note, index) => (
          <motion.div
            key={note.title}
            drag
            dragConstraints={stickerLayerRef}
            dragElastic={0.08}
            dragMomentum={false}
            onPointerDown={() => setStickerDragging(note.id, true)}
            onPointerUp={() => setStickerDragging(note.id, false)}
            onPointerCancel={() => setStickerDragging(note.id, false)}
            onDragStart={() => setStickerDragging(note.id, true)}
            onDragEnd={(_, info) => {
              setStickerDragging(note.id, false);
              const currentOffset = stickerOffsets[note.id] ?? { x: 0, y: 0 };
              updateStickerOffset(note.id, {
                x: currentOffset.x + info.offset.x,
                y: currentOffset.y + info.offset.y,
              });
            }}
            style={{
              x: stickerOffsets[note.id]?.x ?? 0,
              y: stickerOffsets[note.id]?.y ?? 0,
              scale: draggingStickers[note.id] ? 1.12 : 1,
            }}
            initial={
              reduceMotion
                ? { opacity: 0 }
                : {
                    opacity: 0,
                    scale: 0.94,
                    y: 18,
                    rotate: index === 1 ? 5 : -5,
                  }
            }
            whileInView={{
              opacity: 1,
              scale: 1,
              y: 0,
              rotate: index === 1 ? 4 : -4,
            }}
            viewport={{ once: true, amount: 0.4 }}
            whileHover={
              reduceMotion
                ? undefined
                : {
                    scale: 1.03,
                    rotate: index === 1 ? 1 : -1,
                  }
            }
            whileDrag={
              reduceMotion ? undefined : { scale: 1.06, rotate: 0, zIndex: 1 }
            }
            transition={{
              type: "spring",
              stiffness: 220,
              damping: 20,
              mass: 0.9,
              delay: 0.18 + index * 0.07,
            }}
            className={cn(
              "absolute rounded-[24px] border border-black/5 px-5 py-5 pointer-events-auto touch-none cursor-grab active:cursor-grabbing",
              note.className,
              note.positionClass,
            )}
          >
            <div className="absolute left-1/2 top-0 h-6 w-20 -translate-x-1/2 -translate-y-1/2 rotate-[-4deg] rounded-[7px] bg-white/65 shadow-[0_4px_12px_rgba(255,255,255,0.55)]" />
            <Text
              as="p"
              className="geist-pixel text-[18px] leading-[18px] tracking-[-0.04em]"
            >
              {note.title}
            </Text>
            <Text
              as="p"
              className="mt-3 text-[14px] leading-[20px] text-current/85"
            >
              {note.body}
            </Text>
          </motion.div>
        ))}

        <motion.div
          drag
          dragConstraints={stickerLayerRef}
          dragElastic={0.08}
          dragMomentum={false}
          onPointerDown={() => setStickerDragging(badgeSticker.id, true)}
          onPointerUp={() => setStickerDragging(badgeSticker.id, false)}
          onPointerCancel={() => setStickerDragging(badgeSticker.id, false)}
          onDragStart={() => setStickerDragging(badgeSticker.id, true)}
          onDragEnd={(_, info) => {
            setStickerDragging(badgeSticker.id, false);
            const currentOffset = stickerOffsets[badgeSticker.id] ?? {
              x: 0,
              y: 0,
            };
            updateStickerOffset(badgeSticker.id, {
              x: currentOffset.x + info.offset.x,
              y: currentOffset.y + info.offset.y,
            });
          }}
          style={{
            x: stickerOffsets[badgeSticker.id]?.x ?? 0,
            y: stickerOffsets[badgeSticker.id]?.y ?? 0,
            scale: draggingStickers[badgeSticker.id] ? 1.14 : 1,
          }}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          whileDrag={
            reduceMotion ? undefined : { scale: 1.08, rotate: 0, zIndex: 1 }
          }
          viewport={{ once: true, amount: 0.5 }}
          transition={{
            delay: 0.34,
            type: "spring",
            stiffness: 220,
            damping: 20,
            mass: 0.9,
          }}
          className={cn(
            "pointer-events-auto absolute z-0 flex h-28 w-28 rotate-[8deg] touch-none cursor-grab active:cursor-grabbing items-center justify-center rounded-full border border-[#D4DEE8] bg-[radial-gradient(circle_at_35%_30%,#FFFFFF_0%,#F0F6FC_45%,#DCEAF6_100%)] shadow-[0_20px_34px_rgba(95,123,146,0.14)]",
            badgeSticker.positionClass,
          )}
        >
          <Text
            as="p"
            className="geist-pixel max-w-[72px] text-center text-[20px] leading-[18px] tracking-[-0.05em] text-[#49647E]"
          >
            ask away
          </Text>
        </motion.div>
      </div>
    </div>
  );
}
