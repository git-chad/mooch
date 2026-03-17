import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export type BadgeVariant = "admin" | "member" | "settled" | "closed" | "past";
export type BadgeSize = "sm" | "md";

type BadgeProps = {
  label: string;
  emoji?: string;
  icon?: ReactNode;
  /** Preset variant — ignored when `color` is provided */
  variant?: BadgeVariant;
  /** Custom hex accent color — derives tinted bg + border automatically */
  color?: string;
  size?: BadgeSize;
  className?: string;
};

type BadgePalette = {
  start: string;
  end: string;
  text: string;
  border: string;
  depth: string;
};

const PRESETS: Record<BadgeVariant, BadgePalette> = {
  admin: {
    start: "#EEF8DF",
    end: "#D9EEBC",
    text: "#2E5A10",
    border: "#B8DA96",
    depth: "#9FBE83",
  },
  member: {
    start: "#F7EFE6",
    end: "#EBDDCD",
    text: "#5A3A1F",
    border: "#D8C2AB",
    depth: "#BCA289",
  },
  settled: {
    start: "#EBF7DA",
    end: "#D2EAAF",
    text: "#2D5513",
    border: "#B2D48B",
    depth: "#99B977",
  },
  closed: {
    start: "#F2EAE2",
    end: "#E1D4C7",
    text: "#4A4038",
    border: "#CDBDAF",
    depth: "#AE9A89",
  },
  past: {
    start: "#F0E8DF",
    end: "#DDCEC1",
    text: "#564B42",
    border: "#C8B8AB",
    depth: "#A89484",
  },
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "text-[10px] px-2 py-[3px] gap-1",
  md: "text-xs px-2.5 py-1 gap-1.5",
};

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function parseHexColor(value: string): { r: number; g: number; b: number } | null {
  const normalized = value.trim();
  const hex = normalized.startsWith("#") ? normalized.slice(1) : normalized;
  if (!/^[\da-fA-F]{3}$|^[\da-fA-F]{6}$/.test(hex)) return null;

  if (hex.length === 3) {
    return {
      r: Number.parseInt(hex[0] + hex[0], 16),
      g: Number.parseInt(hex[1] + hex[1], 16),
      b: Number.parseInt(hex[2] + hex[2], 16),
    };
  }

  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
  };
}

function mixColor(
  source: { r: number; g: number; b: number },
  target: { r: number; g: number; b: number },
  amount: number,
): { r: number; g: number; b: number } {
  return {
    r: clampByte(source.r + (target.r - source.r) * amount),
    g: clampByte(source.g + (target.g - source.g) * amount),
    b: clampByte(source.b + (target.b - source.b) * amount),
  };
}

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }): string {
  const toHex = (part: number) => clampByte(part).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function buildCustomPalette(color: string): BadgePalette | null {
  const base = parseHexColor(color);
  if (!base) return null;

  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };

  return {
    // Keep custom badges lighter so they don't compete with primary CTAs.
    start: rgbToHex(mixColor(base, white, 0.84)),
    end: rgbToHex(mixColor(base, white, 0.68)),
    text: rgbToHex(mixColor(base, black, 0.7)),
    border: rgbToHex(mixColor(base, white, 0.44)),
    depth: rgbToHex(mixColor(base, black, 0.2)),
  };
}

export function Badge({
  label,
  emoji,
  icon,
  variant = "member",
  color,
  size = "md",
  className,
}: BadgeProps) {
  const palette = (color && buildCustomPalette(color)) || PRESETS[variant];

  const style = {
    color: palette.text,
    borderColor: palette.border,
    background: `linear-gradient(165deg, ${palette.start} 0%, ${palette.end} 100%)`,
    boxShadow: [
      "inset 0 1px 0 rgba(255,255,255,0.62)",
      "inset 0 -1px 2px rgba(0,0,0,0.08)",
      `0 1px 0 ${palette.depth}`,
      "0 2px 5px rgba(82,61,45,0.08)",
    ].join(", "),
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center font-sans font-medium",
        "rounded-full border ring-1 ring-inset ring-white/40",
        "whitespace-nowrap select-none",
        sizeClasses[size],
        className,
      )}
      style={style}
    >
      {icon && <span className="leading-none">{icon}</span>}
      {emoji && <span className="leading-none">{emoji}</span>}
      {label}
    </span>
  );
}
