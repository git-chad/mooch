-- Fix recursive group_members policy and complete group RLS rules.

create or replace function public.is_group_member(group_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members
    where group_members.group_id = $1
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_group_admin(group_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members
    where group_members.group_id = $1
      and user_id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.is_group_creator(group_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.groups
    where groups.id = $1
      and created_by = auth.uid()
  );
$$;

-- groups policies

drop policy if exists "Members can view group" on public.groups;
drop policy if exists "Admins can update group" on public.groups;
drop policy if exists "Users can create groups" on public.groups;
drop policy if exists "Admins can delete group" on public.groups;

create policy "Members can view group"
  on public.groups for select
  using (public.is_group_member(id));

create policy "Users can create groups"
  on public.groups for insert
  with check (auth.uid() = created_by);

create policy "Admins can update group"
  on public.groups for update
  using (public.is_group_admin(id))
  with check (public.is_group_admin(id));

create policy "Admins can delete group"
  on public.groups for delete
  using (public.is_group_admin(id));

-- group_members policies

drop policy if exists "Members can view group_members" on public.group_members;
drop policy if exists "Users can join groups" on public.group_members;
drop policy if exists "Admins can update group members" on public.group_members;
drop policy if exists "Users can leave group or admins can remove" on public.group_members;

create policy "Members can view group_members"
  on public.group_members for select
  using (public.is_group_member(group_id));

create policy "Users can join groups"
  on public.group_members for insert
  with check (
    auth.uid() = user_id
    and (
      public.is_group_member(group_id)
      or public.is_group_creator(group_id)
    )
  );

create policy "Admins can update group members"
  on public.group_members for update
  using (public.is_group_admin(group_id))
  with check (public.is_group_admin(group_id));

create policy "Users can leave group or admins can remove"
  on public.group_members for delete
  using (
    auth.uid() = user_id
    or public.is_group_admin(group_id)
  );

-- Group cover images bucket and RLS

insert into storage.buckets (id, name, public)
values ('group-covers', 'group-covers', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Group covers are publicly viewable" on storage.objects;
drop policy if exists "Users can manage their own group covers" on storage.objects;

create policy "Group covers are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'group-covers');

create policy "Users can manage their own group covers"
  on storage.objects for all
  using (
    bucket_id = 'group-covers'
    and auth.uid() is not null
    and name like auth.uid()::text || '/%'
  )
  with check (
    bucket_id = 'group-covers'
    and auth.uid() is not null
    and name like auth.uid()::text || '/%'
  );
