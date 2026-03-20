# Fortify — Calendaring & notifications (review plan)

This document merges **Prompt 2: Calendaring** with the **current repo reality** and the agreed **deployment / backend** approach. Use it as the single implementation checklist.

**Naming:** In discussion, **“backend”** means the Express app in **`artifacts/api-server`** (pnpm package `@workspace/api-server`). Fortify and fortify-admin remain Vite SPAs; they do not run cron or hold the Supabase **service role** key.

---

## Architecture — Railway (three services)

| Service | Package / artifact | Responsibility |
|--------|---------------------|------------------|
| **Fortify** | `artifacts/fortify` | PWA: calendar UI, onboarding scheduling screens, `Notification.requestPermission`, service worker for **receiving** push, subscribe flow calling backend |
| **Fortify Admin** | `artifacts/fortify-admin` | Admin UI: user calendar tab, analytics charts (unchanged role) |
| **Backend** | `artifacts/api-server` | Long-lived Express: **scheduled job** (every 15–60 min) to query Supabase and send Web Push; **secured HTTP** endpoints to store push subscriptions and optional internal health/cron trigger; uses **service role** + VAPID secrets (never in Vite env) |

**MVP / beta:** notification **delivery** lives in the backend cron loop (`node-cron` or `setInterval`, or Railway cron `POST` to a secret-protected route). **Later:** same logic can move to Supabase Edge Functions without changing the DB model much.

**PWA stays thin:** only client pieces required for permissions, SW registration, and posting subscription JSON to the backend.

---

## Repo fit (adjustments to original spec)

| Original assumption | Current / planned |
|-------------------|-------------------|
| Onboarding: screens between “experience level” and “name/email/password” | Auth is **`/auth`** (email/password); onboarding is **`/onboarding`** (name → subtrack → profile). Add **Primary training days** and **Supplemental timing** in that real order (e.g. after subtrack, before final profile write). |
| “Program” tab | Nav today: Feed, Library, PRs, Chat, Profile. **Add** a **Program** route (e.g. `/program`) and calendar there; replace or slim **FeedCycleSection** on Feed to avoid duplicate cycle UI. |
| Home uses `created_at` offset | Feed already uses **`useNextWorkout`** / session history. **Replace** “today’s workout” logic with **`scheduled_sessions`** + `workouts` join per spec. |
| `sport` in APIs | Schema uses **`discipline`** — keep that everywhere. |
| RLS `scheduled_sessions_own` `for all using …` | Add **`WITH CHECK (auth.uid() = user_id)`** for INSERT. Admin read: use **`public.is_admin_user()`** like other migrations. |
| Estimated duration on cards | **`workouts`** may lack duration — **derive** from blocks or add **`estimated_minutes`** when needed. |
| Admin user “tabs” | Drawer is **sections** today — add a **Calendar** section (or real tabs) as a targeted UI change. |

---

## Part 1 — Database migration

- New file: **`supabase/migrations/009_*.sql`** (next after `008_realtime_broadcast.sql`).
- Contents: `scheduled_sessions` table, RLS (own rows + admin read via `is_admin_user()`), profile columns (`primary_training_days`, `supplemental_timing`, `supplemental_days`, `preferred_workout_time`), indexes as in the product spec.
- Consider a **`cycle_start_date`** (or `date`) on **`profiles`** if not already implied — needed to cap “no week navigation before cycle start.”

---

## Part 2 — Onboarding

- Two new screens (copy/UX per original spec): **Primary training days** (multi-select chips), **Supplemental timing** (same-day before/after vs different days + supplemental day picker + **preferred workout time**).
- Persist on profile: `primary_trainingDays` → `primary_training_days`, `supplemental_timing`, `supplementalDays`, `preferredWorkoutTime`.
- On successful account + profile creation: call **`populateCalendar`** (see Part 3), then show **notification permission** screen before entering main app (spec Part 5).

---

## Part 3 — `populateCalendar`

- **Implement** as a single source of truth: preferably **`populate_calendar(...)` Postgres function** invoked via `supabase.rpc()` **or** backend-only RPC with service role — so subtrack switches and onboarding share logic.
- **Inputs:** `userId`, `discipline`, `subtrack`, `supplementalDays`, `preferredWorkoutTime`, `cycleStartDate` (usually today for new users).
- **Behavior:** read `subtrack_config` + ordered `workouts`; for each week, assign base vs flex days per `base_days_per_week` / `flex_days_per_week`; insert `scheduled_sessions` (`is_confirmed` true for base, false for flex).
- **Subtrack change:** delete **future, incomplete** `scheduled_sessions` for user, then repopulate.
- **Watch:** `unique(user_id, workout_id, scheduled_date)` vs multiple sessions same day — validate against real workout rows.

---

## Part 4 — Calendar UI (Program)

- **Week view:** custom 7-column grid + **date-fns** (navigation, cycle start bound, today highlight).
- **Month view:** reuse **`react-day-picker`** via `artifacts/fortify/src/components/ui/calendar.tsx`; custom day cells for dot semantics (confirmed base / unconfirmed flex / completed).
- **Drag-reschedule:** **`@dnd-kit`** for base + confirmed flex within **same week**; update `scheduled_date`, `rescheduled_from`; conflict + consecutive-day warnings per spec.
- **Coming up:** next 5 sessions, navigate to workout on tap.

---

## Part 5 — Notifications (with backend)

**Client (Fortify PWA)**

- Permission screen after onboarding population.
- Service worker: **receive** push; optional tap navigates to Feed/home.
- Register subscription → **POST to backend** (store in DB, e.g. `push_subscriptions` table — add in migration when implementing).

**Backend (cron)**

- Every **15–60 minutes** (tighter window = more accurate “hour before”):
  - Query `scheduled_sessions` (with `workouts` + `profiles`) where `is_confirmed = true`, not `completed`, and notification flags false.
  - **Day-before:** local **20:00** evening before `scheduled_date` — body copy keyed off `profiles.supplemental_timing` (spec).
  - **Hour-before:** `scheduled_date` at `preferred_time - 60 minutes`.
  - After send: set `notification_day_before_sent` / `notification_hour_before_sent`.
- Use **`web-push`** + VAPID; failures logged; idempotent sends via flags.
- **Unsupported browsers:** UI skips gracefully; no thrown errors in client.

**Profile**

- Toggles: day-before on/off, hour-before on/off; time picker updates `preferred_workout_time` (backend respects on next cron pass).

---

## Part 6 — Feed (“home”) & completion

- Today’s **base** session: query per spec (`scheduled_date = today`, `is_flex_day = false`, `is_confirmed = true`, order, limit 1) + join `workouts`.
- Today’s **confirmed flex** card below when applicable.
- On workout complete: insert `sessions` row as today; **update** matching `scheduled_sessions`: `completed = true`, `completed_session_id = new session id`.

---

## Part 7 — Admin

- User detail: **Calendar** section — table of `scheduled_sessions` + summary counts (scheduled, completed, flex confirmed, flex skipped past-unconfirmed).
- Analytics: **Recharts** — schedule adherence (line, 8 weeks), flex adoption by subtrack (horizontal bar).

---

## Deliverables checklist

- [ ] `009_*.sql`: `scheduled_sessions`, profile scheduling columns, RLS + indexes (+ push subscription storage if bundled)
- [ ] Onboarding: two scheduling screens in **actual** flow order
- [ ] `populate_calendar` after signup + on subtrack change
- [ ] `/program`: week + month calendar, drag, upcoming list
- [ ] Backend: cron + Web Push send + subscription endpoint
- [ ] Fortify: permission screen, SW, thin client subscribe
- [ ] Profile notification settings
- [ ] Feed: today from `scheduled_sessions`; completion updates row
- [ ] Admin: calendar section + two charts
- [ ] No wholesale rebuilds — targeted additions / replacements only

---

## Implementation order (suggested)

1. Migration + types + `populate_calendar` + profile fields  
2. Onboarding + population hook  
3. Program calendar + data reads  
4. Feed + completion wiring  
5. Backend: subscriptions table + send loop + env docs  
6. Admin calendar + analytics  
7. Polish: edge cases, consecutive-day UX, duration display

---

## References in repo

- Migrations: `supabase/migrations/` (through `008` today; add `009` for scheduling)
- Onboarding: `artifacts/fortify` — onboarding route/components
- Cycle UI today: `FeedCycleSection` on Feed
- Backend package: `artifacts/api-server` (**backend** in planning docs)
