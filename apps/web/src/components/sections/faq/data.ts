import type {
  FAQItemData,
  StickerConfig,
  StickerOffsetMap,
  StickerPose,
  StickerPoseMap,
} from "./types";

export const faqItems: readonly FAQItemData[] = [
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
];

export const stickerConfigs: readonly StickerConfig[] = [
  {
    id: "sticker-chaos-club",
    src: "/images/stickers/bigjeff.png",
    alt: "Big Jeff sticker",
    width: 190,
    height: 200,
    baseRotate: -7,
    positionClass: "left-[max(20px,calc(50%-670px))] top-[210px]",
  },
  {
    id: "sticker-group-admin",
    src: "/images/stickers/fentfloyd.png",
    alt: "Fent Floyd sticker",
    width: 210,
    height: 210,
    baseRotate: 6,
    positionClass: "right-[max(16px,calc(50%-690px))] top-[340px]",
  },
  {
    id: "sticker-no-spreadsheet",
    src: "/images/stickers/goy.png",
    alt: "Goy sticker",
    width: 220,
    height: 180,
    baseRotate: -5,
    positionClass: "left-[max(36px,calc(50%-620px))] bottom-[150px]",
  },
  {
    id: "sticker-ask-away",
    src: "/images/stickers/pepe.png",
    alt: "Pepe sticker",
    width: 148,
    height: 148,
    baseRotate: 8,
    positionClass: "bottom-[190px] right-[max(34px,calc(50%-610px))]",
  },
  {
    id: "sticker-vote-later",
    src: "/images/stickers/pika.png",
    alt: "Pika sticker",
    width: 190,
    height: 190,
    baseRotate: 4,
    positionClass: "right-[max(38px,calc(50%-620px))] bottom-[44px]",
  },
];

export const defaultStickerPose: StickerPose = {
  rotateX: 0,
  rotateY: 0,
  twist: 0,
};

export const defaultStickerOffsets: StickerOffsetMap = Object.fromEntries(
  stickerConfigs.map((sticker) => [sticker.id, { x: 0, y: 0 }]),
) as StickerOffsetMap;

export const defaultStickerPoses: StickerPoseMap = Object.fromEntries(
  stickerConfigs.map((sticker) => [sticker.id, { ...defaultStickerPose }]),
) as StickerPoseMap;
