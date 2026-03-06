"use client";

import { useReducedMotion } from "motion/react";
import { createContext, useContext } from "react";
import { supportsViewTransitions } from "@/lib/view-transition";

type TransitionVariant = "none" | "subtle" | "context" | "delight";

type AppTransitionContextValue = {
  enabled: boolean;
  reducedMotion: boolean;
  supportsViewTransitions: boolean;
  defaultLinkTransition: "view" | "none";
  defaultSlotVariant: TransitionVariant;
};

const AppTransitionContext = createContext<AppTransitionContextValue>({
  enabled: true,
  reducedMotion: false,
  supportsViewTransitions: false,
  defaultLinkTransition: "none",
  defaultSlotVariant: "subtle",
});

export function AppTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const reducedMotion = useReducedMotion() ?? false;
  const hasViewTransitions = supportsViewTransitions();

  return (
    <AppTransitionContext.Provider
      value={{
        enabled: true,
        reducedMotion,
        supportsViewTransitions: hasViewTransitions,
        defaultLinkTransition:
          hasViewTransitions && !reducedMotion ? "view" : "none",
        defaultSlotVariant: "subtle",
      }}
    >
      {children}
    </AppTransitionContext.Provider>
  );
}

export function useAppTransition() {
  return useContext(AppTransitionContext);
}

export type { TransitionVariant };
