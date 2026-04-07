-- Feed mentions (track @mentions in posts and replies)
create table if not exists public.feed_mentions (
  id uuid primary key default gen_random_uuid(),
  feed_item_id uuid references public.feed_items(id) on delete cascade,
  feed_reply_id uuid references public.feed_replies(id) on delete cascade,
  mentioned_user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  constraint mentions_one_parent check (
    (feed_item_id is not null and feed_reply_id is null) or
    (feed_item_id is null and feed_reply_id is not null)
  )
);

alter table public.feed_mentions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'feed_mentions' and policyname = 'Group members can read mentions'
  ) then
    create policy "Group members can read mentions"
      on public.feed_mentions for select
      using (
        (feed_item_id is not null and exists (
          select 1 from public.feed_items fi
          where fi.id = feed_item_id and public.is_group_member(fi.group_id)
        ))
        or
        (feed_reply_id is not null and exists (
          select 1 from public.feed_replies fr
          join public.feed_items fi on fi.id = fr.feed_item_id
          where fr.id = feed_reply_id and public.is_group_member(fi.group_id)
        ))
      );
  end if;
end $$;

create index if not exists feed_mentions_feed_item_id_idx
  on public.feed_mentions (feed_item_id) where feed_item_id is not null;
create index if not exists feed_mentions_feed_reply_id_idx
  on public.feed_mentions (feed_reply_id) where feed_reply_id is not null;
create index if not exists feed_mentions_mentioned_user_id_idx
  on public.feed_mentions (mentioned_user_id);
