import type { ExpenseCategory } from "@mooch/types";

export const CATEGORY_CONFIG: Record<
  ExpenseCategory,
  { emoji: string; label: string }
> = {
  bar: { emoji: "🍺", label: "Bar" },
  clubbing: { emoji: "🪩", label: "Clubbing" },
  bbq: { emoji: "🥩", label: "BBQ" },
  groceries: { emoji: "🛒", label: "Groceries" },
  transport: { emoji: "🚗", label: "Transport" },
  accommodation: { emoji: "🏠", label: "Accommodation" },
  other: { emoji: "📦", label: "Other" },
};

export function formatCurrency(
  amount: number,
  currency: string,
  locale = "en",
): string {
  const numberLocale = locale === "es" ? "es-AR" : "en-US";
  return new Intl.NumberFormat(numberLocale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function relativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const hours = diffMs / (1000 * 60 * 60);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  const days = hours / 24;
  if (days < 7) return `${Math.floor(days)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
