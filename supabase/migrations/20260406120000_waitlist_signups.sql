create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_normalized text not null,
  source text not null default 'website_cta',
  ip_hash text,
  user_agent text,
  status text not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  constraint waitlist_signups_email_length_check
    check (char_length(email) between 3 and 320),
  constraint waitlist_signups_email_normalized_length_check
    check (char_length(email_normalized) between 3 and 320),
  constraint waitlist_signups_source_length_check
    check (char_length(source) between 1 and 100),
  constraint waitlist_signups_status_check
    check (status in ('pending', 'contacted', 'invited', 'archived'))
);

create unique index if not exists waitlist_signups_email_normalized_key
  on public.waitlist_signups (email_normalized);

create index if not exists waitlist_signups_ip_hash_created_at_idx
  on public.waitlist_signups (ip_hash, created_at desc);

alter table public.waitlist_signups enable row level security;

grant delete on table public.waitlist_signups to service_role;
grant insert on table public.waitlist_signups to service_role;
grant references on table public.waitlist_signups to service_role;
grant select on table public.waitlist_signups to service_role;
grant trigger on table public.waitlist_signups to service_role;
grant truncate on table public.waitlist_signups to service_role;
grant update on table public.waitlist_signups to service_role;
