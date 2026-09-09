-- Optional company and manager details for the authenticated Circuit account.

create table public.account_profiles (
  owner_user_id uuid primary key references auth.users(id) on delete cascade,
  company_name text check (company_name is null or char_length(company_name) between 1 and 120),
  manager_name text check (manager_name is null or char_length(manager_name) between 1 and 120),
  role_title text check (role_title is null or char_length(role_title) between 1 and 120),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.account_profiles enable row level security;
revoke all on table public.account_profiles from anon, authenticated;

comment on table public.account_profiles is
  'Optional company and manager labels for an authenticated Circuit workspace.';
