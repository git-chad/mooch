-- Phase 5: Plans Board (Kanban)

create type plan_status as enum ('ideas', 'to_plan', 'upcoming', 'done');

create table public.group_plans (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade not null,
  title text not null,
  description text,
  status plan_status not null default 'ideas',
  sort_order int not null default 0,
  date timestamptz,
  organizer_id uuid references public.profiles(id),
  linked_event_id uuid,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.group_plan_attachments (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references public.group_plans(id) on delete cascade not null,
  type text not null check (type in ('photo', 'voice')),
  url text not null,
  created_at timestamptz not null default now()
);

alter table public.group_plans enable row level security;
alter table public.group_plan_attachments enable row level security;

create policy "Group members can manage plans"
  on public.group_plans for all using (public.is_group_member(group_id));

create policy "Group members can manage plan attachments"
  on public.group_plan_attachments for all
  using (exists (
    select 1 from public.group_plans p
    where p.id = plan_id and public.is_group_member(p.group_id)
  ));
