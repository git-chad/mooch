-- Add edited_at column to feed_items for tracking post edits
ALTER TABLE public.feed_items
  ADD COLUMN edited_at timestamptz DEFAULT NULL;
