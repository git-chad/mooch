"use client";

import { useState } from "react";
import { Sheet, Button } from "@mooch/ui";

export function SheetDemo() {
  const [defaultOpen, setDefaultOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="secondary" size="sm" onClick={() => setDefaultOpen(true)}>
        Default sheet
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setReceiptOpen(true)}>
        Receipt sheet
      </Button>

      {/* Default */}
      <Sheet
        open={defaultOpen}
        onOpenChange={setDefaultOpen}
        title="Invite to squad"
        description="Share the invite code or scan the QR to join."
      >
        <div className="space-y-3">
          <div className="rounded-xl bg-[#F5F3F0] border border-[#EDE3DA] px-5 py-4 flex items-center justify-between">
            <span className="font-mono text-xl tracking-[0.25em] text-[#1F2A23] font-semibold">
              A3F9ZK
            </span>
            <Button variant="ghost" size="sm">Copy</Button>
          </div>
          <div className="rounded-xl bg-[#F5F3F0] border border-[#EDE3DA] h-44 flex items-center justify-center">
            <span className="text-xs font-mono text-[#8C7463]">QR code</span>
          </div>
          <Button variant="secondary" size="md" className="w-full">Share link</Button>
        </div>
        <p className="mt-4 text-xs font-mono text-[#8C7463]">↑ drag the handle down to dismiss</p>
      </Sheet>

      {/* Receipt */}
      <Sheet
        variant="receipt"
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        title="mooch"
        description={"app.mooch.com\nSquad invite · expires never"}
      >
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-[#7A6E65]">SQUAD</span>
            <span className="font-semibold">Friday Crew</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#7A6E65]">MEMBERS</span>
            <span>4</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#7A6E65]">CURRENCY</span>
            <span>ARS</span>
          </div>
        </div>

        {/* Invite code */}
        <div className="mt-4 text-center">
          <p className="text-[10px] text-[#7A6E65] uppercase tracking-widest mb-1">Invite code</p>
          <p className="geist-pixel text-3xl tracking-[0.35em] text-[#1A1714]">A3F9ZK</p>
        </div>

        {/* QR placeholder */}
        <div className="mt-4 mx-auto w-32 h-32 border border-[#C8BEB4] flex items-center justify-center">
          <span className="text-[10px] text-[#8C7463]">QR</span>
        </div>

        <p className="mt-4 text-center text-[10px] text-[#7A6E65] uppercase tracking-widest">
          Drag down to dismiss
        </p>
      </Sheet>
    </div>
  );
}
