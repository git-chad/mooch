"use client";

import type { ButtonHTMLAttributes } from "react";
import { useWebHaptics } from "web-haptics/react";
import { cn } from "../lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  // loading: blocks interaction but keeps full visual style + cursor-wait
  loading?: boolean;
};

// Sizes live in globals.css as .btn-sm/md/lg — not Tailwind arbitrary values,
// so they're guaranteed to generate regardless of which app scans this file.
const sizeClasses: Record<ButtonSize, string> = {
  sm: "btn-sm",
  md: "btn-md",
  lg: "btn-lg",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: cn("btn-primary", "border border-[#5A9629]", "text-[#F4FBFF] font-medium"),
  secondary: cn("btn-secondary", "border border-[#D8C8BC]", "text-[#4D6480]"),
  ghost: cn("btn-ghost", "text-[#4F7330]"),
  danger: cn("btn-danger", "border border-[#992B2B]", "text-white font-medium"),
};

const hapticMap: Record<ButtonVariant, string> = {
  primary: "medium",
  secondary: "light",
  ghost: "light",
  danger: "warning",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  disabled,
  loading,
  children,
  onClick,
  ...props
}: ButtonProps) {
  const haptic = useWebHaptics();

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    haptic.trigger(hapticMap[variant]);
    onClick?.(e);
  }

  return (
    // Wrapper carries cursor so it's visible even when the
    // button itself has pointer-events:none (which suppresses :hover styles)
    <span
      className={cn(
        "inline-flex",
        disabled && "cursor-not-allowed",
        loading && "cursor-wait",
      )}
    >
      <button
        // loading: don't pass disabled attr (avoids opacity/grayout), block clicks via pointer-events-none
        disabled={disabled}
        className={cn(
          // layout
          "inline-flex items-center justify-center gap-2 whitespace-nowrap",
          // shape & font — font-sans uses --font-sans → --font-geist-sans
          "rounded-[14px] font-sans",
          // interaction
          "select-none outline-none",
          "focus-visible:ring-2 focus-visible:ring-[#7FBE44] focus-visible:ring-offset-2",
          // disabled: no pointer events (prevents hover styles), reduced opacity
          "disabled:opacity-50 disabled:pointer-events-none",
          // loading: block interaction, keep full visual style
          loading && "pointer-events-none",
          // size & variant
          sizeClasses[size],
          variantClasses[variant],
          className,
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    </span>
  );
}
