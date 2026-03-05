"use client";

import { useRef, useState, useId, useCallback } from "react";
import { useWebHaptics } from "web-haptics/react";
import { cn } from "../lib/cn";

const LENGTH = 6;
// Only alphanumeric — matches the invite code format
const ALLOWED = /^[A-Za-z0-9]$/;

export type InviteCodeInputProps = {
  value?: string;
  onChange?: (value: string) => void;
  /** Called when all 6 cells are filled */
  onComplete?: (code: string) => void;
  label?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
};

export function InviteCodeInput({
  value,
  onChange,
  onComplete,
  label,
  helperText,
  error,
  disabled,
  className,
}: InviteCodeInputProps) {
  const id = useId();
  const haptic = useWebHaptics();
  const hasError = !!error;

  // Internal chars array — source of truth when uncontrolled
  const [internalChars, setInternalChars] = useState<string[]>(
    () => Array.from({ length: LENGTH }, (_, i) => value?.[i]?.toUpperCase() ?? ""),
  );
  const chars = value !== undefined
    ? Array.from({ length: LENGTH }, (_, i) => value[i]?.toUpperCase() ?? "")
    : internalChars;

  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(LENGTH).fill(null));
  const isComplete = chars.every((c) => c !== "");

  function updateChars(next: string[]) {
    setInternalChars(next);
    const code = next.join("");
    onChange?.(code);
    if (next.every((c) => c !== "")) {
      haptic.trigger("success");
      onComplete?.(code);
    }
  }

  function focusCell(index: number) {
    inputRefs.current[Math.max(0, Math.min(LENGTH - 1, index))]?.focus();
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, i: number) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (chars[i]) {
        // Clear current cell
        const next = [...chars];
        next[i] = "";
        updateChars(next);
      } else {
        // Move to previous and clear it
        const prev = i - 1;
        if (prev >= 0) {
          const next = [...chars];
          next[prev] = "";
          updateChars(next);
          focusCell(prev);
        }
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusCell(i - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusCell(i + 1);
    } else if (e.key === "Delete") {
      e.preventDefault();
      const next = [...chars];
      next[i] = "";
      updateChars(next);
    }
  }, [chars]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>, i: number) => {
    const raw = e.target.value.replace(/\s/g, "");
    if (!raw) return;

    // Support paste into a single cell — distribute across remaining cells
    if (raw.length > 1) {
      const filtered = raw.toUpperCase().split("").filter((c) => ALLOWED.test(c));
      const next = [...chars];
      let cursor = i;
      for (const ch of filtered) {
        if (cursor >= LENGTH) break;
        next[cursor] = ch;
        cursor++;
      }
      updateChars(next);
      focusCell(Math.min(cursor, LENGTH - 1));
      return;
    }

    const ch = raw[raw.length - 1].toUpperCase();
    if (!ALLOWED.test(ch)) return;

    const next = [...chars];
    next[i] = ch;
    haptic.trigger("selection");
    updateChars(next);

    if (i < LENGTH - 1) focusCell(i + 1);
  }, [chars]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>, i: number) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\s/g, "");
    const filtered = text.toUpperCase().split("").filter((c) => ALLOWED.test(c));
    const next = [...chars];
    let cursor = i;
    for (const ch of filtered) {
      if (cursor >= LENGTH) break;
      next[cursor] = ch;
      cursor++;
    }
    updateChars(next);
    focusCell(Math.min(cursor, LENGTH - 1));
  }, [chars]);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  }, []);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <label
          htmlFor={`${id}-0`}
          className="text-xs font-medium text-[#4A3728] font-sans select-none"
        >
          {label}
        </label>
      )}

      <div
        className="flex items-center gap-2"
        role="group"
        aria-labelledby={label ? `${id}-label` : undefined}
      >
        {chars.map((ch, i) => (
          <input
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length cells
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            id={i === 0 ? `${id}-0` : undefined}
            type="text"
            inputMode="text"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={6 /* allow paste into first cell */}
            value={ch}
            disabled={disabled}
            onChange={(e) => handleInput(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onPaste={(e) => handlePaste(e, i)}
            onFocus={handleFocus}
            aria-label={`Digit ${i + 1} of ${LENGTH}`}
            className={cn(
              // Size + typography
              "w-11 h-14 rounded-xl text-center font-mono text-xl font-semibold",
              "caret-transparent select-none outline-none",
              // Surface
              "bg-[#FDFCFB]",
              "border-2 transition-[border-color,box-shadow,background] duration-120",
              // States
              hasError
                ? "border-[#C0392B] text-[#C0392B]"
                : isComplete
                  ? "border-[#7FBE44] bg-[#F4FBEA] text-[#2D5A10]"
                  : ch
                    ? "border-[#7FBE44] text-[#1F2A23]"
                    : "border-[#D8C8BC] text-[#1F2A23]",
              // Focus ring
              !hasError && "focus:border-[#7FBE44] focus:ring-4 focus:ring-[#7FBE44]/12",
              // Disabled
              "disabled:opacity-40 disabled:cursor-not-allowed",
              // Shadow
              "shadow-[0_1px_3px_rgba(132,100,79,0.10)]",
            )}
          />
        ))}
      </div>

      {(error || helperText) && (
        <p className={cn(
          "text-xs font-sans leading-snug",
          hasError ? "text-[#C0392B]" : "text-[#7A6E65]",
        )}>
          {error ?? helperText}
        </p>
      )}
    </div>
  );
}
