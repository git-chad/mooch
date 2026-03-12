import React from "react";
import { cn } from "../lib/cn";

type ContainerVariant = "site" | "app";

type ContainerProps = {
  variant?: ContainerVariant;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

/**
 * site — slim editorial layout: max-w-[1440px], mx-auto, 12-col grid, 8px gap, 32px px
 * app  — full-width workspace layout: no max-width, same grid + spacing
 */
export function Container({
  variant = "app",
  as,
  className,
  children,
  ...props
}: ContainerProps) {
  const Tag = (as ?? "div") as keyof React.JSX.IntrinsicElements;

  return React.createElement(
    Tag,
    {
      className: cn(
        "w-full grid grid-cols-6 sm:grid-cols-12 gap-2 px-4 sm:px-8",
        variant === "site" && "max-w-[1280px] mx-auto",
        className,
      ),
      ...props,
    },
    children,
  );
}
