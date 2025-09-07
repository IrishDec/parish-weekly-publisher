[README.md](https://github.com/user-attachments/files/22198820/README.md)
[Uploadin# Trinity of Faith — Weekly Messages Micro-CMS

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
```
A CHECK constraint enforces `slug` looks like `YYYY-MM-DD`.

## Repo layout

```
admin/                # admin page assets (no secrets)
  config.example.js   # exports SUPABASE_URL, SUPABASE_ANON_KEY
  admin.css           # admin UI styles
  admin.js            # admin logic (CRUD)
  admin.html          # minimal standalone admin page (for local/portfolio)
index.html            # optional sample/portfolio scaffold
supabase/
  sql/
    setup.sql         # table + RLS policies
.gitignore            # ignores admin/config.local.js
```

## Quickstart

### 1) Supabase
1. Create a Supabase project.
2. In the SQL editor, run the contents of `supabase/sql/setup.sql`.
3. Copy your **Project URL** and **anon key** from _Project Settings → API_.

### 2) Local admin (for portfolio / dev)
1. Copy `admin/config.example.js` → `admin/config.local.js` (kept out of git).
2. Fill in your project URL + anon key.
3. Open `admin/admin.html` via a local server (any static server works).

> The admin app reads config from `window.__TOF_CFG__`, which is populated by `admin/config.local.js` during local dev, and by an inline snippet when embedded in WordPress.

### 3) WordPress embed (production)
Create a **password-protected** page and add a **Custom HTML** block that:
- (a) inlines your Supabase URL + anon key into `window.__TOF_CFG__`
- (b) loads your built/static `admin.js` + `admin.css` (or serves them from your theme).

Example inline config:
```html
<script type="module">
  window.__TOF_CFG__ = {
    SUPABASE_URL: "https://YOUR-PROJECT.supabase.co",
    SUPABASE_ANON_KEY: "eyJ..." // anon key
  };
</script>
<script type="module" src="https://your-site.example/wp-content/uploads/admin.js"></script>
<link rel="stylesheet" href="https://your-site.example/wp-content/uploads/admin.css"/>
```

### 4) Widgets (homepage & archive)
Your existing WP widgets call Supabase (anon) and:
- **Homepage**: `select(*)` where `published = true`, order by `week_start desc`, take 1 → render `teaser_html`.
- **Archive**: `select(title, full_html)` where `published = true`, order by `week_start desc`.

## Security notes (current posture)
- Admin is protected by the **WP page password**.
- RLS only exposes `SELECT` for rows where `published = true`.
- **Writes** (insert/update/delete) are allowed to the `anon` role for now to keep friction low. If adding Supabase Auth later, tighten policies to use `authenticated` with role checks.
- Since `*_html` fields are rendered, ensure only trusted admins use the page.

## Roadmap
- Optional: switch to Supabase Auth (email link or OAuth) and restrict write policies.
- Add simple validation, autoslug from `week_start`, and confirm dialogs.
- Small UI polish: homepage spacing + “News by Church” alignment (CSS only).

## License
MIT (or your preference).
g README.md…]()
