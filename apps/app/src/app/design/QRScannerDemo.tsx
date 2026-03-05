"use client";

import { useState } from "react";
import { Sheet, Button } from "@mooch/ui";
import { QRScanner } from "@/components/QRScanner";

export function QRScannerDemo() {
  const [open, setOpen] = useState(false);
  const [scanned, setScanned] = useState<string | null>(null);

  function handleScan(value: string) {
    setScanned(value);
    setOpen(false);
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="primary" onClick={() => { setScanned(null); setOpen(true); }}>
          Open scanner
        </Button>
        {scanned && (
          <p className="text-sm font-mono text-[#3D6B1A] bg-[#EBF7D8] border border-[#C7DEB0] rounded-lg px-3 py-1.5 max-w-xs truncate">
            ✓ {scanned}
          </p>
        )}
      </div>

      <Sheet
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
        }}
        title="Scan QR code"
        description="Point your camera at a mooch invite QR code."
      >
        <div className="-mx-6 -mb-8">
          <QRScanner
            onScan={handleScan}
            className="rounded-none"
          />
          <div className="px-6 pt-4 pb-8">
            <p className="text-xs font-sans text-[#8C7463] text-center">
              Works best in good lighting. Desktop uses your webcam.
            </p>
          </div>
        </div>
      </Sheet>
    </>
  );
}
