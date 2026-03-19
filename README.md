# Fortify

Supplemental strength programming for functional athletes — mobile-first PWA (**Fortify**) plus a desktop **admin** app. Data lives in **Supabase**; there is no custom API for the product apps.

This repo is a **pnpm workspace**. Use pnpm (not npm at the repo root — the root `preinstall` enforces this).

## Prerequisites

- **Node.js** 18 or newer (22+ or 24 LTS recommended)
- **pnpm** 9+ (`corepack enable` then `corepack prepare pnpm@latest --activate`, or install from [pnpm.io](https://pnpm.io/installation))
- A **Supabase** project

## One-time setup

1. **Install dependencies** (from repo root):

   ```bash
   pnpm install
   ```

2. **Apply SQL** in the Supabase SQL editor (or CLI), **in order**:

   - `supabase/migrations/001_initial.sql`
   - `supabase/migrations/002_add_admin.sql`
   - `supabase/migrations/003_subtracks.sql`
   - `supabase/migrations/004_sports.sql`
   - `supabase/migrations/005_rename_sport_to_discipline.sql`

3. **Seed data**: run `supabase/seed.sql`.

4. **Realtime** (Supabase Dashboard → Database → Replication): enable for `chat_messages` and `sessions` if not already on.

5. **Environment files**

   - Main app: copy `artifacts/fortify/.env.example` → `artifacts/fortify/.env`
   - Admin: copy `artifacts/fortify-admin/.env.example` → `artifacts/fortify-admin/.env`

   Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from Project Settings → API.

6. **Grant admin** (after you sign up once in the admin app):

   ```sql
   update profiles
   set is_admin = true
   where id = (
     select id from auth.users
     where email = 'your-email@example.com'
   );
   ```

## Run locally

From the **repository root**:

```bash
pnpm --filter @workspace/fortify dev
pnpm --filter @workspace/fortify-admin dev
```

Each Vite app listens on **http://localhost:5173** by default. Override with `PORT` if needed.

Optional for Replit-style hosting: set `BASE_PATH` if the app is served under a subpath.

## Build

```bash
pnpm run build
```

## Product direction & backlog

See `replit.md` for workspace layout and stack notes. Larger feature specs (flex-day model, scheduling, notifications) are tracked in your product doc — the database today uses `disciplines`, `subtracks`, and `workouts`; migrations for `subtrack_config`, flex fields, and `scheduled_sessions` are not in this repo yet.

## Legacy Replit files

`.replit` and Replit-only Vite plugins remain for compatibility; on a normal machine, cartographer/dev-banner only load when `REPL_ID` is set.
