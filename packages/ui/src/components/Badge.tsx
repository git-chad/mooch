import { cn } from "../lib/cn";

export type BadgeVariant = "admin" | "member" | "settled" | "closed" | "past";
export type BadgeSize = "sm" | "md";

type BadgeProps = {
  label: string;
  emoji?: string;
  /** Preset variant — ignored when `color` is provided */
  variant?: BadgeVariant;
  /** Custom hex accent color — derives tinted bg + border automatically */
  color?: string;
  size?: BadgeSize;
  className?: string;
};

const PRESETS: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  admin:   { bg: "#EBF7D8", text: "#3D6B1A", border: "#C7DEB0" },
  member:  { bg: "#EDE3D4", text: "#5C3D20", border: "#D8C8BC" },
  settled: { bg: "#D4EDBC", text: "#2C5A0E", border: "#B4D890" },
  closed:  { bg: "#E0D8D0", text: "#4A4038", border: "#C8C0B8" },
  past:    { bg: "#DDD5CC", text: "#5A5048", border: "#C4B8B0" },
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "text-[10px] px-2 py-0.5 gap-1",
  md: "text-xs px-2.5 py-1 gap-1.5",
};

export function Badge({
  label,
  emoji,
  variant = "member",
  color,
  size = "md",
  className,
}: BadgeProps) {
  // Custom color: derive tinted bg + border from the hex accent
  const style = color
    ? {
        background: `${color}18`,   // ~10% opacity fill
        color,
        borderColor: `${color}38`,  // ~22% opacity border
      }
    : {
        background: PRESETS[variant].bg,
        color: PRESETS[variant].text,
        borderColor: PRESETS[variant].border,
      };

  return (
    <span
      className={cn(
        "inline-flex items-center font-sans font-medium",
        "rounded-full border",
        "whitespace-nowrap select-none",
        sizeClasses[size],
        className,
      )}
      style={style}
    >
      {emoji && <span className="leading-none">{emoji}</span>}
      {label}
    </span>
  );
}
