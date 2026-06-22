# Supabase Setup for DOFree v2

DOFree v2 is prepared for Supabase Auth and database-backed member features.

## Environment variables

Add these variables in Vercel Project Settings → Environment Variables.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in browser/client components. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.

## Core database tables

The migration file is located at:

```txt
supabase/migrations/20260623000000_dofree_core.sql
```

It prepares:

- `profiles` — user display name, avatar, role
- `favorites` — saved movie/TV favorites
- `watch_history` — user watch/trailer activity
- `memberships` — premium status and payment review state
- `notifications` — user notifications

## Current integration state

The app still works without Supabase because localStorage is used as a fallback for demo workflows. The next step is to replace localStorage actions with Supabase calls once the correct Supabase project is confirmed.

## Recommended rollout

1. Confirm the correct Supabase project.
2. Apply the migration.
3. Add the environment variables to Vercel.
4. Connect login to Supabase Auth.
5. Move favorites from localStorage to the `favorites` table.
6. Move premium status to the `memberships` table.
7. Add admin review screens for pending memberships.
