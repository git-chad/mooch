"use client";

import { motion } from "motion/react";
import {
  type TransitionVariant,
  useAppTransition,
} from "@/components/AppTransitionProvider";
import { getSurfaceTransition, motionDuration } from "@/lib/motion";

type Props = {
  children: React.ReactNode;
  className?: string;
  variant?: TransitionVariant;
};

function getVariantState(variant: TransitionVariant, reducedMotion: boolean) {
  if (reducedMotion || variant === "none") {
    return {
      initial: false,
      animate: { opacity: 1 },
      transition: getSurfaceTransition(true, motionDuration.fast),
    };
  }

  if (variant === "delight") {
    return {
      initial: { opacity: 0, y: 12, filter: "blur(8px)" },
      animate: { opacity: 1, y: 0, filter: "blur(0px)" },
      transition: getSurfaceTransition(false, motionDuration.delight),
    };
  }

  if (variant === "context") {
    return {
      initial: { opacity: 0, y: 10, filter: "blur(6px)" },
      animate: { opacity: 1, y: 0, filter: "blur(0px)" },
      transition: getSurfaceTransition(false, motionDuration.standard),
    };
  }

  return {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: getSurfaceTransition(false, motionDuration.fast),
  };
}

export function TransitionSlot({ children, className, variant }: Props) {
  const { enabled, reducedMotion, defaultSlotVariant } = useAppTransition();
  const nextVariant = enabled ? (variant ?? defaultSlotVariant) : "none";
  const state = getVariantState(nextVariant, reducedMotion);

  return (
    <motion.div
      className={className}
      initial={state.initial}
      animate={state.animate}
      transition={state.transition}
    >
      {children}
    </motion.div>
  );
}
