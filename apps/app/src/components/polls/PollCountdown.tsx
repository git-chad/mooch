"use client";

import { Text } from "@mooch/ui";
import { useEffect, useState } from "react";

type Props = {
  closesAt: string;
};

function getRemaining(closesAt: string) {
  const diff = new Date(closesAt).getTime() - Date.now();
  if (diff <= 0) return null;

  const totalMin = Math.floor(diff / 60_000);
  const totalHours = Math.floor(totalMin / 60);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = totalMin % 60;

  return { diff, days, hours, minutes, totalHours };
}

function formatRemaining(r: NonNullable<ReturnType<typeof getRemaining>>) {
  if (r.diff < 60_000) return "< 1m";

  // > 48 hours: show days only
  if (r.totalHours > 48) {
    const d = r.days + (r.hours >= 12 ? 1 : 0); // round up if 12+ hours
    return `${d}d left`;
  }

  // ≤ 48 hours: show days + hours + minutes
  if (r.days > 0) return `${r.days}d ${r.hours}h ${r.minutes}m left`;
  if (r.hours > 0) return `${r.hours}h ${r.minutes}m left`;
  return `${r.minutes}m left`;
}

export function PollCountdown({ closesAt }: Props) {
  const [remaining, setRemaining] = useState(() => getRemaining(closesAt));

  useEffect(() => {
    const tick = () => setRemaining(getRemaining(closesAt));
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [closesAt]);

  if (!remaining) return null;

  const isUrgent = remaining.diff < 5 * 60_000;
  const isBreathing = remaining.diff < 60_000;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium select-none"
      style={{
        background: isUrgent ? "#FEF2F2" : "#F7F4F0",
        borderColor: isUrgent ? "#FECACA" : "var(--color-edge)",
        color: isUrgent ? "#DC2626" : "var(--color-ink-subtle)",
      }}
    >
      {isUrgent && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-red-500"
          style={{
            animation: isBreathing
              ? "pulse-breathe 1.2s ease-in-out infinite"
              : "pulse-dot 2s ease-in-out infinite",
          }}
        />
      )}
      <Text variant="caption" color="inherit" className="font-medium">
        {isUrgent && remaining.diff >= 60_000
          ? "Closing soon!"
          : formatRemaining(remaining)}
      </Text>
    </span>
  );
}
