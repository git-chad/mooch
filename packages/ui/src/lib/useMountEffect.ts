"use client";

// biome-ignore lint/style/noRestrictedImports: This hook is the single explicit escape hatch for mount-only effects.
import { useEffect } from "react";

/**
 * Escape hatch for one-time external sync on mount/unmount.
 * Prefer derived state and event handlers before using this.
 */
// biome-ignore lint/suspicious/noConfusingVoidType: React effect callbacks return void or a cleanup function by design.
export function useMountEffect(effect: () => void | (() => void)) {
  useEffect(effect, []);
}
