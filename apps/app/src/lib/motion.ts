import type { Transition } from "motion/react";

export const motionDuration = {
  fast: 0.16,
  standard: 0.22,
  layout: 0.26,
  sheet: 0.5,
  delight: 0.28,
} as const;

export const motionEase = {
  out: [0.22, 1, 0.36, 1],
  standard: [0.32, 0.72, 0, 1],
} as const;

export const layoutSpring: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.82,
};

export function getLayoutTransition(reducedMotion: boolean): Transition {
  if (reducedMotion) {
    return {
      duration: motionDuration.fast,
      ease: motionEase.out,
    };
  }

  return layoutSpring;
}

export function getSurfaceTransition(
  reducedMotion: boolean,
  duration: number = motionDuration.standard,
): Transition {
  return {
    duration: reducedMotion ? motionDuration.fast : duration,
    ease: motionEase.out,
  };
}
