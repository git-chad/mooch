export type User = {
  id: string;
  display_name: string;
  photo_url: string | null;
  locale: string;
  default_currency: string;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  display_name: string;
  photo_url: string | null;
  locale: string;
  default_currency: string;
  created_at: string;
  updated_at: string;
};

export type Group = {
  id: string;
  name: string;
  emoji: string;
  cover_photo_url: string | null;
  currency: string;
  locale: string;
  invite_code: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type GroupMember = {
  group_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
};

export type TabStatus = "open" | "closed";

export type Tab = {
  id: string;
  group_id: string;
  name: string;
  emoji: string;
  status: TabStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type ExpenseCategory =
  | "bar"
  | "clubbing"
  | "bbq"
  | "groceries"
  | "transport"
  | "accommodation"
  | "other";

export type SplitType = "equal" | "percentage" | "exact";

export type Expense = {
  id: string;
  group_id: string;
  tab_id: string;
  description: string;
  notes: string | null;
  amount: number;
  currency: string;
  // Populated only when the user manually converts to group currency
  exchange_rate: number | null;
  converted_amount: number | null;
  rate_fetched_at: string | null;
  category: ExpenseCategory;
  paid_by: string;
  split_type: SplitType;
  // Lucide icon name (e.g. "Guitar") chosen via icon picker when category is 'other'
  custom_category: string | null;
  photo_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type ExpenseParticipant = {
  expense_id: string;
  user_id: string;
  // Always in the same currency as expenses.amount
  share_amount: number;
};

export type Balance = {
  id: string;
  group_id: string;
  tab_id: string;
  from_user: string;
  to_user: string;
  // Always in group currency
  amount: number;
  updated_at: string;
};

export type SettlementPayment = {
  id: string;
  group_id: string;
  tab_id: string | null;
  from_user: string;
  to_user: string;
  amount: number;
  currency: string;
  exchange_rate: number | null;
  converted_amount: number | null;
  rate_fetched_at: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
};
