"use client";

import { Button, InviteCodeInput, Modal } from "@mooch/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { joinGroupByCode } from "@/app/actions/groups";
import { QRScanner } from "@/components/QRScanner";

type JoinGroupModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function extractCode(rawValue: string): string {
  const cleaned = rawValue.toUpperCase();

  try {
    const parsed = new URL(cleaned);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const joinIndex = parts.indexOf("join");

    if (joinIndex !== -1 && parts[joinIndex + 1]) {
      return parts[joinIndex + 1].replace(/[^A-Z0-9]/g, "").slice(0, 6);
    }
  } catch {
    // Input is not a URL.
  }

  return cleaned.replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

export function JoinGroupModal({ open, onOpenChange }: JoinGroupModalProps) {
  const router = useRouter();

  const [mode, setMode] = useState<"code" | "qr">("code");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetState() {
    setMode("code");
    setCode("");
    setLoading(false);
    setError(null);
  }

  async function submitJoin(explicitCode?: string) {
    const inviteCode = (explicitCode ?? code).toUpperCase().trim();

    if (inviteCode.length !== 6) {
      setError("Invite code must contain 6 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await joinGroupByCode(inviteCode);

    if ("error" in result) {
      setError(result.error);
      setLoading(false);
      return;
    }

    onOpenChange(false);
    resetState();
    router.push(`/groups/${result.groupId}`);
    router.refresh();
  }

  function handleScan(value: string) {
    const scannedCode = extractCode(value);

    if (scannedCode.length !== 6) {
      setError("QR code does not contain a valid invite code.");
      return;
    }

    setCode(scannedCode);
    setMode("code");
    void submitJoin(scannedCode);
  }

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          resetState();
        }
      }}
      title="Join a squad"
      description="Use an invite code or scan a QR."
      size="md"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={mode === "code" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setMode("code")}
          >
            Code
          </Button>
          <Button
            type="button"
            variant={mode === "qr" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setMode("qr")}
          >
            QR
          </Button>
        </div>

        {mode === "code" ? (
          <>
            <InviteCodeInput
              label="Invite code"
              value={code}
              onChange={(value) => {
                setCode(value);
                setError(null);
              }}
              error={error ?? undefined}
              helperText="Paste or type the 6-character code from your squad admin."
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                loading={loading}
                onClick={() => void submitJoin()}
              >
                {loading ? "Joining…" : "Join squad"}
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <QRScanner onScan={handleScan} />
            <p className="text-xs text-[#7A6E65] font-sans text-center">
              Point your camera to a mooch invite QR code.
            </p>
            {error && (
              <p className="text-xs text-[#C0392B] font-sans">{error}</p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
