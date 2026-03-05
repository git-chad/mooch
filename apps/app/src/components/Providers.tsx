"use client";

import { Tooltip } from "@base-ui-components/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip.Provider delay={400} closeDelay={100}>
      {children}
    </Tooltip.Provider>
  );
}
