"use client";

import { useRouter } from "next/navigation";
// biome-ignore lint/style/noRestrictedImports: useEffect needed for IntersectionObserver lifecycle — not derivable from state.
import { useEffect, useRef } from "react";

/**
 * Prefetch a route when an element enters the viewport.
 *
 * Attach the returned ref to any element — once it scrolls into view the
 * route is prefetched exactly once via `router.prefetch`.
 *
 * Particularly useful with `TransitionLink`, which intercepts clicks and
 * navigates via `router.push` — prefetching ensures the RSC payload is
 * already cached when the navigation fires.
 */
export function usePrefetch<T extends HTMLElement = HTMLElement>(
  href: string | null | undefined,
) {
  const ref = useRef<T>(null);
  const router = useRouter();
  const prefetchedHref = useRef<string | null>(null);

  useEffect(() => {
    if (!href) return;

    // Already prefetched this exact href
    if (prefetchedHref.current === href) return;

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && prefetchedHref.current !== href) {
          router.prefetch(href);
          prefetchedHref.current = href;
          observer.disconnect();
        }
      },
      { rootMargin: "50px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [href, router]);

  return ref;
}
