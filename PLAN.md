# mooch — Webapp Development Plan

> **"Track the chaos, keep the vibes: expenses, plans, votes & memories — all in one squad app."**
>
> Web app (Next.js 16 + Supabase) · Monorepo · English & Spanish
> Structure: `mooch.me` (marketing) + `app.mooch.me` (app)

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
│   ├── app/          → Next.js app — app.mooch.me
│   └── web/          → Next.js marketing site — mooch.me
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

**Status:** 🟢

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

- [x] 1.3.1 — `packages/db/src/client/browser.ts`: `createBrowserClient()` using `@supabase/ssr`.
- [x] 1.3.2 — `packages/db/src/client/server.ts`: `createServerClient()` (for Server Components + Server Actions).
- [x] 1.3.3 — `packages/db/src/client/middleware.ts`: `createMiddlewareClient()` for Next.js middleware.
- [x] 1.3.4 — Export all three from `packages/db/src/index.ts`.

### 1.4 — Next.js Auth Middleware (apps/app)

- [x] 1.4.1 — Create `apps/app/src/middleware.ts`. Use `createMiddlewareClient()` from `@mooch/db` to refresh the session on every request.
- [x] 1.4.2 — Protect all non-auth, non-public routes — redirect unauthenticated users to `/login`.
- [x] 1.4.3 — Redirect authenticated users away from `/login` and `/signup` to `/groups`.

### 1.5 — Auth Route Handlers (apps/app)

- [x] 1.5.1 — Create `apps/app/src/app/auth/callback/route.ts`. Exchange the OAuth code for a session and redirect to `/groups`.
- [x] 1.5.2 — Create `apps/app/src/app/auth/confirm/route.ts` for email confirmation links.

### 1.6 — Login & Signup Pages

- [x] 1.6.1 — Create `apps/app/src/app/(auth)/layout.tsx` — centered, full-height auth layout with mooch logo/wordmark.
- [x] 1.6.2 — Create `apps/app/src/app/(auth)/login/page.tsx`:
  - Email + password fields
  - "Sign in with Google" button (calls `signInWithOAuth({ provider: 'google' })`)
  - Link to `/signup`
  - "Forgot password?" link
  - Client component — uses `createBrowserClient()`
  - Show error message on failed login
  - Loading state on submit
- [x] 1.6.3 — Create `apps/app/src/app/(auth)/signup/page.tsx`:
  - Display name, email, password fields
  - Validation: display name ≥ 2 chars, valid email, password ≥ 8 chars
  - On success: show "Check your email" message
  - Link back to `/login`
- [x] 1.6.4 — Create `apps/app/src/app/(auth)/forgot-password/page.tsx`:
  - Email field → calls `resetPasswordForEmail()`
  - Success/error feedback

### 1.7 — Profile Queries (packages/db)

- [x] 1.7.1 — Create `packages/db/src/queries/profiles.ts`:
  - `getProfile(supabase, userId)` — fetch profile by ID
  - `updateProfile(supabase, userId, data)` — update display_name, photo_url, locale, default_currency
- [x] 1.7.2 — Export from `packages/db/src/index.ts`.

### 1.8 — Shell Layout & Profile Page (apps/app)

- [x] 1.8.1 — Create `apps/app/src/app/(shell)/layout.tsx` — server component that fetches the session. If no session, redirect to `/login`. Renders sidebar/navigation shell.
- [x] 1.8.2 — Create `apps/app/src/app/(shell)/groups/page.tsx` — placeholder groups list showing "Welcome, {display_name}".
- [x] 1.8.3 — Create `apps/app/src/app/(shell)/profile/page.tsx`:
  - Display current profile (display_name, email read-only, locale, default_currency)
  - Edit form for display_name, locale (EN/ES selector), default_currency
  - Avatar upload (Supabase Storage `avatars` bucket, create bucket in migration)
  - "Sign Out" button — calls `signOut()` + redirect to `/login`
- [x] 1.8.4 — Avatar upload: compress client-side (Canvas API) → upload to `avatars/{userId}.{ext}` → save public URL to `profiles.photo_url`.

### 1.9 — Zustand Auth Store (packages/stores)

- [x] 1.9.1 — Create `packages/stores/src/auth.ts`: `useAuthStore` with `user`, `profile`, `setUser`, `setProfile`, `reset`.
- [x] 1.9.2 — In the app's root provider/layout, hydrate the store from the session after mount.

### 1.10 — Verify & Test

- [x] 1.10.1 — Sign up with email → receive confirmation email → click link → redirected to `/groups`.
- [x] 1.10.2 — Sign in with email/password → lands on `/groups`.
- [x] 1.10.3 — Sign in with Google → redirected through OAuth → lands on `/groups`.
- [x] 1.10.4 — Visiting `/groups` when logged out → redirected to `/login`.
- [x] 1.10.5 — Visiting `/login` when logged in → redirected to `/groups`.
- [x] 1.10.6 — Profile edit saves to Supabase, changes reflected on reload.
- [x] 1.10.7 — Avatar upload works (photo visible after upload).
- [x] 1.10.8 — Sign out → redirected to `/login`, session cleared.
- [x] 1.10.9 — Forgot password → email received with reset link.
- [x] 1.10.10 — `profiles` row auto-created on signup (verify in Supabase Studio).

---

**Phase 1 Testing Checklist (must all pass before APPROVED):**

- [x] Email sign-up + email confirmation works end to end
- [x] Google OAuth sign-in works end to end
- [x] Auth-guarded routes redirect unauthenticated users
- [x] Profile is auto-created on first sign-up
- [x] Profile editing (name, locale, currency, avatar) saves correctly
- [x] Sign out clears session and redirects

**Phase 1 Status: 🟢 APPROVED**

---

---

# Phase 2: Groups System

**Goal:** Users can create squads, invite friends via invite code or QR, join groups, and switch between groups. The active group context is available throughout the app.

**Status:** 🟢

---

### 2.1 — Database Migrations: Groups

- [x] 2.1.1 — Create `supabase/migrations/0003_groups.sql`:

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

- [x] 2.1.2 — Add `Group` and `GroupMember` TypeScript types to `packages/types`.
- [x] 2.1.3 — Run migration and verify in Supabase Studio.

### 2.2 — Group Queries & Server Actions

- [x] 2.2.1 — `packages/db/src/queries/groups.ts`:
  - `getGroupsByUser(supabase, userId)` — groups where user is a member
  - `getGroupById(supabase, groupId)` — single group with members
  - `getGroupMembers(supabase, groupId)` — list of members with profile data
- [x] 2.2.2 — `apps/app/src/app/actions/groups.ts` (Server Actions):
  - `createGroup(data)` — generates 6-char alphanumeric invite code, inserts group + adds creator as admin
  - `joinGroupByCode(inviteCode)` — looks up group, adds current user as member
  - `updateGroup(groupId, data)` — update name, emoji, cover photo, currency, locale (admin only)
  - `leaveGroup(groupId)` — remove self from members (prevent last admin from leaving)
  - `deleteGroup(groupId)` — admin only, cascades
  - `regenerateInviteCode(groupId)` — admin only, creates new unique 6-char code
  - `removeMember(groupId, userId)` — admin only

### 2.3 — Group Zustand Store

- [x] 2.3.1 — Create `packages/stores/src/groups.ts`: `useGroupStore` with `groups`, `activeGroupId`, `setGroups`, `setActiveGroup`, `addGroup`, `removeGroup`.

### 2.4 — Groups UI

- [x] 2.4.1 — `apps/app/src/app/(shell)/groups/page.tsx`:
  - List of user's groups (emoji, name, member count, currency badge)
  - "Create a squad" button → opens create group modal
  - "Join a squad" button → opens join group modal
  - Empty state: "You're not in any squads yet"
- [x] 2.4.2 — `apps/app/src/components/groups/CreateGroupModal.tsx`:
  - Group name input
  - Emoji picker (inline grid of preset emojis)
  - Currency selector (ARS, USD, EUR, BRL)
  - Locale selector (EN, ES)
  - Optional: cover photo upload
  - On submit: calls `createGroup` → navigates to group page
- [x] 2.4.3 — `apps/app/src/components/groups/JoinGroupModal.tsx`:
  - 6-character code input (auto-uppercase, auto-advance per char)
  - QR code scanner (browser `getUserMedia` + `jsqr` lib)
  - On submit: calls `joinGroupByCode`
- [x] 2.4.4 — `apps/app/src/app/(shell)/groups/[groupId]/page.tsx`:
  - Group header (emoji, name, member count)
  - Members list (avatar, name, role badge)
  - Navigation tabs for group sections
  - "Invite" button → opens invite sheet
- [x] 2.4.5 — `apps/app/src/components/groups/InviteSheet.tsx`:
  - Large monospace invite code display
  - "Copy code" button
  - QR code (generated with `qrcode` npm package)
  - "Share link" button → `navigator.share()` with `https://app.mooch.me/join/{code}`
- [x] 2.4.6 — `apps/app/src/app/join/[code]/page.tsx` (public, no auth required):
  - Shows group name + emoji from invite code lookup
  - "Join this squad" CTA → if not logged in, redirect to `/login?next=/join/{code}`; if logged in, call `joinGroupByCode`
- [x] 2.4.7 — `apps/app/src/app/(shell)/groups/[groupId]/settings/page.tsx`:
  - Edit name, emoji, cover photo, currency, locale
  - Member management (remove member, change role — admin only)
  - "Regenerate invite code" button
  - "Leave group" with confirm dialog
  - "Delete group" (admin only, confirm by typing group name)
- [x] 2.4.8 — `apps/app/src/components/groups/GroupSwitcher.tsx`:
  - Horizontal scrollable row of group chips (emoji + name) in top nav
  - Active chip highlighted
  - Clicking sets `activeGroupId` in Zustand + persists to `localStorage`
  - "+" chip → open create group modal

### 2.5 — App Layout with Group Context

- [x] 2.5.1 — Update `apps/app/src/app/(shell)/layout.tsx` to fetch user's groups server-side.
- [x] 2.5.2 — Create client-side `GroupsProvider` that hydrates the Zustand group store.
- [x] 2.5.3 — Add `GroupSwitcher` to the shell top nav.

### 2.6 — Verify & Test

- [x] 2.6.1 — Create a group → appears in groups list.
- [x] 2.6.2 — Invite code generated (6 chars, alphanumeric).
- [x] 2.6.3 — Copy invite code → paste into join modal → joins group.
- [x] 2.6.4 — QR code displays correctly and is scannable.
- [x] 2.6.5 — Deep link `/join/{code}` shows group preview and allows joining.
- [x] 2.6.6 — Group switcher switches active group.
- [x] 2.6.7 — Group settings: edit name/emoji → changes saved.
- [x] 2.6.8 — Leave group removes user from members.
- [x] 2.6.9 — Delete group cascades (no orphaned data).
- [x] 2.6.10 — Non-members cannot access group data (RLS check in Supabase Studio).

---

**Phase 2 Testing Checklist (must all pass before APPROVED):**

- [x] Create group with name, emoji, currency
- [x] Join by invite code works
- [x] Join by QR code works
- [x] Join via `/join/{code}` deep link works (logged in + logged out flows)
- [x] Group switcher changes active group
- [x] Group settings (edit, leave, delete) work
- [x] RLS confirmed: unauthenticated user cannot query groups table

**Phase 2 Status: 🟢 APPROVED**

---

---

# Interlude: Shell Layout & Navigation Overhaul

**Goal:** Replace the flat `ShellTopNav` with a proper navigation shell: persistent sidebar on desktop, bottom tab bar on mobile, mobile top bar, and a root dashboard page. Implemented between Phase 2 and Phase 3 as a prerequisite for all section pages.

**Status:** 🟢 **COMPLETE**

---

### What was built

- [x] `components/layout/Sidebar.tsx` — desktop 240px sidebar: groups list with active indicator, create/join buttons (open modals), section nav (Overview → Insights + Settings), profile footer
- [x] `components/layout/BottomTabBar.tsx` — mobile fixed bottom nav: 4 primary tabs (Overview, Feed, Expenses, Plans) + "More" Sheet (Polls, Events, Insights); active tab highlighted in brand green
- [x] `components/layout/MobileTopBar.tsx` — mobile sticky header: active group emoji + name (tappable → Sheet group switcher), avatar → `/profile`
- [x] `(shell)/layout.tsx` — refactored to fetch profile + groups server-side; wires Sidebar / MobileTopBar / BottomTabBar with responsive visibility
- [x] `(shell)/page.tsx` — root dashboard: squad grid or empty state with create/join CTAs (client component reading from Zustand store)
- [x] `(shell)/[groupId]/page.tsx` — canonical group overview reusing `GroupDetailClient`
- [x] `(shell)/[groupId]/feed|expenses|polls|plans|events|insights/page.tsx` — 6 placeholder section pages
- [x] `middleware.ts` — removed `/` redirect to `/groups`; authenticated + auth-route fallback now goes to `/`
- [x] `GroupDetailClient.tsx` — Overview tab link updated from `/groups/${id}` → `/${id}` (canonical route)
- [x] `app/page.tsx` — deleted (replaced by `(shell)/page.tsx`)

### Route structure

| URL                          | File                                         | Purpose                    |
| ---------------------------- | -------------------------------------------- | -------------------------- |
| `/`                          | `(shell)/page.tsx`                           | Root dashboard             |
| `/[groupId]`                 | `(shell)/[groupId]/page.tsx`                 | Group overview (canonical) |
| `/[groupId]/feed`            | `(shell)/[groupId]/feed/page.tsx`            | Feed placeholder           |
| `/[groupId]/expenses`        | `(shell)/[groupId]/expenses/page.tsx`        | Expenses placeholder       |
| `/[groupId]/polls`           | `(shell)/[groupId]/polls/page.tsx`           | Polls placeholder          |
| `/[groupId]/plans`           | `(shell)/[groupId]/plans/page.tsx`           | Plans placeholder          |
| `/[groupId]/events`          | `(shell)/[groupId]/events/page.tsx`          | Events placeholder         |
| `/[groupId]/insights`        | `(shell)/[groupId]/insights/page.tsx`        | Insights placeholder       |
| `/groups`                    | `(shell)/groups/page.tsx`                    | Groups list (unchanged)    |
| `/groups/[groupId]/settings` | `(shell)/groups/[groupId]/settings/page.tsx` | Settings (unchanged)       |

---

---

# Phase 3: Tabs, Expenses & Balances

**Goal:** Expense splitting organized by **Tabs** (a "bar tab" — a group of related expenses like a BBQ, a trip, or groceries). Each tab has its own expenses, balances, and settle-up flow. A global view aggregates balances across tabs with filtering. Receipt generation per tab via Sheet receipt variant.

**Status:** 🔄

**Key concept — Tab:** A tab is a container for expenses within a group. Every expense belongs to exactly one tab. Examples: "BBQ at Tobi's", "Cancun Trip", "Weekly Groceries". Tabs can be open (active) or closed (settled/archived).

---

### 3.1 — Database Migrations: Tabs, Expenses & Balances

- [x] 3.1.1 — Created `supabase/migrations/0006_expenses.sql` (0003–0005 were taken by groups + RLS migrations):

  **Design decisions vs. original plan:**
  - `expenses` gains `notes` field and multi-currency fields: `exchange_rate`, `converted_amount`, `rate_fetched_at`. No auto-conversion — user triggers it manually during expense creation with an API-suggested rate (e.g. dollar blue). At settle time, a stale-rate warning is shown if `rate_fetched_at` is > 1 day old.
  - Removed `is_settled` / `settled_at` from `expenses` — individual expenses are never flagged as settled. Debt is cleared via `settlement_payments` records instead.
  - Added `settlement_payments` table (separate from expenses): records actual pay-back transactions between two members with full currency + exchange_rate fields, kept forever as audit trail.
  - No `recalculate_balances` DB trigger. Balance recomputation is called explicitly from server actions and written via service-role client (bypasses RLS). Logic lives in TypeScript where multi-currency handling is easier.
  - `balances` has SELECT-only RLS for group members; writes are done server-side via service-role.
  - Indexes added on `(group_id, created_at desc)` for expenses and settlements, and on `expense_participants (expense_id, user_id)`.

- [x] 3.1.2 — **NEW:** Create `supabase/migrations/0008_tabs.sql`:
  - `tabs` table: `id` (uuid PK), `group_id` (FK → groups), `name` (text, 2–60 chars), `emoji` (text, encoded same as group icons), `status` (text: `open` | `closed`, default `open`), `created_by` (FK → auth.users), `created_at`, `updated_at`
  - Add `tab_id` (FK → tabs, NOT NULL) to `expenses` table
  - Add `tab_id` (FK → tabs, NOT NULL) to `balances` table
  - Add `tab_id` (FK → tabs, nullable) to `settlement_payments` (nullable so global settle-ups across tabs work too)
  - RLS: group members can SELECT tabs; INSERT/UPDATE/DELETE for group admins + tab creator
  - Index on `tabs (group_id, status, created_at desc)`
  - Index on `expenses (tab_id, created_at desc)`
  - Index on `balances (tab_id)`

- [x] 3.1.3 — Added `ExpenseCategory`, `SplitType`, `Expense`, `ExpenseParticipant`, `Balance`, `SettlementPayment` types to `packages/types/src/index.ts`.

- [x] 3.1.4 — **NEW:** Add `Tab` type to `packages/types/src/index.ts`:

  ```ts
  type TabStatus = "open" | "closed";
  type Tab = {
    id: string;
    group_id: string;
    name: string;
    emoji: string;
    status: TabStatus;
    created_by: string;
    created_at: string;
    updated_at: string;
  };
  ```

  Update `Expense`, `Balance` types to include `tab_id`.

- [x] 3.1.5 — (was 3.1.2) Implement `recalculateBalances` in TypeScript — **UPDATED:** now takes `(groupId, tabId)` and recalculates per-tab. Added `recalculateAllBalances(groupId)` for global settlements:
  1. Fetch all expenses for the tab (use `converted_amount` if set, else `amount` when currency matches group default; skip unconverted foreign-currency expenses with a console warning)
  2. Fetch all `settlement_payments` for the tab
  3. Compute net balance per user (owed - owing - settlements)
  4. Greedy simplification: match largest creditor with largest debtor
  5. Delete existing balances for the tab, insert fresh rows via service-role client

### 3.2 — Queries & Server Actions

- [x] 3.2.1 — `packages/db/src/queries/expenses.ts` — **UPDATE:** all expense/balance queries now filter by `tab_id`:
  - `getExpenses(supabase, tabId, cursor?)` — paginated 20/page, cursor by `created_at`
  - `getExpenseById(supabase, expenseId)` — with participants + profile data + payer profile
  - `getBalances(supabase, tabId)` — simplified balances for one tab with `from_profile` + `to_profile`
  - `getGlobalBalances(supabase, groupId)` — **NEW:** aggregated balances across all open tabs in a group, with tab attribution
  - `getUserNetBalance(supabase, groupId, userId)` — net across all tabs in group currency
  - `getSettlementPayments(supabase, tabId)` — settlements for one tab with profile data
  - All exported from `packages/db/src/index.ts`

- [x] 3.2.2 — **NEW:** `packages/db/src/queries/tabs.ts`:
  - `getTabs(supabase, groupId)` — all tabs for a group, ordered by status (open first) then created_at desc
  - `getTabById(supabase, tabId)` — single tab with expense count + total amount
  - `getTabWithExpenses(supabase, tabId, cursor?)` — tab + paginated expenses
  - Exported from `packages/db/src/index.ts`

- [x] 3.2.3 — **NEW:** `apps/app/src/app/actions/tabs.ts` (Server Actions):
  - `createTab(groupId, data)` — creates tab, returns full payload
  - `updateTab(tabId, data)` — creator/admin only, updates name/emoji/status
  - `closeTab(tabId)` — sets status to `closed` (all balances should be settled first — warn if not)
  - `reopenTab(tabId)` — sets status back to `open`
  - `deleteTab(tabId)` — admin only, only if tab has zero expenses; hard delete

- [x] 3.2.4 — `apps/app/src/app/actions/expenses.ts` (Server Actions) — **UPDATE:** `addExpense` now requires `tabId`:
  - `uploadReceiptPhoto(formData)` — uploads to `receipts` bucket (5 MB, private), returns storage path
  - `addExpense(tabId, data)` — inserts expense + participants, calls `recalculateBalances(groupId, tabId)`
  - `updateExpense(expenseId, data)` — creator/admin only, updates fields + participants, recalculates
  - `deleteExpense(expenseId)` — creator/admin only, recalculates
  - `applyExchangeRate(expenseId, rate)` — sets `exchange_rate`, `converted_amount`, `rate_fetched_at`; recalculates
  - `settleUp(tabId, data)` — creates `settlement_payments` record (audit trail), recalculates tab balances
  - `settleUpGlobal(groupId, fromUserId, toUserId, amount)` — **NEW:** settle across tabs; creates settlement_payment with `tab_id = null`, recalculates all affected tab balances

- [x] 3.2.5 — (was 3.2.4) Added `custom_category` (nullable Lucide icon name) to `expenses` via `0007_expense_custom_category.sql`.

### 3.3 — Client State & Real-time

- [x] 3.3.1 — `packages/stores/src/expenses.ts` — **UPDATED** with tabs + global balances:
  - `useExpenseStore` with `tabs`, `expenses`, `balances`, `globalBalances` + all setters/upsert/remove/clear
  - Exported `BalanceWithProfiles` type (`Balance & { from_profile, to_profile }`)

- [x] 3.3.2 — `apps/app/src/components/expenses/ExpensesProvider.tsx` — **REWRITTEN** as two providers:
  - `ExpensesGroupProvider` (group-level): manages tabs list + global balances, subscribes to `tabs` + `balances` realtime
  - `ExpensesTabProvider` (tab-level): manages expenses + per-tab balances, subscribes to `expenses` + `balances` filtered by `tab_id`

- [x] 3.3.3 — Both providers subscribe to `balances` table changes and refetch full balance list with profile joins (realtime payloads lack joins).

### 3.4 — Tabs & Expenses UI

**Routes:**

- `/{groupId}/expenses` — tab list + global balance overview
- `/{groupId}/expenses/{tabId}` — expenses within a tab + tab balances + receipt

#### Tab List (expenses landing page)

- [x] 3.4.1 — `apps/app/src/app/(shell)/[groupId]/expenses/page.tsx`:
  - Grid/list of tab cards (open tabs first, then closed)
  - Global balance summary card: "You owe X across N tabs" / "You're owed Y across N tabs" with per-person breakdown
  - "Settle up with {name}" button on global view — triggers `settleUpGlobal`
  - "New Tab" button → `CreateTabModal`
  - Empty state: "No tabs yet — open one to start tracking expenses!"

- [x] 3.4.2 — `apps/app/src/components/expenses/TabCard.tsx`:
  - Tab emoji + name, status badge (open/closed), expense count, total amount
  - Tap → navigates to `/{groupId}/expenses/{tabId}`

- [x] 3.4.3 — `apps/app/src/components/expenses/CreateTabModal.tsx`:
  - Name input, emoji/icon picker (same `IconPicker` as groups)
  - Creates tab → navigates to new tab page

#### Tab Detail (expenses within a tab)

- [x] 3.4.4 — `apps/app/src/app/(shell)/[groupId]/expenses/[tabId]/page.tsx`:
  - Tab header: emoji, name, status badge, "Close Tab" / "Reopen" action
  - Two sub-tabs: **Activity** and **Balances**
  - "Add Expense" button (only if tab is open)

- [x] 3.4.5 — `apps/app/src/components/expenses/ExpenseList.tsx` (existing, reused):
  - Paginated expense list (20 per page), cursor-based "Load more" button
  - Empty state: "No expenses yet — split your first one!"

- [x] 3.4.6 — `apps/app/src/components/expenses/ExpenseCard.tsx` (existing, reused):
  - Category emoji or custom Lucide icon (for "other"), description, amount in group currency
  - "Paid by {name}" / "You paid"; amount color-coded green (you paid)

- [x] 3.4.7 — `apps/app/src/components/expenses/AddExpenseModal.tsx` (existing, updated):
  - **Step 1:** Large number input for amount + currency selector, description, notes textarea, receipt photo attach
  - **Step 2:** Category grid + `IconPicker` shown when category is "other" for custom icon
  - **Step 3:** "Paid by" selector + split type toggle (Equal / Percentage / Exact) with per-member rows and live validation
  - Submit → receipt upload (if any) → `addExpense(tabId, ...)` action; animated step transitions
  - Now receives `tabId` prop instead of `groupId` for expense creation

- [x] 3.4.8 — `apps/app/src/app/(shell)/[groupId]/expenses/[tabId]/[expenseId]/page.tsx`:
  - Full breakdown (all participants + shares)
  - Edit button (creator/admin) → pre-filled edit modal
  - Delete with confirm dialog

- [x] 3.4.9 — `apps/app/src/components/expenses/BalanceMatrix.tsx` (existing, reused per-tab):
  - Simplified debt list: "{Name} owes {Name} ${Amount}" with "Settle Up" button for current-user rows
  - Settle Up → `ConfirmDialog` → `settleUp` server action; "Everyone is settled up" empty state

- [x] 3.4.10 — `apps/app/src/components/expenses/BalanceCard.tsx` (existing, reused per-tab):
  - Net balance for current user (green/red/neutral); "Everyone is settled up" empty state

#### Tab Receipt

- [x] 3.4.11 — `apps/app/src/components/expenses/TabReceipt.tsx`:
  - Opens `Sheet` component in `receipt` variant
  - Receipt content: tab name as "store name", date range, all expenses listed (description + amount + paid by), divider, per-person totals, balance summary (who owes who), grand total
  - "Download as image" button — uses `html-to-image` to capture the receipt DOM and trigger a PNG download
  - Accessible from tab detail page header (e.g. receipt icon button)

### 3.5 — Verify & Test

- [ ] 3.5.1 — Tab CRUD: create, rename, close, reopen, delete (only empty tabs).
- [ ] 3.5.2 — Expenses always belong to a tab; cannot create expense without a tab.
- [ ] 3.5.3 — Equal split: all participants get correct equal shares.
- [ ] 3.5.4 — Percentage split: validation rejects non-100% total.
- [ ] 3.5.5 — Exact split: validation rejects non-matching total.
- [ ] 3.5.6 — Per-tab balances recalculate automatically after each expense.
- [ ] 3.5.7 — Global balances aggregate correctly across open tabs.
- [ ] 3.5.8 — Balance matrix shows simplified debts (not gross).
- [ ] 3.5.9 — Per-tab settle-up: settle between two users within a tab → tab debts clear.
- [ ] 3.5.10 — Global settle-up: settle between two users across tabs → all relevant tab debts clear.
- [ ] 3.5.11 — Realtime: user A adds expense → user B (other browser tab) sees it without refresh.
- [ ] 3.5.12 — Edit expense → amounts and participants update correctly. Implemented via expense detail route + shared edit modal; manual browser verification pending.
- [ ] 3.5.13 — Delete expense → balances recalculate. Implemented via expense detail route + existing delete action; manual browser verification pending.
- [ ] 3.5.14 — Close tab → cannot add new expenses; can still view and generate receipt. Receipt access path is implemented from tab detail; manual browser verification pending.
- [ ] 3.5.15 — Tab receipt renders correctly and downloads as PNG. Implemented with receipt `Sheet` variant + `html-to-image`; manual browser verification pending.
- [ ] 3.5.16 — Non-member cannot read tabs or expenses (RLS).

---

**Phase 3 Testing Checklist (must all pass before APPROVED):**

Implementation coverage added in this pass:

- Expense detail page with edit/delete flow
- Receipt sheet from tab detail
- PNG export for receipts

These checklist items stay unchecked until browser/manual verification is completed.

- [ ] Tab CRUD works (create, edit, close, reopen, delete empty)
- [ ] Expenses always live inside a tab
- [ ] Three split types compute correctly
- [ ] Per-tab balance recalculation works
- [ ] Global balance aggregation across tabs works
- [ ] Balance simplification produces minimal set of transactions
- [ ] Per-tab and global settle-up both work
- [ ] Real-time updates visible across browser tabs
- [ ] Edit and delete expenses work
- [ ] Tab receipt renders and downloads as image
- [ ] RLS: non-members cannot read group tabs or expenses

**Phase 3 Status: ⬜ — Awaiting approval**

---

---

# Phase 3A: Motion Foundation & Transition Pilot

**Goal:** Apply the UX direction from `UX.md` to the real expense surfaces first, using `motion/react`, layout animations, and selective transition polish. This is a pilot phase: if the results are strong, the same motion system becomes the standard for the rest of the app in Phases 4-9.

**Status:** ⬜

**Intent:**

- Prove the motion language on real screens instead of abstract demos.
- Improve clarity and delight without slowing high-frequency actions.
- Create reusable transition primitives that later phases can inherit.

---

### 3A.1 — Motion Foundation

- [x] 3A.1.1 — Create shared motion tokens / helpers (durations, easing, spring presets, reduced-motion fallbacks).
- [x] 3A.1.2 — Define a small transition vocabulary:
  - `fast`
  - `standard`
  - `layout`
  - `sheet`
  - `delight`
- [x] 3A.1.3 — Ensure all new motion respects `prefers-reduced-motion`.

### 3A.2 — Navigation & View Switching

- [x] 3A.2.1 — `apps/app/src/components/expenses/TabDetailClient.tsx`:
  - Upgrade `Activity` / `Balances` switch with shared moving indicator (`layoutId`)
  - Add clear, low-latency content transition that preserves context
- [x] 3A.2.2 — `apps/app/src/components/layout/BottomTabBar.tsx`:
  - Introduce animated active indicator / shared movement language
  - Keep transitions interruptible and under ~200ms for frequent actions
- [x] 3A.2.3 — `apps/app/src/components/groups/GroupDetailClient.tsx`:
  - Align top nav active-state motion with bottom nav behavior
  - Remove any mismatch in indicator timing/easing

### 3A.3 — Expense List Layout Animation

- [x] 3A.3.1 — `apps/app/src/components/expenses/ExpenseList.tsx`:
  - Add list-level layout animation so add/edit/delete operations settle smoothly
- [x] 3A.3.2 — `apps/app/src/components/expenses/ExpenseCard.tsx`:
  - Add subtle press feedback and layout participation
  - Keep card interaction fast and tactile
- [x] 3A.3.3 — First-load list reveal:
  - Optional stagger on initial load only
  - Must not replay annoyingly on routine revisits

### 3A.4 — Expense Card to Detail Continuity

- [x] 3A.4.1 — Connect `ExpenseCard` and `ExpenseDetailClient` with shared-element continuity:
  - category icon
  - title/description block
  - amount block
- [x] 3A.4.2 — Add supporting content fade/settle around the shared transition without relying on generic page crossfades.
- [x] 3A.4.3 — Ensure navigation still feels correct when motion is reduced or unsupported.

### 3A.5 — Modal & Sheet Choreography

- [x] 3A.5.1 — `apps/app/src/components/expenses/AddExpenseModal.tsx`:
  - Refine step transitions so they feel directional and interruptible
  - Preserve responsiveness during back/next changes
- [x] 3A.5.2 — `apps/app/src/components/expenses/TabReceipt.tsx`:
  - Improve receipt sheet entrance and internal reveal
  - Keep receipt download action clear and immediate
- [ ] 3A.5.3 — Review shared modal/sheet timing against mobile-first expectations (`cubic-bezier(0.32, 0.72, 0, 1)` where appropriate).

### 3A.6 — Reusable Transition Architecture

- [x] 3A.6.1 — Decide whether to introduce lightweight shared primitives now or in Phase 9:
  - `AppTransitionProvider`
  - `TransitionLink`
  - `TransitionSlot`
- [x] 3A.6.2 — If introduced now, use progressive enhancement:
  - Browser View Transitions API where supported
  - `motion/react` fallback everywhere else
- [x] 3A.6.3 — Keep the architecture minimal; do not add full-page transitions everywhere by default.

### 3A.7 — Rollout Rule For Later Phases

- [x] 3A.7.1 — This phase is approved. The motion system created here is now the default implementation standard for Polls, Plans, Feed, Events, Insights, auth/navigation refinements, and final polish work.
- [x] 3A.7.2 — Later phases must reuse the same motion tokens, shared-element patterns, route transition wrapper, and reduced-motion behavior rather than inventing one-off transitions.
- [x] 3A.7.3 — Motion coverage is a required delivery criterion for all remaining user-facing surfaces, not optional follow-up polish. New flows should ship with transitions/layout animation in the initial implementation unless there is a concrete performance or accessibility reason not to.

### 3A.8 — Verify & Test

- [x] 3A.8.1 — Segmented/tab indicators animate smoothly with no visible jitter.
- [x] 3A.8.2 — Expense list add/edit/delete operations reflow smoothly with no layout jump.
- [x] 3A.8.3 — Expense card -> expense detail transition feels continuous and remains understandable with reduced motion.
- [x] 3A.8.4 — Bottom nav and top nav feel like the same motion system.
- [x] 3A.8.5 — Modal and sheet transitions remain interruptible and responsive.
- [x] 3A.8.6 — No major CLS/layout-shift regressions introduced by motion.
- [x] 3A.8.7 — Mobile interaction still feels fast on repeated use.

---

**Phase 3A Testing Checklist (must all pass before APPROVED):**

- [x] Shared motion tokens are defined and reused
- [x] Navigation indicators feel consistent across surfaces
- [x] Expense list layout animation is smooth
- [x] Expense detail continuity transition works well
- [x] Modal/sheet motion feels native enough for mobile-first use
- [x] Reduced-motion behavior remains clear and usable
- [x] Motion system is good enough to roll forward into the rest of the app

**Phase 3A Status: 🟢 — APPROVED on 2026-03-06. Motion system is now mandatory across the rest of the app.**

---

---

# Phase 3B: Monetization — Subscriptions, Billing & Token System

**Goal:** Introduce paid plans (Free / Pro / Club), Stripe-backed subscriptions, Corruption Token microtransactions, and in-app feature gating. The public pricing page lives at `apps/web/app/pricing/page.tsx`; the billing management UI and all enforcement logic live in `apps/app`.

**Status:** 🟢 — _APPROVED (2026-03-16)_

---

### 3B.1 — Database Migrations: Monetization Schema

- [x] 3B.1.1 — Create `supabase/migrations/0009_monetization.sql`:

  ```sql
  -- Plan definitions
  create table public.plans (
    id text primary key, -- 'free' | 'pro' | 'club'
    name text not null,
    monthly_price_cents int not null,
    annual_price_cents int not null,
    max_groups int,                   -- null = unlimited
    max_members_per_group int not null,
    expense_history_months int,       -- null = unlimited
    tokens_monthly_grant int not null  -- tokens credited to the user at the start of each month
  );

  -- User subscriptions
  create table public.subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade not null unique,
    plan_id text references public.plans(id) not null default 'free',
    billing_cycle text check (billing_cycle in ('monthly', 'annual')),
    status text not null default 'active', -- 'active' | 'canceled' | 'past_due'
    current_period_start timestamptz,
    current_period_end timestamptz,
    stripe_subscription_id text,
    stripe_customer_id text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  -- Corruption token balances
  create table public.token_balances (
    user_id uuid references public.profiles(id) on delete cascade primary key,
    balance int not null default 0,  -- monthly grant + purchases - spent; no upper cap
    reset_at timestamptz not null default date_trunc('month', now()) + interval '1 month',
    updated_at timestamptz not null default now()
  );

  -- Token transactions (purchases + usage + monthly grants)
  create table public.token_transactions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    type text not null check (type in ('purchase', 'monthly_grant', 'usage')),
    amount int not null, -- positive = credit, negative = debit
    action text,         -- 'double_down' | 'the_leak' | 'the_coup' | 'ghost_vote' | 'the_veto' | 'hail_mary'
    stripe_payment_intent_id text,
    created_at timestamptz not null default now()
  );

  alter table public.subscriptions enable row level security;
  alter table public.token_balances enable row level security;
  alter table public.token_transactions enable row level security;

  create policy "Users manage their own subscription"
    on public.subscriptions for all using (auth.uid() = user_id);

  create policy "Users view their own token balance"
    on public.token_balances for select using (auth.uid() = user_id);

  create policy "Users view their own token transactions"
    on public.token_transactions for select using (auth.uid() = user_id);
  ```

- [x] 3B.1.2 — Seed `public.plans` with Free / Pro / Club rows in the same migration:

  | id   | monthly_price_cents | annual_price_cents | max_groups | max_members | history_months | tokens_monthly_grant |
  | ---- | ------------------- | ------------------ | ---------- | ----------- | -------------- | -------------------- |
  | free | 0                   | 0                  | 1          | 8           | 3              | 2                    |
  | pro  | 499                 | 4990               | null       | 20          | null           | 10                   |
  | club | 1499                | 14990              | null       | 50          | null           | 30                   |

  > Users receive their monthly grant automatically. They can also purchase additional tokens at any time with no cap. Balance carries over — unspent tokens are never removed.

- [x] 3B.1.3 — On `auth.users` sign-up trigger: insert a `subscriptions` row (plan = `free`) and a `token_balances` row (balance = 2, reflecting the first monthly grant) for every new user.

---

### 3B.2 — Stripe Integration

#### 3B.2.1 — Package & Environment Setup

- [x] Add `stripe` and `@stripe/stripe-js` + `@stripe/react-stripe-js` to `apps/app`.
- [x] Add to `.env.local` and document all three in `.env.example`:
  ```
  STRIPE_SECRET_KEY=sk_test_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
  ```
- [x] Create Stripe singleton `apps/app/lib/stripe.ts` — import this everywhere; never instantiate Stripe inline:

  ```typescript
  import Stripe from "stripe";

  export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2023-10-16",
    typescript: true,
  });
  ```

- [x] Create client-side singleton `apps/app/lib/stripe-client.ts`:

  ```typescript
  import { loadStripe } from "@stripe/stripe-js";

  export const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  );
  ```

#### 3B.2.2 — Customer Management

- [x] Create `apps/app/lib/stripe-customers.ts` with a `createOrRetrieveCustomer` helper. Called on first checkout — never create duplicate customers:

  ```typescript
  import { stripe } from "./stripe";
  import type Stripe from "stripe";

  export async function createOrRetrieveCustomer(
    email: string,
    userId: string,
  ): Promise<Stripe.Customer> {
    const existing = await stripe.customers.list({ email, limit: 1 });
    if (existing.data.length > 0) return existing.data[0];

    return stripe.customers.create({
      email,
      metadata: { userId }, // used to look up the user in webhooks
    });
  }
  ```

#### 3B.2.3 — Server Actions: `apps/app/app/actions/billing.ts`

All actions are `'use server'`. All Stripe calls use idempotency keys for safety. Errors are caught by type using `Stripe.errors`.

- [x] `createCheckoutSession(planId: 'pro' | 'club', billingCycle: 'monthly' | 'annual')`:
  - Calls `createOrRetrieveCustomer`, saves `stripe_customer_id` to `subscriptions` if new.
  - Creates a Stripe Checkout Session (`mode: 'subscription'`) with:
    - The correct `price` ID for the plan + billing cycle (looked up from `STRIPE_PRICE_IDS` constant).
    - `subscription_data.trial_period_days: 7` for Pro only.
    - `success_url` → `/billing?session_id={CHECKOUT_SESSION_ID}`, `cancel_url` → `/billing`.
    - `allow_promotion_codes: true`.
  - Returns the session URL; caller redirects with `redirect()`.

- [x] `createTokenPurchaseSession(pack: 'starter' | 'popular' | 'power')`:
  - Token pack prices (`STARTER_PRICE_ID` 1×$0.99, `POPULAR_PRICE_ID` 3×$1.99, `POWER_PRICE_ID` 9×$4.99) stored as constants alongside the function.
  - Creates a Stripe Checkout Session (`mode: 'payment'`) with `payment_intent_data.metadata: { userId, pack }` so the webhook can credit the right token amount.
  - Uses an idempotency key: `token-purchase-${userId}-${pack}-${Date.now()}`.
  - Returns the session URL.

- [x] `createPortalSession()`:
  - Fetches `stripe_customer_id` from `subscriptions` for the current user.
  - Creates a Stripe Customer Portal session with `return_url: /billing`.
  - Returns the portal URL; caller redirects with `redirect()`.

#### 3B.2.4 — Webhook Handler: `apps/app/app/api/webhooks/stripe/route.ts`

Must be a Next.js Route Handler (not a Server Action) — Stripe requires access to the raw request body for signature verification.

- [x] Implement the route handler:

  ```typescript
  import { headers } from "next/headers";
  import { stripe } from "@/lib/stripe";
  import type Stripe from "stripe";

  export async function POST(request: Request) {
    const body = await request.text(); // raw body required for sig verification
    const signature = headers().get("stripe-signature")!;

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch {
      return new Response("Webhook signature verification failed", {
        status: 400,
      });
    }

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent,
        );
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }

    return new Response("ok", { status: 200 });
  }
  ```

- [x] `handleCheckoutCompleted(session)` — for `mode: 'subscription'`:
  - Retrieve `userId` from `session.metadata` or via `stripe.customers.retrieve(session.customer)`.
  - Update `subscriptions` row: set `stripe_subscription_id`, `stripe_customer_id`, `plan_id`, `billing_cycle`, `status = 'active'`, `current_period_start/end`.

- [x] `handleSubscriptionUpdated(subscription)` — sync plan, billing cycle, status, and period dates to `subscriptions`.

- [x] `handleSubscriptionDeleted(subscription)` — set `plan_id = 'free'`, `status = 'canceled'`, clear Stripe IDs. Data is never deleted.

- [x] `handlePaymentIntentSucceeded(paymentIntent)` — only fires for token pack purchases (`paymentIntent.metadata.pack` is set):
  - Look up token amount from pack name (`starter=1`, `popular=3`, `power=9`).
  - Increment `token_balances.balance` for the user.
  - Insert `token_transactions` row (type `'purchase'`, amount = tokens credited, `stripe_payment_intent_id` stored).

- [x] `handleInvoicePaymentFailed(invoice)` — set `subscriptions.status = 'past_due'` for the affected user.

#### 3B.2.5 — Monthly Token Grant: `supabase/functions/reset-monthly-tokens/index.ts`

- [x] Scheduled Supabase Edge Function (cron: `0 0 1 * *` — first of each month):
  - Fetches all users joined with their active plan's `tokens_monthly_grant`.
  - For each user: increments `token_balances.balance` by `tokens_monthly_grant`, updates `reset_at`, inserts a `token_transactions` row (type `'monthly_grant'`).
  - Balance is additive — unspent tokens from prior months carry over indefinitely.

#### 3B.2.6 — Error Handling Pattern

All Stripe calls in Server Actions must use typed error catching:

```typescript
import Stripe from "stripe";

try {
  // stripe call
} catch (error) {
  if (error instanceof Stripe.errors.StripeCardError) {
    throw new Error("card_declined");
  } else if (error instanceof Stripe.errors.StripeInvalidRequestError) {
    throw new Error("invalid_request");
  } else {
    throw new Error("stripe_error");
  }
}
```

---

### 3B.3 — Feature Gating Utilities

- [x] 3B.3.1 — `packages/db/src/queries/subscriptions.ts`:
  - `getUserPlan(userId)` — fetches `subscriptions` joined with `plans`. Wrap with React `cache()` for deduplication per request.
  - `getUserTokenBalance(userId)` — fetches `token_balances.balance`.

- [x] 3B.3.2 — `packages/types/src/plans.ts`:

  ```typescript
  export type PlanId = "free" | "pro" | "club";

  export interface PlanLimits {
    maxGroups: number | null; // null = unlimited
    maxMembersPerGroup: number;
    expenseHistoryMonths: number | null;
    tokensMonthlyGrant: number;
  }

  export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
    free: {
      maxGroups: 1,
      maxMembersPerGroup: 8,
      expenseHistoryMonths: 3,
      tokensMonthlyGrant: 2,
    },
    pro: {
      maxGroups: null,
      maxMembersPerGroup: 20,
      expenseHistoryMonths: null,
      tokensMonthlyGrant: 10,
    },
    club: {
      maxGroups: null,
      maxMembersPerGroup: 50,
      expenseHistoryMonths: null,
      tokensMonthlyGrant: 30,
    },
  };
  ```

- [x] 3B.3.3 — `canPerformAction(userId, action)` in `packages/db/src/queries/subscriptions.ts`:
  - Supported `action` values: `'create_group'`, `'add_member'`, `'view_expense_history'`.
  - Fetches the user's plan and current counts, returns `{ allowed: boolean, reason?: string }`.
  - Used server-side in all relevant Server Actions before mutating data.

- [x] 3B.3.4 — `usePlanStore()` Zustand store in `packages/stores/src/plan.ts`:
  - Subscribes to Supabase Realtime on `subscriptions` and `token_balances` rows for the current user.
  - Exposes `{ plan: PlanId, limits: PlanLimits, tokenBalance: number }`.
  - Refreshes automatically when the Stripe webhook updates either table — no page reload needed.

- [x] 3B.3.5 — Locked-feature UI pattern (shared component `packages/ui/src/LockedFeature.tsx`):
  - Renders a 🔒 icon with muted text and a tooltip: _"Upgrade to Pro"_ linking to `mooch.me/pricing`.
  - **Never** use a red ❌. The locked state should feel like an invitation, not a rejection.

---

### 3B.4 — Corruption Token Action Enforcement

- [x] 3B.4.1 — `packages/db/src/queries/tokens.ts` — shared `spendTokens(userId, action, cost)` server utility:
  1. Fetches `token_balances.balance` — throws `INSUFFICIENT_TOKENS` if `balance < cost`.
  2. Atomically decrements `balance` by `cost` (use a Postgres function or `update ... where balance >= cost` to avoid race conditions).
  3. Inserts `token_transactions` row: `{ type: 'usage', amount: -cost, action }`.
  4. Returns `{ ok: true, remainingBalance: number }`.

- [x] 3B.4.2 — Action slugs and costs (enforce in the `spendTokens` call site):

  | Slug          | Display Name   | Cost |
  | ------------- | -------------- | ---- |
  | `double_down` | Double Down 🎰 | 1    |
  | `the_leak`    | The Leak 🕵️    | 1    |
  | `the_coup`    | The Coup 👑    | 3    |
  | `ghost_vote`  | Ghost Vote 👻  | 1    |
  | `the_veto`    | The Veto ☠️    | 2    |
  | `hail_mary`   | Hail Mary 🙏   | 1    |

- [ ] 3B.4.3 — After a successful `spendTokens`, emit a Squad Feed event with `{ actorId, action, groupId }`. All corruption actions are public by design — users see who did what in the feed.

---

### 3B.5 — In-App Billing Page

- [x] 3B.5.1 — `apps/app/src/app/(shell)/billing/page.tsx` (Server Component — fetches plan server-side):
  - Current plan badge, billing cycle, and period end date (`current_period_end`).
  - If `status = 'past_due'`: show a payment failed banner with a "Update payment method" CTA → `createPortalSession`.
  - Upgrade / downgrade CTA buttons that call `createCheckoutSession` as a Server Action.
  - Token balance widget showing current balance + monthly grant for their plan.
  - Token pack cards (Starter / Popular / Power) — Popular highlighted with ⭐ Best value badge. Each calls `createTokenPurchaseSession`.
  - "Manage subscription" button → `createPortalSession` (cancel, update card, download invoices).

- [x] 3B.5.2 — `apps/app/src/app/(shell)/billing/success/page.tsx`: post-checkout landing page. Reads `?session_id=` from URL, shows a confirmation message. Webhook handles the actual DB update asynchronously — the UI should not rely on session data for plan state.

- [x] 3B.5.3 — Add billing link to the app sidebar navigation and user profile page.

---

### Phase 3B Testing Checklist

- [x] 3B-T1 — New user sign-up auto-creates `subscriptions` (plan = `free`) and `token_balances` (balance = 2) rows via DB trigger.
- [x] 3B-T2 — `createCheckoutSession('pro', 'monthly')` redirects to Stripe Checkout (test mode). Completing checkout fires webhook → `subscriptions.plan_id` = `pro`, `status` = `active`.
- [x] 3B-T3 — Webhook signature verification rejects requests with invalid `stripe-signature`; returns 400.
- [x] 3B-T4 — `usePlan()` reflects plan upgrade in real-time via Supabase Realtime — no page reload needed.
- [x] 3B-T5 — Free user hitting `canPerformAction('create_group')` after owning 1 group returns `{ allowed: false, reason: 'LIMIT_EXCEEDED' }`.
- [x] 3B-T6 — Token purchase (Popular pack, test mode): Stripe payment succeeds → webhook → `token_balances.balance` += 3, `token_transactions` row inserted (type `purchase`).
- [x] 3B-T7 — `spendTokens` with insufficient balance throws `INSUFFICIENT_TOKENS` and does not mutate the DB.
- [x] 3B-T8 — `spendTokens` with sufficient balance atomically decrements balance and inserts usage transaction.
- [x] 3B-T9 — Monthly grant cron increments each user's balance by their plan grant; `monthly_grant` transaction row created; prior balance preserved.
- [x] 3B-T10 — Cancellation via Stripe Portal → `customer.subscription.deleted` webhook → `plan_id` = `free`, data intact.
- [x] 3B-T11 — `invoice.payment_failed` webhook sets `subscriptions.status = 'past_due'`; billing page shows the payment failed banner.
- [x] 3B-T12 — Duplicate customer guard: calling `createOrRetrieveCustomer` twice with the same email returns the same Stripe customer ID.
- [x] 3B-T13 — Locked-feature UI shows 🔒 badge with upgrade tooltip; no ❌ icons anywhere.
- [ ] 3B-T14 — Pricing page: correct layout on desktop (Pro elevated) and mobile (stacked, Pro first). Annual toggle updates prices with smooth animation.
- [x] 3B-T15 — FAQ accordion animates open/close without layout shift. All Phase 3A motion standards met.
- [x] 3B-T16 — `bun run build` passes with zero TypeScript errors.

---

**Phase 3B Status: 🟢 — APPROVED (2026-03-16)**

---

---

# Phase 4: Voting & Polls

**Goal:** Create polls with single or multi-choice voting, anonymous option, live animated results, auto-close, and Corruption Token actions that let users bend the rules — double their vote, leak anonymous results, ghost-vote invisibly, veto someone else, or block debtors from voting.

**Status:** 🔄 — _In progress._

---

### 4.1 — Database Migrations: Polls

- [x] 4.1.1 — Create `supabase/migrations/0011_polls.sql`:

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
    id uuid primary key default gen_random_uuid(),
    poll_id uuid references public.polls(id) on delete cascade not null,
    option_id uuid references public.poll_options(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    weight int not null default 1,           -- 1 = normal, 2 = Double Down
    is_ghost boolean not null default false,  -- true = Ghost Vote (never revealed)
    is_vetoed boolean not null default false,  -- true = vetoed by another user
    vetoed_by uuid references public.profiles(id),
    created_at timestamptz not null default now(),
    unique (poll_id, option_id, user_id)      -- one vote per option per user
  );

  -- Tracks corruption token actions used on polls
  create table public.poll_token_actions (
    id uuid primary key default gen_random_uuid(),
    poll_id uuid references public.polls(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    action text not null check (action in (
      'double_down', 'the_leak', 'the_coup', 'ghost_vote', 'the_veto', 'hail_mary'
    )),
    target_user_id uuid references public.profiles(id),  -- for the_veto: whose vote was cancelled
    metadata jsonb,                                        -- extra context (e.g. leaked results snapshot)
    created_at timestamptz not null default now()
  );

  alter table public.polls enable row level security;
  alter table public.poll_options enable row level security;
  alter table public.poll_votes enable row level security;
  alter table public.poll_token_actions enable row level security;

  create policy "Group members can manage polls"
    on public.polls for all using (public.is_group_member(group_id));

  create policy "Group members can view poll options"
    on public.poll_options for all
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

  create policy "Group members can view token actions"
    on public.poll_token_actions for all
    using (exists (
      select 1 from public.polls p
      where p.id = poll_id and public.is_group_member(p.group_id)
    ));
  ```

- [x] 4.1.2 — Add `Poll`, `PollOption`, `PollVote`, `PollTokenAction` types to `packages/types`.

---

### 4.2 — Poll Queries & Server Actions

- [x] 4.2.1 — `packages/db/src/queries/polls.ts`:
  - `getPolls(supabase, groupId)` — with option vote counts (respecting `weight`, excluding vetoed); active first, closed below
  - `getPollById(supabase, pollId)` — with options + weighted vote counts + voter profiles (if not anonymous; ghost votes excluded from voter list)
  - `getUserVotes(supabase, pollId, userId)` — which options user voted for
  - `getPollTokenActions(supabase, pollId)` — all corruption actions used on this poll (public by design)

- [x] 4.2.2 — `apps/app/src/app/actions/polls.ts` (Server Actions):
  - `createPoll(groupId, data)` — creates poll + options
  - `vote(pollId, optionIds)` — transaction: delete old votes (single-choice), insert new. Check `hail_mary` — if active on this poll, users with outstanding debt in the group cannot vote
  - `closePoll(pollId)` — creator/admin only
  - `deletePoll(pollId)` — creator/admin only

---

### 4.3 — Corruption Token Actions for Polls

All corruption actions call `spendTokens(userId, action, cost)` from 3B.4 before executing. On success, insert a `poll_token_actions` row and emit a Squad Feed event. **All corruption actions are public** — every group member sees who did what in the feed.

- [x] 4.3.1 — `apps/app/src/app/actions/poll-corruption.ts` (Server Actions):

  | Action | Cost | Server Action | Behavior |
  |--------|------|---------------|----------|
  | **Double Down** 🎰 | 1 | `doubleDown(pollId, optionId)` | Sets `weight = 2` on the user's vote for the specified option. In multi-choice polls, only one option can be doubled — the user picks which one. If they haven't voted yet, votes + doubles in one action. |
  | **The Leak** 🕵️ | 1 | `theLeak(pollId)` | Returns a snapshot of current anonymous poll results with voter identities revealed. Only works on anonymous polls. Stores the snapshot in `poll_token_actions.metadata` for audit. Other users see "X used The Leak" in the feed but don't get the leaked data. |
  | **The Coup** 👑 | 3 | `theCoup(pollId)` | Forcefully closes the poll immediately, locking in current results. Only usable on open polls. The poll is marked closed with a "Coup'd by X" badge. The poll creator gets a push notification. |
  | **Ghost Vote** 👻 | 1 | `ghostVote(pollId, optionIds)` | Casts the user's vote(s) with `is_ghost = true`. Ghost votes count toward totals but the voter is **never** revealed — not even after the poll closes or in non-anonymous polls. In multi-choice, all selected options are ghosted (plural). Cannot be combined with Double Down on the same poll. |
  | **The Veto** ☠️ | 2 | `theVeto(pollId, targetUserId)` | Cancels **all** of the target user's votes on this poll (sets `is_vetoed = true` on every vote row). Vetoed votes no longer count toward totals. The target sees "Your vote was vetoed by X" notification. If the target had a Double Down, both the vote and the double are cancelled. |
  | **Hail Mary** 🙏 | 1 | `hailMary(pollId)` | Activates "moochers can't vote" mode on this poll. Any group member who currently has an outstanding debt (owes money to anyone in the group, checked via global balances from Phase 3) is blocked from voting or has existing votes removed. Lasts for the remainder of the poll. Stored as a flag on `poll_token_actions`. |

- [x] 4.3.2 — Validation rules:
  - Each user can use each action **at most once per poll** (enforced via unique constraint on `poll_token_actions(poll_id, user_id, action)`).
  - Cannot use corruption actions on closed polls (except The Leak — can leak results of a closed anonymous poll retroactively).
  - Ghost Vote and Double Down are mutually exclusive on the same poll for the same user.
  - The Veto cannot target yourself.
  - Hail Mary: debt threshold is any positive balance owed (> $0). Check `getGlobalBalances` from Phase 3.

---

### 4.4 — Real-time Subscription

- [x] 4.4.1 — Zustand store `packages/stores/src/polls.ts` with polls + votes state for the active group.
- [x] 4.4.2 — `PollsProvider` subscribing to Supabase Realtime on `poll_votes` and `poll_token_actions` for the active group's polls.
- [x] 4.4.3 — On vote change or corruption action, update live results without page reload.

---

### 4.5 — Polls UI

- [x] 4.5.1 — `apps/app/src/app/(shell)/[groupId]/polls/page.tsx`:
  - Active polls at top, closed polls below (grayed)
  - "Create Poll" button
  - Empty state: "No polls yet — start a vote!"

- [x] 4.5.2 — `apps/app/src/components/polls/PollCard.tsx`:
  - Question, creator + timestamp, status badge
  - Options as interactive tiles
  - Live results bar per option (animated fill, respects vote `weight`)
  - Winning option highlighted for closed polls
  - Anonymous badge, multi-choice badge
  - Non-anonymous: voter avatars (max 3 + overflow); ghost voters excluded
  - Corruption action badges: show icons for actions used on this poll (e.g. "🎰 doubled by X", "👑 coup'd by X", "🙏 moochers blocked")
  - If poll was coup'd: "Coup'd by X" badge replaces normal closed state

- [x] 4.5.3 — `apps/app/src/components/polls/PollOptionTile.tsx`:
  - Single-choice: radio behavior. Multi-choice: checkbox behavior.
  - Disabled if closed, or if user is blocked by Hail Mary
  - Your vote indicator (with 🎰 icon if doubled)
  - Vetoed votes shown with strikethrough + ☠️ icon
  - Optimistic update on click

- [x] 4.5.4 — LiveResultsBar integrated into `PollOptionTile.tsx`:
  - Motion `animate width` on percentage change
  - Smooth re-animation on new votes (Realtime)
  - Vote counts reflect `weight` (doubled votes count as 2)

- [x] 4.5.5 — `apps/app/src/components/polls/CreatePollModal.tsx`:
  - Question input, options list (min 2 / max 8), add/remove with AnimatePresence
  - Toggle pills with Lucide icons: Anonymous (EyeOff), Multi-choice (CheckSquare)
  - Custom DateTimePicker for optional auto-close
  - ~~Template chips removed~~ (premade templates were low-value)

- [x] 4.5.6 — `apps/app/src/components/polls/CorruptionActionsBar.tsx`:
  - Row of corruption action buttons below the poll card
  - Each button uses Lucide icons (Dices, Eye, EyeOff, Ban, UserX, Crown) + cost
  - Base UI Tooltip on hover shows action name + description
  - Disabled if: insufficient tokens, already used on this poll, poll closed (except Leak)
  - Confirmation dialog before spending tokens ("Spend 2 tokens to veto Lucas's vote?")
  - After use: button shows checkmark icon in "Used" state
  - The Leak: reveals voter identities inline below the bar
  - The Veto: opens a user picker to select target (TODO: full user picker UI)
  - Hail Mary: shows which users will be blocked before confirming

- [x] 4.5.7 — Auto-close Edge Function:
  - Create `supabase/functions/close-expired-polls/index.ts`
  - Runs on cron (every 5 minutes)
  - Sets `is_closed = true` on polls where `closes_at < now()`

---

### 4.6 — Verify & Test

- [ ] 4.6.1 — Create poll from template → options pre-filled.
- [ ] 4.6.2 — Single-choice: re-voting changes selection, can't vote for multiple.
- [ ] 4.6.3 — Multi-choice: can select multiple options.
- [ ] 4.6.4 — Anonymous poll: no voter names visible (except via The Leak).
- [ ] 4.6.5 — Live results update in real-time (vote on one tab → see update on other tab).
- [ ] 4.6.6 — Auto-close: manually invoke Edge Function → poll closes.
- [ ] 4.6.7 — Manual close by creator works.
- [ ] 4.6.8 — Results bars animate smoothly on vote change.

#### Corruption Token Tests

- [ ] 4.6.9 — **Double Down**: vote weight = 2 reflected in results bar. Multi-choice: only one option doubled.
- [ ] 4.6.10 — **The Leak**: anonymous poll → leaked snapshot shows voter identities. Non-anonymous poll → action rejected.
- [ ] 4.6.11 — **The Coup**: poll closes immediately. "Coup'd by X" badge visible. Creator notified.
- [ ] 4.6.12 — **Ghost Vote**: voter never revealed in any view (during or after poll). All options ghosted in multi-choice.
- [ ] 4.6.13 — **The Veto**: target's votes (including doubled) all cancelled. Target sees notification. Vote count updates in real-time.
- [ ] 4.6.14 — **Hail Mary**: users with outstanding debt blocked from voting. Existing debtor votes removed. Non-debtors unaffected.
- [ ] 4.6.15 — Each corruption action can only be used once per poll per user.
- [ ] 4.6.16 — Ghost Vote + Double Down mutually exclusive on same poll.
- [ ] 4.6.17 — Insufficient token balance → action rejected, no DB mutation.
- [ ] 4.6.18 — All corruption actions appear in Squad Feed with actor + action + poll.

---

**Phase 4 Testing Checklist (must all pass before APPROVED):**

- [ ] Create polls (template + custom)
- [ ] Single and multi-choice voting works
- [ ] Anonymous voting hides voter identities
- [ ] Live results update via Realtime
- [ ] Auto-close Edge Function closes polls correctly
- [ ] Option drag-to-reorder works in create modal
- [ ] Double Down doubles vote weight (single option only in multi-choice)
- [ ] The Leak reveals anonymous voters to the leaker only
- [ ] The Coup force-closes a poll immediately
- [ ] Ghost Vote hides voter identity permanently (all votes in multi-choice)
- [ ] The Veto cancels all of a target's votes (including doubled)
- [ ] Hail Mary blocks debtors from voting
- [ ] Token balance deducted correctly for each action
- [ ] Corruption actions visible in feed and on poll card
- [ ] `bun run build` passes with zero TypeScript errors

**Phase 4 Status: ⬜ — Awaiting approval**

---

---

# Phase 5: Plans Board (Kanban)

**Goal:** Drag-and-drop kanban board with 4 columns to move squad ideas into real plans and events.

**Status:** 🔄 — _In progress_

---

### 5.1 — Database Migrations: Plans

- [x] 5.1.1 — Create `supabase/migrations/0013_plans.sql` (renumbered from 0005 to avoid collision):

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

- [x] 5.1.2 — Add `Plan`, `PlanAttachment`, `PlanStatus` types to `packages/types`.

### 5.2 — Plan Queries & Server Actions

- [x] 5.2.1 — `packages/db/src/queries/plans.ts`:
  - `getPlans(supabase, groupId)` — all plans ordered by status + sort_order
  - `getPlanById(supabase, planId)` — with attachments + organizer profile
- [x] 5.2.2 — `apps/app/src/app/actions/plans.ts` (Server Actions):
  - `createPlan(groupId, data)`
  - `updatePlan(planId, data)`
  - `movePlan(planId, newStatus, newSortOrder)`
  - `reorderPlans(groupId, updates: {id, sort_order}[])` — batch update
  - `deletePlan(planId)` — creator/admin only
  - `addPlanAttachment(planId, type, url)`
  - `removePlanAttachment(attachmentId)`

### 5.3 — Kanban Board UI

- [x] 5.3.1 — `apps/app/src/app/(shell)/[groupId]/plans/page.tsx` — full kanban board.
- [x] 5.3.2 — `apps/app/src/components/plans/KanbanBoard.tsx`:
  - Responsive grid: 2-col on md, 4-col on xl
  - Columns: Ideas, To Plan, Upcoming, Completed (each with Lucide icon + color accent)
  - Empty state uses shared `EmptyState` component
- [x] 5.3.3 — `apps/app/src/components/plans/KanbanColumn.tsx`:
  - Vertically scrollable list with card count in header
  - Per-column color accent (icon tint, header border, drop zone highlight)
  - Empty column placeholder text (e.g. "No ideas yet", "All clear")
  - Drop zone with column-colored highlight on drag-over
  - "+" add button
  - Uses `@hello-pangea/dnd` for drag-drop
- [x] 5.3.4 — `apps/app/src/components/plans/PlanCard.tsx`:
  - Whole card is the drag handle (no separate grip icon)
  - Title, description preview (2 lines, truncated)
  - Footer: creator avatar + name + relative time (left), date badge + organizer avatar (right)
  - "Create event" badge on hover for upcoming cards (inline in footer, not absolute overlay)
  - Done cards: reduced opacity, muted gradient
  - Shadow stack matches Badge 3D design language
  - Tap → plan detail
- [x] 5.3.5 — Drag-drop logic:
  - On cross-column drop: `movePlan` action
  - On same-column reorder: `reorderPlans` action
  - Optimistic update: move in local state immediately, revert on error
- [x] 5.3.6 — `apps/app/src/components/plans/CreatePlanSheet.tsx`:
  - Title (required), description, DateTimePicker (shared with polls), status Select dropdown
  - Photo/voice attachments removed (not needed for plans)
- [x] 5.3.7 — `apps/app/src/components/plans/PlanDetailPanel.tsx`:
  - Full details in Sheet, status Select dropdown with optimistic updates
  - Edit/Delete actions use `Button variant="inline"` / `"inline-danger"`
  - Attachment viewer/player
  - "Create Event from Plan" → navigates to create event pre-filled

### 5.4 — Supabase Storage

- [x] 5.4.1 — Create `plan-attachments` bucket (authenticated uploads, max 10MB photos / 5MB audio).
- [x] 5.4.2 — Storage RLS: group members can upload to group folder and read from it.

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

**Phase 5 Status: 🔄 — UI polish in progress**

---

---

# Phase 6: Squad Feed & Media

**Goal:** A chronological, Instagram-like squad feed for photos, voice notes, and text posts with playful UI polish and instant reactions.

**Status:** ⬜ — _Blocked until Phase 5 is APPROVED_

---

### 6.1 — Database Migrations: Feed

- [x] 6.1.1 — Create `supabase/migrations/0013_feed.sql`:

  ```sql
  create type feed_item_type as enum ('photo', 'voice', 'text');

  create table public.feed_items (
    id uuid primary key default gen_random_uuid(),
    group_id uuid references public.groups(id) on delete cascade not null,
    type feed_item_type not null,
    media_path text,
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

- [x] 6.1.2 — Add `FeedItem`, `FeedReaction` types to `packages/types`.

### 6.2 — Feed Queries & Server Actions

- [x] 6.2.1 — `packages/db/src/queries/feed.ts`:
  - `getFeedItems(supabase, groupId, cursor?)` — paginated 20/page, desc by `created_at`, continuous stream (no day grouping), with creator profile + reaction counts + current user reaction
  - `getFeedItemById(supabase, itemId)` — full detail
  - `getSignedFeedMediaUrl(supabase, mediaPath)` — signed URL for private media rendering
- [x] 6.2.2 — `apps/app/src/app/actions/feed.ts` (Server Actions):
  - `addFeedItem(groupId, data)`
  - `deleteFeedItem(itemId)` — creator/admin only
  - `toggleReaction(itemId, emoji)` — upsert/delete (one reaction per user; switching replaces previous)
  - All actions apply optimistic local state first; realtime reconciles final truth

### 6.3 — Feed Media Storage (Initial Prototype)

- [x] 6.3.1 — Create **private** `feed-media` bucket (authenticated uploads, 10MB photo / 5MB voice limits) via `supabase/migrations/0014_feed_media_bucket.sql`.
- [x] 6.3.2 — Storage RLS: group members can upload + read.
- [x] 6.3.3 — `packages/db/src/storage/feed.ts`:
  - `uploadFeedPhoto(supabase, groupId, file)` — compress to 1080px max width (Canvas API) → upload → return storage path
  - `uploadFeedVoice(supabase, groupId, blob)` — upload audio blob → return storage path
  - `deleteFeedMedia(supabase, mediaPath)`

Note: this Supabase Storage bucket was a working prototype to unblock feed development. Supabase remains the backend for auth, DB, RLS, and feed metadata, but the long-term plan for large media objects is Cloudflare R2.

### 6.4 — Feed UI

- [x] 6.4.1 — `apps/app/src/app/(shell)/[groupId]/feed/page.tsx`:
  - Single-column continuous stream (Instagram-like), infinite scroll (intersection observer), **no day separators**
  - **No stories strip in v1**
  - Docked quick composer bar (Text / Photo / Voice) that stays accessible while scrolling
  - Medium-playful visual direction (homepage spirit through card/composer styling and motion), with **no decorative sticker/background layer in v1**
  - Empty state copy uses edgy homepage tone
- [x] 6.4.2 — `apps/app/src/components/feed/FeedItemCard.tsx`:
  - Header: avatar, name, relative timestamp
  - Comfortable (not compact) card density and spacing
  - **Photo:** full-width image + caption. Tap → lightbox.
  - **Voice:** waveform/progress + play/pause + duration. Caption below.
  - **Text:** styled text content (max 500 chars), media-first hierarchy preserved overall
  - Context badge (expense / poll link in v1; event deferred to Phase 7)
  - Footer: `ReactionBar`
  - Delete button (own items only, confirm)
- [x] 6.4.3 — `apps/app/src/components/feed/ReactionBar.tsx`:
  - Emoji chips with counts ("❤️ 3 🔥 2")
  - Tap to toggle your reaction (one reaction per user per item)
  - "+" opens preset picker: ❤️ 😂 🔥 😮 👏 💀
  - Scale bounce animation (Motion) on tap + optimistic count updates
  - Real-time: subscribe to `feed_reactions` changes via Realtime for reconciliation
- [x] 6.4.4 — `apps/app/src/components/feed/PostPhotoSheet.tsx`:
  - File input (camera on mobile, gallery on desktop)
  - Client-side preview + compression (Canvas API)
  - Caption textarea (optional, max 200 chars)
  - Optional link to expense/poll (event deferred to Phase 7)
  - "Post" → compress → upload → `addFeedItem`
- [x] 6.4.5 — `apps/app/src/components/feed/RecordVoiceSheet.tsx`:
  - Start/stop recording via `MediaRecorder` API
  - Live audio level bar animation
  - Max 60 seconds
  - Post-record playback preview
  - Caption textarea
  - Optional link to expense/poll (event deferred to Phase 7)
  - "Post" → upload → `addFeedItem`
- [x] 6.4.6 — `apps/app/src/components/feed/ImageLightbox.tsx`:
  - Full-screen overlay, close on Escape or backdrop click
  - Arrow navigation between consecutive photos in feed
  - Pinch-to-zoom on mobile (touch events)

### 6.5 — Post Editing

- [x] 6.5.1 — Migration: add `edited_at` (timestamptz, nullable) column to `feed_items`.
- [x] 6.5.2 — Server action `editFeedItem(itemId, { caption })`:
  - Only the creator can edit
  - Text posts: full caption edit (1-500 chars)
  - Photo/voice posts: caption-only edit (0-200 chars)
  - Sets `edited_at = now()` on every edit
  - Returns updated item
- [x] 6.5.3 — `FeedItemCard`: show "(edited)" label next to timestamp when `edited_at` is set.
- [x] 6.5.4 — Edit UI: inline edit mode on `FeedItemCard` — tap edit icon → textarea replaces caption → save/cancel buttons. No sheet/modal.
- [x] 6.5.5 — Optimistic edit: update caption locally, revert on server error.

### 6.6 — Reply Threads

- [x] 6.6.1 — Migration: create `feed_replies` table:
  - `id` (UUID PK), `feed_item_id` (FK → feed_items ON DELETE CASCADE), `user_id` (FK → profiles), `content` (text, max 500 chars), `created_at` (timestamptz)
  - RLS: group members can SELECT/INSERT/DELETE (own replies only for delete)
- [x] 6.6.2 — Types: add `FeedReply` to `packages/types`.
- [x] 6.6.3 — Queries: `getReplies(supabase, feedItemId)` — returns replies with creator profile, ordered by `created_at` asc. Also `getReplyCount` and `getReplyCounts` for batch counts.
- [x] 6.6.4 — Server actions: `addReply(feedItemId, content)`, `deleteReply(replyId)`.
- [x] 6.6.5 — `FeedItemCard`: show reply count badge. Tap to expand inline reply thread below the card.
- [x] 6.6.6 — Reply input: compact text input at bottom of expanded thread, with send button.
- [x] 6.6.7 — Realtime: subscribe to `feed_replies` inserts/deletes for visible threads.
- [x] 6.6.8 — Optimistic replies: instant local insert, reconcile via realtime.

### 6.7 — Mentions

- [x] 6.7.1 — Mention detection: parse `@[Display Name](userId)` from caption/reply content at save time.
- [x] 6.7.2 — Migration: create `feed_mentions` table:
  - `id` (UUID PK), `feed_item_id` (FK → feed_items, nullable), `feed_reply_id` (FK → feed_replies, nullable), `mentioned_user_id` (FK → profiles), `created_at` (timestamptz)
  - CHECK: exactly one of `feed_item_id` or `feed_reply_id` must be non-null
  - RLS: group members can SELECT; insert handled by server action via admin client
- [x] 6.7.3 — Mention autocomplete: in text/caption/reply inputs, typing `@` opens a member dropdown filtered by typed characters. Keyboard navigation (arrows, Enter/Tab, Escape).
- [x] 6.7.4 — Mention rendering: `@Name` rendered as a styled inline pill/highlight in captions, text posts, and replies.
- [x] 6.7.5 — Server-side: extract mentions from content in `addFeedItem`, `editFeedItem`, `addReply` — upsert into `feed_mentions` via `syncMentions`.
- [x] 6.7.6 — (Notification hook: defer to Phase 9 — for now, just store mentions for future notification system.)

### 6.8 — Location Tags

- [x] 6.8.1 — Migration: add `location_name` (text, nullable, max 100 chars) and `location_coords` (point, nullable) to `feed_items`.
- [x] 6.8.2 — Update `addFeedItem` and `editFeedItem` to accept optional `location_name` and `location_coords`.
- [x] 6.8.3 — Update `FeedItem` type with new fields.
- [x] 6.8.4 — Composer UI: optional "Add location" button in all three composer sheets. Opens a text input for place name (free text, no geocoding API in v1).
- [x] 6.8.5 — `FeedItemCard`: show location pill below the header when `location_name` is set (MapPin icon + name).

### 6.9 — Cloudflare R2-Backed Feed Media

**Architecture note:** Supabase stays the primary backend for auth, Postgres, RLS, server actions, and feed item metadata. Cloudflare R2 is used only for storing blob media (photos, voice, and later videos). `feed_items.media_path` continues to store the object key/path; the app resolves that key to a signed R2 URL server-side.

- [x] 6.9.1 — Set up Cloudflare R2 bucket (`mooch-feed-media`) and generate S3-compatible API credentials.
- [x] 6.9.2 — Add server-only R2 env vars for local dev and deployment:
  - `R2_ACCOUNT_ID`
  - `R2_ACCESS_KEY_ID`
  - `R2_SECRET_ACCESS_KEY`
  - `R2_BUCKET_NAME`
  - Update `.env.example` / app env examples accordingly
- [x] 6.9.3 — Create `packages/db/src/storage/r2.ts`:
  - R2 client using `@aws-sdk/client-s3` with Cloudflare endpoint
  - `uploadToR2(key, body, contentType)` — PutObject
  - `getSignedR2Url(key, expiresIn)` — GetObject presigned URL
  - `deleteFromR2(key)` — DeleteObject
- [x] 6.9.4 — Move feed media uploads behind a server-controlled boundary:
  - Do **not** expose R2 credentials in the client
  - Either add a server action / route handler that uploads to R2, or a server-generated presigned upload URL flow
  - Keep the existing logical path structure (`{groupId}/photos/...`, `{groupId}/voice/...`)
- [x] 6.9.5 — Update feed media write/delete helpers so photo + voice uploads go to R2, while Supabase remains the authority for membership/authorization checks.
- [x] 6.9.6 — Update `getSignedFeedMediaUrl` to resolve `media_path` through R2 presigned URLs server-side.
- [x] 6.9.7 — Keep Supabase feed records unchanged apart from storing the R2 object key in `media_path`.
- [x] 6.9.8 — Decide the treatment of the existing `feed-media` Supabase bucket prototype:
  - Preferred: keep it temporarily for existing/dev objects while new uploads go to R2
  - Add an explicit follow-up if a full backfill or cleanup is later desired
- [x] 6.9.9 — Do **not** add object auto-expiry unless product explicitly wants disappearing media. Default behavior: feed media persists.
- [ ] 6.9.10 — Verify end-to-end:
  - [x] Photo upload stores object in R2 and item in Supabase
  - [x] Voice upload stores object in R2 and item in Supabase
  - [x] Signed read URLs render correctly in feed
  - [x] Delete post removes the object from R2
  - Non-members still cannot create/read feed items because authorization remains enforced through Supabase-backed server logic

### 6.10 — Verify & Test

- [x] 6.10.1 — Post photo (file picker) → appears in feed.
- [ ] 6.10.2 — Image compressed before upload (verify size < original).
- [x] 6.10.3 — Record voice note → preview works before posting.
- [x] 6.10.4 — Post voice note → play button + duration shown in feed.
- [ ] 6.10.5 — Post text → appears in feed.
- [ ] 6.10.6 — Add reaction → updates in real-time on other tab.
- [ ] 6.10.7 — Remove reaction → count decreases.
- [x] 6.10.8 — Delete own item → removed. Cannot delete others'.
- [ ] 6.10.9 — Infinite scroll loads next page at bottom.
- [ ] 6.10.10 — Feed stays a continuous stream (no stories strip, no day separators).
- [ ] 6.10.11 — Reactions and post/delete actions feel instant (optimistic), then reconcile via realtime without flicker.
- [ ] 6.10.12 — Private media access works only for group members via signed URLs.
- [ ] 6.10.13 — Edit text post → caption updates, "(edited)" shown.
- [ ] 6.10.14 — Edit photo/voice caption → updates correctly.
- [ ] 6.10.15 — Reply to a post → reply appears in thread, count increments.
- [ ] 6.10.16 — Delete own reply → removed. Cannot delete others'.
- [ ] 6.10.17 — Type `@` in text/caption/reply → member autocomplete appears.
- [ ] 6.10.18 — Mention renders as styled pill in feed.
- [ ] 6.10.19 — Add location to post → location pill shown on card.
- [ ] 6.10.20 — R2: photo upload → signed URL loads correctly.
- [ ] 6.10.21 — R2: voice upload → signed URL plays correctly.
- [ ] 6.10.22 — R2: delete media → object removed from bucket.

---

**Phase 6 Testing Checklist (must all pass before APPROVED):**

- [ ] Photo, voice, and text post all work
- [ ] Voice recording works via MediaRecorder API
- [ ] Client-side image compression works
- [ ] Reactions work in real-time
- [ ] Post/delete/reaction flows are optimistic and reconcile cleanly via realtime
- [ ] Infinite scroll pagination works
- [ ] Delete: own items only
- [ ] No stories strip in v1 and continuous stream layout is preserved
- [ ] Edit: text posts fully editable, photo/voice caption-only
- [ ] Edit: "(edited)" label shown after edit
- [ ] Replies: add/delete/realtime sync
- [ ] Mentions: autocomplete, styled rendering, stored in DB
- [ ] Location: optional free-text tag, shown on card
- [ ] R2: all media uploads/reads/deletes go through Cloudflare R2
- [ ] R2: signed URLs work for private media access

**Phase 6 Status: ⬜ — Awaiting approval**

---

---

# Phase 7: Events & Attendance

**Goal:** Create events from polls/plans or manually, RSVP system, post-event attendance confirmation.

**Status:** ⬜ — _Blocked until Phase 6 is APPROVED_

---

### 7.1 — Database Migrations: Events

- [ ] 7.1.1 — Create `supabase/migrations/0015_events.sql`:

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

- [ ] 7.3.1 — `apps/app/src/app/(shell)/[groupId]/events/page.tsx`:
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
- [ ] 7.3.4 — `apps/app/src/app/(shell)/[groupId]/events/[eventId]/page.tsx`:
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

- [ ] 8.4.1 — `apps/app/src/app/(shell)/[groupId]/insights/page.tsx`:
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

### 9.6 — Receipt OCR Auto-fill

- [ ] 9.6.1 — On `AddExpenseModal`, add an optional "Scan Receipt" button that opens a file/camera picker.
- [ ] 9.6.2 — Run OCR client-side (Tesseract.js) or via a cloud vision API on the uploaded image.
- [ ] 9.6.3 — Extract total amount and merchant/description from receipt → pre-fill form fields. User confirms before submitting.
- [ ] 9.6.4 — Keep the existing receipt photo attachment (from Phase 3) as the stored proof — OCR is just a UX convenience layer on top.

### 9.7 — Marketing Site (apps/web)

- [ ] 9.6.1 — `apps/web/src/app/page.tsx` home page:
  - Hero: tagline + CTA → `app.mooch.me/signup`
  - Feature sections: Expenses, Polls, Plans, Feed, Events, Insights
  - Footer: Privacy, Terms, support email
- [ ] 9.6.2 — `/privacy` and `/terms` static pages.
- [ ] 9.6.3 — `/join/{code}` → redirect to `app.mooch.me/join/{code}`.
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
- [ ] 9.7.10 — Receipt OCR auto-fill works end to end (scan → pre-fill → confirm).

---

**Phase 9 Testing Checklist (must all pass before APPROVED):**

- [ ] EN/ES switch works across entire app
- [ ] All 6 empty states present
- [ ] Skeleton loaders work
- [ ] Dark mode works
- [ ] App works on 375px viewport
- [ ] Marketing site complete with Privacy + Terms pages
- [ ] All animations present and smooth
- [ ] Receipt OCR scan → pre-fill flow works

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

- [ ] 10.3.1 — Lighthouse: `apps/app` groups page → LCP < 2.5s, CLS < 0.1.
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
- [ ] 10.5.6 — Enable Realtime on required tables in production Supabase project.
- [ ] 10.5.7 — Set up weekly-digest cron schedule in production.

### 10.6 — Vercel Deployment

- [ ] 10.6.1 — Create Vercel project for `apps/app`:
  - Root: `apps/app`
  - All env vars set
  - Custom domain: `app.mooch.me`
- [ ] 10.6.2 — Create Vercel project for `apps/web`:
  - Root: `apps/web`
  - Custom domains: `mooch.me` + `www.mooch.me`
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

| Feature                      | Notes                                                                                                                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Squad Pro subscription       | Stripe or LemonSqueezy, feature gates                                                                                                                                                            |
| AI weekly recaps             | LLM-generated fun facts (Claude API)                                                                                                                                                             |
| Custom group themes          | Color palettes, profile cosmetics                                                                                                                                                                |
| PDF exports                  | Monthly expense reports, event summaries                                                                                                                                                         |
| PWA offline support          | Service Worker caching for offline viewing                                                                                                                                                       |
| Item-level receipt splitting | OCR extracts line items → each item assigned to specific members → generates per-person exact splits. E.g. alcohol buyers vs non-drinkers on the same receipt. Builds on Phase 9 OCR foundation. |

---

## Approval Log

| Phase                          | Status | Approved By | Date       | Notes                                                                                                         |
| ------------------------------ | ------ | ----------- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| Phase 0: Monorepo Foundation   | ⬜     | —           | —          | —                                                                                                             |
| Phase 1: Auth & Profiles       | ⬜     | —           | —          | —                                                                                                             |
| Phase 2: Groups System         | 🟢     | Tobias      | 2026-03-05 | All tests passed, RLS verified                                                                                |
| Phase 3: Expense Tracker       | ⬜     | —           | —          | —                                                                                                             |
| Phase 3A: Motion & Transitions | 🟢     | Tobias      | 2026-03-06 | Expense surfaces pilot approved; motion/layout transitions now required across remaining user-facing surfaces |
| Phase 3B: Monetization         | 🟢     | Tobias      | 2026-03-16 | 60/60 unit tests pass; pricing page (T14) deferred to Phase 9 (marketing site polish)                         |
| Phase 4: Voting & Polls        | ⬜     | —           | —          | —                                                                                                             |
| Phase 5: Plans Board           | ⬜     | —           | —          | —                                                                                                             |
| Phase 6: Squad Feed            | ⬜     | —           | —          | —                                                                                                             |
| Phase 7: Events                | ⬜     | —           | —          | —                                                                                                             |
| Phase 8: Insights              | ⬜     | —           | —          | —                                                                                                             |
| Phase 9: Polish & Marketing    | ⬜     | —           | —          | —                                                                                                             |
| Phase 10: Testing & Deploy     | ⬜     | —           | —          | —                                                                                                             |
