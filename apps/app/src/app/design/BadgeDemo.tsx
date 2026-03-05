"use client";

import { useState } from "react";
import { Badge, Input } from "@mooch/ui";

const SWATCHES = [
  "#7FBE44", // lime
  "#4D9BDB", // blue
  "#E67E22", // orange
  "#9B59B6", // purple
  "#E74C3C", // red
  "#1ABC9C", // teal
  "#F39C12", // amber
  "#E91E8C", // pink
];

export function BadgeDemo() {
  const [label, setLabel] = useState("admin");
  const [emoji, setEmoji] = useState("✦");
  const [color, setColor] = useState(SWATCHES[0]);

  return (
    <div className="space-y-8">

      {/* Preset variants */}
      <div>
        <p className="text-xs font-mono text-[#8C7463] mb-3">presets</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="admin" label="Admin" size="md" />
          <Badge variant="member" label="Member" size="md" />
          <Badge variant="settled" label="Settled" size="md" />
          <Badge variant="closed" label="Closed" size="md" />
          <Badge variant="past" label="Past" size="md" />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="admin" label="Admin" size="sm" />
          <Badge variant="member" label="Member" size="sm" />
          <Badge variant="settled" label="Settled" size="sm" />
          <Badge variant="closed" label="Closed" size="sm" />
          <Badge variant="past" label="Past" size="sm" />
        </div>
      </div>

      {/* Live customizer */}
      <div>
        <p className="text-xs font-mono text-[#8C7463] mb-3">custom — live preview</p>

        <div className="rounded-2xl border border-[#EDE3DA] bg-[#FDFCFB] p-5 space-y-4 max-w-sm">

          {/* Preview */}
          <div className="flex items-center justify-center py-3 rounded-xl bg-[#F5F3F0] min-h-[56px]">
            <Badge label={label || "Badge"} emoji={emoji || undefined} color={color} size="md" />
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Admin"
              maxLength={24}
            />
            <Input
              label="Emoji"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="e.g. ✦"
              maxLength={2}
            />
          </div>

          {/* Color swatches */}
          <div>
            <p className="text-xs font-medium text-[#4A3728] font-sans mb-2">Color</p>
            <div className="flex flex-wrap gap-2">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#7FBE44] focus:ring-offset-1"
                  style={{
                    background: c,
                    borderColor: color === c ? c : "transparent",
                    boxShadow: color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : undefined,
                  }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Input states */}
      <div>
        <p className="text-xs font-mono text-[#8C7463] mb-3">input states</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl">
          <Input label="Default" placeholder="Placeholder" />
          <Input label="With helper" placeholder="e.g. Friday Crew" helperText="Between 3 and 32 characters." />
          <Input label="Error" placeholder="Enter name" error="Name is required." />
        </div>
      </div>

    </div>
  );
}
