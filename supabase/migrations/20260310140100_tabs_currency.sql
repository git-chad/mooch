-- Add currency column to tabs.
-- Defaults to the group's currency for existing rows.
alter table public.tabs
  add column currency text;

-- Backfill existing tabs with their group's currency.
update public.tabs t
set currency = g.currency
from public.groups g
where t.group_id = g.id;

-- Now make it not null.
alter table public.tabs
  alter column currency set not null;
