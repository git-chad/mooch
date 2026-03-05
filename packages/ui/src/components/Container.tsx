import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

type ContainerVariant = "site" | "app";

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  variant?: ContainerVariant;
  as?: React.ElementType;
};

/**
 * site — slim editorial layout: max-w-[1440px], mx-auto, 12-col grid, 8px gap, 32px px
 * app  — full-width workspace layout: no max-width, same grid + spacing
 */
export function Container({
  variant = "app",
  as: Tag = "div",
  className,
  children,
  ...props
}: ContainerProps) {
  return (
    <Tag
      className={cn(
        "w-full grid grid-cols-6 sm:grid-cols-12 gap-2 px-4 sm:px-8",
        variant === "site" && "max-w-[1280px] mx-auto",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
