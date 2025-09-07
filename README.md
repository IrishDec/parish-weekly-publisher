# Trinity of Faith — Weekly Messages Micro-CMS

A tiny, no-backend CMS for a church site. Editors paste weekly content into an **admin page** (WordPress password-protected), which writes to **Supabase**.  
The **homepage** shows the latest teaser; the **archive page** lists all published messages.

## What’s inside
- **Supabase**: `weekly_messages` table (+ Row Level Security)
- **Admin UI** (`admin.html` / `admin.js` / `admin.css`): create/update/delete, publish toggle
- **Widgets**:
  - **Homepage teaser**: loads latest published `teaser_html`
  - **Archive**: renders all published `full_html`, newest first

## Quick start (local / portfolio)
1. **Clone** this repo.
2. **Create config** (ignored by git):
   ```bash
   cp admin/config.example.js admin/config.local.js
