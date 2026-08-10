-- Mirror of TypeORM AddUserUrlKey1786120000000.
-- Prefer TypeORM migrations in app deploys; this keeps Supabase schema docs in sync.

alter table public.users
  add column if not exists url_key character varying(64);

-- Backfill is handled by the TypeORM migration (JS url-key allocator).

create unique index if not exists "UQ_users_url_key" on public.users (url_key);
