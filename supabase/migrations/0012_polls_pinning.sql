-- Add pinning to polls
alter table polls add column is_pinned boolean not null default false;
