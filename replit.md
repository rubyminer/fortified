# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Fortify is a mobile-first PWA for functional athletes (CrossFit, Hyrox, ATHX) built with React + Vite + Tailwind + Supabase. No backend — all persistence via Supabase directly from the frontend.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5 (api-server, not used by Fortify)
- **Database**: Supabase (external) — not Replit's built-in DB
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server (not used by Fortify)
│   └── fortify/            # Fortify PWA — React + Vite + Supabase
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── supabase/               # Supabase SQL files (run against external Supabase project)
│   ├── migrations/001_initial.sql   # Schema with all tables + RLS policies
│   └── seed.sql                     # 40+ movements, 14+ workouts, chat seeds
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml     # Workspace config
├── tsconfig.base.json      # Shared TS options
└── package.json            # Root package
```

## Fortify App

### Setup
1. Create a Supabase project at https://supabase.com
2. Run `supabase/migrations/001_initial.sql` in the Supabase SQL editor
3. Run `supabase/seed.sql` to populate movements and workouts
4. Enable Realtime on `chat_messages` and `sessions` tables (Database > Replication)
5. Create `artifacts/fortify/.env` from `artifacts/fortify/.env.example` (see root `README.md` for full local setup):
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

### Pages/Routes
- `/auth` — Sign in / sign up with Supabase email auth
- `/onboarding` — First-time profile setup (sport, subtrack, level, frequency)
- `/` — Feed / home (today's workout, recent history, stats)
- `/workout/:id` — Workout detail + set logging
- `/movements` — Movement library (searchable, filterable)
- `/movements/:id` — Movement detail (YouTube embed, cues, muscles)
- `/prs` — Personal records log + add PR
- `/chat` — Community chat (Supabase Realtime)
- `/profile` — User stats + settings

### Sport/Subtrack Options
- **hyrox**: sled_carry_strength, running_economy, upper_body_push
- **crossfit**: overhead_shoulder_strength, lower_body_strength, engine_builder
- **athx**: explosive_power, maximal_strength, conditioning

### PWA
- `artifacts/fortify/public/manifest.json` — Web app manifest
- `artifacts/fortify/public/sw.js` — Service worker for offline shell caching
- `artifacts/fortify/index.html` — PWA meta tags, SW registration

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/fortify` (`@workspace/fortify`)

Fortify — mobile-first PWA for functional athletes. Pure frontend app using Supabase for all data.

Key dependencies: `@supabase/supabase-js`, `wouter`, `@tanstack/react-query`, `framer-motion`, `lucide-react`, `react-hook-form`, `zod`, `date-fns`

### `artifacts/fortify-admin` (`@workspace/fortify-admin`)

Fortify Admin — desktop-optimized admin panel for managing the Fortify app. Pure frontend using Supabase for all data.

Preview path: `/admin/`

Key features: Dashboard stats, Workout CRUD with exercise builder, Movement library management, User management with track override, Community moderation (chat posts, pin/delete), Analytics charts with Recharts.

Key dependencies: `@supabase/supabase-js`, `wouter`, `recharts`, `date-fns`

Setup:
1. Run `supabase/migrations/002_add_admin.sql` in Supabase SQL editor to add `is_admin` column and admin RLS policies
2. Grant admin: `update profiles set is_admin = true where id = (select id from auth.users where email = 'your-email@example.com');`
3. Create `artifacts/fortify-admin/.env` from `artifacts/fortify-admin/.env.example`:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server (not used by Fortify — included as part of monorepo template).

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL (for api-server use, not Fortify).
