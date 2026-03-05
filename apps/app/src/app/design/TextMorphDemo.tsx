"use client";

import { TextMorph } from "torph/react";
import { useEffect, useState } from "react";
import { Button } from "@mooch/ui";

// ── Button label cycling demo ────────────────────────────────────────────────

const SAVE_STATES = ["Save changes", "Saving…", "Saved!"] as const;

export function ButtonTextMorphDemo() {
  const [idx, setIdx] = useState(0);
  const [running, setRunning] = useState(false);

  function trigger() {
    if (running) return;
    setRunning(true);
    setIdx(1);
    setTimeout(() => setIdx(2), 1200);
    setTimeout(() => {
      setIdx(0);
      setRunning(false);
    }, 2600);
  }

  return (
    <Button variant="primary" onClick={trigger} loading={running}>
      <TextMorph>{SAVE_STATES[idx]}</TextMorph>
    </Button>
  );
}

// ── Status label cycling demo ────────────────────────────────────────────────

const STATUS_CYCLE = [
  { label: "Pending", color: "#8C7463" },
  { label: "In review", color: "#4D6480" },
  { label: "Approved", color: "#5A9629" },
  { label: "Closed", color: "#B04A2A" },
] as const;

export function StatusTextMorphDemo() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % STATUS_CYCLE.length), 1600);
    return () => clearInterval(id);
  }, []);

  const current = STATUS_CYCLE[idx];

  return (
    <span
      className="inline-flex items-center gap-1.5 text-sm font-mono font-medium transition-colors"
      style={{ color: current.color }}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{ background: current.color }}
      />
      <TextMorph>{current.label}</TextMorph>
    </span>
  );
}

// ── Balance amount cycling demo ──────────────────────────────────────────────

const AMOUNTS = ["€0.00", "€12.50", "€87.30", "−€34.00", "€0.00"] as const;

export function BalanceTextMorphDemo() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % AMOUNTS.length), 1800);
    return () => clearInterval(id);
  }, []);

  const isNegative = AMOUNTS[idx].startsWith("−");
  const isZero = AMOUNTS[idx] === "€0.00";

  return (
    <span
      className="geist-pixel text-2xl tabular-nums transition-colors"
      style={{ color: isNegative ? "#B04A2A" : isZero ? "#8C7463" : "#3A6B1A" }}
    >
      <TextMorph>{AMOUNTS[idx]}</TextMorph>
    </span>
  );
}
