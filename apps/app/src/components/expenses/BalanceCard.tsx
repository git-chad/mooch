"use client";

import { useExpenseStore } from "@mooch/stores";
import type { BalanceWithProfiles } from "@mooch/stores";
import { Avatar, Text } from "@mooch/ui";
import { Tooltip } from "@base-ui-components/react";
import Image from "next/image";
import { formatCurrency } from "@/lib/expenses";

type Props = {
  currentUserId: string;
  currency: string;
  locale: string;
  global?: boolean;
};

export function BalanceCard({
  currentUserId,
  currency,
  locale,
  global,
}: Props) {
  const tabBalances = useExpenseStore((s) => s.balances);
  const globalBalances = useExpenseStore((s) => s.globalBalances);
  const balances = global ? globalBalances : tabBalances;

  // net > 0 = owed money, net < 0 = owes money
  const net = balances.reduce((sum, b) => {
    if (b.to_user === currentUserId) return sum + Number(b.amount);
    if (b.from_user === currentUserId) return sum - Number(b.amount);
    return sum;
  }, 0);

  const isSettled = Math.abs(net) < 0.005;
  const isOwed = net > 0;

  // Collect people who owe the current user (or who the user owes)
  const relevantBalances: BalanceWithProfiles[] = balances.filter((b) =>
    isOwed ? b.to_user === currentUserId : b.from_user === currentUserId,
  );

  if (isSettled) {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <div className="dither rounded-sm overflow-hidden mb-4">
          <Image
            src="/images/jammies.gif"
            alt="All settled"
            width={200}
            height={200}
            unoptimized
          />
        </div>
        <Text variant="display">
          No moochers here
        </Text>
        <Text variant="caption" color="subtle" className="block mt-1">
          Everyone&apos;s squared away{global ? " across all tabs" : ""}. For now.
        </Text>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 py-2">
      {/* Stacked avatars of people involved */}
      {relevantBalances.length > 0 && (
        <div className="flex -space-x-2">
          {relevantBalances.map((b) => {
            const profile = isOwed ? b.from_profile : b.to_profile;
            return (
              <Tooltip.Root key={b.id}>
                <Tooltip.Trigger
                  render={
                    <div className="relative rounded-full ring-2 ring-white">
                      <Avatar
                        src={profile.photo_url ?? undefined}
                        name={profile.display_name}
                        size="sm"
                      />
                    </div>
                  }
                />
                <Tooltip.Portal>
                  <Tooltip.Positioner sideOffset={6}>
                    <Tooltip.Popup className="avatar-tooltip">
                      {profile.display_name}
                    </Tooltip.Popup>
                  </Tooltip.Positioner>
                </Tooltip.Portal>
              </Tooltip.Root>
            );
          })}
        </div>
      )}

      <div className="min-w-0">
        <Text
          variant="heading"
          color="inherit"
          style={{ color: isOwed ? "#2d5a10" : "#b24a3a" }}
        >
          {formatCurrency(Math.abs(net), currency, locale)}
        </Text>
        <Text variant="caption" color="subtle" className="block">
          {isOwed
            ? relevantBalances.length === 1
              ? `${relevantBalances[0].from_profile.display_name} owes you`
              : "these mooches owe you"
            : relevantBalances.length === 1
              ? `you owe ${relevantBalances[0].to_profile.display_name}`
              : "you owe the squad"}
          {global ? " (all tabs)" : ""}
        </Text>
      </div>
    </div>
  );
}
