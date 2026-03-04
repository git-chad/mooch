# mooch — Webapp Development Plan

> **"Track the chaos, keep the vibes: expenses, plans, votes & memories — all in one squad app."**
>
> Web app (Next.js 16 + Supabase) · Monorepo · English & Spanish
> Structure: `mooch.com` (marketing) + `app.mooch.com` (app)

---

## Rules

- **A phase is not done until it is explicitly marked APPROVED.**
- No work on the next phase may begin until the current phase is approved.
- If a phase is in progress and a blocker is found, stop and report it — never skip steps.
- Each phase ends with a **Testing Checklist**. All items must pass before approval.

---

## Status Legend

| Symbol | Meaning                                             |
| ------ | --------------------------------------------------- |
| ⬜     | Not started                                         |
| 🔄     | In progress                                         |
| ✅     | Done                                                |
| ✋     | Blocked                                             |
| 🟢     | **APPROVED** — phase complete, next phase can begin |

---

## Tech Stack

| Layer          | Technology                                                   |
| -------------- | ------------------------------------------------------------ |
| Framework      | Next.js 16 (App Router) + React 19                           |
| Language       | TypeScript 5                                                 |
| Styling        | Tailwind CSS 4                                               |
| UI Primitives  | Base UI Components                                           |
| Animations     | Motion (Framer Motion v12)                                   |
| Backend        | Supabase (Postgres, Auth, Storage, Realtime, Edge Functions) |
| Auth           | Supabase Auth — email/password + Google OAuth                |
| Real-time      | Supabase Realtime channels                                   |
| Push           | Web Push API + Supabase Edge Functions                       |
| File Storage   | Supabase Storage                                             |
| State (client) | Zustand (stores in `packages/stores`)                        |
| Monorepo       | Bun workspaces                                               |
| Linting/Format | Biome                                                        |
| Deployment     | Vercel (both apps)                                           |

---

## Monorepo Structure

```
mooch/
├── apps/
│   ├── app/          → Next.js app — app.mooch.com
│   └── web/          → Next.js marketing site — mooch.com
├── packages/
│   ├── db/           → Supabase client, queries, types
│   ├── types/        → Shared TypeScript types & Zod schemas
│   ├── ui/           → Shared components (used by both apps)
│   └── stores/       → Zustand stores (client state)
├── supabase/
│   ├── migrations/   → SQL migration files
│   └── functions/    → Edge Functions (TS)
├── biome.json
├── package.json      → bun workspaces root
└── turbo.json        → Turborepo task orchestration
```

---

## Supabase Database Schema (Reference)

```sql
-- profiles (extends auth.users)
profiles (id, display_name, photo_url, locale, default_currency, created_at, updated_at)

-- groups
groups (id, name, emoji, cover_photo_url, currency, locale, invite_code, created_by, created_at, updated_at)
group_members (group_id, user_id, role, joined_at)

-- expenses
expenses (id, group_id, description, amount, currency, category, paid_by, split_type, is_settled, settled_at, photo_url, created_by, created_at, updated_at)
expense_participants (expense_id, user_id, share_amount)
balances (id, group_id, from_user, to_user, amount, updated_at)

-- polls
polls (id, group_id, question, is_anonymous, is_multi_choice, is_closed, closes_at, created_by, created_at, updated_at)
poll_options (id, poll_id, text, sort_order)
poll_votes (poll_id, option_id, user_id, created_at)

-- plans (kanban)
plans (id, group_id, title, description, status, sort_order, date, organizer_id, linked_event_id, created_by, created_at, updated_at)
plan_attachments (id, plan_id, type, url, created_at)

-- events
events (id, group_id, title, description, date, location, organizer_id, linked_poll_id, linked_plan_id, created_by, created_at, updated_at)
event_rsvps (event_id, user_id, status, plus_ones, created_at, updated_at)
event_attendees (event_id, user_id)

-- feed
feed_items (id, group_id, type, media_url, caption, duration_seconds, linked_expense_id, linked_event_id, linked_poll_id, created_by, created_at)
feed_reactions (feed_item_id, user_id, emoji, created_at)

-- insights
insights (id, group_id, week_id, total_spent, top_category, top_poll, attendance_leader, most_organized, top_lender, fun_fact, generated_at)
```

---

---

# Phase 0: Monorepo Foundation & Tooling

**Goal:** Working monorepo with both Next.js apps running, shared packages wired up, Supabase local dev running, and all tooling configured.

**Status:** 🟢

---

### 0.1 — Bun Workspaces

- [x] 0.1.1 — Update root `package.json` to declare bun workspaces:
  ```json
  {
    "name": "mooch",
    "private": true,
    "workspaces": ["apps/*", "packages/*"]
  }
  ```
- [x] 0.1.2 — Give each app and package a proper `package.json` with a unique name:
  - `apps/app` → `@mooch/app`
  - `apps/web` → `@mooch/web`
  - `packages/db` → `@mooch/db`
  - `packages/types` → `@mooch/types`
  - `packages/ui` → `@mooch/ui`
  - `packages/stores` → `@mooch/stores` (create this package)
- [x] 0.1.3 — Run `bun install` from root and verify the lockfile resolves all workspaces.

### 0.2 — Turborepo

- [x] 0.2.1 — Add `turbo` as a dev dependency at root.
- [x] 0.2.2 — Create `turbo.json` with task graph:
  - `build` depends on `^build` (dependencies built first)
  - `dev` runs in parallel, no deps
  - `lint` runs in parallel
  - `typecheck` runs in parallel
- [x] 0.2.3 — Add root scripts: `dev`, `build`, `lint`, `typecheck` → delegate to turbo.

### 0.3 — Apps: Next.js Setup

- [x] 0.3.1 — Scaffold `apps/app` as a full Next.js 16 App Router project (copy/move relevant config from root `next.config.ts`, `tsconfig.json`, `postcss.config.mjs` into the app folder). App should be self-contained.
- [x] 0.3.2 — Scaffold `apps/web` as a second full Next.js 16 App Router project with its own config.
- [x] 0.3.3 — Configure each app's `tsconfig.json` to resolve `@mooch/*` packages via `paths`.
- [x] 0.3.4 — Verify both `bun run dev` commands start without errors.
- [x] 0.3.5 — Clean up root: remove `src/`, `next.config.ts`, `next-env.d.ts`, `postcss.config.mjs` from root (the root is now the workspace root only, not an app).

### 0.4 — Shared Packages Scaffold

- [x] 0.4.1 — `packages/types`: add `tsconfig.json`, export `src/index.ts`. Add placeholder types (`User`, `Group`).
- [x] 0.4.2 — `packages/db`: add `tsconfig.json`, export `src/index.ts`. Install `@supabase/supabase-js` and `@supabase/ssr`. Create `createClient()` helpers (browser + server/SSR).
- [x] 0.4.3 — `packages/ui`: add `tsconfig.json`, export `src/index.ts`. Create a placeholder `<Button>` component. Ensure it can be imported by both apps.
- [x] 0.4.4 — `packages/stores`: add `tsconfig.json`, export `src/index.ts`. Install `zustand`. Create placeholder `useGroupStore` (active group id).

### 0.5 — Supabase Local Dev

- [x] 0.5.1 — Install Supabase CLI globally: `bun add -g supabase`.
- [x] 0.5.2 — Run `supabase init` in the repo root (already has a `supabase/` folder, confirm it's initialized).
- [x] 0.5.3 — Run `supabase start` and verify all local services are up (Studio at `localhost:54323`, DB at port `54322`).
- [x] 0.5.4 — Create `.env.local` for each app with local Supabase keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- [x] 0.5.5 — Add `.env*.local` to `.gitignore` (verify). Add `.env.example` files with placeholder keys.

### 0.6 — Biome Config

- [x] 0.6.1 — Ensure root `biome.json` applies to all apps and packages. Confirm.
- [x] 0.6.2 — Add a `lint` script to each app/package's `package.json` that runs `biome check`.
- [x] 0.6.3 — Run `bun lint` from root through turbo and fix any existing issues.

### 0.7 — Verify & Test

- [x] 0.7.1 — `bun run dev` from root starts both apps simultaneously.
- [x] 0.7.2 — `apps/app` dev server accessible at `localhost:3000`.
- [x] 0.7.3 — `apps/web` dev server accessible at `localhost:3001`.
- [x] 0.7.4 — `bun build` from root builds both apps without TypeScript errors.
- [x] 0.7.5 — Supabase local Studio accessible at `localhost:54323`.
- [x] 0.7.6 — `packages/ui` `<Button>` can be imported and rendered in `apps/app`.
- [x] 0.7.7 — `packages/db` Supabase client can be instantiated without errors.

---

**Phase 0 Testing Checklist (must all pass before APPROVED):**

- [x] Both apps start with `bun run dev`
- [x] Both apps build with `bun run build`
- [x] Supabase local dev runs (`supabase status` shows all services healthy)
- [x] Workspace resolution works (cross-package imports resolve)
- [x] No lint errors with `bun run lint`

**Phase 0 Status: 🟢 APPROVED**

---

---

# Phase 1: Authentication & User Profiles

**Goal:** Users can sign up and log in with email/password or Google OAuth. A profile is persisted in Supabase. Auth state is available throughout the app.

**Status:** 🔄

---

### 1.1 — Database Migration: Profiles

- [x] 1.1.1 — Create `supabase/migrations/0001_profiles.sql`:

  ```sql
  create table public.profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    display_name text not null,
    photo_url text,
    locale text not null default 'en',
    default_currency text not null default 'USD',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  alter table public.profiles enable row level security;

  create policy "Users can view own profile"
    on public.profiles for select using (auth.uid() = id);

  create policy "Users can update own profile"
    on public.profiles for update using (auth.uid() = id);

  -- Auto-create profile on signup
  create or replace function public.handle_new_user()
  returns trigger language plpgsql security definer set search_path = public as $$
  begin
    insert into public.profiles (id, display_name, photo_url)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
      new.raw_user_meta_data->>'avatar_url'
    );
    return new;
  end;
  $$;

  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
  ```

- [x] 1.1.2 — Run `supabase db reset` locally and confirm the `profiles` table exists.
- [x] 1.1.3 — Add the `Profile` TypeScript type to `packages/types/src/index.ts`.

### 1.2 — Supabase Auth Configuration

- [x] 1.2.1 — Enable email/password auth in local Supabase config (`supabase/config.toml`).
- [x] 1.2.2 — Enable Google OAuth in Supabase Dashboard (local). Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to env.
- [x] 1.2.3 — Configure redirect URL for Google OAuth: `http://localhost:3000/auth/callback`.
- [x] 1.2.4 — Configure email templates (confirm email, password reset) in Supabase local config.

### 1.3 — Supabase Client Helpers (packages/db)

- [ ] 1.3.1 — `packages/db/src/client/browser.ts`: `createBrowserClient()` using `@supabase/ssr`.
- [ ] 1.3.2 — `packages/db/src/client/server.ts`: `createServerClient()` (for Server Components + Server Actions).
- [ ] 1.3.3 — `packages/db/src/client/middleware.ts`: `createMiddlewareClient()` for Next.js middleware.
- [ ] 1.3.4 — Export all three from `packages/db/src/index.ts`.

### 1.4 — Next.js Auth Middleware (apps/app)

- [ ] 1.4.1 — Create `apps/app/src/middleware.ts`. Use `createMiddlewareClient()` from `@mooch/db` to refresh the session on every request.
- [ ] 1.4.2 — Protect all routes under `/dashboard/*` — redirect unauthenticated users to `/login`.
- [ ] 1.4.3 — Redirect authenticated users away from `/login` and `/signup` to `/dashboard`.

### 1.5 — Auth Route Handlers (apps/app)

- [ ] 1.5.1 — Create `apps/app/src/app/auth/callback/route.ts`. Exchange the OAuth code for a session and redirect to `/dashboard`.
- [ ] 1.5.2 — Create `apps/app/src/app/auth/confirm/route.ts` for email confirmation links.

### 1.6 — Login & Signup Pages

- [ ] 1.6.1 — Create `apps/app/src/app/(auth)/layout.tsx` — centered, full-height auth layout with mooch logo/wordmark.
- [ ] 1.6.2 — Create `apps/app/src/app/(auth)/login/page.tsx`:
  - Email + password fields
  - "Sign in with Google" button (calls `signInWithOAuth({ provider: 'google' })`)
  - Link to `/signup`
  - "Forgot password?" link
  - Client component — uses `createBrowserClient()`
  - Show error message on failed login
  - Loading state on submit
- [ ] 1.6.3 — Create `apps/app/src/app/(auth)/signup/page.tsx`:
  - Display name, email, password fields
  - Validation: display name ≥ 2 chars, valid email, password ≥ 8 chars
  - On success: show "Check your email" message
  - Link back to `/login`
- [ ] 1.6.4 — Create `apps/app/src/app/(auth)/forgot-password/page.tsx`:
  - Email field → calls `resetPasswordForEmail()`
  - Success/error feedback

### 1.7 — Profile Queries (packages/db)

- [ ] 1.7.1 — Create `packages/db/src/queries/profiles.ts`:
  - `getProfile(supabase, userId)` — fetch profile by ID
  - `updateProfile(supabase, userId, data)` — update display_name, photo_url, locale, default_currency
- [ ] 1.7.2 — Export from `packages/db/src/index.ts`.

### 1.8 — Dashboard Layout & Profile Page (apps/app)

- [ ] 1.8.1 — Create `apps/app/src/app/dashboard/layout.tsx` — server component that fetches the session. If no session, redirect to `/login`. Renders sidebar/navigation shell.
- [ ] 1.8.2 — Create `apps/app/src/app/dashboard/page.tsx` — placeholder home page showing "Welcome, {display_name}".
- [ ] 1.8.3 — Create `apps/app/src/app/dashboard/profile/page.tsx`:
  - Display current profile (display_name, email read-only, locale, default_currency)
  - Edit form for display_name, locale (EN/ES selector), default_currency
  - Avatar upload (Supabase Storage `avatars` bucket, create bucket in migration)
  - "Sign Out" button — calls `signOut()` + redirect to `/login`
- [ ] 1.8.4 — Avatar upload: compress client-side (Canvas API) → upload to `avatars/{userId}.{ext}` → save public URL to `profiles.photo_url`.

### 1.9 — Zustand Auth Store (packages/stores)

- [ ] 1.9.1 — Create `packages/stores/src/auth.ts`: `useAuthStore` with `user`, `profile`, `setUser`, `setProfile`, `reset`.
- [ ] 1.9.2 — In the app's root provider/layout, hydrate the store from the session after mount.

### 1.10 — Verify & Test

- [ ] 1.10.1 — Sign up with email → receive confirmation email → click link → redirected to `/dashboard`.
- [ ] 1.10.2 — Sign in with email/password → lands on `/dashboard`.
- [ ] 1.10.3 — Sign in with Google → redirected through OAuth → lands on `/dashboard`.
- [ ] 1.10.4 — Visiting `/dashboard` when logged out → redirected to `/login`.
- [ ] 1.10.5 — Visiting `/login` when logged in → redirected to `/dashboard`.
- [ ] 1.10.6 — Profile edit saves to Supabase, changes reflected on reload.
- [ ] 1.10.7 — Avatar upload works (photo visible after upload).
- [ ] 1.10.8 — Sign out → redirected to `/login`, session cleared.
- [ ] 1.10.9 — Forgot password → email received with reset link.
- [ ] 1.10.10 — `profiles` row auto-created on signup (verify in Supabase Studio).

---

**Phase 1 Testing Checklist (must all pass before APPROVED):**

- [ ] Email sign-up + email confirmation works end to end
- [ ] Google OAuth sign-in works end to end
- [ ] Auth-guarded routes redirect unauthenticated users
- [ ] Profile is auto-created on first sign-up
- [ ] Profile editing (name, locale, currency, avatar) saves correctly
- [ ] Sign out clears session and redirects

**Phase 1 Status: ⬜ — Awaiting approval**

---

---

# Phase 2: Groups System

**Goal:** Users can create squads, invite friends via invite code or QR, join groups, and switch between groups. The active group context is available throughout the app.

**Status:** ⬜ — _Blocked until Phase 1 is APPROVED_

---

### 2.1 — Database Migrations: Groups

- [ ] 2.1.1 — Create `supabase/migrations/0002_groups.sql`:

  ```sql
  create table public.groups (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    emoji text not null default '👥',
    cover_photo_url text,
    currency text not null default 'ARS',
    locale text not null default 'en',
    invite_code text not null unique,
    created_by uuid references public.profiles(id) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table public.group_members (
    group_id uuid references public.groups(id) on delete cascade,
    user_id uuid references public.profiles(id) on delete cascade,
    role text not null default 'member',
    joined_at timestamptz not null default now(),
    primary key (group_id, user_id)
  );

  alter table public.groups enable row level security;
  alter table public.group_members enable row level security;

  create policy "Members can view group"
    on public.groups for select
    using (exists (
      select 1 from public.group_members
      where group_id = id and user_id = auth.uid()
    ));

  create policy "Admins can update group"
    on public.groups for update
    using (exists (
      select 1 from public.group_members
      where group_id = id and user_id = auth.uid() and role = 'admin'
    ));

  create policy "Members can view group_members"
    on public.group_members for select
    using (exists (
      select 1 from public.group_members gm
      where gm.group_id = group_id and gm.user_id = auth.uid()
    ));

  create or replace function public.is_group_member(group_id uuid)
  returns boolean language sql security definer as $$
    select exists (
      select 1 from public.group_members
      where group_members.group_id = $1 and user_id = auth.uid()
    );
  $$;
  ```

- [ ] 2.1.2 — Add `Group` and `GroupMember` TypeScript types to `packages/types`.
- [ ] 2.1.3 — Run migration and verify in Supabase Studio.

### 2.2 — Group Queries & Server Actions

- [ ] 2.2.1 — `packages/db/src/queries/groups.ts`:
  - `getGroupsByUser(supabase, userId)` — groups where user is a member
  - `getGroupById(supabase, groupId)` — single group with members
  - `getGroupMembers(supabase, groupId)` — list of members with profile data
- [ ] 2.2.2 — `apps/app/src/app/actions/groups.ts` (Server Actions):
  - `createGroup(data)` — generates 6-char alphanumeric invite code, inserts group + adds creator as admin
  - `joinGroupByCode(inviteCode)` — looks up group, adds current user as member
  - `updateGroup(groupId, data)` — update name, emoji, cover photo, currency, locale (admin only)
  - `leaveGroup(groupId)` — remove self from members (prevent last admin from leaving)
  - `deleteGroup(groupId)` — admin only, cascades
  - `regenerateInviteCode(groupId)` — admin only, creates new unique 6-char code
  - `removeMember(groupId, userId)` — admin only

### 2.3 — Group Zustand Store

- [ ] 2.3.1 — Create `packages/stores/src/groups.ts`: `useGroupStore` with `groups`, `activeGroupId`, `setGroups`, `setActiveGroup`, `addGroup`, `removeGroup`.

### 2.4 — Groups UI

- [ ] 2.4.1 — `apps/app/src/app/dashboard/groups/page.tsx`:
  - List of user's groups (emoji, name, member count, currency badge)
  - "Create a squad" button → opens create group modal
  - "Join a squad" button → opens join group modal
  - Empty state: "You're not in any squads yet"
- [ ] 2.4.2 — `apps/app/src/components/groups/CreateGroupModal.tsx`:
  - Group name input
  - Emoji picker (inline grid of preset emojis)
  - Currency selector (ARS, USD, EUR, BRL)
  - Locale selector (EN, ES)
  - Optional: cover photo upload
  - On submit: calls `createGroup` → navigates to group page
- [ ] 2.4.3 — `apps/app/src/components/groups/JoinGroupModal.tsx`:
  - 6-character code input (auto-uppercase, auto-advance per char)
  - QR code scanner (browser `getUserMedia` + `jsqr` lib)
  - On submit: calls `joinGroupByCode`
- [ ] 2.4.4 — `apps/app/src/app/dashboard/groups/[groupId]/page.tsx`:
  - Group header (emoji, name, member count)
  - Members list (avatar, name, role badge)
  - Navigation tabs for group sections
  - "Invite" button → opens invite sheet
- [ ] 2.4.5 — `apps/app/src/components/groups/InviteSheet.tsx`:
  - Large monospace invite code display
  - "Copy code" button
  - QR code (generated with `qrcode` npm package)
  - "Share link" button → `navigator.share()` with `https://app.mooch.com/join/{code}`
- [ ] 2.4.6 — `apps/app/src/app/join/[code]/page.tsx` (public, no auth required):
  - Shows group name + emoji from invite code lookup
  - "Join this squad" CTA → if not logged in, redirect to `/login?next=/join/{code}`; if logged in, call `joinGroupByCode`
- [ ] 2.4.7 — `apps/app/src/app/dashboard/groups/[groupId]/settings/page.tsx`:
  - Edit name, emoji, cover photo, currency, locale
  - Member management (remove member, change role — admin only)
  - "Regenerate invite code" button
  - "Leave group" with confirm dialog
  - "Delete group" (admin only, confirm by typing group name)
- [ ] 2.4.8 — `apps/app/src/components/groups/GroupSwitcher.tsx`:
  - Horizontal scrollable row of group chips (emoji + name) in top nav
  - Active chip highlighted
  - Clicking sets `activeGroupId` in Zustand + persists to `localStorage`
  - "+" chip → open create group modal

### 2.5 — App Layout with Group Context

- [ ] 2.5.1 — Update `apps/app/src/app/dashboard/layout.tsx` to fetch user's groups server-side.
- [ ] 2.5.2 — Create client-side `GroupsProvider` that hydrates the Zustand group store.
- [ ] 2.5.3 — Add `GroupSwitcher` to the dashboard top nav.

### 2.6 — Verify & Test

- [ ] 2.6.1 — Create a group → appears in groups list.
- [ ] 2.6.2 — Invite code generated (6 chars, alphanumeric).
- [ ] 2.6.3 — Copy invite code → paste into join modal → joins group.
- [ ] 2.6.4 — QR code displays correctly and is scannable.
- [ ] 2.6.5 — Deep link `/join/{code}` shows group preview and allows joining.
- [ ] 2.6.6 — Group switcher switches active group.
- [ ] 2.6.7 — Group settings: edit name/emoji → changes saved.
- [ ] 2.6.8 — Leave group removes user from members.
- [ ] 2.6.9 — Delete group cascades (no orphaned data).
- [ ] 2.6.10 — Non-members cannot access group data (RLS check in Supabase Studio).

---

**Phase 2 Testing Checklist (must all pass before APPROVED):**

- [ ] Create group with name, emoji, currency
- [ ] Join by invite code works
- [ ] Join by QR code works
- [ ] Join via `/join/{code}` deep link works (logged in + logged out flows)
- [ ] Group switcher changes active group
- [ ] Group settings (edit, leave, delete) work
- [ ] RLS confirmed: unauthenticated user cannot query groups table

**Phase 2 Status: ⬜ — Awaiting approval**

---

---

# Phase 3: Expense Tracker & Balances

**Goal:** Full expense splitting with equal/percentage/exact splits, real-time balance calculation, balance matrix, and settle-up flow. This is the core value loop.

**Status:** ⬜ — _Blocked until Phase 2 is APPROVED_

---

### 3.1 — Database Migrations: Expenses & Balances

- [ ] 3.1.1 — Create `supabase/migrations/0003_expenses.sql`:

  ```sql
  create type expense_category as enum ('bar', 'clubbing', 'bbq', 'groceries', 'transport', 'accommodation', 'other');
  create type split_type as enum ('equal', 'percentage', 'exact');

  create table public.expenses (
    id uuid primary key default gen_random_uuid(),
    group_id uuid references public.groups(id) on delete cascade not null,
    description text not null,
    amount numeric(12,2) not null check (amount > 0),
    currency text not null,
    category expense_category not null default 'other',
    paid_by uuid references public.profiles(id) not null,
    split_type split_type not null default 'equal',
    is_settled boolean not null default false,
    settled_at timestamptz,
    photo_url text,
    created_by uuid references public.profiles(id) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table public.expense_participants (
    expense_id uuid references public.expenses(id) on delete cascade,
    user_id uuid references public.profiles(id) on delete cascade,
    share_amount numeric(12,2) not null,
    primary key (expense_id, user_id)
  );

  create table public.balances (
    id uuid primary key default gen_random_uuid(),
    group_id uuid references public.groups(id) on delete cascade not null,
    from_user uuid references public.profiles(id) not null,
    to_user uuid references public.profiles(id) not null,
    amount numeric(12,2) not null,
    updated_at timestamptz not null default now(),
    unique (group_id, from_user, to_user)
  );

  alter table public.expenses enable row level security;
  alter table public.expense_participants enable row level security;
  alter table public.balances enable row level security;

  create policy "Group members can manage expenses"
    on public.expenses for all using (public.is_group_member(group_id));

  create policy "Group members can view expense participants"
    on public.expense_participants for select
    using (exists (
      select 1 from public.expenses e
      where e.id = expense_id and public.is_group_member(e.group_id)
    ));

  create policy "Group members can view balances"
    on public.balances for select using (public.is_group_member(group_id));
  ```

- [ ] 3.1.2 — Create Postgres function `recalculate_balances(p_group_id uuid)`:
  1. Compute net balance per user (owed minus owing across all unsettled expenses)
  2. Greedy simplification: match largest creditor with largest debtor
  3. Upsert results into `balances` table
- [ ] 3.1.3 — Create trigger: after insert/update/delete on `expenses` or `expense_participants`, call `recalculate_balances(group_id)`.
- [ ] 3.1.4 — Add `Expense`, `ExpenseParticipant`, `Balance` types to `packages/types`.

### 3.2 — Expense Queries & Server Actions

- [ ] 3.2.1 — `packages/db/src/queries/expenses.ts`:
  - `getExpenses(supabase, groupId, cursor?)` — paginated desc by `created_at`
  - `getExpenseById(supabase, expenseId)` — with participants + profile data
  - `getBalances(supabase, groupId)` — all simplified balances with profile data
  - `getUserNetBalance(supabase, groupId, userId)` — total owed/owing for current user
- [ ] 3.2.2 — `apps/app/src/app/actions/expenses.ts` (Server Actions):
  - `addExpense(groupId, data)` — inserts expense + participants (triggers balance recalc)
  - `updateExpense(expenseId, data)` — updates expense + participants
  - `deleteExpense(expenseId)` — only creator or admin
  - `settleExpense(expenseId)` — marks as settled
  - `settleAllBetween(groupId, fromUser, toUser)` — settle all debts between two users

### 3.3 — Client State & Real-time

- [ ] 3.3.1 — `packages/stores/src/expenses.ts`: `useExpenseStore` with optimistic add/delete.
- [ ] 3.3.2 — Subscribe to Supabase Realtime on `expenses` table for active group. Update list on `INSERT`/`UPDATE`/`DELETE`.
- [ ] 3.3.3 — Same real-time subscription for `balances` table.

### 3.4 — Expenses UI

- [ ] 3.4.1 — `apps/app/src/app/dashboard/[groupId]/expenses/page.tsx`:
  - Two tabs: **Activity** and **Balances**
  - "Add Expense" button
- [ ] 3.4.2 — `apps/app/src/components/expenses/ExpenseList.tsx`:
  - Paginated expense list (20 per page), infinite scroll
  - Empty state: "No expenses yet — split your first one!"
- [ ] 3.4.3 — `apps/app/src/components/expenses/ExpenseCard.tsx`:
  - Category emoji, description, amount in group currency
  - "Paid by {name}"
  - "You owe $X" (red) or "You are owed $X" (green)
  - Settled badge
  - Tap → expense detail
- [ ] 3.4.4 — `apps/app/src/components/expenses/AddExpenseModal.tsx`:
  - **Step 1:** Large number input for amount, description field
  - **Step 2:** Category grid (🍺 Bar, 🪩 Clubbing, 🥩 BBQ, 🛒 Groceries, 🚗 Transport, 🏠 Accommodation, 📦 Other)
  - **Step 3:** "Paid by" selector + split type toggle (Equal / Percentage / Exact)
    - Equal: member checkboxes (all on by default), auto-computes shares
    - Percentage: number input per member, must sum to 100%, live validation
    - Exact: number input per member, must sum to total, live validation
  - Submit → optimistic update → `addExpense` action
- [ ] 3.4.5 — `apps/app/src/app/dashboard/[groupId]/expenses/[expenseId]/page.tsx`:
  - Full breakdown (all participants + shares)
  - Edit button (creator/admin) → pre-filled edit modal
  - Delete with confirm dialog
  - "Mark as Settled" button
- [ ] 3.4.6 — `apps/app/src/components/expenses/BalanceMatrix.tsx`:
  - Personal summary (total owed vs. total owing vs. net, color-coded)
  - Simplified debt list: "{Name} owes {Name} ${Amount}" with "Settle Up" button
  - Settle Up → confirm dialog → `settleAllBetween`
- [ ] 3.4.7 — `apps/app/src/components/expenses/BalanceCard.tsx`:
  - Net balance for current user (green/red/neutral)
  - Animated counter on amount change

### 3.5 — Verify & Test

- [ ] 3.5.1 — Equal split: all participants get correct equal shares.
- [ ] 3.5.2 — Percentage split: validation rejects non-100% total.
- [ ] 3.5.3 — Exact split: validation rejects non-matching total.
- [ ] 3.5.4 — Balances recalculate automatically after each expense.
- [ ] 3.5.5 — Balance matrix shows simplified debts (not gross).
- [ ] 3.5.6 — Settle all between two users → debts clear.
- [ ] 3.5.7 — Realtime: user A adds expense → user B (other tab) sees it without refresh.
- [ ] 3.5.8 — Edit expense → amounts and participants update correctly.
- [ ] 3.5.9 — Delete expense → balances recalculate.
- [ ] 3.5.10 — Non-member cannot read expenses (RLS).

---

**Phase 3 Testing Checklist (must all pass before APPROVED):**

- [ ] Three split types compute correctly
- [ ] Balance recalculate trigger works
- [ ] Balance simplification produces minimal set of transactions
- [ ] Real-time updates visible across tabs
- [ ] Settle-up clears debts
- [ ] Edit and delete work
- [ ] RLS: non-members cannot read group expenses

**Phase 3 Status: ⬜ — Awaiting approval**

---

---

# Phase 4: Voting & Polls

**Goal:** Create polls with single or multi-choice voting, anonymous option, live animated results, and auto-close.

**Status:** ⬜ — _Blocked until Phase 3 is APPROVED_

---

### 4.1 — Database Migrations: Polls

- [ ] 4.1.1 — Create `supabase/migrations/0004_polls.sql`:

  ```sql
  create table public.polls (
    id uuid primary key default gen_random_uuid(),
    group_id uuid references public.groups(id) on delete cascade not null,
    question text not null,
    is_anonymous boolean not null default false,
    is_multi_choice boolean not null default false,
    is_closed boolean not null default false,
    closes_at timestamptz,
    created_by uuid references public.profiles(id) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table public.poll_options (
    id uuid primary key default gen_random_uuid(),
    poll_id uuid references public.polls(id) on delete cascade not null,
    text text not null,
    sort_order int not null default 0
  );

  create table public.poll_votes (
    poll_id uuid references public.polls(id) on delete cascade,
    option_id uuid references public.poll_options(id) on delete cascade,
    user_id uuid references public.profiles(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (poll_id, option_id, user_id)
  );

  alter table public.polls enable row level security;
  alter table public.poll_options enable row level security;
  alter table public.poll_votes enable row level security;

  create policy "Group members can manage polls"
    on public.polls for all using (public.is_group_member(group_id));

  create policy "Group members can view poll options"
    on public.poll_options for select
    using (exists (
      select 1 from public.polls p
      where p.id = poll_id and public.is_group_member(p.group_id)
    ));

  create policy "Group members can vote"
    on public.poll_votes for all
    using (exists (
      select 1 from public.polls p
      where p.id = poll_id and public.is_group_member(p.group_id)
    ));
  ```

- [ ] 4.1.2 — Add `Poll`, `PollOption`, `PollVote` types to `packages/types`.

### 4.2 — Poll Queries & Server Actions

- [ ] 4.2.1 — `packages/db/src/queries/polls.ts`:
  - `getPolls(supabase, groupId)` — with option vote counts; active first
  - `getPollById(supabase, pollId)` — with options + votes + voter profiles (if not anonymous)
  - `getUserVotes(supabase, pollId, userId)` — which options user voted for
- [ ] 4.2.2 — `apps/app/src/app/actions/polls.ts` (Server Actions):
  - `createPoll(groupId, data)` — creates poll + options
  - `vote(pollId, optionIds)` — transaction: delete old votes (single-choice), insert new
  - `closePoll(pollId)` — creator/admin only
  - `deletePoll(pollId)` — creator/admin only

### 4.3 — Real-time Subscription

- [ ] 4.3.1 — Subscribe to Supabase Realtime on `poll_votes` for the active group's polls.
- [ ] 4.3.2 — On vote change, update live results without page reload.

### 4.4 — Polls UI

- [ ] 4.4.1 — `apps/app/src/app/dashboard/[groupId]/polls/page.tsx`:
  - Active polls at top, closed polls below (grayed)
  - "Create Poll" button
  - Empty state: "No polls yet — start a vote!"
- [ ] 4.4.2 — `apps/app/src/components/polls/PollCard.tsx`:
  - Question, creator + timestamp, status badge
  - Options as interactive tiles
  - Live results bar per option (animated fill)
  - Winning option highlighted for closed polls
  - Anonymous badge, multi-choice badge
  - Non-anonymous: voter avatars (max 3 + overflow)
- [ ] 4.4.3 — `apps/app/src/components/polls/PollOptionTile.tsx`:
  - Single-choice: radio behavior. Multi-choice: checkbox behavior.
  - Disabled if closed
  - Your vote indicator
  - Optimistic update on click
- [ ] 4.4.4 — `apps/app/src/components/polls/LiveResultsBar.tsx`:
  - Motion `animate width` on percentage change
  - Smooth re-animation on new votes (Realtime)
- [ ] 4.4.5 — `apps/app/src/components/polls/CreatePollModal.tsx`:
  - Template chips: "Pizza vs BBQ 🍕🥩", "What are we drinking? 🍺", "When to meet? 📅", "Custom"
  - Question input, options list (min 2 / max 8), add/remove/reorder options
  - Toggles: Anonymous, Multi-choice
  - Optional auto-close date-time picker
- [ ] 4.4.6 — Auto-close Edge Function:
  - Create `supabase/functions/close-expired-polls/index.ts`
  - Runs on cron (every 5 minutes)
  - Sets `is_closed = true` on polls where `closes_at < now()`

### 4.5 — Verify & Test

- [ ] 4.5.1 — Create poll from template → options pre-filled.
- [ ] 4.5.2 — Single-choice: re-voting changes selection, can't vote for multiple.
- [ ] 4.5.3 — Multi-choice: can select multiple options.
- [ ] 4.5.4 — Anonymous poll: no voter names visible.
- [ ] 4.5.5 — Live results update in real-time (vote on one tab → see update on other tab).
- [ ] 4.5.6 — Auto-close: manually invoke Edge Function → poll closes.
- [ ] 4.5.7 — Manual close by creator works.
- [ ] 4.5.8 — Results bars animate smoothly on vote change.

---

**Phase 4 Testing Checklist (must all pass before APPROVED):**

- [ ] Create polls (template + custom)
- [ ] Single and multi-choice voting works
- [ ] Anonymous voting hides voter identities
- [ ] Live results update via Realtime
- [ ] Auto-close Edge Function closes polls correctly
- [ ] Option drag-to-reorder works in create modal

**Phase 4 Status: ⬜ — Awaiting approval**

---

---

# Phase 5: Plans Board (Kanban)

**Goal:** Drag-and-drop kanban board with 4 columns to move squad ideas into real plans and events.

**Status:** ⬜ — _Blocked until Phase 4 is APPROVED_

---

### 5.1 — Database Migrations: Plans

- [ ] 5.1.1 — Create `supabase/migrations/0005_plans.sql`:

  ```sql
  create type plan_status as enum ('ideas', 'to_plan', 'upcoming', 'done');

  create table public.plans (
    id uuid primary key default gen_random_uuid(),
    group_id uuid references public.groups(id) on delete cascade not null,
    title text not null,
    description text,
    status plan_status not null default 'ideas',
    sort_order int not null default 0,
    date timestamptz,
    organizer_id uuid references public.profiles(id),
    linked_event_id uuid,
    created_by uuid references public.profiles(id) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table public.plan_attachments (
    id uuid primary key default gen_random_uuid(),
    plan_id uuid references public.plans(id) on delete cascade not null,
    type text not null check (type in ('photo', 'voice')),
    url text not null,
    created_at timestamptz not null default now()
  );

  alter table public.plans enable row level security;
  alter table public.plan_attachments enable row level security;

  create policy "Group members can manage plans"
    on public.plans for all using (public.is_group_member(group_id));

  create policy "Group members can manage plan attachments"
    on public.plan_attachments for all
    using (exists (
      select 1 from public.plans p
      where p.id = plan_id and public.is_group_member(p.group_id)
    ));
  ```

- [ ] 5.1.2 — Add `Plan`, `PlanAttachment`, `PlanStatus` types to `packages/types`.

### 5.2 — Plan Queries & Server Actions

- [ ] 5.2.1 — `packages/db/src/queries/plans.ts`:
  - `getPlans(supabase, groupId)` — all plans ordered by status + sort_order
  - `getPlanById(supabase, planId)` — with attachments + organizer profile
- [ ] 5.2.2 — `apps/app/src/app/actions/plans.ts` (Server Actions):
  - `createPlan(groupId, data)`
  - `updatePlan(planId, data)`
  - `movePlan(planId, newStatus, newSortOrder)`
  - `reorderPlans(groupId, updates: {id, sort_order}[])` — batch update
  - `deletePlan(planId)` — creator/admin only
  - `addPlanAttachment(planId, type, url)`
  - `removePlanAttachment(attachmentId)`

### 5.3 — Kanban Board UI

- [ ] 5.3.1 — `apps/app/src/app/dashboard/[groupId]/plans/page.tsx` — full kanban board.
- [ ] 5.3.2 — `apps/app/src/components/plans/KanbanBoard.tsx`:
  - Horizontal 4-column layout with horizontal scroll on mobile
  - Columns: "💡 Ideas", "📋 To Plan", "📅 Upcoming", "✅ Done" + count badge
- [ ] 5.3.3 — `apps/app/src/components/plans/KanbanColumn.tsx`:
  - Vertically scrollable list
  - Drop zone with visual highlight
  - "+" add button
  - Uses `@hello-pangea/dnd` for drag-drop
- [ ] 5.3.4 — `apps/app/src/components/plans/PlanCard.tsx`:
  - Draggable with drag handle
  - Title, description preview (2 lines, truncated)
  - Date badge, organizer avatar, attachment indicators (📷 N, 🎙️ N)
  - Motion `whileDrag`: scale + shadow
  - Tap → plan detail
- [ ] 5.3.5 — Drag-drop logic:
  - On cross-column drop: `movePlan` action
  - On same-column reorder: `reorderPlans` action (debounced 300ms)
  - Optimistic update: move in local state immediately, revert on error
- [ ] 5.3.6 — `apps/app/src/components/plans/CreatePlanSheet.tsx`:
  - Title (required), description, date picker, organizer selector, column selector
  - Photo attach: file input → Supabase Storage `plan-attachments/{planId}/{filename}`
  - Voice note: `MediaRecorder` API, max 60s, preview playback
- [ ] 5.3.7 — `apps/app/src/components/plans/PlanDetailPanel.tsx`:
  - Full details, status dropdown (editable), attachment viewer/player
  - Edit, delete
  - "Create Event from Plan" → navigates to create event pre-filled

### 5.4 — Supabase Storage

- [ ] 5.4.1 — Create `plan-attachments` bucket (authenticated uploads, max 10MB photos / 5MB audio).
- [ ] 5.4.2 — Storage RLS: group members can upload to group folder and read from it.

### 5.5 — Verify & Test

- [ ] 5.5.1 — Create plan in "Ideas" column.
- [ ] 5.5.2 — Drag to "To Plan" → status changes in DB.
- [ ] 5.5.3 — Reorder within column → sort_order persists.
- [ ] 5.5.4 — Photo attachment uploads and displays in detail.
- [ ] 5.5.5 — Voice note records and plays back in detail.
- [ ] 5.5.6 — "Create Event from Plan" pre-fills event form correctly.
- [ ] 5.5.7 — Delete plan → removed from board.
- [ ] 5.5.8 — Drag is instant (optimistic), no flicker on success.

---

**Phase 5 Testing Checklist (must all pass before APPROVED):**

- [ ] Drag-and-drop across all 4 columns works
- [ ] Reordering within a column persists
- [ ] Photo and voice attachments upload and display
- [ ] Voice recording works in browser (MediaRecorder API)
- [ ] "Create Event from Plan" flow navigates correctly
- [ ] RLS: non-members cannot access plans

**Phase 5 Status: ⬜ — Awaiting approval**

---

---

# Phase 6: Squad Feed & Media

**Goal:** A chronological feed of photos, voice notes, and text posts with emoji reactions.

**Status:** ⬜ — _Blocked until Phase 5 is APPROVED_

---

### 6.1 — Database Migrations: Feed

- [ ] 6.1.1 — Create `supabase/migrations/0006_feed.sql`:

  ```sql
  create type feed_item_type as enum ('photo', 'voice', 'text');

  create table public.feed_items (
    id uuid primary key default gen_random_uuid(),
    group_id uuid references public.groups(id) on delete cascade not null,
    type feed_item_type not null,
    media_url text,
    caption text,
    duration_seconds int,
    linked_expense_id uuid references public.expenses(id) on delete set null,
    linked_event_id uuid,
    linked_poll_id uuid references public.polls(id) on delete set null,
    created_by uuid references public.profiles(id) not null,
    created_at timestamptz not null default now()
  );

  create table public.feed_reactions (
    feed_item_id uuid references public.feed_items(id) on delete cascade,
    user_id uuid references public.profiles(id) on delete cascade,
    emoji text not null,
    created_at timestamptz not null default now(),
    primary key (feed_item_id, user_id)
  );

  alter table public.feed_items enable row level security;
  alter table public.feed_reactions enable row level security;

  create policy "Group members can manage feed items"
    on public.feed_items for all using (public.is_group_member(group_id));

  create policy "Group members can manage reactions"
    on public.feed_reactions for all
    using (exists (
      select 1 from public.feed_items fi
      where fi.id = feed_item_id and public.is_group_member(fi.group_id)
    ));
  ```

- [ ] 6.1.2 — Add `FeedItem`, `FeedReaction` types to `packages/types`.

### 6.2 — Feed Queries & Server Actions

- [ ] 6.2.1 — `packages/db/src/queries/feed.ts`:
  - `getFeedItems(supabase, groupId, cursor?)` — paginated 20/page, desc by `created_at`, with creator profile + reaction counts
  - `getFeedItemById(supabase, itemId)` — full detail
- [ ] 6.2.2 — `apps/app/src/app/actions/feed.ts` (Server Actions):
  - `addFeedItem(groupId, data)`
  - `deleteFeedItem(itemId)` — creator/admin only
  - `toggleReaction(itemId, emoji)` — upsert/delete (one emoji per user)

### 6.3 — Supabase Storage: Media

- [ ] 6.3.1 — Create `feed-media` bucket (authenticated uploads, 10MB photo / 5MB voice limits).
- [ ] 6.3.2 — Storage RLS: group members can upload + read.
- [ ] 6.3.3 — `packages/db/src/storage/feed.ts`:
  - `uploadFeedPhoto(supabase, groupId, file)` — compress to 1080px max width (Canvas API) → upload → return URL
  - `uploadFeedVoice(supabase, groupId, blob)` — upload audio blob → return URL
  - `deleteFeedMedia(supabase, url)`

### 6.4 — Feed UI

- [ ] 6.4.1 — `apps/app/src/app/dashboard/[groupId]/feed/page.tsx`:
  - Vertical scroll of cards, infinite scroll (intersection observer)
  - Floating post bar: "📷 Photo", "🎙️ Voice", "✍️ Text"
  - Empty state: "Be the first to post something!"
- [ ] 6.4.2 — `apps/app/src/components/feed/FeedItemCard.tsx`:
  - Header: avatar, name, relative timestamp
  - **Photo:** full-width image + caption. Tap → lightbox.
  - **Voice:** waveform + play/pause + duration. Caption below.
  - **Text:** styled text content (max 500 chars).
  - Context badge (expense / event / poll link)
  - Footer: `ReactionBar`
  - Delete button (own items only, confirm)
- [ ] 6.4.3 — `apps/app/src/components/feed/ReactionBar.tsx`:
  - Emoji chips with counts ("❤️ 3 🔥 2")
  - Tap to toggle your reaction
  - "+" opens preset picker: ❤️ 😂 🔥 😮 👏 💀
  - Scale bounce animation (Motion) on tap
  - Real-time: subscribe to `feed_reactions` changes via Realtime
- [ ] 6.4.4 — `apps/app/src/components/feed/PostPhotoSheet.tsx`:
  - File input (camera on mobile, gallery on desktop)
  - Client-side preview + compression (Canvas API)
  - Caption textarea (optional, max 200 chars)
  - Optional link to expense/event/poll
  - "Post" → compress → upload → `addFeedItem`
- [ ] 6.4.5 — `apps/app/src/components/feed/RecordVoiceSheet.tsx`:
  - Start/stop recording via `MediaRecorder` API
  - Live audio level bar animation
  - Max 60 seconds
  - Post-record playback preview
  - Caption textarea
  - "Post" → upload → `addFeedItem`
- [ ] 6.4.6 — `apps/app/src/components/feed/ImageLightbox.tsx`:
  - Full-screen overlay, close on Escape or backdrop click
  - Arrow navigation between consecutive photos in feed
  - Pinch-to-zoom on mobile (touch events)

### 6.5 — Verify & Test

- [ ] 6.5.1 — Post photo (file picker) → appears in feed.
- [ ] 6.5.2 — Image compressed before upload (verify size < original).
- [ ] 6.5.3 — Record voice note → preview works before posting.
- [ ] 6.5.4 — Post voice note → play button + duration shown in feed.
- [ ] 6.5.5 — Post text → appears in feed.
- [ ] 6.5.6 — Add reaction → updates in real-time on other tab.
- [ ] 6.5.7 — Remove reaction → count decreases.
- [ ] 6.5.8 — Lightbox opens, closes on Escape, navigates between photos.
- [ ] 6.5.9 — Delete own item → removed. Cannot delete others'.
- [ ] 6.5.10 — Infinite scroll loads next page at bottom.

---

**Phase 6 Testing Checklist (must all pass before APPROVED):**

- [ ] Photo, voice, and text post all work
- [ ] Voice recording works via MediaRecorder API
- [ ] Client-side image compression works
- [ ] Reactions work in real-time
- [ ] Infinite scroll pagination works
- [ ] Lightbox works (open, close, navigation)
- [ ] Delete: own items only

**Phase 6 Status: ⬜ — Awaiting approval**

---

---

# Phase 7: Events & Attendance

**Goal:** Create events from polls/plans or manually, RSVP system, post-event attendance confirmation.

**Status:** ⬜ — _Blocked until Phase 6 is APPROVED_

---

### 7.1 — Database Migrations: Events

- [ ] 7.1.1 — Create `supabase/migrations/0007_events.sql`:

  ```sql
  create type rsvp_status as enum ('yes', 'no', 'maybe');

  create table public.events (
    id uuid primary key default gen_random_uuid(),
    group_id uuid references public.groups(id) on delete cascade not null,
    title text not null,
    description text,
    date timestamptz not null,
    location text,
    organizer_id uuid references public.profiles(id),
    linked_poll_id uuid references public.polls(id) on delete set null,
    linked_plan_id uuid references public.plans(id) on delete set null,
    created_by uuid references public.profiles(id) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table public.event_rsvps (
    event_id uuid references public.events(id) on delete cascade,
    user_id uuid references public.profiles(id) on delete cascade,
    status rsvp_status not null,
    plus_ones int not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (event_id, user_id)
  );

  create table public.event_attendees (
    event_id uuid references public.events(id) on delete cascade,
    user_id uuid references public.profiles(id) on delete cascade,
    primary key (event_id, user_id)
  );

  alter table public.events enable row level security;
  alter table public.event_rsvps enable row level security;
  alter table public.event_attendees enable row level security;

  create policy "Group members can manage events"
    on public.events for all using (public.is_group_member(group_id));

  create policy "Group members can manage RSVPs"
    on public.event_rsvps for all
    using (exists (
      select 1 from public.events e
      where e.id = event_id and public.is_group_member(e.group_id)
    ));

  create policy "Group members can view attendees"
    on public.event_attendees for all
    using (exists (
      select 1 from public.events e
      where e.id = event_id and public.is_group_member(e.group_id)
    ));
  ```

- [ ] 7.1.2 — Add `linked_event_id` FK constraint to `feed_items` and `plans` now that `events` table exists.
- [ ] 7.1.3 — Add `Event`, `EventRSVP`, `RSVPStatus` types to `packages/types`.

### 7.2 — Event Queries & Server Actions

- [ ] 7.2.1 — `packages/db/src/queries/events.ts`:
  - `getEvents(supabase, groupId)` — split upcoming vs past, with RSVP counts
  - `getEventById(supabase, eventId)` — with RSVPs + attendees + linked data
  - `getUserRSVP(supabase, eventId, userId)`
- [ ] 7.2.2 — `apps/app/src/app/actions/events.ts` (Server Actions):
  - `createEvent(groupId, data)` — optionally link to poll/plan; if linked plan, move it to "Upcoming"
  - `updateEvent(eventId, data)`
  - `deleteEvent(eventId)` — creator/admin only
  - `rsvp(eventId, status, plusOnes)` — upsert RSVP
  - `confirmAttendance(eventId, attendeeIds)` — organizer only; if linked plan, move to "Done"

### 7.3 — Events UI

- [ ] 7.3.1 — `apps/app/src/app/dashboard/[groupId]/events/page.tsx`:
  - Upcoming and Past sections
  - "Create Event" button
  - Empty state: "No events yet — plan something!"
- [ ] 7.3.2 — `apps/app/src/components/events/EventCard.tsx`:
  - Title, formatted date + time, location
  - Organizer avatar
  - RSVP summary: "5 Yes · 2 Maybe · 1 No"
  - Your RSVP badge
  - Past events: attendance count
- [ ] 7.3.3 — `apps/app/src/components/events/RSVPButtons.tsx`:
  - "✅ Yes", "🤔 Maybe", "❌ No" buttons with selected state
  - "+1 guest" counter appears after "Yes"
  - Optimistic update
  - Mini avatars per RSVP category below buttons
- [ ] 7.3.4 — `apps/app/src/app/dashboard/[groupId]/events/[eventId]/page.tsx`:
  - Full event details + RSVPButtons
  - RSVP breakdown (expandable Yes / Maybe / No sections with member names + avatars)
  - Past events: "Confirm who came" button (organizer only)
  - Edit/delete (creator/admin)
- [ ] 7.3.5 — `apps/app/src/components/events/AttendanceConfirmation.tsx`:
  - List of "Yes" RSVPs as checkboxes
  - "Confirm" → `confirmAttendance` action
- [ ] 7.3.6 — `apps/app/src/components/events/CreateEventModal.tsx`:
  - Title, description, date + time picker, location, organizer
  - "Pre-fill from poll result" option (closed polls dropdown)
  - "Pre-fill from plan" option (plans dropdown)

### 7.4 — Verify & Test

- [ ] 7.4.1 — Create event manually → appears in upcoming.
- [ ] 7.4.2 — Create from poll → title pre-filled, `linked_poll_id` set.
- [ ] 7.4.3 — Create from plan → `linked_plan_id` set, plan moves to "Upcoming".
- [ ] 7.4.4 — RSVP "Yes" with +2 → count reflected in summary.
- [ ] 7.4.5 — Change RSVP → updates correctly.
- [ ] 7.4.6 — Confirm attendance → `event_attendees` populated, linked plan moves to "Done".
- [ ] 7.4.7 — Non-organizer cannot see "Confirm attendance" button.

---

**Phase 7 Testing Checklist (must all pass before APPROVED):**

- [ ] Create events (manual + from poll + from plan)
- [ ] RSVP system (yes/no/maybe + plus-ones)
- [ ] Attendance confirmation (organizer only)
- [ ] Linked plan moves to "Done" after attendance confirmed
- [ ] Upcoming vs past split works

**Phase 7 Status: ⬜ — Awaiting approval**

---

---

# Phase 8: Insights & Weekly Digest

**Goal:** Automated weekly stats, leaderboards, fun facts, and a weekly push notification digest.

**Status:** ⬜ — _Blocked until Phase 7 is APPROVED_

---

### 8.1 — Database Migrations: Insights

- [ ] 8.1.1 — Create `supabase/migrations/0008_insights.sql`:

  ```sql
  create table public.insights (
    id uuid primary key default gen_random_uuid(),
    group_id uuid references public.groups(id) on delete cascade not null,
    week_id text not null,
    total_spent numeric(12,2),
    top_category text,
    top_poll_question text,
    top_poll_winning_option text,
    attendance_leader uuid references public.profiles(id),
    most_organized uuid references public.profiles(id),
    top_lender uuid references public.profiles(id),
    media_highlight_ids text[],
    fun_fact text,
    generated_at timestamptz not null default now(),
    unique (group_id, week_id)
  );

  create table public.push_subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    subscription_json jsonb not null,
    created_at timestamptz not null default now()
  );

  alter table public.insights enable row level security;
  alter table public.push_subscriptions enable row level security;

  create policy "Group members can view insights"
    on public.insights for select using (public.is_group_member(group_id));

  create policy "Users can manage own push subscriptions"
    on public.push_subscriptions for all using (auth.uid() = user_id);
  ```

- [ ] 8.1.2 — Add `Insight` type to `packages/types`.

### 8.2 — Weekly Digest Edge Function

- [ ] 8.2.1 — Create `supabase/functions/weekly-digest/index.ts`:
  - Cron trigger: every Sunday 13:00 UTC (10:00 AM UTC-3)
  - For each active group (had activity in the last 7 days):
    1. `total_spent`: sum of expenses in the week
    2. `top_category`: most common expense category
    3. `top_poll`: most-voted poll closed this week + winning option
    4. `attendance_leader`: highest attendance % across past events
    5. `most_organized`: member who created most events/plans
    6. `top_lender`: member who paid for most expenses
    7. `media_highlights`: top 3-5 feed items by reaction count
    8. `fun_fact`: pick 1-2 applicable templates
    9. Upsert into `insights` with `week_id` (e.g. `2026-W09`)
- [ ] 8.2.2 — Fun fact template pool:
  - "{name} suggested {n} hangouts this week — a record!"
  - "{name} organized every event this month — legend."
  - "The squad spent {amount} on {category} — a new high!"
  - "{name} voted in every poll — true democracy."
  - "The squad's balance sheet is finally clean — respect."
  - "{name} posted {n} memories this week — squad historian."

### 8.3 — Web Push Notifications

- [ ] 8.3.1 — Generate VAPID keys (`npx web-push generate-vapid-keys`). Store in Edge Function secrets.
- [ ] 8.3.2 — Create `apps/app/public/sw.js` Service Worker: handles `push` events → shows browser notification.
- [ ] 8.3.3 — Register Service Worker and request notification permission on first login.
- [ ] 8.3.4 — Save push subscription JSON to `push_subscriptions` table via Server Action.
- [ ] 8.3.5 — `supabase/functions/send-push/index.ts`: reusable helper that takes `userId` + message → sends Web Push.
- [ ] 8.3.6 — In `weekly-digest`: after computing insights, call `send-push` for all group members:
  - Title: "Your mooch Weekly Recap 🎉"
  - Body: "You spent {amount} · {name} was MVP · {n} events attended"

### 8.4 — Insights UI

- [ ] 8.4.1 — `apps/app/src/app/dashboard/[groupId]/insights/page.tsx`:
  - Week selector (this week + previous weeks browsable)
  - Loads from `insights` table by `week_id`
  - Empty state: "Digest generates every Sunday — check back soon!"
- [ ] 8.4.2 — `apps/app/src/components/insights/WeeklySummaryCard.tsx`:
  - Total spent, top category emoji, top poll result
  - "Week of {date}" subtitle
  - Count-up animation on numbers (Motion `animate`)
- [ ] 8.4.3 — `apps/app/src/components/insights/LeaderboardCard.tsx`:
  - Three tiles: "Most Reliable 🏆", "The Organizer 📋", "Most Generous 💰"
  - Winner avatar + name + stat
  - Crown on #1
- [ ] 8.4.4 — `apps/app/src/components/insights/MediaHighlights.tsx`:
  - Horizontal scrollable row of top feed item thumbnails
  - Tap → full feed item detail
- [ ] 8.4.5 — `apps/app/src/components/insights/FunFactCard.tsx`:
  - Styled callout with fun fact text, gradient background, emoji accent

### 8.5 — Verify & Test

- [ ] 8.5.1 — Manually trigger Edge Function → `insights` row created.
- [ ] 8.5.2 — All 6 stats are correctly computed.
- [ ] 8.5.3 — Fun fact matches a template.
- [ ] 8.5.4 — Media highlights are the most-reacted feed items.
- [ ] 8.5.5 — Web push notification received in browser.
- [ ] 8.5.6 — Week selector shows previous weeks.
- [ ] 8.5.7 — Count-up animations play on page load.

---

**Phase 8 Testing Checklist (must all pass before APPROVED):**

- [ ] Edge Function produces correct insight data
- [ ] All 6 stats computed correctly
- [ ] Fun fact generates from templates
- [ ] Web push notification delivered in browser
- [ ] Insights screen renders all sections
- [ ] Historical week browsing works

**Phase 8 Status: ⬜ — Awaiting approval**

---

---

# Phase 9: Polish, Animations & Marketing Site

**Goal:** Full UX polish, EN/ES i18n, smooth animations, empty/error states, and the marketing landing site.

**Status:** ⬜ — _Blocked until Phase 8 is APPROVED_

---

### 9.1 — i18n (EN + ES)

- [ ] 9.1.1 — Install `next-intl` in `apps/app` and `apps/web`.
- [ ] 9.1.2 — Create `apps/app/messages/en.json` and `apps/app/messages/es.json` with all UI strings.
- [ ] 9.1.3 — Audit every user-facing string — ensure none are hardcoded.
- [ ] 9.1.4 — Implement locale routing (via `Accept-Language` header or user profile locale).
- [ ] 9.1.5 — Language switcher in profile settings → saves to `profiles.locale`.
- [ ] 9.1.6 — Currency: `Intl.NumberFormat` with group currency + user locale.
- [ ] 9.1.7 — Dates: relative ("2 hours ago" / "Hace 2 horas") + absolute ("Sat Feb 22" / "Sáb 22 Feb").

### 9.2 — Animations & Micro-interactions

- [ ] 9.2.1 — Page transitions: Motion `AnimatePresence` on route changes (slide or fade).
- [ ] 9.2.2 — List stagger: feed, expenses, members animate in with staggered fade-up.
- [ ] 9.2.3 — Expense added: confetti burst (`canvas-confetti`).
- [ ] 9.2.4 — Poll vote: bar fill animates with easing.
- [ ] 9.2.5 — Reaction tap: scale bounce.
- [ ] 9.2.6 — Kanban drag: shadow + scale on lift.
- [ ] 9.2.7 — Balance settled: checkmark animation.
- [ ] 9.2.8 — Nav tabs: smooth active indicator transition.
- [ ] 9.2.9 — Modals: slide-up from bottom (mobile) / fade-scale from center (desktop).
- [ ] 9.2.10 — Insights numbers: count-up animation.

### 9.3 — Empty States

- [ ] 9.3.1 — Expenses: "No expenses yet — split your first one! 🍕"
- [ ] 9.3.2 — Polls: "No polls yet — start a vote! 🗳️"
- [ ] 9.3.3 — Plans: "No plans yet — throw an idea in! 💡"
- [ ] 9.3.4 — Feed: "No posts yet — share a memory! 📸"
- [ ] 9.3.5 — Events: "No events yet — plan something! 🎉"
- [ ] 9.3.6 — Groups: "You're not in any squads — create or join one! 👥"
- [ ] 9.3.7 — Each empty state has an SVG illustration + CTA button.

### 9.4 — Loading & Error States

- [ ] 9.4.1 — Skeleton loaders for: expense list, poll cards, kanban board, feed, member list.
- [ ] 9.4.2 — Error boundary components with retry buttons.
- [ ] 9.4.3 — Offline banner: `navigator.onLine` + `online`/`offline` events.
- [ ] 9.4.4 — Toast system for: success actions, errors, destructive confirmations.

### 9.5 — Design Consistency

- [ ] 9.5.1 — Audit all components for consistent spacing, typography, color.
- [ ] 9.5.2 — Dark mode: respect `prefers-color-scheme`. Manual override in profile.
- [ ] 9.5.3 — Mobile responsive: all pages work at 375px width.
- [ ] 9.5.4 — Touch targets: all interactive elements ≥ 44px height on mobile.
- [ ] 9.5.5 — Accessibility: semantic HTML, `aria-label` on icon-only buttons, keyboard navigation in modals.

### 9.6 — Marketing Site (apps/web)

- [ ] 9.6.1 — `apps/web/src/app/page.tsx` home page:
  - Hero: tagline + CTA → `app.mooch.com/signup`
  - Feature sections: Expenses, Polls, Plans, Feed, Events, Insights
  - Footer: Privacy, Terms, support email
- [ ] 9.6.2 — `/privacy` and `/terms` static pages.
- [ ] 9.6.3 — `/join/{code}` → redirect to `app.mooch.com/join/{code}`.
- [ ] 9.6.4 — Open Graph meta tags on all pages.
- [ ] 9.6.5 — Favicon + apple-touch-icon.
- [ ] 9.6.6 — `sitemap.xml` and `robots.txt`.

### 9.7 — Verify & Test

- [ ] 9.7.1 — Language switch EN → ES: all strings change, currency/date formats update.
- [ ] 9.7.2 — All animations play without flicker or layout shift.
- [ ] 9.7.3 — All empty states display with illustration and CTA.
- [ ] 9.7.4 — Skeleton loaders visible during slow network (DevTools throttling).
- [ ] 9.7.5 — Offline banner appears when network disabled.
- [ ] 9.7.6 — App works on 375px viewport (no horizontal overflow).
- [ ] 9.7.7 — Marketing site complete: all links work, CTAs point to correct URLs.
- [ ] 9.7.8 — Dark mode toggles correctly.
- [ ] 9.7.9 — Keyboard navigation works in all modals (Tab, Escape).

---

**Phase 9 Testing Checklist (must all pass before APPROVED):**

- [ ] EN/ES switch works across entire app
- [ ] All 6 empty states present
- [ ] Skeleton loaders work
- [ ] Dark mode works
- [ ] App works on 375px viewport
- [ ] Marketing site complete with Privacy + Terms pages
- [ ] All animations present and smooth

**Phase 9 Status: ⬜ — Awaiting approval**

---

---

# Phase 10: Testing & Deployment

**Goal:** Stable, tested, deployed app on production URLs with monitoring.

**Status:** ⬜ — _Blocked until Phase 9 is APPROVED_

---

### 10.1 — Unit Tests

- [ ] 10.1.1 — Install Vitest + `@testing-library/react` in `apps/app`.
- [ ] 10.1.2 — Unit tests for business logic:
  - Balance simplification algorithm
  - Expense split calculations (equal, percentage, exact)
  - Poll vote counting and winner determination
  - Plan sort_order assignment
  - Week ID generation (`YYYY-WXX` format)
  - Fun fact template selection
- [ ] 10.1.3 — Unit tests for utility functions (currency format, date format, invite code generation).
- [ ] 10.1.4 — Target: 80%+ coverage on all `packages/` logic.

### 10.2 — Integration & E2E Tests

- [ ] 10.2.1 — Component tests with `@testing-library/react`:
  - `AddExpenseModal` — form validation, split type switching, submit
  - `PollCard` — voting behavior (single/multi), disabled when closed
  - `RSVPButtons` — state transitions, plus-one counter
  - `ReactionBar` — toggle behavior, emoji picker
- [ ] 10.2.2 — E2E with Playwright:
  - Sign up → create group → add expense → check balances → settle
  - Create poll → vote → see live results
  - Create plan → drag to "Upcoming" → create event from plan → RSVP
  - Post photo → add reaction
- [ ] 10.2.3 — Supabase RLS policy tests:
  - Unauthenticated user cannot read any table
  - Non-member cannot read group data
  - Member can read, non-admin cannot delete group

### 10.3 — Performance Audit

- [ ] 10.3.1 — Lighthouse: `apps/app` dashboard page → LCP < 2.5s, CLS < 0.1.
- [ ] 10.3.2 — Lighthouse: `apps/web` home → 90+ score.
- [ ] 10.3.3 — Add DB indexes on `group_id`, `created_at` for all subcollection tables.
- [ ] 10.3.4 — Ensure Next.js `<Image>` is used throughout. Verify lazy loading.
- [ ] 10.3.5 — Bundle size analysis: code-split kanban board and voice recorder.

### 10.4 — Security Review

- [ ] 10.4.1 — Review all RLS policies — positive and negative test cases for each.
- [ ] 10.4.2 — Review all Server Actions — no unauthorized operations possible.
- [ ] 10.4.3 — Storage RLS: unauthenticated users cannot read private buckets.
- [ ] 10.4.4 — Edge Functions: validate inputs, check auth before processing.
- [ ] 10.4.5 — No secrets exposed to client (no sensitive `NEXT_PUBLIC_` keys).

### 10.5 — Production Supabase Setup

- [ ] 10.5.1 — Create production Supabase project.
- [ ] 10.5.2 — Run all migrations: `supabase db push`.
- [ ] 10.5.3 — Configure Google OAuth for production callback URL.
- [ ] 10.5.4 — Deploy Edge Functions: `supabase functions deploy`.
- [ ] 10.5.5 — Set VAPID keys in production Edge Function secrets.
- [ ] 10.5.6 — Enable Realtime on required tables in production dashboard.
- [ ] 10.5.7 — Set up weekly-digest cron schedule in production.

### 10.6 — Vercel Deployment

- [ ] 10.6.1 — Create Vercel project for `apps/app`:
  - Root: `apps/app`
  - All env vars set
  - Custom domain: `app.mooch.com`
- [ ] 10.6.2 — Create Vercel project for `apps/web`:
  - Root: `apps/web`
  - Custom domains: `mooch.com` + `www.mooch.com`
- [ ] 10.6.3 — Configure Turborepo remote cache in Vercel.
- [ ] 10.6.4 — Set up preview deployments on pull requests.

### 10.7 — Monitoring

- [ ] 10.7.1 — Install Sentry in both apps.
- [ ] 10.7.2 — Configure Sentry source maps in Vercel build.
- [ ] 10.7.3 — Set up `@vercel/analytics` for page views + custom events.
- [ ] 10.7.4 — Supabase Dashboard alerts for DB CPU/connection spikes.

### 10.8 — Final QA

- [ ] 10.8.1 — Full manual walkthrough on production URLs.
- [ ] 10.8.2 — Google OAuth on production with real Google account.
- [ ] 10.8.3 — Invite link end-to-end: share → open on another device → join.
- [ ] 10.8.4 — Web Push on production (requires HTTPS).
- [ ] 10.8.5 — Test on Safari + Chrome + Firefox (desktop).
- [ ] 10.8.6 — Test on iOS Safari + Chrome Android (mobile).
- [ ] 10.8.7 — Real-time: two tabs, action on one → other updates without refresh.

---

**Phase 10 Testing Checklist (must all pass before APPROVED):**

- [ ] Unit tests pass with 80%+ coverage on packages
- [ ] E2E Playwright tests all pass
- [ ] RLS tests: non-members cannot access data
- [ ] Lighthouse: app 70+, web 90+
- [ ] Both apps deployed to production Vercel URLs
- [ ] Custom domains live
- [ ] Sentry receiving events
- [ ] Google OAuth works on production
- [ ] Web Push works on production
- [ ] Real-time works on production

**Phase 10 Status: ⬜ — Awaiting approval**

---

---

## Post-MVP Roadmap

_(Do not start until Phase 10 is APPROVED and shipped)_

| Feature                | Notes                                                   |
| ---------------------- | ------------------------------------------------------- |
| Squad Pro subscription | Stripe or LemonSqueezy, feature gates                   |
| Receipt OCR            | Tesseract.js or cloud vision for expense photo scanning |
| AI weekly recaps       | LLM-generated fun facts (Claude API)                    |
| Custom group themes    | Color palettes, profile cosmetics                       |
| PDF exports            | Monthly expense reports, event summaries                |
| PWA offline support    | Service Worker caching for offline viewing              |

---

## Approval Log

| Phase                        | Status | Approved By | Date | Notes |
| ---------------------------- | ------ | ----------- | ---- | ----- |
| Phase 0: Monorepo Foundation | ⬜     | —           | —    | —     |
| Phase 1: Auth & Profiles     | ⬜     | —           | —    | —     |
| Phase 2: Groups System       | ⬜     | —           | —    | —     |
| Phase 3: Expense Tracker     | ⬜     | —           | —    | —     |
| Phase 4: Voting & Polls      | ⬜     | —           | —    | —     |
| Phase 5: Plans Board         | ⬜     | —           | —    | —     |
| Phase 6: Squad Feed          | ⬜     | —           | —    | —     |
| Phase 7: Events              | ⬜     | —           | —    | —     |
| Phase 8: Insights            | ⬜     | —           | —    | —     |
| Phase 9: Polish & Marketing  | ⬜     | —           | —    | —     |
| Phase 10: Testing & Deploy   | ⬜     | —           | —    | —     |
