-- Circuit manager accounts and order-aware feedback
-- Existing pilot rows remain intact but are not assigned to a new account.

alter table public.locations add column owner_user_id uuid references auth.users(id) on delete cascade;
alter table public.import_batches add column owner_user_id uuid references auth.users(id) on delete cascade;
alter table public.manager_actions add column owner_user_id uuid references auth.users(id) on delete cascade;
alter table public.source_connections
  add column owner_user_id uuid references auth.users(id) on delete cascade,
  add column location_id uuid references public.locations(id) on delete cascade;
alter table public.reviews
  add column owner_user_id uuid references auth.users(id) on delete cascade,
  add column external_order_id text,
  add column ordered_items text[] not null default '{}',
  add column feedback_channel text,
  add column reviewer_review_count integer check (reviewer_review_count is null or reviewer_review_count >= 0),
  add column reviewer_is_verified boolean,
  add column provider_flagged boolean not null default false,
  add column legitimacy_status text not null default 'unassessed'
    check (legitimacy_status in ('trusted', 'review', 'excluded', 'unassessed')),
  add column legitimacy_reason text;

create table public.competitors (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  website text,
  latest_summary text,
  latest_sources jsonb not null default '[]'::jsonb,
  last_researched_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.source_connections drop constraint if exists source_connections_provider_key;
drop index if exists public.reviews_source_external_id_unique;

create unique index source_connections_owner_provider_unique
  on public.source_connections (owner_user_id, location_id, provider)
  where owner_user_id is not null;

create unique index reviews_owner_source_external_id_unique
  on public.reviews (owner_user_id, source, external_review_id)
  where owner_user_id is not null and external_review_id is not null;

create index locations_owner_user_id_idx on public.locations (owner_user_id, sort_order);
create index import_batches_owner_user_id_idx on public.import_batches (owner_user_id, created_at desc);
create index manager_actions_owner_user_id_idx on public.manager_actions (owner_user_id, status, created_at desc);
create index reviews_owner_user_id_idx on public.reviews (owner_user_id, review_date desc);
create index source_connections_owner_location_idx on public.source_connections (owner_user_id, location_id);
create unique index competitors_owner_name_unique on public.competitors (owner_user_id, lower(name));
create index competitors_owner_user_id_idx on public.competitors (owner_user_id, created_at);

alter table public.competitors enable row level security;
revoke all on table public.competitors from anon, authenticated;

comment on column public.reviews.external_order_id is
  'Provider order reference used to attach POS context to feedback.';
comment on column public.reviews.ordered_items is
  'Menu item names supplied by an authorized POS or feedback integration.';
comment on column public.reviews.feedback_channel is
  'How feedback was collected, such as sms, web, or marketplace.';
comment on column public.reviews.legitimacy_status is
  'A conservative review-quality signal based only on provider-supplied account history and spam indicators.';
