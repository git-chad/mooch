"use client";

import { useExpenseStore } from "@mooch/stores";
import type { GroupMember, Profile } from "@mooch/types";
import { Avatar, ConfirmDialog, Text } from "@mooch/ui";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { settleUp } from "@/app/actions/expenses";
import { formatCurrency } from "@/lib/expenses";

type Member = GroupMember & { profile: Profile };

type Props = {
  groupId: string;
  tabId: string;
  members: Member[];
  currentUserId: string;
  currency: string;
  locale: string;
};

type SettleTarget = {
  from_user: string;
  to_user: string;
  amount: number;
  fromName: string;
  toName: string;
};

export function BalanceMatrix({
  groupId,
  tabId,
  members,
  currentUserId,
  currency,
  locale,
}: Props) {
  const balances = useExpenseStore((s) => s.balances);
  const [settleTarget, setSettleTarget] = useState<SettleTarget | null>(null);
  const [settling, setSettling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getMemberName(userId: string) {
    return (
      members.find((m) => m.user_id === userId)?.profile.display_name ??
      "Unknown"
    );
  }

  function getMemberPhoto(userId: string) {
    return (
      members.find((m) => m.user_id === userId)?.profile.photo_url ?? undefined
    );
  }

  async function handleSettle() {
    if (!settleTarget) return;
    setSettling(true);
    setError(null);
    const result = await settleUp(groupId, tabId, {
      from_user: settleTarget.from_user,
      to_user: settleTarget.to_user,
      amount: settleTarget.amount,
      currency,
    });
    setSettling(false);
    if (result && "error" in result) {
      setError(result.error);
    } else {
      setSettleTarget(null);
    }
  }

  if (balances.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-0.5">
        <Text variant="overline" color="subtle" className="block px-1 mb-2">
          Who owes what
        </Text>

        {balances.map((b) => {
          const fromName = getMemberName(b.from_user);
          const toName = getMemberName(b.to_user);
          const isCurrentUserInvolved =
            b.from_user === currentUserId || b.to_user === currentUserId;

          return (
            <div
              key={b.id}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-[#F7F2ED]/60"
            >
              <Avatar
                src={getMemberPhoto(b.from_user)}
                name={fromName}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <Text variant="caption" color="default" className="block">
                  <span className="font-medium">
                    {b.from_user === currentUserId ? "You" : fromName}
                  </span>
                  <ChevronRight className="inline w-3 h-3 text-ink-dim mx-0.5" />
                  <span className="font-medium">
                    {b.to_user === currentUserId ? "you" : toName}
                  </span>
                </Text>
              </div>

              <Text
                variant="label"
                color="inherit"
                className="shrink-0 font-semibold tabular-nums"
                style={{
                  color:
                    b.to_user === currentUserId ? "#2d5a10" : "#1F2A23",
                }}
              >
                {formatCurrency(Number(b.amount), currency, locale)}
              </Text>

              {isCurrentUserInvolved && (
                <button
                  type="button"
                  onClick={() =>
                    setSettleTarget({
                      from_user: b.from_user,
                      to_user: b.to_user,
                      amount: Number(b.amount),
                      fromName:
                        b.from_user === currentUserId ? "You" : fromName,
                      toName: b.to_user === currentUserId ? "you" : toName,
                    })
                  }
                  className="shrink-0 text-[12px] font-medium px-3 py-1 rounded-full cursor-pointer transition-colors hover:bg-[#E4F2D4]"
                  style={{
                    background: "#F1F9E8",
                    border: "1px solid #C7DEB0",
                    color: "#4F7330",
                  }}
                >
                  Settle
                </button>
              )}
            </div>
          );
        })}
      </div>

      {settleTarget && (
        <ConfirmDialog
          open={!!settleTarget}
          onOpenChange={(open) => {
            if (!open) setSettleTarget(null);
          }}
          title="Settle up"
          description={`Mark ${settleTarget.fromName} paying ${settleTarget.toName} ${formatCurrency(settleTarget.amount, currency, locale)} as settled. This creates a payment record.`}
          confirmLabel={settling ? "Settling..." : "Confirm"}
          onConfirm={handleSettle}
          onCancel={() => setSettleTarget(null)}
          variant="default"
        />
      )}

      {error && (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      )}
    </>
  );
}
