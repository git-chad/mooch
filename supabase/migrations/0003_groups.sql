create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null default '👥',
  cover_photo_url text,
  currency text not null default 'ARS',
  locale text not null default 'en',
  invite_code text not null unique,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid references public.groups(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

create policy "Members can view group"
  on public.groups for select
  using (exists (
    select 1 from public.group_members
    where group_id = id and user_id = auth.uid()
  ));

create policy "Admins can update group"
  on public.groups for update
  using (exists (
    select 1 from public.group_members
    where group_id = id and user_id = auth.uid() and role = 'admin'
  ));

create policy "Members can view group_members"
  on public.group_members for select
  using (exists (
    select 1 from public.group_members gm
    where gm.group_id = group_id and gm.user_id = auth.uid()
  ));

create or replace function public.is_group_member(group_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.group_members
    where group_members.group_id = $1 and user_id = auth.uid()
  );
$$;
