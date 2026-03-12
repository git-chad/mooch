import React from "react";
import { cn } from "../lib/cn";

export type TextVariant =
  | "display"
  | "title"
  | "heading"
  | "subheading"
  | "body"
  | "label"
  | "caption"
  | "overline";

export type TextColor =
  | "default"
  | "subtle"
  | "muted"
  | "label"
  | "placeholder"
  | "info"
  | "danger"
  | "accent"
  | "inherit";

type TextProps = {
  as?: React.ElementType;
  variant?: TextVariant;
  color?: TextColor;
  className?: string;
  children?: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, "color">;

const variantClasses: Record<TextVariant, string> = {
  display:    "geist-pixel text-4xl leading-tight",
  title:      "text-2xl font-semibold font-sans leading-tight",
  heading:    "text-lg font-semibold font-sans",
  subheading: "text-base font-semibold font-sans",
  body:       "text-sm font-sans",
  label:      "text-xs font-medium font-sans",
  caption:    "text-xs font-sans",
  overline:   "text-[10px] font-semibold font-sans uppercase tracking-widest",
};

const colorClasses: Record<TextColor, string> = {
  default:     "text-ink",
  subtle:      "text-ink-sub",
  muted:       "text-ink-dim",
  label:       "text-ink-label",
  placeholder: "text-ink-placeholder",
  info:        "text-ink-info-2",
  danger:      "text-danger",
  accent:      "text-accent-fg",
  inherit:     "text-inherit",
};

const defaultColors: Record<TextVariant, TextColor> = {
  display:    "default",
  title:      "default",
  heading:    "default",
  subheading: "default",
  body:       "default",
  label:      "label",
  caption:    "muted",
  overline:   "subtle",
};

const defaultElements: Record<TextVariant, React.ElementType> = {
  display:    "p",
  title:      "h1",
  heading:    "h2",
  subheading: "h3",
  body:       "p",
  label:      "span",
  caption:    "span",
  overline:   "span",
};

export function Text({
  as,
  variant = "body",
  color,
  className,
  children,
  ...props
}: TextProps) {
  const Tag = as ?? defaultElements[variant];
  const resolvedColor = color ?? defaultColors[variant];

  return React.createElement(
    Tag,
    {
      className: cn(
        variantClasses[variant],
        colorClasses[resolvedColor],
        className,
      ),
      ...props,
    },
    children,
  );
}
