-- supabase/sql/setup.sql
-- Trinity of Faith — Weekly Messages Micro-CMS
-- Creates the table and RLS policies exactly as described.

-- Ensure gen_random_uuid() is available
create extension if not exists "pgcrypto";

-- 1) Table
create table if not exists public.weekly_messages (
  id uuid primary key default gen_random_uuid(),
  title text,
  week_start date not null,
  slug text not null unique,
  teaser_html text,
  full_html text not null,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  constraint slug_is_yyyy_mm_dd check (slug ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$')
);

-- Helpful index for homepage queries
create index if not exists weekly_messages_week_start_desc
  on public.weekly_messages (published desc, week_start desc);

-- 2) RLS
alter table public.weekly_messages enable row level security;

-- SELECT: allow anyone to read only published rows
create policy if not exists "select_published_only"
on public.weekly_messages
for select
to public
using (published = true);

-- INSERT: allow anon role to write (because WP page is password protected)
create policy if not exists "anon_can_insert"
on public.weekly_messages
for insert
to anon
with check (true);

-- UPDATE: allow anon role to update any row
create policy if not exists "anon_can_update"
on public.weekly_messages
for update
to anon
using (true)
with check (true);

-- DELETE: allow anon role to delete
create policy if not exists "anon_can_delete"
on public.weekly_messages
for delete
to anon
using (true);

-- 3) (Optional) Seed example — comment out if not needed
-- insert into public.weekly_messages (title, week_start, slug, teaser_html, full_html, published)
-- values (
--   'Welcome to Trinity of Faith',
--   '2025-01-05',
--   '2025-01-05',
--   '<p>This week''s reflection…</p>',
--   '<div><h2>Full Message</h2><p>Grace and peace…</p></div>',
--   true
-- );
