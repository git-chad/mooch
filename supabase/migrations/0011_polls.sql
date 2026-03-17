-- Polls
create table public.polls (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade not null,
  question text not null,
  is_anonymous boolean not null default false,
  is_multi_choice boolean not null default false,
  is_closed boolean not null default false,
  closes_at timestamptz,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Poll options
create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references public.polls(id) on delete cascade not null,
  text text not null,
  sort_order int not null default 0
);

-- Poll votes
create table public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references public.polls(id) on delete cascade not null,
  option_id uuid references public.poll_options(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  weight int not null default 1,              -- 1 = normal, 2 = Double Down
  is_ghost boolean not null default false,     -- true = Ghost Vote (never revealed)
  is_vetoed boolean not null default false,    -- true = vetoed by another user
  vetoed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (poll_id, option_id, user_id)         -- one vote per option per user
);

-- Corruption token actions used on polls
create table public.poll_token_actions (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references public.polls(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  action text not null check (action in (
    'double_down', 'the_leak', 'the_coup', 'ghost_vote', 'the_veto', 'hail_mary'
  )),
  target_user_id uuid references public.profiles(id),  -- for the_veto: whose vote was cancelled
  metadata jsonb,                                        -- extra context (e.g. leaked results snapshot)
  created_at timestamptz not null default now(),
  unique (poll_id, user_id, action)                      -- each action at most once per poll per user
);

-- RLS
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
alter table public.poll_token_actions enable row level security;

create policy "Group members can manage polls"
  on public.polls for all using (public.is_group_member(group_id));

create policy "Group members can manage poll options"
  on public.poll_options for all
  using (exists (
    select 1 from public.polls p
    where p.id = poll_id and public.is_group_member(p.group_id)
  ));

create policy "Group members can manage votes"
  on public.poll_votes for all
  using (exists (
    select 1 from public.polls p
    where p.id = poll_id and public.is_group_member(p.group_id)
  ));

create policy "Group members can manage token actions"
  on public.poll_token_actions for all
  using (exists (
    select 1 from public.polls p
    where p.id = poll_id and public.is_group_member(p.group_id)
  ));
