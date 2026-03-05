"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { cn } from "@mooch/ui";

type Props = {
  /** The URL or string to encode */
  value: string;
  /** Canvas size in px (width = height) */
  size?: number;
  className?: string;
};

export function QRCodeDisplay({ value, size = 200, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    QRCode.toCanvas(canvas, value, {
      width: size,
      margin: 2,
      color: { dark: "#1A1714", light: "#F8F6F1" },
    }).catch(console.error);
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("rounded-lg", className)}
    />
  );
}
