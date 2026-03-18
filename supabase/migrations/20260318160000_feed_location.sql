-- 6.8.1: Add location fields to feed_items
alter table feed_items
  add column location_name text default null,
  add column location_coords point default null;

-- Constrain location_name length
alter table feed_items
  add constraint feed_items_location_name_length check (
    location_name is null or char_length(location_name) <= 100
  );
