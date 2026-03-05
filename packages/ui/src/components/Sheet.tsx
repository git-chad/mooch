"use client";

import { useRef } from "react";
import { Dialog } from "@base-ui-components/react";
import { useWebHaptics } from "web-haptics/react";
import { cn } from "../lib/cn";

export type SheetVariant = "default" | "receipt";

type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  hideTitle?: boolean;
  description?: string;
  variant?: SheetVariant;
  className?: string;
  children: React.ReactNode;
};

// ── Shared swipe logic ────────────────────────────────────────────────────────

function useSwipeToDismiss(onDismiss: () => void) {
  const popupRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const dragStart = useRef(0);
  const lastY = useRef(0);
  const lastT = useRef(0);
  const vel = useRef(0);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    dragStart.current = e.clientY;
    lastY.current = e.clientY;
    lastT.current = Date.now();
    vel.current = 0;
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    const now = Date.now();
    const dt = now - lastT.current;
    if (dt > 0) vel.current = (e.clientY - lastY.current) / dt;
    lastY.current = e.clientY;
    lastT.current = now;

    const dy = Math.max(0, e.clientY - dragStart.current);
    const el = popupRef.current;
    if (!el) return;
    el.style.transition = "none";
    el.style.transform = `translateY(${dy}px)`;
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    dragging.current = false;
    const dy = Math.max(0, e.clientY - dragStart.current);
    const el = popupRef.current;
    const threshold = (el?.offsetHeight ?? 300) * 0.3;

    if (vel.current > 0.45 || dy > threshold) {
      onDismiss();
      if (el) { el.style.transition = ""; el.style.transform = ""; }
    } else {
      if (el) { el.style.transition = ""; el.style.transform = ""; }
    }
  }

  return { popupRef, onPointerDown, onPointerMove, onPointerUp };
}

// ── Default sheet ─────────────────────────────────────────────────────────────

function DefaultSheet({ open, onOpenChange, title, hideTitle, description, className, children }: SheetProps) {
  const haptic = useWebHaptics();
  const { popupRef, ...drag } = useSwipeToDismiss(() => { haptic.trigger("light"); onOpenChange(false); });

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="modal-backdrop fixed inset-0 bg-black/40" />
        <Dialog.Viewport className="fixed inset-0 flex items-end justify-center">
          <Dialog.Popup
            ref={popupRef}
            className={cn(
              "sheet-popup",
              "relative w-full sm:max-w-lg bg-surface outline-none",
              "rounded-t-2xl",
              "shadow-[var(--shadow-glass)]",
              "border border-b-0 border-edge-subtle",
              className,
            )}
          >
            <div
              className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none"
              {...drag}
            >
              <div className="w-8 h-1 rounded-full bg-edge" />
            </div>

            <div className="flex items-center justify-between px-6 pt-3 pb-0">
              <Dialog.Title className={cn("text-base font-semibold text-ink font-sans", hideTitle && "sr-only")}>
                {title}
              </Dialog.Title>
              <Dialog.Close
                className="inline-flex items-center justify-center w-7 h-7 rounded-full text-ink-sub hover:text-ink-label hover:bg-hover-bg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                aria-label="Close"
                onClick={() => haptic.trigger("light")}
              >
                <CloseIcon />
              </Dialog.Close>
            </div>

            {description && (
              <Dialog.Description className="px-6 pt-1.5 text-sm text-ink-info-2 font-sans">
                {description}
              </Dialog.Description>
            )}

            <div className="px-6 pt-4 pb-8">{children}</div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Receipt sheet ─────────────────────────────────────────────────────────────

// Scalloped edge via CSS radial-gradient — circles punched out from one side,
// showing the dark backdrop through them.
const SCALLOP_SIZE = 16; // px — diameter of each bite
const SCALLOP_H = SCALLOP_SIZE / 2;

const scallopTop = {
  height: SCALLOP_H,
  background: `radial-gradient(circle at 50% 0%, transparent ${SCALLOP_H - 1}px, var(--receipt-bg) ${SCALLOP_H}px)`,
  backgroundSize: `${SCALLOP_SIZE}px ${SCALLOP_H}px`,
} as const;

const scallopBottom = {
  height: SCALLOP_H,
  background: `radial-gradient(circle at 50% 100%, transparent ${SCALLOP_H - 1}px, var(--receipt-bg) ${SCALLOP_H}px)`,
  backgroundSize: `${SCALLOP_SIZE}px ${SCALLOP_H}px`,
  backgroundPosition: "0 100%",
} as const;

function ReceiptSheet({ open, onOpenChange, title, description, className, children }: SheetProps) {
  const haptic = useWebHaptics();
  const { popupRef, ...drag } = useSwipeToDismiss(() => { haptic.trigger("light"); onOpenChange(false); });

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="modal-backdrop fixed inset-0 bg-black/40" />
        <Dialog.Viewport className="fixed inset-0 flex items-end justify-center pb-4 px-4">
          <Dialog.Popup
            ref={popupRef}
            className={cn(
              "sheet-popup",
              "relative w-full max-w-[340px] outline-none",
              className,
            )}
          >
            {/* Top scalloped edge — also the drag zone */}
            <div
              style={{ background: "var(--receipt-bg)" }}
              className="cursor-grab active:cursor-grabbing touch-none"
              {...drag}
            >
              <div style={scallopTop} />
              {/* Small drag hint dots */}
              <div className="flex justify-center gap-1 py-2">
                {[...Array(5)].map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: decorative
                  <div key={i} className="w-1 h-1 rounded-full bg-[var(--receipt-edge)]" />
                ))}
              </div>
            </div>

            {/* Receipt body */}
            <div
              className="px-6 pb-5"
              style={{ background: "var(--receipt-bg)", fontFamily: "var(--font-geist-mono), monospace" }}
            >
              {/* Store name / title */}
              <Dialog.Title className="geist-pixel text-[22px] text-center uppercase tracking-wider text-ink leading-tight">
                {title}
              </Dialog.Title>

              {description && (
                <Dialog.Description className="mt-1 text-center text-[11px] text-ink-dim leading-snug" style={{ fontFamily: "inherit" }}>
                  {description}
                </Dialog.Description>
              )}

              <ReceiptDivider />

              {/* Content */}
              <div className="text-[12px] text-ink leading-relaxed">
                {children}
              </div>

              <ReceiptDivider />

              {/* Close */}
              <div className="flex justify-center pt-1">
                <Dialog.Close className="text-[11px] uppercase tracking-widest text-ink-sub hover:text-ink-label transition-colors outline-none focus-visible:underline" style={{ fontFamily: "inherit" }} onClick={() => haptic.trigger("light")}>
                  × Close
                </Dialog.Close>
              </div>
            </div>

            {/* Bottom scalloped edge */}
            <div style={{ ...scallopBottom, background: `radial-gradient(circle at 50% 100%, transparent ${SCALLOP_H - 1}px, var(--receipt-bg) ${SCALLOP_H}px)`, backgroundSize: `${SCALLOP_SIZE}px ${SCALLOP_H}px`, backgroundPosition: "0 100%" }} />
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ReceiptDivider() {
  return (
    <div className="my-4 flex items-center gap-0.5">
      {[...Array(32)].map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: decorative
        <div key={i} className="flex-1 h-px bg-[var(--receipt-edge)]" style={{ opacity: i % 2 === 0 ? 1 : 0 }} />
      ))}
    </div>
  );
}

// ── Public export ─────────────────────────────────────────────────────────────

export function Sheet({ variant = "default", ...props }: SheetProps) {
  if (variant === "receipt") return <ReceiptSheet {...props} />;
  return <DefaultSheet {...props} />;
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
