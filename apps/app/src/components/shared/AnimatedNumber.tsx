"use client";

import { useMotionValue, useSpring, useTransform, motion, useReducedMotion } from "motion/react";
import { useEffect } from "react";

type Props = {
  value: number;
  className?: string;
  /** Format function — defaults to Math.round */
  format?: (n: number) => string;
};

export function AnimatedNumber({ value, className, format }: Props) {
  const reducedMotion = useReducedMotion() ?? false;
  const mv = useMotionValue(value);
  const spring = useSpring(mv, {
    stiffness: 300,
    damping: 30,
    mass: 0.8,
  });
  const display = useTransform(spring, (v) =>
    format ? format(v) : String(Math.round(v)),
  );

  useEffect(() => {
    if (reducedMotion) {
      // Skip animation — snap immediately
      mv.jump(value);
    } else {
      mv.set(value);
    }
  }, [value, mv, reducedMotion]);

  return <motion.span className={className}>{display}</motion.span>;
}
