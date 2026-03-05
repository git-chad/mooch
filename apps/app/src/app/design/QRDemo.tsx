"use client";

import { useState } from "react";
import { Sheet, Button } from "@mooch/ui";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";

const DEMO_CODE = "FRIDAY3";
const DEMO_URL = `https://app.mooch.lol/join/${DEMO_CODE}`;

export function QRDemo() {
  const [defaultOpen, setDefaultOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(DEMO_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => setDefaultOpen(true)}>
          Sheet — default
        </Button>
        <Button variant="primary" onClick={() => setReceiptOpen(true)}>
          Sheet — receipt
        </Button>
      </div>

      {/* ── Default sheet variant ─────────────────────────────────────── */}
      <Sheet
        open={defaultOpen}
        onOpenChange={setDefaultOpen}
        title="Invite to Friday Crew"
        description="Scan or share the code below to join the group."
      >
        <div className="flex flex-col items-center gap-5 py-2">
          <div className="rounded-2xl border border-[#EDE3DA] bg-[#F8F6F1] p-4">
            <QRCodeDisplay value={DEMO_URL} size={200} />
          </div>

          <div className="text-center space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-[#8C7463] font-mono">
              invite code
            </p>
            <p className="geist-pixel text-2xl tracking-[0.25em] text-[#1F2A23] select-all">
              {DEMO_CODE}
            </p>
          </div>

          <Button variant="secondary" size="sm" onClick={copyLink}>
            {copied ? "✓ Copied!" : "Copy invite link"}
          </Button>
        </div>
      </Sheet>

      {/* ── Receipt sheet variant ─────────────────────────────────────── */}
      <Sheet
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        title="mooch"
        description="Friday Crew · 6 members"
        variant="receipt"
      >
        <div className="flex flex-col items-center gap-4 py-1">
          {/* QR code */}
          <div className="overflow-hidden border border-[#D8C8BC]">
            <QRCodeDisplay value={DEMO_URL} size={168} />
          </div>

          {/* Invite code */}
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-[#7A6E65] mb-1">
              invite code
            </p>
            <p
              className="geist-pixel text-[22px] tracking-[0.3em] text-[#1A1714] select-all"
            >
              {DEMO_CODE}
            </p>
          </div>

          {/* Copy link */}
          <button
            type="button"
            onClick={copyLink}
            className="text-[11px] uppercase tracking-widest transition-colors outline-none focus-visible:underline"
            style={{ color: copied ? "#5A9E2A" : "#7FBE44", fontFamily: "inherit" }}
          >
            {copied ? "✓ copied!" : "copy invite link"}
          </button>
        </div>
      </Sheet>
    </>
  );
}
