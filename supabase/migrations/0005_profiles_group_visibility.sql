-- Allow group members to view each other's profiles.
-- Uses a security definer function to avoid RLS recursion on group_members.

create or replace function public.shares_group_with(target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members gm1
    join public.group_members gm2 on gm1.group_id = gm2.group_id
    where gm1.user_id = auth.uid()
      and gm2.user_id = target_user_id
  );
$$;

drop policy if exists "Users can view own profile" on public.profiles;

create policy "Users can view own and group members profiles"
  on public.profiles for select
  using (
    auth.uid() = id
    or public.shares_group_with(id)
  );
