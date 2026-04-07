"use client";

import { Button, Sheet } from "@mooch/ui";
import { useMemo, useState } from "react";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";

type InviteSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inviteCode: string;
  groupName: string;
};

export function InviteSheet({
  open,
  onOpenChange,
  inviteCode,
  groupName,
}: InviteSheetProps) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const inviteLink = useMemo(
    () => `https://app.mooched.app/join/${inviteCode}`,
    [inviteCode],
  );

  async function copyCode() {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  async function shareLink() {
    setSharing(true);

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Join ${groupName} on mooch`,
          text: `Use invite code ${inviteCode}`,
          url: inviteLink,
        });
      } else {
        await navigator.clipboard.writeText(inviteLink);
      }
    } finally {
      setSharing(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Invite members"
      description={`Share this code to join ${groupName}.`}
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-[#D8C8BC] bg-[#F8F6F1] px-4 py-3 text-center">
          <p className="text-[10px] uppercase tracking-widest text-[#8C7463] font-mono">
            Invite code
          </p>
          <p className="mt-1 font-mono text-3xl tracking-[0.25em] text-[#1F2A23]">
            {inviteCode}
          </p>
        </div>

        <div className="rounded-xl border border-[#EDE3DA] bg-[#F8F6F1] p-3 grid place-items-center">
          <QRCodeDisplay value={inviteLink} size={220} />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={copyCode}
          >
            {copied ? "Copied" : "Copy code"}
          </Button>
          <Button
            type="button"
            variant="primary"
            className="w-full"
            loading={sharing}
            onClick={shareLink}
          >
            {sharing ? "Sharing…" : "Share link"}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
