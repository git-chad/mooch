export type FAQItemData = {
  id: string;
  question: string;
  answer: string;
  accent: string;
};

export type StickerConfig = {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  baseRotate: number;
  // Position center point in px:
  // centerX: horizontal offset from section center line
  // centerY: vertical offset from section top
  placement: {
    centerX: number;
    centerY: number;
  };
};

export type StickerOffset = { x: number; y: number };
export type StickerOffsetMap = Record<string, StickerOffset>;

export type StickerPose = {
  rotateX: number;
  rotateY: number;
  twist: number;
};
export type StickerPoseMap = Record<string, StickerPose>;
