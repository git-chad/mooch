import { LucideIconByName } from "@mooch/ui";

export const LUCIDE_GROUP_ICON_PREFIX = "lucide:";

export function encodeGroupIcon(iconName: string): string {
  return `${LUCIDE_GROUP_ICON_PREFIX}${iconName}`;
}

export function decodeGroupIcon(value: string | null | undefined): {
  kind: "lucide" | "emoji";
  value: string;
} {
  if (!value) {
    return { kind: "emoji", value: "👥" };
  }

  if (value.startsWith(LUCIDE_GROUP_ICON_PREFIX)) {
    const iconName = value.slice(LUCIDE_GROUP_ICON_PREFIX.length).trim();
    if (iconName) {
      return { kind: "lucide", value: iconName };
    }
  }

  return { kind: "emoji", value };
}

type GroupIconProps = {
  value: string | null | undefined;
  size?: number;
  className?: string;
};

export function GroupIcon({ value, size = 20, className }: GroupIconProps) {
  const decoded = decodeGroupIcon(value);

  if (decoded.kind === "lucide") {
    return (
      <LucideIconByName
        name={decoded.value}
        size={size}
        strokeWidth={1.9}
        className={className}
      />
    );
  }

  return <span className={className}>{decoded.value}</span>;
}
