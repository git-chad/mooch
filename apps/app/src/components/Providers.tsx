"use client";

import { Tooltip } from "@base-ui-components/react";
import { AppTransitionProvider } from "./AppTransitionProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppTransitionProvider>
      <Tooltip.Provider delay={400} closeDelay={100}>
        {children}
      </Tooltip.Provider>
    </AppTransitionProvider>
  );
}
