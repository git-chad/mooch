-- ============================================================
-- 3B.1.1 — Monetization schema: plans, subscriptions, tokens
-- ============================================================

-- Plan definitions
create table public.plans (
  id text primary key, -- 'free' | 'pro' | 'club'
  name text not null,
  monthly_price_cents int not null,
  annual_price_cents int not null,
  max_groups int,                   -- null = unlimited
  max_members_per_group int not null,
  expense_history_months int,       -- null = unlimited
  tokens_monthly_grant int not null  -- tokens credited to the user at the start of each month
);

-- User subscriptions
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  plan_id text references public.plans(id) not null default 'free',
  billing_cycle text check (billing_cycle in ('monthly', 'annual')),
  status text not null default 'active', -- 'active' | 'canceled' | 'past_due'
  current_period_start timestamptz,
  current_period_end timestamptz,
  stripe_subscription_id text,
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Corruption token balances
create table public.token_balances (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  balance int not null default 0,  -- monthly grant + purchases - spent; no upper cap
  reset_at timestamptz not null default date_trunc('month', now()) + interval '1 month',
  updated_at timestamptz not null default now()
);

-- Token transactions (purchases + usage + monthly grants)
create table public.token_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('purchase', 'monthly_grant', 'usage')),
  amount int not null, -- positive = credit, negative = debit
  action text,         -- 'double_down' | 'the_leak' | 'the_coup' | 'ghost_vote' | 'the_veto' | 'hail_mary'
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.subscriptions enable row level security;
alter table public.token_balances enable row level security;
alter table public.token_transactions enable row level security;

create policy "Users manage their own subscription"
  on public.subscriptions for all using (auth.uid() = user_id);

create policy "Users view their own token balance"
  on public.token_balances for select using (auth.uid() = user_id);

create policy "Users view their own token transactions"
  on public.token_transactions for select using (auth.uid() = user_id);

-- ============================================================
-- 3B.1.2 — Seed plans
-- ============================================================

insert into public.plans (id, name, monthly_price_cents, annual_price_cents, max_groups, max_members_per_group, expense_history_months, tokens_monthly_grant) values
  ('free',  'Free',  0,    0,     1,    8,  3,    2),
  ('pro',   'Pro',   499,  4990,  null, 20, null, 10),
  ('club',  'Club',  1499, 14990, null, 50, null, 30);

-- ============================================================
-- 3B.1.3 — Auto-create subscription + token balance on sign-up
-- ============================================================

create or replace function public.handle_new_user_monetization()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.subscriptions (user_id, plan_id, status)
  values (new.id, 'free', 'active');

  insert into public.token_balances (user_id, balance)
  values (new.id, 2);

  insert into public.token_transactions (user_id, type, amount)
  values (new.id, 'monthly_grant', 2);

  return new;
end;
$$;

create trigger on_auth_user_created_monetization
  after insert on auth.users
  for each row execute function public.handle_new_user_monetization();
