-- Remove pre-account prototype records and the retired CSV import structure.
-- Account-owned data is preserved.

delete from public.reviews where owner_user_id is null;
delete from public.manager_actions where owner_user_id is null;
delete from public.source_connections where owner_user_id is null;
delete from public.locations where owner_user_id is null;

alter table public.reviews drop column if exists import_batch_id;
drop table if exists public.import_batches;

alter table public.reviews alter column owner_user_id set not null;
alter table public.locations alter column owner_user_id set not null;
alter table public.manager_actions alter column owner_user_id set not null;
alter table public.source_connections alter column owner_user_id set not null;

comment on table public.reviews is
  'Account-owned customer feedback received from authorized provider connections.';
