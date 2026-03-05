# Mistakes & Sessions

## Protocol

When a problem is encountered and fixed, log it here immediately:
- **Problem:** what went wrong and why
- **Fix:** what solved it
- **Avoid:** what not to do next time
- **Rule:** user-facing create/join/edit flows must reflect changes immediately in UI state (no manual reload dependency)

---

## Mistakes Log

### Silently edited plan checklist
- **Problem:** Marked 0.4.3 done while quietly removing "Install tailwindcss, motion" from the item text — a valid decision (keep shared deps at root) but made without flagging it.
- **Fix:** Called out when user noticed.
- **Avoid:** Never alter plan wording when marking items done. Add a note instead.

### AbortError "Lock broken by another request with the steal option"
- **Problem:** `@supabase/ssr`'s browser client uses the Web Locks API to prevent concurrent session access. Cookie changes (triggered by auth flows) cause the client to call `initialize()` with `steal: true`, which kills any in-progress lock — including `updateUser`. The call fails before making a network request, with no visible error.
- **Fix:** Run auth mutation operations (`updateUser`, `signOut`, etc.) as **Server Actions** using the server Supabase client. Server-side code doesn't use Web Locks. For read operations, use the `globalThis.__supabase` singleton to avoid multiple client instantiations stealing each other's locks.
- **Avoid:** Never call `supabase.auth.updateUser()` or other write operations from the browser client in a Next.js/Turbopack app — use Server Actions instead.

---

### Auth callback routes blocked by middleware (redirect to /login)
- **Problem:** `/auth/reset-callback` (and any new auth route handler) was not in `PUBLIC_ROUTES`, so the middleware treated it as a protected route and redirected unauthenticated users to `/login` before the route handler could run.
- **Fix:** Added `/auth/reset-callback` to `PUBLIC_ROUTES` in middleware. All `/auth/*` route handlers must be in `PUBLIC_ROUTES`.
- **Avoid:** Any time a new `/auth/*` route handler is added, add it to `PUBLIC_ROUTES` in middleware immediately.

---

### Password reset link redirected to /login instead of /update-password
- **Problem:** `resetPasswordForEmail` with `redirectTo` containing query params (`?next=/update-password`) didn't match Supabase's redirect URL whitelist (exact base-URL match). Supabase fell back to `site_url`, landing the user on the root which redirected to `/login`.
- **Fix:** Changed email templates to bypass Supabase's redirect entirely — link directly to our app using `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/update-password`. Our `/auth/confirm` route handles `verifyOtp` with `token_hash`. No whitelist needed.
- **Avoid:** Never put query params in `redirectTo` for Supabase email flows — whitelist matching is base-URL only. For full control over the destination, build the link directly in the email template using `{{ .TokenHash }}` and `{{ .SiteURL }}`.

---

### `@mooch/db` barrel export pulled `next/headers` into client bundle
- **Problem:** `packages/db/src/index.ts` re-exported all three clients (`browser`, `server`, `middleware`). Client components importing `createBrowserClient` from `@mooch/db` caused the bundler to follow the barrel into `server.ts`, which imports `next/headers` — a server-only module.
- **Fix:** Stripped `index.ts` down to browser-only export. Added `exports` subpaths in `package.json` (`"./server"` and `"./middleware"`) for server-side callers. Updated middleware and route handlers to import from `@mooch/db/server` / `@mooch/db/middleware`.
- **Avoid:** Never barrel-export server-only modules (anything that imports `next/headers`, `next/server` internals, etc.) alongside browser modules. Use subpath exports to enforce the boundary.

---

### Group modal layout only side-by-side on `sm+`
- **Problem:** Implemented icon/name side-by-side with `sm:grid-cols...`, so on mobile it still stacked even after explicit request for side-by-side.
- **Fix:** Changed to always-on two-column grid (`grid-cols-[auto,minmax(0,1fr)]`) for icon + name and `grid-cols-2` for currency/language.
- **Avoid:** When user asks for fixed layout behavior, avoid responsive qualifiers unless explicitly requested.

---

### Cover upload path relied on brittle client-side storage flow
- **Problem:** Initial create/settings cover uploads were done from browser client directly, exposing "bucket not found" and inconsistent behavior across environments.
- **Fix:** Added server action `uploadGroupCover`, bucket ensure/create guard, and server-side upload with admin client. Both create and settings now use this shared server upload path.
- **Avoid:** For critical writes (storage/object creation), prefer server-side actions with explicit validation and setup checks, not ad-hoc client uploads.

---

### Upload UX duplicated controls after file selection
- **Problem:** `AssetUpload` kept the dropzone visible even after a file was already selected, creating redundant UI and clutter.
- **Fix:** Hide dropzone once a file is selected; show preview + compact row with `Change` and `Remove`.
- **Avoid:** Don’t show mutually redundant controls in the same state. Design component states explicitly (`empty`, `selected`, `error`).

---

### Group banner file-size policy started too high
- **Problem:** Set limit to 5 MB, which is too permissive for this use case and against product preference.
- **Fix:** Enforced 1 MB across UI, server validation, storage bucket creation limit, and user-facing error copy. Reduced server action body limit to 2 MB headroom.
- **Avoid:** Confirm product constraints first, then enforce them consistently at every layer (client hints, server checks, storage policy).

---

### Groups list read path hid failures and appeared stale
- **Problem:** Groups page depended on RLS-sensitive reads and DB helpers that return `[]` on error, so failures looked like "no groups" even when rows existed in DB.
- **Fix:** Switched groups page to forced-dynamic render and server-side admin-scoped queries by authenticated user membership, then computed counts from the same source.
- **Avoid:** Never swallow data-read errors as empty state in critical screens; surface/handle explicitly, and avoid fragile read paths when consistency is required.

---

### New group/join state required refresh to appear in UI
- **Problem:** After creating or joining a group, UI relied on navigation refresh timing and server refetch; group chips/list were not updated immediately in client state, so users had to reload to see the new group.
- **Fix:** Returned full group payload from server actions, upserted it into `useGroupStore` immediately (`addGroup` + `setActiveGroup`), and added `revalidatePath` for server consistency fallback.
- **Avoid:** For any mutation, ship both:
  1. Immediate client-state update (optimistic or confirmed payload apply)
  2. Server cache/path revalidation as a backup sync
  Before merge, explicitly validate against Next.js data patterns from `next-best-practices` / `nextjs15-performance` skills to avoid refresh-dependent UX.

---

### Wrong lint path when running from app subdirectory
- **Problem:** Ran Biome with repo-relative path while already in `apps/app`, causing a false "no files processed" failure.
- **Fix:** Re-ran with subdir-relative path and completed lint/typecheck successfully.
- **Avoid:** Match lint/typecheck target paths to current working directory.

---

## Sessions

| Date | Summary | Problems |
|------|---------|----------|
| 2026-03-04 | Phase 0 complete — bun workspaces, turbo, both Next.js apps, shared packages (db/types/ui/stores), Supabase local dev, Biome lint clean. Renamed project from squad-sync → mooch throughout. | Docker not running initially (started mid-session). Turbo missing `packageManager` field. Lockfile stale after rename — deleted and regenerated. |
| 2026-03-04 | Phase 1 (1.4–1.9) complete — middleware, auth route handlers, login/signup/forgot-password/update-password pages, profile queries, shell layout, profile page with avatar upload, Zustand auth store. | @mooch/db barrel export pulled next/headers into client bundle (fixed with subpath exports). Password reset flow broken by middleware missing /auth/reset-callback in PUBLIC_ROUTES + /update-password in AUTH_ROUTES blocking authenticated users. Web Lock AbortError on updateUser fixed by moving to a Server Action. |
| 2026-03-05 | UI component library sprint — built design system primitives in `packages/ui`: Button (primary/secondary/ghost/danger, loading state, TextMorph preview), Container (site/app variants), Modal (Base UI Dialog, slide-up mobile / fade-scale desktop, no backdrop blur), ConfirmDialog (shakes on dismiss attempt via pointer/escape interception), Sheet (swipe-to-dismiss with velocity detection + receipt variant with CSS scalloped edges), Avatar (gradient border, gloss inner shadow, deterministic color palette, Base UI tooltip), Tooltip (warm glass surface). Added `TooltipProvider` to root layout. `/design` route previews all components. | Tailwind v4 silently drops classes from packages/ui without `@source` directive — fixed by adding `@source` to globals.css and moving size classes to plain CSS. `onPointerMove` fires on hover (not just drag) — fixed with `dragging` ref guard. `Tooltip.Trigger` render prop swallows Base UI event handlers unless component uses `forwardRef` and spreads `...htmlProps`. Broken image DNS timeout shows browser broken-image placeholder before `onError` fires — fixed by using a local 404 path. |
| 2026-03-05 | Phase 2.4 groups implementation/cleanup — create/join modals, group pages/settings, lucide icon support, invite/deeplink paths, upload primitive, and server-side group actions hardening. | Multiple regressions fixed during iteration: side-by-side layout initially only on `sm+`; group cover upload started client-side and was brittle (`bucket not found`); upload UX duplicated controls after selection; banner size policy initially too high (5MB) and was tightened to 1MB; groups list rendered empty despite DB rows due to fragile read path and silent empty-on-error behavior, fixed with dynamic + admin-scoped membership queries; create/join initially required refresh to reflect in UI, fixed by immediate store upsert + revalidation. |
