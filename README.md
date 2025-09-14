# Trinity of Faith — Weekly Messages Micro-CMS

A super-light CMS: a password-protected WordPress admin page writes to Supabase; the homepage shows a teaser and an archive lists published messages — both reading from Supabase.

## Architecture (low-tech, by design)

### WordPress
- **Admin page:** password-protected page running a tiny JS admin (CRUD + publish).
- **Homepage widget:** reads latest published teaser from Supabase.
- **Archive widget:** lists all published messages (`title` + `full_html`) from Supabase.

### Supabase
- **Single table:** `weekly_messages`.
- **RLS:** on  
  - `SELECT` allowed only when `published = true`.  
  - `INSERT/UPDATE/DELETE` temporarily allowed for the `anon` role (admin page is password-gated). _Plan: move to Supabase Auth and tighten._

### Table (source of truth)

```sql
create table if not exists weekly_messages (
  id          uuid primary key default gen_random_uuid(),
  title       text,
  week_start  date not null,
  slug        text unique not null,     -- format: YYYY-MM-DD
  teaser_html text,
  full_html   text not null,
  published   boolean not null default false,
  created_at  timestamptz default now()
);

-- Optional: enforce YYYY-MM-DD slugs
alter table weekly_messages
  add constraint weekly_messages_slug_format
  check (slug ~ '^\d{4}-\d{2}-\d{2}$');
Repo layout
pgsql
Copy code
admin/                 # admin page assets (no secrets)
  admin.html           # standalone admin page (for local/portfolio)
  admin.css            # admin UI styles
  admin.js             # admin logic (CRUD)
  config.example.js    # exports SUPABASE_URL, SUPABASE_ANON_KEY

index.html             # optional sample/portfolio scaffold

supabase/
  sql/
    setup.sql          # table + constraints + RLS policies

.gitignore             # ignores admin/config.local.js
Quickstart
1) Supabase
Create a project.

SQL Editor → run supabase/sql/setup.sql.

Project Settings → API → copy Project URL and anon key.

2) Local admin (portfolio/dev)
Copy admin/config.example.js → admin/config.local.js (do not commit).

Fill in SUPABASE_URL and SUPABASE_ANON_KEY.

Serve admin/admin.html with any static server.

The admin reads config from window.__TOF_CFG__, set by config.local.js locally, and by an inline snippet when embedded in WordPress.

3) WordPress embed (production)
Create a password-protected page and add a Custom HTML block:

html
Copy code
<script>
  window.__TOF_CFG__ = {
    SUPABASE_URL: "https://YOUR-PROJECT.supabase.co",
    SUPABASE_ANON_KEY: "eyJ..."   /* anon key */
  };
</script>
<link rel="stylesheet" href="https://your-site.example/wp-content/uploads/admin.css">
<script src="https://your-site.example/wp-content/uploads/admin.js"></script>
4) Widgets (homepage & archive)
Homepage: render latest teaser

sql
Copy code
select * from weekly_messages
where published = true
order by week_start desc
limit 1;
Archive: list all published

sql
Copy code
select title, full_html from weekly_messages
where published = true
order by week_start desc;
Security notes (current posture)
Admin is protected by a WP page password.

RLS exposes SELECT only for published = true.

Writes are temporarily allowed to anon for low friction on a password-gated page.
Next: enable Supabase Auth and restrict writes to authenticated with role checks.

Since *_html is rendered, only trusted staff should access the admin page.

Roadmap
Switch to Supabase Auth (magic-link/OAuth) and tighten policies.

Add validations, auto-slug from week_start, and confirm dialogs.

Small UI polish: homepage spacing + “News by Church” alignment.

Optional: screenshots/GIFs of the editor and front-page teaser.

License
MIT (or your preference).












