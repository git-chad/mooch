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
  | "overline"
  | "web-hero"
  | "web-section"
  | "web-lead"
  | "web-body"
  | "web-ui"
  | "web-ui-strong"
  | "web-chip";

export type TextColor =
  | "default"
  | "subtle"
  | "muted"
  | "label"
  | "placeholder"
  | "info"
  | "danger"
  | "accent"
  | "web-title-hero"
  | "web-title"
  | "web-description"
  | "web-eyebrow"
  | "inherit";

type TextProps = {
  as?: React.ElementType;
  variant?: TextVariant;
  color?: TextColor;
  className?: string;
  children?: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, "color">;

const variantClasses: Record<TextVariant, string> = {
  display: "geist-pixel text-4xl leading-[91%]",
  title: "text-2xl font-semibold font-sans leading-tight",
  heading: "text-lg font-semibold font-sans",
  subheading: "text-base font-semibold font-sans",
  body: "text-sm font-sans",
  label: "text-xs font-medium font-sans",
  caption: "text-xs font-sans",
  overline: "text-[10px] font-semibold font-sans uppercase tracking-widest",
  // Homepage - Final Version (Paper: mooched.app / frame 2PI-0)
  // 80/73, -0.06 tracking, GeistPixel-Circle
  "web-hero": "geist-pixel text-[80px] leading-[73px] tracking-[-0.06em]",
  // 42/44, -0.04 tracking, GeistPixel-Circle
  "web-section": "geist-pixel text-[42px] leading-[44px] tracking-[-0.04em]",
  // 20/32, -0.01 tracking
  "web-lead": "font-sans text-[20px] leading-[32px] tracking-[-0.01em]",
  // 15/20 body copy and footer links
  "web-body": "font-sans text-[15px] leading-[20px]",
  // 13/16 UI labels (inputs/buttons secondary)
  "web-ui": "font-sans text-[13px] leading-[16px]",
  // 13/16 medium (primary CTA labels)
  "web-ui-strong": "font-sans text-[13px] leading-[16px] font-medium",
  // 12/16 chips, tiny pills, pre-hero eyebrow
  "web-chip": "font-sans text-[12px] leading-[16px]",
};

const colorClasses: Record<TextColor, string> = {
  default: "text-ink",
  subtle: "text-ink-sub",
  muted: "text-ink-dim",
  label: "text-ink-label",
  placeholder: "text-ink-placeholder",
  info: "text-ink-info-2",
  danger: "text-danger",
  accent: "text-accent-fg",
  // Homepage - Final Version (Paper: mooched.app / frame 2PI-0)
  "web-title-hero": "text-[#1F2A23]",
  "web-title": "text-[#1E2A35]",
  "web-description": "text-[#6F859B]",
  "web-eyebrow": "text-[#5B7188]",
  inherit: "text-inherit",
};

const defaultColors: Record<TextVariant, TextColor> = {
  display: "default",
  title: "default",
  heading: "default",
  subheading: "default",
  body: "default",
  label: "label",
  caption: "muted",
  overline: "subtle",
  "web-hero": "web-title-hero",
  "web-section": "web-title",
  "web-lead": "web-description",
  "web-body": "web-description",
  "web-ui": "web-description",
  // Context-dependent: CTA labels and chips often carry color from parent.
  "web-ui-strong": "inherit",
  "web-chip": "web-eyebrow",
};

const defaultElements: Record<TextVariant, React.ElementType> = {
  display: "p",
  title: "h1",
  heading: "h2",
  subheading: "h3",
  body: "p",
  label: "span",
  caption: "span",
  overline: "span",
  "web-hero": "h1",
  "web-section": "h2",
  "web-lead": "p",
  "web-body": "p",
  "web-ui": "span",
  "web-ui-strong": "span",
  "web-chip": "span",
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
