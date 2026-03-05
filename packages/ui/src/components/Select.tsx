"use client";

import { useId } from "react";
import { Select as BaseSelect } from "@base-ui-components/react";
import { useWebHaptics } from "web-haptics/react";
import { cn } from "../lib/cn";

// ── Types ──────────────────────────────────────────────────────────────────────

export type SelectOption = {
  value: string;
  label: string;
  /** Emoji or short icon string shown before the label */
  icon?: string;
  /** Secondary line shown below the label */
  description?: string;
  disabled?: boolean;
};

export type SelectGroup = {
  label: string;
  options: SelectOption[];
};

type SelectBaseProps = {
  label?: string;
  placeholder?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  /** Flat list of options */
  options?: SelectOption[];
  /** Grouped options — use instead of `options` */
  groups?: SelectGroup[];
};

export type SelectSingleProps = SelectBaseProps & {
  multiple?: false;
  value: string | null;
  onValueChange: (value: string) => void;
};

export type SelectMultiProps = SelectBaseProps & {
  multiple: true;
  value: string[];
  onValueChange: (value: string[]) => void;
};

export type SelectProps = SelectSingleProps | SelectMultiProps;

// ── Helpers ────────────────────────────────────────────────────────────────────

function flattenOptions(options?: SelectOption[], groups?: SelectGroup[]): SelectOption[] {
  if (options) return options;
  if (groups) return groups.flatMap((g) => g.options);
  return [];
}

// ── Select ─────────────────────────────────────────────────────────────────────

export function Select(props: SelectProps) {
  const {
    label,
    placeholder = "Select…",
    helperText,
    error,
    disabled,
    className,
    id,
    options,
    groups,
    multiple,
    value,
    onValueChange,
  } = props;

  const autoId = useId();
  const inputId = id ?? autoId;
  const hasError = !!error;
  const allOptions = flattenOptions(options, groups);

  function findOption(v: string) {
    return allOptions.find((o) => o.value === v);
  }

  const triggerBase = cn(
    "w-full flex items-start gap-2 rounded-lg px-3.5 py-2.5 text-sm font-sans text-left",
    "bg-[#FDFCFB] text-[#1F2A23]",
    "border outline-none",
    hasError
      ? "border-[#C0392B] focus:ring-2 focus:ring-[#C0392B]/15 data-[popup-open]:border-[#C0392B]"
      : "border-[#D8C8BC] focus:ring-2 focus:ring-[#7FBE44]/15 data-[popup-open]:border-[#7FBE44] data-[popup-open]:ring-2 data-[popup-open]:ring-[#7FBE44]/15",
    "shadow-[0_1px_2px_rgba(132,100,79,0.08)]",
    "transition-[border-color,box-shadow] duration-120",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    className,
  );

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-[#4A3728] font-sans select-none"
        >
          {label}
        </label>
      )}

      <BaseSelect.Root
        id={inputId}
        // biome-ignore lint/suspicious/noExplicitAny: generic multiple overload
        multiple={multiple as any}
        // biome-ignore lint/suspicious/noExplicitAny: generic multiple overload
        value={value as any}
        // biome-ignore lint/suspicious/noExplicitAny: generic multiple overload
        onValueChange={onValueChange as any}
        disabled={disabled}
      >
        <BaseSelect.Trigger className={triggerBase}>
          {/* Value display */}
          <span className="flex-1 min-w-0">
            <BaseSelect.Value>
              {(currentValue: string | string[] | null) => {
                // Multi-select: chips
                if (multiple) {
                  const vals = (currentValue as string[] | null) ?? [];
                  if (vals.length === 0)
                    return <span className="text-[#B8A898] leading-[1.4]">{placeholder}</span>;
                  return (
                    <span className="flex flex-wrap gap-1">
                      {vals.map((v) => {
                        const opt = findOption(v);
                        return (
                          <span
                            key={v}
                            className="inline-flex items-center gap-1 text-xs bg-[#EBF7D8] text-[#3D6B1A] border border-[#C7DEB0] rounded-full px-2 py-0.5 font-medium leading-none"
                          >
                            {opt?.icon && <span>{opt.icon}</span>}
                            {opt?.label ?? v}
                          </span>
                        );
                      })}
                    </span>
                  );
                }
                // Single: icon + label
                const v = currentValue as string | null;
                if (!v) return <span className="text-[#B8A898]">{placeholder}</span>;
                const opt = findOption(v);
                return (
                  <span className="flex items-center gap-2">
                    {opt?.icon && <span className="text-base leading-none">{opt.icon}</span>}
                    <span>{opt?.label ?? v}</span>
                  </span>
                );
              }}
            </BaseSelect.Value>
          </span>

          {/* Chevron */}
          <BaseSelect.Icon className="flex-shrink-0 mt-[3px] text-[#8C7463] transition-transform duration-150 data-[popup-open]:rotate-180">
            <ChevronDownIcon />
          </BaseSelect.Icon>
        </BaseSelect.Trigger>

        <BaseSelect.Portal>
          <BaseSelect.Positioner sideOffset={6} align="start" className="z-50 min-w-[var(--anchor-width)] max-w-[360px]">
            <BaseSelect.Popup className="select-popup bg-[#FDFCFB] border border-[#EDE3DA] rounded-xl outline-none overflow-hidden shadow-[var(--shadow-elevated)] py-1.5">
              <BaseSelect.List className="max-h-60 overflow-y-auto overflow-x-hidden space-y-1 px-0.5">
                {groups
                  ? groups.map((group) => (
                      <BaseSelect.Group key={group.label}>
                        <BaseSelect.GroupLabel className="px-3 pt-2.5 pb-1 text-[10px] font-mono uppercase tracking-widest text-[#8C7463] select-none">
                          {group.label}
                        </BaseSelect.GroupLabel>
                        {group.options.map((opt) => (
                          <OptionItem key={opt.value} option={opt} />
                        ))}
                        <BaseSelect.Separator className="my-1.5 h-px bg-[#EDE3DA] mx-2" />
                      </BaseSelect.Group>
                    ))
                  : allOptions.map((opt) => (
                      <OptionItem key={opt.value} option={opt} />
                    ))}
              </BaseSelect.List>
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>

      {(error || helperText) && (
        <p
          className={cn(
            "text-xs font-sans leading-snug",
            hasError ? "text-[#C0392B]" : "text-[#7A6E65]",
          )}
        >
          {error ?? helperText}
        </p>
      )}
    </div>
  );
}

// ── Option item ────────────────────────────────────────────────────────────────

function OptionItem({ option }: { option: SelectOption }) {
  const haptic = useWebHaptics();
  return (
    <BaseSelect.Item
      value={option.value}
      disabled={option.disabled}
      onClick={() => !option.disabled && haptic.trigger("selection")}
      className={cn(
        "select-item relative flex items-center gap-2.5 px-3 py-2 mx-1 rounded-lg",
        "text-sm font-sans cursor-default outline-none select-none",
        "transition-colors duration-75",
        option.disabled && "opacity-40 cursor-not-allowed",
      )}
    >
      {/* Check indicator — takes up space even when unchecked so labels align */}
      <BaseSelect.ItemIndicator
        keepMounted
        className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-[#7FBE44] opacity-0 data-[selected]:opacity-100 transition-opacity duration-100"
      >
        <CheckIcon />
      </BaseSelect.ItemIndicator>

      {option.icon && (
        <span className="text-base leading-none flex-shrink-0">{option.icon}</span>
      )}

      <span className="flex-1 min-w-0 py-0.5">
        <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
        {option.description && (
          <span className="block text-[11px] text-[#7A6E65] font-sans mt-0.5 leading-snug">
            {option.description}
          </span>
        )}
      </span>
    </BaseSelect.Item>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
