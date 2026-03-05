"use client";

import { Dialog } from "@base-ui-components/react";
import { cn } from "../lib/cn";

export type ModalSize = "sm" | "md" | "lg";

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Visually hides the title — still read by screen readers */
  hideTitle?: boolean;
  description?: string;
  size?: ModalSize;
  className?: string;
  children: React.ReactNode;
};

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export function Modal({
  open,
  onOpenChange,
  title,
  hideTitle = false,
  description,
  size = "md",
  className,
  children,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Backdrop — dark overlay, no blur */}
        <Dialog.Backdrop className="modal-backdrop fixed inset-0 bg-black/40" />

        {/* Viewport — centers popup, handles scroll on tall modals */}
        <Dialog.Viewport className="fixed inset-0 overflow-y-auto flex items-end sm:items-center justify-center sm:p-4 p-0">
          <Dialog.Popup
            className={cn(
              "modal-popup",
              "relative w-full bg-[#FDFCFB] outline-none",
              // mobile: card from bottom with rounded top
              "rounded-t-2xl sm:rounded-2xl",
              // max-width on desktop
              sizeClasses[size],
              // shadow
              "shadow-[var(--shadow-glass)]",
              // border
              "border border-[#EDE3DA]",
              className,
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-0">
              <Dialog.Title
                className={cn(
                  "text-base font-semibold text-[#1F2A23] font-sans",
                  hideTitle && "sr-only",
                )}
              >
                {title}
              </Dialog.Title>

              <Dialog.Close
                className={cn(
                  "inline-flex items-center justify-center",
                  "w-7 h-7 rounded-full",
                  "text-[#8C7463] hover:text-[#4A3728] hover:bg-[#F0E8E0]",
                  "transition-colors outline-none",
                  "focus-visible:ring-2 focus-visible:ring-[#7FBE44] focus-visible:ring-offset-1",
                )}
                aria-label="Close"
              >
                <CloseIcon />
              </Dialog.Close>
            </div>

            {description && (
              <Dialog.Description className="px-6 pt-1.5 text-sm text-[#6F859B] font-sans">
                {description}
              </Dialog.Description>
            )}

            {/* Content */}
            <div className="px-6 pt-4 pb-6">{children}</div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function CloseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1 1L13 13M13 1L1 13"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
