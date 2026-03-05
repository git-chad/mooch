"use client";

import { useState } from "react";
import { Select } from "@mooch/ui";
import type { SelectOption, SelectGroup } from "@mooch/ui";

// ── Static option sets ─────────────────────────────────────────────────────────

const CURRENCIES: SelectOption[] = [
  { value: "usd", label: "US Dollar", icon: "🇺🇸", description: "USD · $" },
  { value: "eur", label: "Euro", icon: "🇪🇺", description: "EUR · €" },
  { value: "gbp", label: "British Pound", icon: "🇬🇧", description: "GBP · £" },
  { value: "jpy", label: "Japanese Yen", icon: "🇯🇵", description: "JPY · ¥" },
  { value: "brl", label: "Brazilian Real", icon: "🇧🇷", description: "BRL · R$" },
  { value: "aud", label: "Australian Dollar", icon: "🇦🇺", description: "AUD · A$" },
  { value: "cad", label: "Canadian Dollar", icon: "🇨🇦", description: "CAD · C$" },
  { value: "chf", label: "Swiss Franc", icon: "🇨🇭", description: "CHF · Fr" },
];

const CATEGORIES: SelectOption[] = [
  { value: "food", label: "Food & Drinks", icon: "🍕" },
  { value: "transport", label: "Transport", icon: "🚗" },
  { value: "accommodation", label: "Accommodation", icon: "🏨" },
  { value: "activities", label: "Activities", icon: "🎳" },
  { value: "shopping", label: "Shopping", icon: "🛍️" },
  { value: "other", label: "Other", icon: "📦" },
];

const TIMEZONE_GROUPS: SelectGroup[] = [
  {
    label: "Americas",
    options: [
      { value: "america_new_york", label: "New York", description: "UTC−5 / EDT" },
      { value: "america_chicago", label: "Chicago", description: "UTC−6 / CDT" },
      { value: "america_los_angeles", label: "Los Angeles", description: "UTC−8 / PDT" },
      { value: "america_sao_paulo", label: "São Paulo", description: "UTC−3 / BRT" },
    ],
  },
  {
    label: "Europe",
    options: [
      { value: "europe_london", label: "London", description: "UTC+0 / GMT" },
      { value: "europe_paris", label: "Paris", description: "UTC+1 / CET" },
      { value: "europe_berlin", label: "Berlin", description: "UTC+1 / CET" },
      { value: "europe_lisbon", label: "Lisbon", description: "UTC+0 / WET" },
    ],
  },
  {
    label: "Asia / Pacific",
    options: [
      { value: "asia_tokyo", label: "Tokyo", description: "UTC+9 / JST" },
      { value: "asia_singapore", label: "Singapore", description: "UTC+8 / SGT" },
      { value: "australia_sydney", label: "Sydney", description: "UTC+10 / AEST" },
    ],
  },
];

const MEMBERS: SelectOption[] = [
  { value: "tobias", label: "Tobias M.", description: "Admin", icon: "🟢" },
  { value: "ana", label: "Ana García", description: "Member", icon: "🟢" },
  { value: "marcus", label: "Marcus Webb", description: "Member", icon: "🟡" },
  { value: "priya", label: "Priya Sharma", description: "Member", icon: "🔴" },
  { value: "leo", label: "Leo Nakamura", description: "Member", icon: "🟢" },
  { value: "sofia", label: "Sofia Rossi", description: "Member", icon: "🟡" },
];

const ROLES: SelectOption[] = [
  {
    value: "admin",
    label: "Admin",
    description: "Full access — can manage members, settings, and all content",
  },
  {
    value: "member",
    label: "Member",
    description: "Standard access — can add expenses, vote, and post",
  },
  {
    value: "viewer",
    label: "Viewer",
    description: "Read-only — can see activity but cannot make changes",
    disabled: true,
  },
];

// ── Demo ───────────────────────────────────────────────────────────────────────

export function SelectDemo() {
  const [currency, setCurrency] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [timezone, setTimezone] = useState<string | null>(null);
  const [members, setMembers] = useState<string[]>([]);
  const [role, setRole] = useState<string | null>("member");

  return (
    <div className="space-y-10">

      {/* ── Row 1: Basic + with icons ──────────────────────────────────────── */}
      <div>
        <p className="text-xs font-mono text-[#8C7463] mb-4">single — with icons + description</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
          <Select
            label="Currency"
            placeholder="Pick a currency"
            options={CURRENCIES}
            value={currency}
            onValueChange={setCurrency}
            helperText="Used for expense display."
          />
          <Select
            label="Category"
            placeholder="Pick a category"
            options={CATEGORIES}
            value={category}
            onValueChange={setCategory}
          />
        </div>
      </div>

      {/* ── Row 2: Grouped + descriptions ─────────────────────────────────── */}
      <div>
        <p className="text-xs font-mono text-[#8C7463] mb-4">single — grouped options</p>
        <div className="max-w-[280px]">
          <Select
            label="Timezone"
            placeholder="Select timezone"
            groups={TIMEZONE_GROUPS}
            value={timezone}
            onValueChange={setTimezone}
          />
        </div>
      </div>

      {/* ── Row 3: Multi-select ────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-mono text-[#8C7463] mb-4">multi-select — chip display in trigger</p>
        <div className="max-w-[320px]">
          <Select
            label="Split with"
            placeholder="Select members…"
            options={MEMBERS}
            multiple
            value={members}
            onValueChange={setMembers}
            helperText={
              members.length > 0
                ? `${members.length} member${members.length > 1 ? "s" : ""} selected`
                : "Who's splitting this expense?"
            }
          />
        </div>
      </div>

      {/* ── Row 4: Roles — descriptions, disabled option ──────────────────── */}
      <div>
        <p className="text-xs font-mono text-[#8C7463] mb-4">single — long descriptions · disabled option</p>
        <div className="max-w-[320px]">
          <Select
            label="Role"
            options={ROLES}
            value={role}
            onValueChange={setRole}
          />
        </div>
      </div>

      {/* ── Row 5: States ─────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-mono text-[#8C7463] mb-4">states — default · error · disabled</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl">
          <Select
            label="Default"
            placeholder="Select…"
            options={CATEGORIES}
            value={null}
            onValueChange={() => {}}
          />
          <Select
            label="Error"
            placeholder="Select…"
            options={CATEGORIES}
            value={null}
            onValueChange={() => {}}
            error="Please select a category."
          />
          <Select
            label="Disabled"
            placeholder="Select…"
            options={CATEGORIES}
            value={null}
            onValueChange={() => {}}
            disabled
          />
        </div>
      </div>

    </div>
  );
}
