-- ─────────────────────────────────────────────
-- Tabs — a "bar tab" grouping related expenses
-- ─────────────────────────────────────────────
-- Every expense belongs to exactly one tab. A tab is a container for
-- related expenses within a group (e.g. "BBQ at Tobi's", "Cancun Trip").
-- Tabs can be open (active) or closed (settled/archived).

create type public.tab_status as enum ('open', 'closed');

create table public.tabs (
  id          uuid        primary key default gen_random_uuid(),
  group_id    uuid        references public.groups(id) on delete cascade not null,
  name        text        not null check (char_length(name) between 2 and 60),
  emoji       text        not null default 'lucide:Receipt',
  status      public.tab_status not null default 'open',
  created_by  uuid        references public.profiles(id) not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- Add tab_id to expenses
-- ─────────────────────────────────────────────
-- New column is nullable initially so existing rows don't break.
-- After data migration (or if there are no existing expenses), we
-- tighten it to NOT NULL.

alter table public.expenses
  add column tab_id uuid references public.tabs(id) on delete cascade;

-- ─────────────────────────────────────────────
-- Add tab_id to balances
-- ─────────────────────────────────────────────
-- Balances are now per-tab. Same nullable-then-tighten strategy.

alter table public.balances
  add column tab_id uuid references public.tabs(id) on delete cascade;

-- Drop the old unique constraint (group_id, from_user, to_user)
-- and replace with (tab_id, from_user, to_user) since balances are per-tab now.
alter table public.balances
  drop constraint if exists balances_group_id_from_user_to_user_key;

alter table public.balances
  add constraint balances_tab_id_from_user_to_user_key unique (tab_id, from_user, to_user);

-- ─────────────────────────────────────────────
-- Add tab_id to settlement_payments
-- ─────────────────────────────────────────────
-- Nullable: null means a global cross-tab settlement.

alter table public.settlement_payments
  add column tab_id uuid references public.tabs(id) on delete cascade;

-- ─────────────────────────────────────────────
-- Row Level Security for tabs
-- ─────────────────────────────────────────────

alter table public.tabs enable row level security;

-- Group members can read all tabs in their group
create policy "Group members can view tabs"
  on public.tabs for select
  using (public.is_group_member(group_id));

-- Group members can create tabs
create policy "Group members can create tabs"
  on public.tabs for insert
  with check (
    public.is_group_member(group_id)
    and auth.uid() = created_by
  );

-- Tab creator or group admin can update
create policy "Tab creator or admin can update tabs"
  on public.tabs for update
  using (
    auth.uid() = created_by
    or exists (
      select 1 from public.group_members gm
      where gm.group_id = tabs.group_id
        and gm.user_id = auth.uid()
        and gm.role = 'admin'
    )
  );

-- Tab creator or group admin can delete (app logic enforces "only if empty")
create policy "Tab creator or admin can delete tabs"
  on public.tabs for delete
  using (
    auth.uid() = created_by
    or exists (
      select 1 from public.group_members gm
      where gm.group_id = tabs.group_id
        and gm.user_id = auth.uid()
        and gm.role = 'admin'
    )
  );

-- ─────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────

create index on public.tabs (group_id, status, created_at desc);
create index on public.expenses (tab_id, created_at desc);
create index on public.balances (tab_id);
