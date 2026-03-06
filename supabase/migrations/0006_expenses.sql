-- ─────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────

create type public.expense_category as enum (
  'bar',
  'clubbing',
  'bbq',
  'groceries',
  'transport',
  'accommodation',
  'other'
);

create type public.split_type as enum ('equal', 'percentage', 'exact');

-- ─────────────────────────────────────────────
-- Expenses
-- ─────────────────────────────────────────────
-- `amount` and `currency` always reflect what was actually paid.
-- Multi-currency: if currency differs from the group's default, the user can
-- optionally convert. When they do, exchange_rate, converted_amount, and
-- rate_fetched_at are populated. Balance recalculation uses converted_amount
-- when available, falls back to amount when currencies match. Expenses with a
-- foreign currency and no conversion are excluded from balance calc until
-- converted (the UI warns about this).

create table public.expenses (
  id                uuid      primary key default gen_random_uuid(),
  group_id          uuid      references public.groups(id) on delete cascade not null,
  description       text      not null,
  notes             text,
  amount            numeric(12,2) not null check (amount > 0),
  currency          text      not null,
  -- Populated only when the user manually triggers conversion to group currency
  exchange_rate     numeric(18,6),
  converted_amount  numeric(12,2),
  rate_fetched_at   timestamptz,
  category          public.expense_category not null default 'other',
  paid_by           uuid      references public.profiles(id) not null,
  split_type        public.split_type not null default 'equal',
  photo_url         text,
  created_by        uuid      references public.profiles(id) not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- Expense participants
-- ─────────────────────────────────────────────
-- share_amount is always in the same currency as expenses.amount.
-- The application derives each participant's share in group currency as:
--   share_amount * exchange_rate (when exchange_rate is set)

create table public.expense_participants (
  expense_id   uuid references public.expenses(id) on delete cascade,
  user_id      uuid references public.profiles(id) on delete cascade,
  share_amount numeric(12,2) not null check (share_amount >= 0),
  primary key (expense_id, user_id)
);

-- ─────────────────────────────────────────────
-- Balances
-- ─────────────────────────────────────────────
-- Simplified debt matrix, always stored in group currency.
-- Recomputed entirely by the server action after every expense or
-- settlement mutation (no DB trigger — computed in TypeScript and
-- written via service-role client to bypass RLS).
-- A row (from_user → to_user, amount) means from_user owes to_user that amount.

create table public.balances (
  id          uuid      primary key default gen_random_uuid(),
  group_id    uuid      references public.groups(id) on delete cascade not null,
  from_user   uuid      references public.profiles(id) not null,
  to_user     uuid      references public.profiles(id) not null,
  amount      numeric(12,2) not null check (amount > 0),
  updated_at  timestamptz not null default now(),
  unique (group_id, from_user, to_user)
);

-- ─────────────────────────────────────────────
-- Settlement payments
-- ─────────────────────────────────────────────
-- Records actual pay-back transactions between two members.
-- These are factored into balance recalculation alongside expenses.
-- Kept forever as an audit trail — nothing is ever "deleted as settled".

create table public.settlement_payments (
  id               uuid      primary key default gen_random_uuid(),
  group_id         uuid      references public.groups(id) on delete cascade not null,
  from_user        uuid      references public.profiles(id) not null,
  to_user          uuid      references public.profiles(id) not null,
  amount           numeric(12,2) not null check (amount > 0),
  currency         text      not null,
  -- Populated if the payment was made in a currency other than the group default
  exchange_rate    numeric(18,6),
  converted_amount numeric(12,2),
  rate_fetched_at  timestamptz,
  notes            text,
  created_by       uuid      references public.profiles(id) not null,
  created_at       timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────

alter table public.expenses             enable row level security;
alter table public.expense_participants enable row level security;
alter table public.balances             enable row level security;
alter table public.settlement_payments  enable row level security;

-- Expenses: group members can do everything
create policy "Group members can manage expenses"
  on public.expenses for all
  using (public.is_group_member(group_id));

-- Expense participants: readable/writable if you can see the parent expense
create policy "Group members can manage expense participants"
  on public.expense_participants for all
  using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id and public.is_group_member(e.group_id)
    )
  );

-- Balances: group members can read. Writes are done server-side via
-- service-role client (bypasses RLS) so no write policy is needed here.
create policy "Group members can view balances"
  on public.balances for select
  using (public.is_group_member(group_id));

-- Settlement payments: group members can read all; only the creator can insert.
create policy "Group members can view settlement payments"
  on public.settlement_payments for select
  using (public.is_group_member(group_id));

create policy "Group members can create settlement payments"
  on public.settlement_payments for insert
  with check (
    public.is_group_member(group_id)
    and auth.uid() = created_by
  );

-- ─────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────

create index on public.expenses             (group_id, created_at desc);
create index on public.expense_participants (expense_id);
create index on public.expense_participants (user_id);
create index on public.balances             (group_id);
create index on public.settlement_payments  (group_id, created_at desc);
