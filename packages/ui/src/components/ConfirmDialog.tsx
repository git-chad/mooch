"use client";

import { useRef } from "react";
import { Dialog } from "@base-ui-components/react";
import { cn } from "../lib/cn";
import { Button } from "./Button";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button as a destructive red action */
  variant?: "default" | "destructive";
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  function shake() {
    const el = popupRef.current;
    if (!el) return;
    // Remove first to allow re-triggering if the user clicks outside rapidly
    el.classList.remove("modal-popup-shake");
    void el.offsetWidth; // force reflow
    el.classList.add("modal-popup-shake");
  }

  function handleOpenChange(
    nextOpen: boolean,
    eventDetails: Dialog.Root.ChangeEventDetails,
  ) {
    if (
      !nextOpen &&
      (eventDetails.reason === "outside-press" ||
        eventDetails.reason === "escape-key")
    ) {
      shake();
      return; // swallow the close attempt
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="modal-backdrop fixed inset-0 bg-black/40" />

        <Dialog.Viewport className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Popup
            ref={popupRef}
            className={cn(
              "modal-popup",
              "relative w-full max-w-sm bg-[#FDFCFB] outline-none",
              "rounded-2xl",
              "shadow-[var(--shadow-glass)]",
              "border border-[#EDE3DA]",
            )}
          >
            <div className="px-6 pt-6 pb-5">
              <Dialog.Title className="text-base font-semibold text-[#1F2A23] font-sans">
                {title}
              </Dialog.Title>

              {description && (
                <Dialog.Description className="mt-2 text-sm text-[#556B82] font-sans leading-relaxed">
                  {description}
                </Dialog.Description>
              )}

              <div className="mt-5 flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={onCancel}>
                  {cancelLabel}
                </Button>
                <Button
                  variant={variant === "destructive" ? "danger" : "primary"}
                  size="sm"
                  onClick={onConfirm}
                >
                  {confirmLabel}
                </Button>
              </div>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
