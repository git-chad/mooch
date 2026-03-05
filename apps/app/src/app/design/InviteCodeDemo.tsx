"use client";

import { useState } from "react";
import { InviteCodeInput, Button } from "@mooch/ui";

export function InviteCodeDemo() {
  const [code, setCode] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errorCode, setErrorCode] = useState("");

  function handleComplete(value: string) {
    setSubmitted(false); // reset until they submit
  }

  function handleSubmit() {
    if (code.length < 6) return;
    setSubmitted(true);
  }

  return (
    <div className="space-y-10">

      {/* ── Main flow ─────────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-mono text-[#8C7463] mb-4">
          join flow — type or paste a 6-char code
        </p>
        <div className="flex flex-col gap-4 max-w-xs">
          <InviteCodeInput
            label="Invite code"
            value={code}
            onChange={setCode}
            onComplete={() => setSubmitted(false)}
            helperText={
              code.length === 0
                ? "Ask your group admin for a code."
                : code.length < 6
                  ? `${6 - code.length} character${6 - code.length > 1 ? "s" : ""} left`
                  : "Looking good!"
            }
          />
          <Button
            variant="primary"
            disabled={code.length < 6}
            onClick={handleSubmit}
          >
            {submitted ? "✓ Joined!" : "Join group"}
          </Button>
        </div>
      </div>

      {/* ── Error state ───────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-mono text-[#8C7463] mb-4">error state</p>
        <InviteCodeInput
          label="Invite code"
          value={errorCode}
          onChange={setErrorCode}
          error={errorCode.length === 6 ? "Code not found. Check with your admin." : undefined}
          helperText={errorCode.length < 6 ? "Enter the 6-character code." : undefined}
        />
      </div>

      {/* ── Disabled ─────────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-mono text-[#8C7463] mb-4">disabled</p>
        <InviteCodeInput
          label="Invite code"
          value="FRI"
          disabled
        />
      </div>

    </div>
  );
}
