insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'plan-attachments',
  'plan-attachments',
  false,
  10485760, -- 10MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/webm', 'audio/wav', 'audio/x-m4a']
) on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/webm', 'audio/wav', 'audio/x-m4a'];

create policy "Group members can upload plan attachments"
on storage.objects for insert
with check (
  bucket_id = 'plan-attachments' and
  auth.role() = 'authenticated' and
  (storage.foldername(name))[1] in (
    select id::text from public.groups
    where id::text = (storage.foldername(name))[1]
    and public.is_group_member(id)
  )
);

create policy "Group members can view plan attachments"
on storage.objects for select
using (
  bucket_id = 'plan-attachments' and
  auth.role() = 'authenticated' and
  (storage.foldername(name))[1] in (
    select id::text from public.groups
    where id::text = (storage.foldername(name))[1]
    and public.is_group_member(id)
  )
);

create policy "Group members can delete plan attachments"
on storage.objects for delete
using (
  bucket_id = 'plan-attachments' and
  auth.role() = 'authenticated' and
  (storage.foldername(name))[1] in (
    select id::text from public.groups
    where id::text = (storage.foldername(name))[1]
    and public.is_group_member(id)
  )
);
