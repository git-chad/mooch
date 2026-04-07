-- 6.8.1: Add location fields to feed_items
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'feed_items' and column_name = 'location_name'
  ) then
    alter table public.feed_items
      add column location_name text default null,
      add column location_coords point default null;

    alter table public.feed_items
      add constraint feed_items_location_name_length check (
        location_name is null or char_length(location_name) <= 100
      );
  end if;
end $$;
