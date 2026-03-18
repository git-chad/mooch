-- Feed replies (threaded comments on feed items)
create table public.feed_replies (
  id uuid primary key default gen_random_uuid(),
  feed_item_id uuid references public.feed_items(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null check (char_length(content) <= 500),
  created_at timestamptz not null default now()
);

alter table public.feed_replies enable row level security;

-- Group members can read all replies on items in their groups
create policy "Group members can read replies"
  on public.feed_replies for select
  using (exists (
    select 1 from public.feed_items fi
    where fi.id = feed_item_id and public.is_group_member(fi.group_id)
  ));

-- Group members can insert replies on items in their groups
create policy "Group members can insert replies"
  on public.feed_replies for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.feed_items fi
      where fi.id = feed_item_id and public.is_group_member(fi.group_id)
    )
  );

-- Users can delete their own replies
create policy "Users can delete own replies"
  on public.feed_replies for delete
  using (auth.uid() = user_id);

create index on public.feed_replies (feed_item_id, created_at asc);
