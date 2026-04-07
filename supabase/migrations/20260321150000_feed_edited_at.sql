-- Add edited_at column to feed_items for tracking post edits
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'feed_items' and column_name = 'edited_at'
  ) then
    alter table public.feed_items add column edited_at timestamptz default null;
  end if;
end $$;
