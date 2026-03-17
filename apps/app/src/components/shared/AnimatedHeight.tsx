"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCallback, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Smoothly animates height when children change size.
 * Uses ResizeObserver to measure content, then spring-animates
 * a fixed height value. No `layout` prop — no skew bugs.
 */
export function AnimatedHeight({ children, className }: Props) {
  const reducedMotion = useReducedMotion() ?? false;
  const [height, setHeight] = useState<number | "auto">("auto");
  const prevHeight = useRef<number>(0);

  const measuredRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;

      // Set initial height synchronously
      const h = node.getBoundingClientRect().height;
      if (prevHeight.current === 0) {
        prevHeight.current = h;
        setHeight(h);
      }

      const ro = new ResizeObserver(([entry]) => {
        const newH = entry.contentRect.height;
        if (Math.abs(newH - prevHeight.current) > 0.5) {
          prevHeight.current = newH;
          setHeight(newH);
        }
      });

      ro.observe(node);

      // Cleanup on unmount — ResizeObserver is GC'd when node detaches,
      // but we disconnect explicitly via a MutationObserver-free approach:
      // store the observer on the node so the next call can disconnect it.
      const prev = (node as any).__ro;
      if (prev) prev.disconnect();
      (node as any).__ro = ro;
    },
    [],
  );

  return (
    <motion.div
      className={className}
      style={{ overflow: "hidden" }}
      animate={{ height }}
      transition={
        reducedMotion
          ? { duration: 0.1 }
          : { type: "spring", stiffness: 400, damping: 34, mass: 0.8 }
      }
    >
      <div ref={measuredRef}>{children}</div>
    </motion.div>
  );
}
