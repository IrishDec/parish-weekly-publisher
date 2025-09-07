# Trinity of Faith — Weekly Messages Micro-CMS

A super-light CMS: a password-protected WordPress admin page writes to Supabase; the homepage shows a “teaser” and an archive lists published messages — both reading from Supabase.

## Architecture (low-tech, by design)

- **WordPress (WP)**
  - **Admin page**: Password-protected WP page that runs a tiny JS admin app (CRUD + publish toggle).
  - **Homepage widget**: Reads the latest **published** teaser from Supabase.
  - **Archive widget**: Lists all **published** messages (title + full_html) from Supabase.
- **Supabase**
  - Single table: `weekly_messages`.
  - RLS on. Current policies:
    - `SELECT` allowed only when `published = true`.
    - `INSERT/UPDATE/DELETE` allowed for the `anon` role (because WP page is gated by password). _We will tighten later if we add Supabase Auth._

## Table (source of truth)

```sql
weekly_messages (
  id           uuid pk default gen_random_uuid(),
  title        text,
  week_start   date not null,
  slug         text unique not null   -- format: YYYY-MM-DD
  teaser_html  text,
  full_html    text not null,
  published    boolean not null default false,
  created_at   timestamptz default now()
)
