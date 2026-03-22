"use client";

import { Text } from "@mooch/ui";
import { Check, Loader2, X } from "lucide-react";

type EditCaptionProps = {
  value: string;
  onChange: (v: string) => void;
  maxChars: number;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
  required?: boolean;
};

export function EditCaption({
  value,
  onChange,
  maxChars,
  saving,
  onSave,
  onCancel,
  required,
}: EditCaptionProps) {
  const canSave = required ? value.trim().length > 0 : true;

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxChars}
        rows={3}
        disabled={saving}
        // biome-ignore lint/a11y/noAutofocus: edit mode should focus immediately
        autoFocus
        className="w-full rounded-xl border border-[#DECFC2] bg-[#FFFEFD] px-3 py-2.5 text-[14px] leading-relaxed text-ink outline-none transition-colors placeholder:text-[#AF9F93] focus:border-[#93BB6D]"
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSave();
        }}
      />
      <div className="flex items-center justify-between">
        <Text
          variant="caption"
          color={value.length > maxChars - 30 ? "danger" : "subtle"}
          className="tabular-nums"
        >
          {value.length}/{maxChars}
        </Text>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[12px] font-medium text-[#7C6858] transition-colors hover:bg-[#F5EFE8] disabled:opacity-50"
          >
            <X className="h-3 w-3" />
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || !canSave}
            className="inline-flex h-7 items-center gap-1 rounded-lg bg-[#5A9629] px-2.5 text-[12px] font-medium text-white transition-colors hover:bg-[#4E8423] disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" />
            )}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
