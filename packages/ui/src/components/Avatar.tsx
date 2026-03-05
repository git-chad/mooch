"use client";

import { forwardRef, useState, type HTMLAttributes } from "react";
import { Tooltip } from "@base-ui-components/react";
import { cn } from "../lib/cn";

export type AvatarSize = "sm" | "md" | "lg";

type AvatarProps = {
  src?: string | null;
  name: string;
  size?: AvatarSize;
  /** Set to false to suppress the name tooltip */
  tooltip?: boolean;
  className?: string;
};

const sizes: Record<AvatarSize, { outer: string; text: string }> = {
  sm: { outer: "w-7 h-7",   text: "text-[10px] tracking-wide" },
  md: { outer: "w-9 h-9",   text: "text-[11px] tracking-wide" },
  lg: { outer: "w-12 h-12", text: "text-sm" },
};

// Warm, muted palette — deterministic per name
const PALETTES = [
  { bg: "#EAD5C2", fg: "#5C3D20" },
  { bg: "#C5D9B0", fg: "#2C4A1A" },
  { bg: "#C2D0E0", fg: "#1E3A52" },
  { bg: "#DCC8D8", fg: "#4A2650" },
  { bg: "#D4C8A8", fg: "#4A3A10" },
  { bg: "#C8D8D4", fg: "#1E3A34" },
  { bg: "#E0CAC0", fg: "#5A2A18" },
  { bg: "#D0D8C0", fg: "#283C1E" },
];

// Gradient border: bright top-left → dark bottom-right for the 3D rim effect
const BORDER_GRADIENT =
  "linear-gradient(145deg, rgba(255,255,255,0.82) 0%, rgba(0,0,0,0.20) 100%)";

// Inner highlight: top shine + bottom depth = glossy sphere
const GLOSS_SHADOW =
  "inset 0 1.5px 3px rgba(255,255,255,0.55), inset 0 -1.5px 3px rgba(0,0,0,0.10)";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getPalette(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return PALETTES[h % PALETTES.length];
}

// forwardRef so Tooltip.Trigger can attach its ref and inject event handlers
const AvatarBubble = forwardRef<
  HTMLSpanElement,
  Omit<AvatarProps, "tooltip"> & HTMLAttributes<HTMLSpanElement>
>(function AvatarBubble({ src, name, size = "md", className, ...htmlProps }, ref) {
    const [failed, setFailed] = useState(false);
    const showImage = !!src && !failed;
    const p = getPalette(name);
    const s = sizes[size];

    return (
      // Outer: gradient "border" via background + padding
      <span
        ref={ref}
        {...htmlProps}
        className={cn(
          "inline-flex shrink-0 rounded-full p-[1.5px] select-none",
          s.outer,
          className,
        )}
        style={{ background: BORDER_GRADIENT }}
      >
        {/* Inner: actual avatar surface with gloss shadow */}
        <span
          className="w-full h-full rounded-full overflow-hidden inline-flex items-center justify-center"
          style={{
            background: showImage ? "var(--avatar-placeholder)" : p.bg,
            boxShadow: GLOSS_SHADOW,
          }}
        >
          {showImage ? (
            <img
              src={src}
              alt={name}
              className="w-full h-full object-cover"
              onError={() => setFailed(true)}
            />
          ) : (
            <span
              className={cn("font-semibold leading-none font-sans", s.text)}
              style={{ color: p.fg }}
            >
              {getInitials(name)}
            </span>
          )}
        </span>
      </span>
    );
  },
);

export function Avatar({ tooltip = true, name, ...rest }: AvatarProps) {
  if (!tooltip) return <AvatarBubble name={name} {...rest} />;

  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={<AvatarBubble name={name} {...rest} />} />
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={6}>
          <Tooltip.Popup className="avatar-tooltip">{name}</Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
