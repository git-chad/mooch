import { useEffect } from "react";

/**
 * Locks body scroll when `enabled` is true.
 * Uses the position:fixed trick required for iOS Safari — plain
 * `overflow:hidden` on body is ignored there.
 */
export function useScrollLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const y = window.scrollY;
    const body = document.body;

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${y}px`;
    body.style.width = "100%";

    return () => {
      body.style.overflow = "";
      body.style.position = "";
      body.style.top = "";
      body.style.width = "";
      window.scrollTo(0, y);
    };
  }, [enabled]);
}
