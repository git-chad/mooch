"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import jsQR from "jsqr";
import { useWebHaptics } from "web-haptics/react";

type Status = "idle" | "requesting" | "active" | "scanned" | "denied" | "error";

export type QRScannerProps = {
  /** Called with the decoded QR string on a successful scan */
  onScan: (value: string) => void;
  onError?: (err: Error) => void;
  /** Start the camera immediately on mount (default: true) */
  autoStart?: boolean;
  className?: string;
};

export function QRScanner({
  onScan,
  onError,
  autoStart = true,
  className,
}: QRScannerProps) {
  const [status, setStatus] = useState<Status>("idle");
  const haptic = useWebHaptics();
  const hapticRef = useRef(haptic);
  hapticRef.current = haptic;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const lastScanRef = useRef<number>(0);
  const scannedRef = useRef(false);

  // ── Camera ─────────────────────────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    setStatus("requesting");
    scannedRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      streamRef.current = stream;
      await video.play();
      setStatus("active");
    } catch (err) {
      const e = err as Error;
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        setStatus("denied");
      } else {
        setStatus("error");
        onError?.(e);
      }
    }
  }, [onError]);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // Stop camera on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  // Auto-start
  useEffect(() => {
    if (autoStart) startCamera();
  }, [autoStart, startCamera]);

  // ── Scan loop ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (status !== "active") return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    function tick() {
      rafRef.current = requestAnimationFrame(tick);
      if (scannedRef.current) return;

      const now = Date.now();
      if (now - lastScanRef.current < 80) return; // ~12 fps
      lastScanRef.current = now;

      if (!video || video.readyState < video.HAVE_ENOUGH_DATA) return;

      const c = canvas!;
      c.width = video.videoWidth;
      c.height = video.videoHeight;
      ctx!.drawImage(video, 0, 0);

      const img = ctx!.getImageData(0, 0, c.width, c.height);
      const result = jsQR(img.data, img.width, img.height, {
        inversionAttempts: "dontInvert",
      });

      if (result?.data) {
        scannedRef.current = true;
        cancelAnimationFrame(rafRef.current);
        setStatus("scanned");
        hapticRef.current.trigger("success");
        // Brief success flash before firing callback
        setTimeout(() => onScan(result.data), 400);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [status, onScan]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl bg-black ${className ?? ""}`}>
      {/* Video feed */}
      <video
        ref={videoRef}
        className="w-full object-cover"
        playsInline
        muted
        style={{ aspectRatio: "4/3" }}
      />

      {/* Off-screen canvas for frame analysis */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── Overlay ── */}
      {(status === "active" || status === "scanned") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Dark vignette with box-shadow cutout */}
          <div
            className="relative w-56 h-56 rounded-2xl"
            style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)" }}
          >
            {/* Corner brackets */}
            <Corner pos="tl" done={status === "scanned"} />
            <Corner pos="tr" done={status === "scanned"} />
            <Corner pos="bl" done={status === "scanned"} />
            <Corner pos="br" done={status === "scanned"} />

            {/* Scan line — hides on success */}
            {status === "active" && (
              <div className="scan-line absolute left-3 right-3 top-3 h-0.5 rounded-full bg-gradient-to-r from-transparent via-[#7FBE44] to-transparent" />
            )}

            {/* Success flash */}
            {status === "scanned" && (
              <div className="absolute inset-0 rounded-2xl bg-[#7FBE44]/20 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-[#7FBE44] flex items-center justify-center shadow-lg">
                  <CheckIcon />
                </div>
              </div>
            )}
          </div>

          {/* Status text */}
          <p className="mt-5 text-xs font-sans text-white/70 select-none">
            {status === "scanned" ? "Code found!" : "Point at a mooch QR code"}
          </p>
        </div>
      )}

      {/* ── Non-camera states ── */}
      {(status === "idle" || status === "requesting") && (
        <Placeholder>
          <Spinner />
          <p className="mt-3 text-sm font-sans text-white/60">
            {status === "requesting" ? "Requesting camera…" : "Starting…"}
          </p>
        </Placeholder>
      )}

      {status === "denied" && (
        <Placeholder>
          <CameraOffIcon />
          <p className="mt-3 text-sm font-semibold font-sans text-white">Camera access denied</p>
          <p className="mt-1 text-xs font-sans text-white/50 text-center max-w-[200px]">
            Allow camera access in your browser settings and try again.
          </p>
          <button
            type="button"
            onClick={startCamera}
            className="mt-4 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-sans transition-colors outline-none"
          >
            Try again
          </button>
        </Placeholder>
      )}

      {status === "error" && (
        <Placeholder>
          <CameraOffIcon />
          <p className="mt-3 text-sm font-semibold font-sans text-white">Camera unavailable</p>
          <p className="mt-1 text-xs font-sans text-white/50 text-center max-w-[200px]">
            No camera found on this device.
          </p>
        </Placeholder>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Corner({ pos, done }: { pos: "tl" | "tr" | "bl" | "br"; done: boolean }) {
  const base = "absolute w-5 h-5 transition-colors duration-300";
  const color = done ? "border-[#7FBE44]" : "border-white";
  const positions = {
    tl: "top-0 left-0 border-t-2 border-l-2 rounded-tl-lg",
    tr: "top-0 right-0 border-t-2 border-r-2 rounded-tr-lg",
    bl: "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg",
    br: "bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg",
  };
  return <div className={`${base} ${color} ${positions[pos]}`} />;
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#1A1714]"
      style={{ aspectRatio: "4/3" }}
    >
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin text-white/40" width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="11" stroke="currentColor" strokeWidth="2.5" strokeDasharray="50 20" strokeLinecap="round" />
    </svg>
  );
}

function CameraOffIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 2l20 20M7.5 7.5A3 3 0 0 0 9 9m0 0a3 3 0 0 0 3 3m0 0a3 3 0 0 0 .5-.05M12 12l3 3M9 3h.01M11 3h6a2 2 0 0 1 2 2v12a2 2 0 0 1-.1.6M3 9v10a2 2 0 0 0 2 2h12" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}
