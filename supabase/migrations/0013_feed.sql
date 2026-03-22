-- Feed
create type public.feed_item_type as enum ('photo', 'voice', 'text');

create table public.feed_items (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade not null,
  type public.feed_item_type not null,
  media_path text,
  caption text,
  duration_seconds int,
  linked_expense_id uuid references public.expenses(id) on delete set null,
  -- Added as plain UUID for now; FK is introduced when events lands in Phase 7.
  linked_event_id uuid,
  linked_poll_id uuid references public.polls(id) on delete set null,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz not null default now()
);

create table public.feed_reactions (
  feed_item_id uuid references public.feed_items(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (feed_item_id, user_id)
);

alter table public.feed_items enable row level security;
alter table public.feed_reactions enable row level security;

create policy "Group members can manage feed items"
  on public.feed_items for all using (public.is_group_member(group_id));

create policy "Group members can manage reactions"
  on public.feed_reactions for all
  using (exists (
    select 1 from public.feed_items fi
    where fi.id = feed_item_id and public.is_group_member(fi.group_id)
  ));

create index on public.feed_items (group_id, created_at desc);
create index on public.feed_reactions (feed_item_id);
