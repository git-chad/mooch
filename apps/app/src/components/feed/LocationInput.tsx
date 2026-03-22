"use client";

import { Text } from "@mooch/ui";
import { MapPin, X } from "lucide-react";

const LOCATION_MAX = 100;

type Props = {
  show: boolean;
  value: string;
  onChange: (value: string) => void;
  onToggle: () => void;
  disabled?: boolean;
};

export function LocationInput({
  show,
  value,
  onChange,
  onToggle,
  disabled,
}: Props) {
  if (!show) {
    return (
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-medium transition-colors hover:bg-[#F5EFE8] disabled:opacity-50"
        style={{ color: "#7C6858" }}
      >
        <MapPin className="h-3.5 w-3.5" />
        Add location
      </button>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Text variant="overline" color="subtle">
          Location
        </Text>
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className="inline-flex h-5 w-5 items-center justify-center rounded text-[#9C8778] transition-colors hover:bg-[#F5EFE8]"
          aria-label="Remove location"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9C8778]" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={LOCATION_MAX}
          placeholder="e.g. Central Park, NYC"
          disabled={disabled}
          className="w-full rounded-xl border border-[#DECFC2] bg-[#FFFEFD] py-2 pl-9 pr-3 text-[13px] text-ink outline-none transition-colors placeholder:text-[#AF9F93] focus:border-[#93BB6D]"
        />
      </div>
    </div>
  );
}
