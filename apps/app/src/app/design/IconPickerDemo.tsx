"use client";

import { useState } from "react";
import { IconPicker, LucideIconByName, Badge } from "@mooch/ui";

const SWATCHES = [
  "#7FBE44", "#4D9BDB", "#E67E22", "#9B59B6",
  "#E74C3C", "#1ABC9C", "#F39C12", "#E91E8C",
];

export function IconPickerDemo() {
  const [icon, setIcon] = useState("Star");
  const [color, setColor] = useState(SWATCHES[0]);
  const [badgeIcon, setBadgeIcon] = useState("Crown");
  const [badgeColor, setBadgeColor] = useState(SWATCHES[3]);

  return (
    <div className="space-y-10">

      {/* ── Solo trigger ──────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-mono text-[#8C7463] mb-4">standalone trigger — search · category tabs · clear</p>
        <div className="flex flex-wrap items-end gap-6">
          <IconPicker
            label="Icon"
            value={icon}
            onValueChange={setIcon}
            color={color}
            size="md"
          />
          <IconPicker
            label="Small"
            value={icon}
            onValueChange={setIcon}
            color={color}
            size="sm"
          />
          <IconPicker
            label="Disabled"
            value="Star"
            onValueChange={() => {}}
            disabled
          />
        </div>
      </div>

      {/* ── Live: icon + color → Badge preview ────────────────────────────── */}
      <div>
        <p className="text-xs font-mono text-[#8C7463] mb-4">icon + color → badge — live preview</p>

        <div className="rounded-2xl border border-[#EDE3DA] bg-[#FDFCFB] p-5 space-y-4 max-w-sm">

          {/* Preview */}
          <div className="flex items-center justify-center py-4 rounded-xl bg-[#F5F3F0] min-h-[64px] gap-3">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl"
              style={{ background: `${badgeColor}18`, color: badgeColor }}
            >
              <LucideIconByName name={badgeIcon} size={18} strokeWidth={1.75} />
            </div>
            <Badge label={badgeIcon} color={badgeColor} size="md" />
          </div>

          {/* Controls */}
          <div className="flex items-end gap-3">
            <IconPicker
              label="Icon"
              value={badgeIcon}
              onValueChange={(v) => { if (v) setBadgeIcon(v); }}
              color={badgeColor}
            />
            <div className="flex-1">
              <p className="text-xs font-medium text-[#4A3728] font-sans mb-2">Color</p>
              <div className="flex flex-wrap gap-2">
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setBadgeColor(c)}
                    className="w-6 h-6 rounded-full transition-transform hover:scale-110 focus:outline-none"
                    style={{
                      background: c,
                      boxShadow: badgeColor === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : undefined,
                    }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Group name builder ─────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-mono text-[#8C7463] mb-4">icon + color swatch — group name builder pattern</p>

        <div className="rounded-2xl border border-[#EDE3DA] bg-[#FDFCFB] p-5 space-y-4 max-w-sm">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F3F0]">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
              style={{ background: `${color}18`, color }}
            >
              <LucideIconByName name={icon} size={20} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1F2A23] font-sans">Friday Crew</p>
              <p className="text-xs text-[#7A6E65] font-sans">6 members · USD</p>
            </div>
          </div>

          <div className="flex items-end gap-3">
            <IconPicker
              label="Group icon"
              value={icon}
              onValueChange={(v) => { if (v) setIcon(v); }}
              color={color}
            />
            <div className="flex-1">
              <p className="text-xs font-medium text-[#4A3728] font-sans mb-2">Color</p>
              <div className="flex flex-wrap gap-2">
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-6 h-6 rounded-full transition-transform hover:scale-110 focus:outline-none"
                    style={{
                      background: c,
                      boxShadow: color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : undefined,
                    }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
