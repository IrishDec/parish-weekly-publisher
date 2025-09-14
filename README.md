Trinity of Faith — Weekly Messages Micro-CMS

A super-light CMS: a password-protected WordPress admin page writes to Supabase; the homepage shows a “teaser” and an archive lists published messages — both reading from Supabase.

Architecture (low-tech, by design)
WordPress (WP)

Admin page: Password-protected page that runs a tiny JS admin app (CRUD + publish toggle).

Homepage widget: Reads the latest published teaser from Supabase.

Archive widget: Lists all published messages (title + full_html) from Supabase.

Supabase

Single table: weekly_messages.

RLS: On.

SELECT allowed only when published = true.

INSERT/UPDATE/DELETE temporarily allowed for the anon role (because WP admin page is gated by password).
Plan: switch to Supabase Auth and tighten to authenticated only.

Table (source of truth)
weekly_messages (
  id          uuid primary key default gen_random_uuid(),
  title       text,
  week_start  date not null,
  slug        text unique not null,     -- format: YYYY-MM-DD
  teaser_html text,
  full_html   text not null,
  published   boolean not null default false,
  created_at  timestamptz default now()
)


A CHECK constraint enforces slug looks like YYYY-MM-DD.

Repo layout
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

Open admin/admin.html via a static server (any works).

The admin reads config from window.__TOF_CFG__, set by config.local.js locally, and by an inline snippet when embedded in WordPress.

3) WordPress embed (production)

Create a password-protected page and add a Custom HTML block with:

<script>
  window.__TOF_CFG__ = {
    SUPABASE_URL: "https://YOUR-PROJECT.supabase.co",
    SUPABASE_ANON_KEY: "eyJ..."   /* anon key */
  };
</script>
<link rel="stylesheet" href="https://your-site.example/wp-content/uploads/admin.css">
<script src="https://your-site.example/wp-content/uploads/admin.js"></script>

4) Widgets (homepage & archive)

Homepage: SELECT * FROM weekly_messages WHERE published = true ORDER BY week_start DESC LIMIT 1; → render teaser_html.

Archive: SELECT title, full_html FROM weekly_messages WHERE published = true ORDER BY week_start DESC;.

Security notes (current posture)

Admin is protected by the WP page password.

RLS only exposes SELECT for published = true.

Writes are temporarily allowed to anon for low friction on a password-gated page.
Next step: enable Supabase Auth and restrict writes to authenticated with role checks.

Since *_html fields are rendered, ensure only trusted staff can access the admin page.

Roadmap

Switch to Supabase Auth (email magic-link/OAuth) and tighten policies.

Add validations, auto-slug from week_start, and confirm dialogs.

Small UI polish: homepage spacing + “News by Church” alignment (CSS).

Optional: simple screenshots/GIF of the editor and front page teaser.

License

MIT (or your preference).
