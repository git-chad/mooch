-- Feed media bucket and storage RLS

insert into storage.buckets (id, name, public, file_size_limit)
values ('feed-media', 'feed-media', false, 10485760)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

drop policy if exists "Group members can view feed media" on storage.objects;
drop policy if exists "Group members can upload feed media" on storage.objects;
drop policy if exists "Group members can update feed media" on storage.objects;
drop policy if exists "Group members can delete feed media" on storage.objects;

create policy "Group members can view feed media"
  on storage.objects for select
  using (
    bucket_id = 'feed-media'
    and auth.uid() is not null
    and public.is_group_member(
      case
        when split_part(name, '/', 1) ~ '^[0-9a-fA-F-]{36}$'
          then split_part(name, '/', 1)::uuid
        else null
      end
    )
  );

create policy "Group members can upload feed media"
  on storage.objects for insert
  with check (
    bucket_id = 'feed-media'
    and auth.uid() is not null
    and public.is_group_member(
      case
        when split_part(name, '/', 1) ~ '^[0-9a-fA-F-]{36}$'
          then split_part(name, '/', 1)::uuid
        else null
      end
    )
  );

create policy "Group members can update feed media"
  on storage.objects for update
  using (
    bucket_id = 'feed-media'
    and auth.uid() is not null
    and public.is_group_member(
      case
        when split_part(name, '/', 1) ~ '^[0-9a-fA-F-]{36}$'
          then split_part(name, '/', 1)::uuid
        else null
      end
    )
  )
  with check (
    bucket_id = 'feed-media'
    and auth.uid() is not null
    and public.is_group_member(
      case
        when split_part(name, '/', 1) ~ '^[0-9a-fA-F-]{36}$'
          then split_part(name, '/', 1)::uuid
        else null
      end
    )
  );

create policy "Group members can delete feed media"
  on storage.objects for delete
  using (
    bucket_id = 'feed-media'
    and auth.uid() is not null
    and public.is_group_member(
      case
        when split_part(name, '/', 1) ~ '^[0-9a-fA-F-]{36}$'
          then split_part(name, '/', 1)::uuid
        else null
      end
    )
  );
