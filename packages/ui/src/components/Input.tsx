"use client";

import { forwardRef, useId } from "react";
import { cn } from "../lib/cn";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helperText?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, helperText, error, className, id, ...props }, ref) {
    const autoId = useId();
    const inputId = id ?? autoId;
    const hasError = !!error;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-ink-label font-sans select-none"
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-[14px] px-3.5 py-2.5 text-sm font-sans",
            "bg-surface text-ink",
            "border",
            hasError
              ? "border-danger focus:border-danger focus:ring-danger/15"
              : "border-edge focus:border-accent focus:ring-accent/15",
            "placeholder:text-ink-placeholder",
            "outline-none",
            // ring + subtle lift on focus
            "focus:ring-2 focus:ring-offset-0",
            "focus:-translate-y-px",
            "transition-[border-color,box-shadow,transform] duration-120",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            // shadow matching the surface
            "shadow-[inset_0_2px_0_rgba(132,100,79,0.07)]",
            className,
          )}
          aria-invalid={hasError || undefined}
          aria-describedby={helperText || error ? `${inputId}-hint` : undefined}
          {...props}
        />

        {(error || helperText) && (
          <p
            id={`${inputId}-hint`}
            className={cn(
              "text-xs font-sans leading-snug",
              hasError ? "text-danger" : "text-ink-dim",
            )}
          >
            {error ?? helperText}
          </p>
        )}
      </div>
    );
  },
);
