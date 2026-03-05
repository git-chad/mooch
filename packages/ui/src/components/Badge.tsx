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
  admin:   { bg: "var(--color-accent-bg)",  text: "var(--color-accent-fg)",  border: "var(--color-accent-edge)" },
  member:  { bg: "var(--badge-member-bg)",  text: "var(--badge-member-fg)",  border: "var(--color-edge)" },
  settled: { bg: "var(--badge-settled-bg)", text: "var(--badge-settled-fg)", border: "var(--badge-settled-edge)" },
  closed:  { bg: "var(--badge-closed-bg)",  text: "var(--badge-closed-fg)",  border: "var(--badge-closed-edge)" },
  past:    { bg: "var(--badge-past-bg)",    text: "var(--badge-past-fg)",    border: "var(--badge-past-edge)" },
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
