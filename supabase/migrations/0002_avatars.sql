insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatars are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can manage their own avatar"
  on storage.objects for all
  using (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and name like auth.uid()::text || '.%'
  )
  with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and name like auth.uid()::text || '.%'
  );
