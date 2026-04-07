-- Repair migration for the kanban plans feature.
-- A previous branch already used public.plans for billing tiers, so the board
-- data must live under dedicated group_plans tables.

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'plan_status'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.plan_status as enum ('ideas', 'to_plan', 'upcoming', 'done');
  end if;
end $$;

create table if not exists public.group_plans (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade not null,
  title text not null,
  description text,
  status public.plan_status not null default 'ideas',
  sort_order int not null default 0,
  date timestamptz,
  organizer_id uuid references public.profiles(id),
  linked_event_id uuid,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.group_plan_attachments (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references public.group_plans(id) on delete cascade not null,
  type text not null check (type in ('photo', 'voice')),
  url text not null,
  created_at timestamptz not null default now()
);

alter table public.group_plans enable row level security;
alter table public.group_plan_attachments enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'group_plans_group_id_fkey'
      and conrelid = 'public.group_plans'::regclass
  ) then
    alter table public.group_plans
      add constraint group_plans_group_id_fkey
      foreign key (group_id) references public.groups(id) on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'group_plans_organizer_id_fkey'
      and conrelid = 'public.group_plans'::regclass
  ) then
    alter table public.group_plans
      add constraint group_plans_organizer_id_fkey
      foreign key (organizer_id) references public.profiles(id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'group_plans_created_by_fkey'
      and conrelid = 'public.group_plans'::regclass
  ) then
    alter table public.group_plans
      add constraint group_plans_created_by_fkey
      foreign key (created_by) references public.profiles(id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'group_plan_attachments_plan_id_fkey'
      and conrelid = 'public.group_plan_attachments'::regclass
  ) then
    alter table public.group_plan_attachments
      add constraint group_plan_attachments_plan_id_fkey
      foreign key (plan_id) references public.group_plans(id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'group_plans'
      and policyname = 'Group members can manage plans'
  ) then
    create policy "Group members can manage plans"
      on public.group_plans for all using (public.is_group_member(group_id));
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'group_plan_attachments'
      and policyname = 'Group members can manage plan attachments'
  ) then
    create policy "Group members can manage plan attachments"
      on public.group_plan_attachments for all
      using (exists (
        select 1 from public.group_plans p
        where p.id = plan_id and public.is_group_member(p.group_id)
      ));
  end if;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'plan-attachments',
  'plan-attachments',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/webm', 'audio/wav', 'audio/x-m4a']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/webm', 'audio/wav', 'audio/x-m4a'];

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Group members can upload plan attachments'
  ) then
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
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Group members can view plan attachments'
  ) then
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
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Group members can delete plan attachments'
  ) then
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
  end if;
end $$;
