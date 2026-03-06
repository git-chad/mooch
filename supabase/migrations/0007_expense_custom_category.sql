-- Stores a Lucide icon name (e.g. "Guitar", "Pizza") chosen via the icon picker
-- when an expense's category is set to 'other'. Null for all standard categories.
alter table public.expenses
  add column custom_category text;
