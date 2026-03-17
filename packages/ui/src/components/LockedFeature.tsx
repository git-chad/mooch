import { cn } from "../lib/cn";

type LockedFeatureProps = {
  /** Text shown next to the lock icon */
  label?: string;
  /** Which plan unlocks this feature */
  upgradeTo?: "Pro" | "Club";
  className?: string;
  children?: React.ReactNode;
};

export function LockedFeature({
  label,
  upgradeTo = "Pro",
  className,
  children,
}: LockedFeatureProps) {
  return (
    <div
      className={cn(
        "relative flex items-center gap-2 rounded-lg px-3 py-2",
        "text-sm opacity-60",
        className,
      )}
      title={`Upgrade to ${upgradeTo}`}
    >
      <span className="shrink-0" aria-hidden="true">
        🔒
      </span>
      <span className="text-[var(--color-text-secondary)]">
        {label ?? children ?? `Upgrade to ${upgradeTo}`}
      </span>
      <a
        href="/pricing"
        className="ml-auto shrink-0 text-xs font-medium text-[var(--color-accent-fg)] hover:underline"
      >
        Upgrade to {upgradeTo} →
      </a>
    </div>
  );
}
