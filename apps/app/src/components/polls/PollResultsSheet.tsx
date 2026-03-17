"use client";

import type { PollOptionWithVotes, PollWithOptions } from "@mooch/stores";
import { Sheet, Text } from "@mooch/ui";
import { Crown, Download } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { AnimatedHeight } from "@/components/shared/AnimatedHeight";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { motionDuration, motionEase } from "@/lib/motion";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poll: PollWithOptions;
  displayOptions: PollOptionWithVotes[];
  displayTotal: number;
  winnerIds: Set<string>;
};

type ViewMode = "bar" | "donut";

// Warm palette for donut segments
const DONUT_COLORS = [
  "#C8963E", // gold
  "#5B8C5A", // sage
  "#B85C38", // terracotta
  "#3D6B99", // slate blue
  "#9B59B6", // purple
  "#E67E22", // orange
  "#27AE60", // emerald
  "#C0392B", // crimson
];

function getSegmentColor(index: number): string {
  return DONUT_COLORS[index % DONUT_COLORS.length];
}

export function PollResultsSheet({
  open,
  onOpenChange,
  poll,
  displayOptions,
  displayTotal,
  winnerIds,
}: Props) {
  const reducedMotion = useReducedMotion() ?? false;
  const [viewMode, setViewMode] = useState<ViewMode>("bar");
  const chartRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!chartRef.current || downloading) return;
    setDownloading(true);

    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(chartRef.current, {
        backgroundColor: "#FFFFFF",
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      const slug = poll.question
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40);
      link.download = `mooch-poll-${slug}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      // html-to-image may not be installed yet — graceful fallback
      console.error("Failed to download chart image");
    } finally {
      setDownloading(false);
    }
  }, [poll.question, downloading]);

  const sorted = [...displayOptions].sort(
    (a, b) => b.weighted_count - a.weighted_count,
  );

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Poll Results"
      description={poll.question}
    >
      <div className="space-y-5">
        {/* View mode toggle */}
        <div className="flex gap-1 p-1 rounded-lg bg-[#F7F4F0]">
          <ToggleButton
            active={viewMode === "bar"}
            onClick={() => setViewMode("bar")}
          >
            Bar chart
          </ToggleButton>
          <ToggleButton
            active={viewMode === "donut"}
            onClick={() => setViewMode("donut")}
          >
            Donut chart
          </ToggleButton>
        </div>

        {/* Chart area */}
        <div ref={chartRef} className="p-4 rounded-xl bg-white">
          {/* Title for download */}
          <Text variant="subheading" className="mb-4 font-semibold">
            {poll.question}
          </Text>

          <AnimatedHeight>
            {viewMode === "bar" ? (
              <BarChartView
                key="bar"
                options={sorted}
                total={displayTotal}
                winnerIds={winnerIds}
                isClosed={poll.is_closed}
                reducedMotion={reducedMotion}
              />
            ) : (
              <DonutChartView
                key="donut"
                options={sorted}
                total={displayTotal}
                reducedMotion={reducedMotion}
              />
            )}
          </AnimatedHeight>

          {/* Watermark for download */}
          <Text variant="caption" color="subtle" className="mt-4 text-center">
            mooch
          </Text>
        </div>

        {/* Download button */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors"
          style={{
            background: "#F7F4F0",
            border: "1px solid var(--color-edge)",
            color: "var(--color-ink)",
            opacity: downloading ? 0.6 : 1,
          }}
        >
          <Download className="w-4 h-4" />
          {downloading ? "Downloading..." : "Download as image"}
        </button>
      </div>
    </Sheet>
  );
}

/* ── Bar Chart ── */
function BarChartView({
  options,
  total,
  winnerIds,
  isClosed,
  reducedMotion,
}: {
  options: PollOptionWithVotes[];
  total: number;
  winnerIds: Set<string>;
  isClosed: boolean;
  reducedMotion: boolean;
}) {
  const maxCount = Math.max(...options.map((o) => o.weighted_count), 1);

  return (
    <div className="space-y-3">
      {options.map((option, i) => {
        const pct = total > 0 ? (option.weighted_count / total) * 100 : 0;
        const barWidth = (option.weighted_count / maxCount) * 100;
        const isWinner = winnerIds.has(option.id);
        const isLeading = option.weighted_count === maxCount && maxCount > 0;

        return (
          <div key={option.id} className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                {isWinner && isClosed && (
                  <Crown className="w-3.5 h-3.5 shrink-0" style={{ color: "#C8963E" }} />
                )}
                <Text
                  variant="label"
                  color="default"
                  className="truncate"
                >
                  {option.text}
                </Text>
              </div>
              <Text variant="label" color="subtle" className="shrink-0 tabular-nums">
                {Math.round(pct)}% ({option.weighted_count})
              </Text>
            </div>
            <div
              className="w-full rounded-full overflow-hidden"
              style={{
                height: 10,
                background: "rgba(0, 0, 0, 0.04)",
              }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: isWinner
                    ? "linear-gradient(90deg, #C8963E, #D4A84E)"
                    : getSegmentColor(i),
                  boxShadow: isLeading
                    ? `0 0 8px ${getSegmentColor(i)}60`
                    : "none",
                }}
                initial={reducedMotion ? false : { width: 0 }}
                animate={{ width: `${barWidth}%` }}
                transition={
                  reducedMotion
                    ? { duration: 0.1 }
                    : {
                        type: "spring",
                        stiffness: 200,
                        damping: 25,
                        delay: i * 0.08,
                      }
                }
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Donut Chart ── */
function DonutChartView({
  options,
  total,
  reducedMotion,
}: {
  options: PollOptionWithVotes[];
  total: number;
  reducedMotion: boolean;
}) {
  const size = 180;
  const strokeWidth = size * 0.2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Build segments
  let cumulative = 0;
  const segments = options
    .filter((o) => o.weighted_count > 0)
    .map((option, i) => {
      const fraction = total > 0 ? option.weighted_count / total : 0;
      const dashLength = fraction * circumference;
      const dashOffset = -cumulative * circumference;
      cumulative += fraction;

      return {
        option,
        color: getSegmentColor(i),
        dashLength,
        dashOffset,
        fraction,
        index: i,
      };
    });

  return (
    <div className="flex flex-col items-center gap-4">
      {/* SVG donut */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(0,0,0,0.04)"
            strokeWidth={strokeWidth}
          />
          {/* Segments */}
          {segments.map((seg) => (
            <motion.circle
              key={seg.option.id}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
              initial={
                reducedMotion
                  ? false
                  : { strokeDasharray: `0 ${circumference}` }
              }
              animate={{
                strokeDasharray: `${seg.dashLength} ${circumference - seg.dashLength}`,
              }}
              style={{ strokeDashoffset: seg.dashOffset }}
              transition={
                reducedMotion
                  ? { duration: 0.1 }
                  : {
                      type: "spring",
                      stiffness: 120,
                      damping: 20,
                      delay: seg.index * 0.1,
                    }
              }
            />
          ))}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatedNumber
            value={total}
            className="text-2xl font-bold text-[var(--color-ink)] tabular-nums"
          />
          <Text variant="caption" color="subtle">
            votes
          </Text>
        </div>
      </div>

      {/* Legend */}
      <div className="w-full space-y-1.5">
        {options.map((option, i) => {
          const pct =
            total > 0 ? Math.round((option.weighted_count / total) * 100) : 0;
          return (
            <div key={option.id} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  background:
                    option.weighted_count > 0 ? getSegmentColor(i) : "#E0D8D0",
                }}
              />
              <Text variant="caption" color="default" className="flex-1 min-w-0 truncate">
                {option.text}
              </Text>
              <Text variant="caption" color="subtle" className="shrink-0 tabular-nums">
                {pct}%
              </Text>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Toggle button ── */
function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all"
      style={{
        background: active ? "white" : "transparent",
        color: active ? "var(--color-ink)" : "var(--color-ink-subtle)",
        boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
      }}
    >
      {children}
    </button>
  );
}
