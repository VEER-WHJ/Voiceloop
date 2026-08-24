-- VoiceLoop private manager pilot
--
-- This migration preserves existing reviews while adding the small amount of
-- workspace structure needed for locations, reversible imports, and manager
-- actions. It also removes the prototype's anonymous Data API access. All
-- production data operations move through authenticated Next.js server routes.

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  constraint locations_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint locations_name_not_blank
    check (char_length(btrim(name)) between 2 and 80)
);

insert into public.locations (slug, name, sort_order)
values
  ('downtown', 'Downtown', 0),
  ('riverside', 'Riverside', 1),
  ('northgate', 'Northgate', 2),
  ('airport', 'Airport', 3)
on conflict (slug) do nothing;

create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  row_count integer not null,
  status text not null default 'processing',
  created_at timestamp with time zone not null default now(),

  constraint import_batches_filename_not_blank
    check (char_length(btrim(filename)) between 1 and 255),
  constraint import_batches_row_count_range
    check (row_count between 1 and 100),
  constraint import_batches_status_values
    check (status in ('processing', 'complete', 'failed'))
);

alter table public.reviews
  add column import_batch_id uuid references public.import_batches(id) on delete cascade,
  add column location_id uuid references public.locations(id) on delete set null,
  add column external_review_id text;

create index reviews_import_batch_id_idx
  on public.reviews (import_batch_id);

create index reviews_location_id_idx
  on public.reviews (location_id);

create unique index reviews_source_external_id_unique
  on public.reviews (source, external_review_id)
  where external_review_id is not null;

create table public.manager_actions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location_name text,
  priority text not null default 'high',
  status text not null default 'open',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  constraint manager_actions_title_not_blank
    check (char_length(btrim(title)) between 1 and 160),
  constraint manager_actions_description_length
    check (description is null or char_length(description) <= 500),
  constraint manager_actions_location_length
    check (location_name is null or char_length(location_name) <= 80),
  constraint manager_actions_priority_values
    check (priority in ('high', 'normal')),
  constraint manager_actions_status_values
    check (status in ('open', 'monitoring', 'resolved'))
);

create index manager_actions_status_idx
  on public.manager_actions (status, created_at desc);

create table public.source_connections (
  id uuid primary key default gen_random_uuid(),
  provider text not null unique,
  status text not null default 'manager_approval_required',
  account_label text,
  last_synced_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  constraint source_connections_provider_not_blank
    check (char_length(btrim(provider)) between 1 and 60),
  constraint source_connections_status_values
    check (status in ('manager_approval_required', 'ready', 'connected', 'error', 'disconnected'))
);

insert into public.source_connections (provider)
values ('google_business_profile')
on conflict (provider) do nothing;

drop policy if exists "VoiceLoop reviews are readable" on public.reviews;
drop policy if exists "VoiceLoop reviews can be inserted" on public.reviews;
drop policy if exists "VoiceLoop analysis can fill empty review results" on public.reviews;

revoke all on table public.reviews from anon, authenticated;
revoke all on table public.locations from anon, authenticated;
revoke all on table public.import_batches from anon, authenticated;
revoke all on table public.manager_actions from anon, authenticated;
revoke all on table public.source_connections from anon, authenticated;

alter table public.locations enable row level security;
alter table public.import_batches enable row level security;
alter table public.manager_actions enable row level security;
alter table public.source_connections enable row level security;

comment on table public.source_connections is
  'Connection metadata only. OAuth tokens must never be stored in this table.';
