# Mistakes & Sessions

## Protocol

When a problem is encountered and fixed, log it here immediately:
- **Problem:** what went wrong and why
- **Fix:** what solved it
- **Avoid:** what not to do next time
- **Rule:** user-facing create/join/edit flows must reflect changes immediately in UI state (no manual reload dependency)
- **Rule:** All vote/toggle/like interactions must be **optimistic** — update client state instantly, fire the server action in the background, revert only on error. The user should never wait for a network round-trip to see their action reflected. Realtime will reconcile the final truth.

## Active Memory

- **2026-03-06 Decision Lock:** Phase 3A (Motion & Transitions) is approved.
- **Mandatory Standard:** Reuse the shared motion system (`motion.ts`, transition provider/slot/link patterns, reduced-motion behavior) across all remaining user-facing surfaces.
- **Immediate Next Task:** Close pending Phase 3 manual verification checklist items, then request Phase 3 approval before starting full Phase 4 implementation.
- **Icon Standard:** Always use Lucide icons in the app UI — never emojis. Users can type emojis in their own content (poll options, messages), but any chrome/UI element must use Lucide icons.
- **Hard User Preference (2026-03-17):** Do not introduce emojis in UI/chrome/decorative copy/options. Use Lucide icons or plain text only.
- **React Rule (2026-03-17):** Do not import `useEffect` directly in feature code. Prefer derived state, event handlers, query/data libraries, or `useMountEffect` for mount-only external sync.
- **Realtime/Polling Rule (2026-03-18):** Keep realtime subscriptions as primary sync. Polling remains a fallback only when needed (offline/reconnect/visibility wakeups/open timed polls), never unconditional background churn.
- **2026-03-17 Feed Direction Lock (Phase 6):** Instagram-like single-column continuous stream, medium playful tone, docked quick composer, no stories strip v1, no decorative sticker/background layer v1, one reaction per user/item, expense+poll linking in v1 (event linking deferred), private media via signed URLs, optimistic+realtime behavior.
- **Empty State Standard (2026-03-18):** Shared `EmptyState` component is the default pattern. Emoji empty states keep `text-5xl`; image/icon empty states use `size-48` (`192px`) with no blend-mode/background hacks unless explicitly requested.
- **Prefetch Standard (2026-03-18):** Any scrollable card/list-item that navigates on click must use the `usePrefetch` hook (`apps/app/src/hooks/usePrefetch.ts`). Attach the returned ref to the element. This ensures RSC payloads are cached before the user taps, especially important with `TransitionLink` which navigates via `router.push`.

---

## Deferred Cleanup Queue

### Low-priority `useEffect` follow-ups (2026-03-18)
- `apps/app/src/components/feed/PostTextSheet.tsx` — replace open-reset effect with keyed remount pattern at caller level (same approach used for expense/tab modals).
- `apps/app/src/components/feed/PostPhotoSheet.tsx` — same as above; keep object URL cleanup behavior intact while moving reset lifecycle to remount boundaries.
- `apps/app/src/components/feed/FeedListClient.tsx` — `itemsRef.current = items` can be assigned during render instead of effect to reduce lifecycle bookkeeping.
- `apps/app/src/components/groups/GroupsPageClient.tsx` — remove mount-only animation flag effect (`animateStatsIn`) by deriving animation state from motion primitives or initial props.
- `apps/app/src/components/polls/PollListClient.tsx` — `revealedGroups.add(groupId)` can be moved out of effect into safer render-time memoized gate if entrance behavior remains equivalent.
- `apps/app/src/components/expenses/ExpenseList.tsx` — same pattern as PollListClient for `revealedTabs`.
- `apps/app/src/components/polls/corruptionIconPack.tsx` — source reset effect in `CorruptionIconImage` can be refactored to key-based remount by `file` to avoid prop-sync effect choreography.
- `apps/web/src/hooks/usePointerUniform.ts` — initial-value sync effect can be folded into hook initialization/update strategy (low risk; web-only).
- `apps/app/src/app/design/TextMorphDemo.tsx` — demo-only intervals are fine functionally, but can be migrated to shared timer utility if this surface becomes production-facing.

---

## Mistakes Log

### webm blobs lack duration metadata — always provide a fallback
- **Problem:** `audio.duration` returns `NaN` or `Infinity` for webm blobs recorded via `MediaRecorder`. Code guarded with `if (audio.duration && Number.isFinite(audio.duration))` silently skipped all progress updates, making the playback timer and seek bar appear frozen.
- **Fix:** Capture duration from the recording timer (`elapsedRef.current`) and use it as fallback whenever `audio.duration` is not finite. Apply the same fallback in seek logic.
- **Avoid:** Never rely solely on `audio.duration` for MediaRecorder output. Always capture elapsed time during recording and use it as the authoritative duration for playback UI.

---

### Reading refs during render for display values produces stale UI
- **Problem:** Playback timer displayed `audioElRef.current.currentTime` when `playing` was true. Ref mutations don't trigger React re-renders, so the timer appeared frozen even though the rAF loop was running and updating `playProgress` state.
- **Fix:** Use `playProgress` (state, updated every frame via rAF) as the single source of truth for both the timer text and the peak bar coloring. Never read a ref for a value that needs to appear in rendered output.
- **Avoid:** For any value that must be visible in the UI, store it in state, not a ref. Refs are for imperative handles and values that don't affect rendering.

---

### `btn-primary` box-shadow extends beyond element bounds — decorative overlays must account for it
- **Problem:** A pulsing ring animation used `absolute inset-0` on a `btn-primary` button. The button's thick `box-shadow` (3D edge effect) extends beyond the element's CSS box, so the ring appeared to start inside the visible button edge, looking off-center.
- **Fix:** Replaced the border-based ring with a blurred background glow (`blur-xl` blob behind the button with soft scale+opacity animation). No border means no alignment issues with the shadow.
- **Avoid:** When adding decorative overlays to elements with heavy box-shadows, test visually — `inset-0` won't align with the perceived edge. Prefer ambient effects (blurs, glows) over geometric overlays (borders, rings) on 3D-styled buttons.

---

### Timeout on hydration step reverted successfully persisted posts
- **Problem:** `createItem` wrapped both the `addFeedItem` server action (persist) and the subsequent `fetchHydratedItemById` + `getSignedFeedMediaUrl` (hydration) in one try/catch. If `addFeedItem` succeeded but hydration timed out, the catch block removed the optimistic item from the feed and showed "Could not finish posting" — even though the post was already saved in the DB. Users saw an error, refreshed, and found their post was actually there.
- **Fix:** Split `createItem` into two phases: persist (revert optimistic item on failure) and hydrate (leave optimistic item in place on failure, let realtime reconcile). Return `true` from both success paths since the post exists either way.
- **Avoid:** When an optimistic flow has multiple steps and only the first is destructive/critical, don't lump all steps into one error handler. Only revert on actual data loss — if the data is persisted, let eventual consistency fill in the UI details.

---

### `useEffect` usage drift created avoidable sync and load risks
- **Problem:** A targeted audit found three risk patterns: (1) unconditional 30s poll refetch loops despite realtime being active, (2) feed list prop re-sync replacing local state and potentially clobbering optimistic/realtime updates, and (3) modal open-reset effects that relied on dependency choreography instead of lifecycle boundaries.
- **Fix:** Reworked poll refreshing to a guarded fallback strategy (realtime-first, refresh on visibility/online, timer only when needed), changed feed server snapshot handling to merge-with-local instead of replace, and replaced modal open-reset effects with keyed remount behavior at callsites (`AddExpenseModal`, `CreateTabModal`).
- **Avoid:** Treat `useEffect` as external-sync only. For local UI lifecycle/reset behavior prefer keyed remounts. For server sync prefer realtime-first + explicit fallback paths, not perpetual polling.

---

### Reintroduced emojis in feed UI after icon standard was already documented
- **Problem:** Added emoji icons in feed link dropdown options and decorative empty-state copy despite having a documented "Lucide icons, never emojis in UI chrome" rule.
- **Fix:** Removed emoji option icons from feed select inputs, replaced decorative empty-state emoji with Lucide icon, and reinforced the preference as a hard user rule in Active Memory.
- **Avoid:** Never add emoji to UI chrome, labels, helper text, placeholders, or decorative states. If visual emphasis is needed, use Lucide icons.

---

### FAQ section shipped as a monolithic component
- **Problem:** The FAQ section was implemented as one large file mixing static data, animation math, drag physics, and UI rendering in a single component. This violated basic React composition boundaries and made iteration/debugging slower than necessary.
- **Fix:** Refactored FAQ into focused modules: `data.ts` (content/config/default state), `types.ts` (shared types), `FAQItem.tsx` (accordion card), `StickerLayer.tsx` (sticker drag/pose behavior), and a slim `index.tsx` orchestration component.
- **Avoid:** Keep section roots as composition/orchestration only. Move data/config and behavior-heavy subtrees into dedicated modules before layering animation details.

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

### Select dropdown popup width broken everywhere
- **Problem:** Base UI's `Select.Positioner` defaults to `alignItemWithTrigger={true}`, which uses a `position: fixed` layout mode and skips the Floating UI `size` middleware. The `size` middleware is what sets `--anchor-width` on the positioner element. Without it, `min-w-[var(--anchor-width)]` resolved to nothing, causing the popup to either stretch to full container width or shrink to content width depending on other CSS.
- **Fix:** Set `alignItemWithTrigger={false}` on the Positioner so it uses normal Floating UI positioning (which runs the `size` middleware and sets `--anchor-width`). Then use `style={{ width: 'var(--anchor-width)' }}` as an inline style to match the trigger width exactly.
- **Avoid:** When using Base UI's Select, always check whether `alignItemWithTrigger` (enabled by default) interferes with positioning middleware. Don't use Tailwind arbitrary values for CSS custom properties set by JS at runtime — use inline styles instead to avoid compilation/caching issues.

---

### Not using the `Container` component on page layouts
- **Problem:** Built all Phase 3.4 page sections with raw `<section className="mx-auto w-full max-w-5xl p-4 sm:p-6">` wrappers instead of the `Container` component from `packages/ui`. Also failed to update `GroupsPageClient` during the Phase 2 Text sweep — it was still using raw `<h1>` and `<p>`. User had to explicitly flag both issues.
- **Fix:** Replaced all raw section wrappers with `<Container as="section" className="py-4 sm:py-6">` + inner `<div className="col-span-6 sm:col-span-12 mx-auto w-full max-w-5xl space-y-6">` across GroupDetailClient, GroupSettingsClient, GroupsPageClient, ExpensesClient, and DashboardPage.
- **Avoid:** Every shell page section must use `Container` for layout. Before building any new page, check COMPONENTS.md — if `Container` is listed as ✅ and the page has a section wrapper, it should be using `Container`. Never use hardcoded `mx-auto max-w-*` as the outermost wrapper on a page.

---

### Phantom dependencies break Vercel deploy
- **Problem:** Multiple packages (`web-haptics`, `torph`, `@base-ui-components/react`, `motion`, `jsqr`, `lucide-react`) were imported in `packages/ui` and `apps/app` but never declared in their respective `package.json` files. Worked locally due to Bun workspace hoisting, but Vercel's stricter resolution couldn't find them — build failed with `Module not found: Can't resolve 'web-haptics/react'`.
- **Fix:** Added all missing dependencies explicitly to `packages/ui/package.json` and `apps/app/package.json`, ran `bun install` to update lockfile.
- **Avoid:** Every external import must be declared in the consuming package's `package.json` — never rely on root hoisting. Before deploying, check that all imports resolve without hoisting by reviewing each workspace's declared dependencies.

---

### Ignoring project memory when implementing features
- **Problem:** Memory had documented design decisions for receipt photo upload, currency selector, and custom category `IconPicker` in `AddExpenseModal`. These were built in a prior session's planning. None of them were included in the initial implementation of Phase 3.4.
- **Fix:** Added all three after user pointed them out.
- **Avoid:** Always read MEMORY.md and relevant memory topic files before implementing a feature. If the feature is in memory, the decisions there are final — implement them, don't omit them.

---

### Base UI Popover trigger mismatch in DateTimePicker
- **Problem:** The poll DateTimePicker trigger path was implemented as a non-native button (`render={<div role="button" .../>}` with `nativeButton={false}`), but runtime still threw Base UI's button-mode assertion in the app stack.
- **Fix:** Switched `Popover.Trigger` back to a real native `<button type="button">` render target and removed non-native override usage for this component.
- **Avoid:** For Base UI trigger components that default to native button behavior, prefer rendering an actual `<button>` unless there is a hard requirement otherwise. If customized via `render`, verify the final DOM tag matches `nativeButton` semantics.

---

### Drag affordance shipped without drag behavior
- **Problem:** Poll options showed reorder affordance, but only arrow buttons actually changed order; drag was not wired, which created a misleading interaction.
- **Fix:** Replaced arrow-based sorting with actual drag-and-drop reordering on semantic `ul/li` option rows, removed arrow controls, and kept a visible grip handle as the drag affordance.
- **Avoid:** Never show drag handles unless drag interaction is implemented and tested end-to-end.

---

### Duplicate validation produced noisy repeated errors
- **Problem:** Duplicate poll options rendered the same red message under every duplicated row, adding visual noise.
- **Fix:** Kept row-level red border highlighting but collapsed copy to a single section-level error label. Added contextual dimming so non-duplicate options fade when duplicates exist.
- **Avoid:** For list-level validation failures, prefer one clear section message plus targeted visual markers instead of repeating identical text per row.

---

### Shared Button icon + label alignment was not guaranteed
- **Problem:** Icon buttons could render with awkward icon/label stacking in some contexts because the shared `Button` content wrapper did not enforce a horizontal flex layout.
- **Fix:** Updated `packages/ui/src/components/Button.tsx` so the internal text/content wrapper is always `inline-flex items-center gap-2 whitespace-nowrap` with icon shrink guard.
- **Avoid:** For all compound controls (icon + label), enforce row layout in the shared component itself, not per-page overrides.

---

### Group settings icon/name mismatch was a control-size problem
- **Problem:** The icon picker control next to group name looked misaligned because its trigger dimensions did not match input field sizing; this was initially misread as a row alignment issue.
- **Fix:** Extended `IconPicker` with `size="lg"` and normalized it to input-like control geometry (`42x42`, `rounded-[14px]`), then used that size in group settings.
- **Avoid:** When icon pickers sit beside text inputs, match control tokens (height/radius/border treatment) before tweaking layout containers.

---

### Cover URL hide/show toggle added unnecessary friction
- **Problem:** Group settings introduced hide/show behavior for cover URL, adding extra clicks and visual noise despite the "show everything" UX direction.
- **Fix:** Removed toggle state + toggle action entirely and made the cover URL input always visible.
- **Avoid:** In desktop settings forms, default to visible optional fields unless there is a strong information-density reason to collapse.

---

### Members section had dead space and weak hierarchy
- **Problem:** Member rows looked empty and unfinished (large unused area, weak metadata hierarchy, awkward balance between identity and actions).
- **Fix:** Restyled `MemberRow` with clearer left/right structure (avatar + name + joined date, role badge always visible, actions grouped), and refined the section header/count presentation.
- **Avoid:** Don’t rely on generic `justify-between` rows when one side has low information density; design explicit content groups and rhythm.

---

### Empty-state icon styling drifted due iterative blend experiments
- **Problem:** Feed empty-state icon styling was changed repeatedly with blend-mode and wrapper/background tricks, causing visual regressions (visible white plate, overflow artifacts, wrong scale) and breaking parity with other empty states.
- **Fix:** Extracted shared `EmptyState` component and standardized behavior: emoji uses existing `text-5xl`, icon/image uses fixed `size-48` (`192px`), no blend-mode or special wrappers by default. Replaced matching feed/expenses/tabs/polls empty blocks with the shared component.
- **Avoid:** For shared UI patterns, componentize first and codify visual tokens before tweaking one-off styles. Do not add blend/overlay hacks to assets unless explicitly requested and visually verified.

---

## Sessions

| Date | Summary | Problems |
|------|---------|----------|
| 2026-03-04 | Phase 0 complete — bun workspaces, turbo, both Next.js apps, shared packages (db/types/ui/stores), Supabase local dev, Biome lint clean. Renamed project from squad-sync → mooch throughout. | Docker not running initially (started mid-session). Turbo missing `packageManager` field. Lockfile stale after rename — deleted and regenerated. |
| 2026-03-04 | Phase 1 (1.4–1.9) complete — middleware, auth route handlers, login/signup/forgot-password/update-password pages, profile queries, shell layout, profile page with avatar upload, Zustand auth store. | @mooch/db barrel export pulled next/headers into client bundle (fixed with subpath exports). Password reset flow broken by middleware missing /auth/reset-callback in PUBLIC_ROUTES + /update-password in AUTH_ROUTES blocking authenticated users. Web Lock AbortError on updateUser fixed by moving to a Server Action. |
| 2026-03-05 | UI component library sprint — built design system primitives in `packages/ui`: Button (primary/secondary/ghost/danger, loading state, TextMorph preview), Container (site/app variants), Modal (Base UI Dialog, slide-up mobile / fade-scale desktop, no backdrop blur), ConfirmDialog (shakes on dismiss attempt via pointer/escape interception), Sheet (swipe-to-dismiss with velocity detection + receipt variant with CSS scalloped edges), Avatar (gradient border, gloss inner shadow, deterministic color palette, Base UI tooltip), Tooltip (warm glass surface). Added `TooltipProvider` to root layout. `/design` route previews all components. | Tailwind v4 silently drops classes from packages/ui without `@source` directive — fixed by adding `@source` to globals.css and moving size classes to plain CSS. `onPointerMove` fires on hover (not just drag) — fixed with `dragging` ref guard. `Tooltip.Trigger` render prop swallows Base UI event handlers unless component uses `forwardRef` and spreads `...htmlProps`. Broken image DNS timeout shows browser broken-image placeholder before `onError` fires — fixed by using a local 404 path. |
| 2026-03-05 | Phase 2.4 groups implementation/cleanup — create/join modals, group pages/settings, lucide icon support, invite/deeplink paths, upload primitive, and server-side group actions hardening. | Multiple regressions fixed during iteration: side-by-side layout initially only on `sm+`; group cover upload started client-side and was brittle (`bucket not found`); upload UX duplicated controls after selection; banner size policy initially too high (5MB) and was tightened to 1MB; groups list rendered empty despite DB rows due to fragile read path and silent empty-on-error behavior, fixed with dynamic + admin-scoped membership queries; create/join initially required refresh to reflect in UI, fixed by immediate store upsert + revalidation. |
| 2026-03-05 | Shell layout & navigation overhaul — replaced `ShellTopNav` with `Sidebar` (desktop), `BottomTabBar` (mobile), `MobileTopBar` (mobile). Refactored `(shell)/layout.tsx` to fetch profile. Created root dashboard `(shell)/page.tsx`, canonical group overview `(shell)/[groupId]/page.tsx`, and 6 placeholder section pages (feed/expenses/polls/plans/events/insights). Removed `/` redirect from middleware. Deleted old `app/page.tsx`. Updated `GroupDetailClient` Overview tab to canonical `/${id}` route. All TypeScript checks pass. | Stale `.next/types/validator.ts` still referenced deleted `app/page.tsx` — fixed by deleting `.next` cache before typecheck. |
| 2026-03-05 | Phase 2 hardening + design system Text/Button sweep — Fixed group page 404 (RLS profiles blocked member join, fixed with `shares_group_with()` security definer migration). Redesigned tab nav with Framer Motion `layoutId` sliding indicator + ghost buttons + cogwheel settings icon with tooltip. Fixed settings href (`/groups/${id}/settings`), dialog z-index overlap (`isolate` on nav), sidebar active group sync (derive from `pathname` instead of store only), leave/delete group redirect (call `removeGroup` + `router.push("/")`). Added custom 404 page with dither plugin and Bibi image. Approved Phase 2. Created `Text` design system component (8 variants, 9 colors incl. `inherit`) and swept entire webapp to replace raw `h1/h2/p/span` typography. Updated `Button` to wrap children in `<Text as="span">` with size-aware variant mapping. | `profiles` RLS SELECT policy `auth.uid() = id` blocked cross-member profile join — fixed with security definer `shares_group_with()` to avoid RLS recursion. Tab nav `z-10` on items created global stacking context above dialog portals — fixed with `isolate`. `Tooltip.Trigger` render prop must wrap the target element (icon inside Link), not be a child. |
| 2026-03-06 | Phase 3.1–3.2: DB schema, types, queries, balance recalculation, and server actions for expenses. Created `supabase/migrations/0006_expenses.sql` (expenses, expense_participants, balances, settlement_payments + RLS + indexes). Added expense types to `packages/types`. Created `packages/db/src/queries/expenses.ts`. Created `apps/app/src/lib/recalculate-balances.ts` (greedy debt simplification, multi-currency). Created `apps/app/src/app/actions/expenses.ts` (uploadReceiptPhoto, addExpense, updateExpense, deleteExpense, applyExchangeRate, settleUp). Key decisions: no DB trigger for balance recalc; settlement_payments as audit trail; manual multi-currency conversion; receipt = simple attachment only. | — |
| 2026-03-06 | Phase 3.3: Zustand expense store + realtime provider. Created `packages/stores/src/expenses.ts` (`useExpenseStore` with upsertExpense/removeExpense/clear, `BalanceWithProfiles` type). Created `ExpensesProvider.tsx` — hydrates store from server props, subscribes to `expenses` and `balances` postgres_changes, refetches balances with profile joins on realtime balance events. | — |
| 2026-03-06 | Phase 3.4: Expenses UI — built `ExpensesClient`, `ExpenseCard`, `ExpenseList`, `BalanceCard`, `BalanceMatrix`, `AddExpenseModal` (3-step: amount+currency+notes+receipt, category+custom icon, paid-by+split type). Added `appendExpenses` to expense store for cursor pagination. Added `apps/app/src/lib/expenses.ts` shared utilities (CATEGORY_CONFIG, formatCurrency, relativeTime). Expenses page server component fetches group+expenses+balances via admin client and wraps with `ExpensesProvider`. | **Not using `Container` component** — built all page sections with raw `section` wrappers, causing layout inconsistency with other pages. User had to explicitly flag this. Fix: replaced all `mx-auto w-full max-w-5xl` section wrappers with `<Container as="section">` + inner col-span div across GroupDetailClient, GroupSettingsClient, GroupsPageClient, ExpensesClient, and DashboardPage. **Not using `Text` component in GroupsPageClient** — used raw `<h1>` and `<p>` despite the Text component existing and being used everywhere else. **Missing features from project memory** — receipt photo upload, currency selector, and custom category `IconPicker` were all documented in memory from prior design sessions but not initially included. User had to point them out. |
| 2026-03-06 | Consistency sweep + fixes — Added `Container` + `Text` to all remaining shell pages (feed/polls/plans/events/insights placeholders, profile page, dashboard empty state). Fixed `join/[code]` page to use `Button` component instead of inline-styled links and `Text` instead of raw `<p>`. Added group cover banner (3:1 aspect ratio) to `GroupDetailClient` using plain `<img>` (not `next/image` — Supabase storage hostnames differ between dev/prod). Fixed broken `Select` dropdown popup width. | **Select popup width broken everywhere** — Base UI's `Select.Positioner` defaults to `alignItemWithTrigger={true}`, which uses `position: fixed` mode and skips the Floating UI `size` middleware that sets `--anchor-width`. The popup had `min-w-[var(--anchor-width)]` but the variable was never set, causing unpredictable width. Fix: set `alignItemWithTrigger={false}` on the Positioner and use `style={{ width: 'var(--anchor-width)' }}` so the popup matches the trigger width exactly. **`next/image` for user-uploaded content** — using `<Image>` from `next/image` for Supabase storage URLs fails because hostnames differ between dev (`127.0.0.1`) and prod. Use plain `<img>` for user-uploaded content where the hostname isn't known at build time. |
| 2026-03-06 | Phase 3 Tab architecture + UI (3.1–3.4 partial) — Pivoted Phase 3 from flat expenses to Tab-based ("bar tab") grouping. Created `0008_tabs.sql` migration (tabs table, added `tab_id` FK to expenses/balances/settlement_payments). Updated types, queries (now per-tab), server actions (`addExpense`/`settleUp` take `tabId`, new `settleUpGlobal`), balance recalc (per-tab + `recalculateAllBalances`). Rewrote Zustand store (added tabs + globalBalances). Split `ExpensesProvider` into `ExpensesGroupProvider` (tab list + global balances) and `ExpensesTabProvider` (expenses + per-tab balances). Built new UI: `TabCard`, `CreateTabModal`, `TabListClient`, `TabDetailClient`. Rewrote expenses landing page to show tab list. Created tab detail page at `[tabId]/page.tsx`. Updated `ExpenseList` (uses `tabId`), `BalanceMatrix` (passes `tabId` to `settleUp`), `AddExpenseModal` (accepts `tabId`), `BalanceCard` (new `global` prop). Removed dead `ExpensesClient`. Typecheck clean. | — |
| 2026-03-06 | Phase 3 completion + Phase 3A approval — added expense detail/edit/delete flow and tab receipt sheet, then built the first app-wide motion system: shared motion tokens, shared transition provider/slots/links, animated nav indicators, expense list reflow, expense card/detail continuity, calmer modal step transitions, and long-receipt-safe sheet behavior. Phase 3A was approved and documented as the required motion standard for all remaining user-facing surfaces. | Page transitions initially only animated on some routes because source/destination surfaces were bypassing the shared transition layer; fixed by routing overview, expenses, detail, and tab surfaces through the same transition primitives. `AddExpenseModal` resized too abruptly between steps; fixed with a stable step viewport and internal scrolling. Long receipts needed bounded on-screen scroll while PNG export still captured the full receipt; fixed by separating the scroll container from the export target. |
| 2026-03-10 | Expenses UI fixes & enhancements — added SettlementCard component, tab management actions (close/reopen/delete with ConfirmDialog) in CreateTabModal, expense detail page route, edit expense flow in AddExpenseModal, getExpenseById server action, realtime provider improvements (settlement_payments subscription). Redesigned BalanceCard (jammies.gif settled state), restyled ExpenseCard/TabCard/TabListClient/BalanceMatrix. Reduced page max-widths from 5xl to 2xl. Updated TabReceipt. Added `tabs_currency` migration. | **Broad UI refactor broke existing components** — batched too many unrelated UI changes (max-width reduction, BalanceCard redesign, card restyling, tab management relocation) into a single commit. It broke the UI and had to be immediately reverted 6 minutes later, then selectively reapplied. Should have committed per-component or per-concern to isolate regressions. |
| 2026-03-17 | Phase 4 Polls UI polish — optimistic voting (local state overlay, cleared when server catches up via realtime), rounded progress bars with spring animations on PollOptionTile, animated month nav + fixedWeeks on DateTimePicker (fixed height jumps), replaced all UI-chrome emojis with Lucide icons (Dices/Eye/EyeOff/Ban/UserX/Crown), added Base UI tooltips to corruption action buttons, removed premade poll templates from CreatePollModal, stable UUID keys for AnimatePresence on option list. Fixed `getPolls()` to join voter profiles (was returning empty voters breaking optimistic derivation). Removed `revalidatePath` from `vote()` server action to stop it overwriting optimistic state. | **50/50 vote bug** — `getPolls()` returned `voters: []` for all options, so optimistic state couldn't derive previous votes and showed wrong percentages. Fix: updated query to join voter profiles like `getPollById`. **Optimistic not instant** — `revalidatePath` in `vote()` triggered re-render that overwrote optimistic local state. Fix: removed revalidatePath, let realtime reconcile. **Popover trigger mismatch** — non-native DateTimePicker trigger path caused Base UI runtime assertion in this stack. Fix: use native `<button>` render target for `Popover.Trigger`. **Missing background on DateTimePicker popup** — used nonexistent `var(--surface-primary)` instead of `--color-surface`. Fix: hardcoded `#fdfcfb`. **Calendar height jumps** — months have different week counts. Fix: `fixedWeeks` + `showOutsideDays` on DayPicker. |
| 2026-03-17 | Poll creator UX follow-up — redesigned option rows (number badge + grip + remove), implemented true drag-and-drop reorder (removed arrow controls), added duplicate-option detection + submit guard, added deadline quick presets (`In 1 hour`, `In 3 hours`, `Next 9:00 PM`), added live poll summary line, improved DateTimePicker and toggle accessibility labels/focus states, and added orchestrated staggered reveal motion for form sections. | **Fake drag affordance** — UI implied drag but reorder was arrow-only. Fix: semantic drag/drop list (`ul/li`) and removed arrows. **Duplicate error spam** — repeated inline duplicate copy per row. Fix: single section-level error + keep red borders; additionally dim non-duplicate rows while duplicates exist. **Preset-time rounding bug** — initial quick preset rounded to the hour unexpectedly. Fix: switched presets to exact millisecond offsets (`now + 1h/3h`) for the hour-based options. |
| 2026-03-17 | Auth UI redesign break from main plan — fully restyled `/login` and `/signup` with a warm atmospheric auth scene, elevated card layout, design-system form controls (`Input`/`Button`/`Text`), animated error/success feedback, and staggered entrance choreography using shared motion tokens. Preserved all existing auth behavior: safe `next` redirect on login, Google OAuth callback flow, signup validation and Supabase signup/email-confirm flow. | Needed a quick fix during implementation for zsh path globbing with `(auth)` directories (`no matches found`); resolved by quoting paths when running file commands. |
| 2026-03-17 | Group settings polish + consistency pass — fixed shared Button icon/label horizontal alignment at the component level, removed cover URL hide/show functionality, normalized icon picker sizing to match neighboring inputs, and redesigned members rows/section hierarchy for tighter visual quality (identity, role, metadata, actions). | **Icon button layout drift** — shared button did not enforce horizontal icon+label layout in all contexts. **Icon/name mismatch** — icon trigger geometry was inconsistent with input controls. **Unnecessary interaction cost** — cover URL hide/show toggle added avoidable clicks. **Members block felt unfinished** — row layout created dead space and weak hierarchy before the redesign. |
| 2026-03-17 | Phase 6 Feed planning discussion lock — aligned the plan to a homepage-inspired but production-readable Feed direction: Instagram-like continuous stream, medium playful UI, docked quick composer, comfy card density, edgy copy tone, and no stories/sticker decoration in v1. Also locked behavior: one reaction per user per item, expense+poll linking in v1 (events later), private media with signed URLs, optimistic updates with realtime reconciliation. Updated PLAN Phase 6/7 migration naming to current sequence. | — |
| 2026-03-18 | `useEffect` audit + rework on critical app surfaces — reviewed all effect usage, then fixed high-impact cases without feature loss: smarter polls fallback refresh strategy (realtime-first, guarded timer), feed snapshot merge to protect local optimistic/realtime state, and modal reset lifecycle moved from open-effects to keyed remounts (`AddExpenseModal`, `CreateTabModal` callsites). | **Backend load risk** — unconditional 30s poll refetch loop while realtime was healthy. **State clobber risk** — feed prop sync could overwrite local optimistic state. **Lifecycle complexity** — modal reset depended on effect choreography instead of component remount boundaries. |
| 2026-03-18 | Empty-state componentization pass — created shared `apps/app/src/components/EmptyState.tsx` and migrated feed/expenses/tabs/polls empty states to use it. Locked icon sizing to `size-48` (`192px`) for image/icon assets and kept emoji sizing unchanged (`text-5xl`). Removed blend-mode experiments from feed empty state. | **Visual regression loop** — one-off blend-mode iterations caused white background artifacts, overflow clipping issues, and scale mismatch. Resolved by standardizing the pattern in one shared component with explicit size tokens. |
| 2026-03-18 | Feed photo pass correction — rebuilt `PostPhotoSheet` to keep only polished empty/selected/posting states (no metadata scaffolding), kept link selectors, and simplified image-card behavior in `FeedItemCard` to non-shifting subtle transitions with loading/fallback handling. | **Misread intent on metadata + motion** — introduced metadata inputs that were not desired and over-stylized card/lightbox continuity that hurt UX. Fixed by removing metadata UI and toning card animation down to subtle opacity-only behavior. |
| 2026-03-18 | Lightbox removal + upload hardening — removed feed lightbox feature (`ImageLightbox` delete + `FeedListClient` wiring/state cleanup), made photo cards non-click-open, and added explicit upload timeouts/error surfacing for photo/voice submissions. | **Silent-feeling upload loop** — linked submissions could appear stuck without clear feedback when upload/action paths stalled. Fixed by timeout guards and explicit surfaced error messages in submit handlers. |
| 2026-03-18 | Feed composer + card polish pass (photo, text, post bug fix) — **Photo sheet:** redesigned `PostPhotoSheet` to match voice sheet's crafted feel: wrapped in same `rounded-xl border bg-[#F8F4EE]` container, 68px camera button with `btn-primary` + shadow, real drag-and-drop with green border/bg feedback, bottom-anchored gradient overlay + indeterminate progress bar for upload, streamlined file info row. **Photo card:** blurred gradient placeholder instead of shimmer, Instagram-style `aspect-[4/5]` + `object-cover` framing, subtle hover lift. **Text sheet:** tightened container bg to match voice/photo parity (`#F8F4EE`), autofocus textarea on open, posting state dims link selectors, post button with `MessageSquareText` icon. **Text card:** new `TextPostBody` component with three tiers — short posts (<=40 chars) render in Geist Pixel at `web-section` size (42px), medium posts (41-80 chars) render as standard body, long posts (>80 chars) get a left accent blockquote bar. **Post creation bug fix:** split `createItem` into persist + hydrate phases — if `addFeedItem` succeeds but hydration/signing times out, optimistic item stays in place and realtime reconciles instead of reverting + showing false error. | **`object-contain` dead space** — initial attempt used `object-contain` to respect aspect ratio, but created large empty areas around non-standard images. Fix: Instagram-style `aspect-[4/5]` + `object-cover`. **Unnecessary `geist` package install** — tried to install `geist` npm package for Geist Pixel font, but `.geist-pixel` CSS class and font were already wired in `globals.css` and used by the `Text` component's `display`/`web-*` variants. Fix: reverted install, used existing class. **False timeout error on successful posts** — `createItem` had one try/catch around both persist (`addFeedItem`) and hydrate (`fetchHydratedItemById`). If the post saved but hydration timed out, the catch removed the optimistic item and showed an error even though the post was in DB. Fix: split into two phases — only revert on persist failure, leave optimistic item on hydration failure. |
| 2026-03-18 | `usePrefetch` hook + card wiring — created `apps/app/src/hooks/usePrefetch.ts`: viewport-based route prefetching via IntersectionObserver + `router.prefetch()`. Tracks prefetched href (not boolean) so route changes re-prefetch correctly. Disconnects observer after first hit. 50px rootMargin for anticipation. Wired into `TabCard` (`/{groupId}/expenses/{tabId}`), `ExpenseCard` (`/{groupId}/expenses/{tabId}/{expenseId}`), and `GroupCard` (`/groups/{groupId}`). Especially valuable with `TransitionLink` which intercepts clicks and navigates via `router.push` — prefetch ensures RSC payload is cached before navigation fires. | **Original hook had a bug** — `prefetchedRef.current = false` reset was placed after the early return that checks `prefetchedRef.current`, making it dead code when href changed. Fix: track the prefetched href string instead of a boolean, compare against current href. **`options` dep array risk** — original hook accepted `IntersectionObserverInit` in useEffect deps, which would cause infinite re-renders with inline objects. Fix: hardcode `rootMargin`, drop options param. |
| 2026-03-17 | RecordVoiceSheet redesign + VoicePlayer upgrade + shared LinkSelectors — Full rewrite of `RecordVoiceSheet` with three visual phases (idle/recording/playback): idle shows 68px green gradient mic button + static sine canvas + timer; recording shows live canvas waveform (quadratic Bezier curves from RMS ring buffer at 50ms intervals), pulsing blurred lime glow behind stop button, counting timer + progress bar, haptic on start; playback shows play/pause button (morphed via `layoutId`), real audio peak bars (48 bars from `decodeAudioData`), click-to-seek scrubbing, elapsed time, "Record again" ghost button, haptic on stop. Extracted duplicated `LinkSelectors` from all 3 composer sheets into shared component with `groupId` prop — selected items now show navigable link pills (expense → `/{groupId}/expenses/{tabId}/{expenseId}`, poll → `/{groupId}/polls#pollId`). Added `tabId` to `FeedLinkOption` type and expense query. Upgraded `VoicePlayer` in `FeedItemCard` to match: real peak extraction via fetch+decodeAudioData, rAF-driven smooth progress (was choppy `timeupdate` ~4fps), click-to-seek on bars, `btn-primary` play button with filled white icons, green/tan bar coloring by playhead position. | **webm duration NaN** — `audio.duration` is often `NaN`/`Infinity` for webm blobs recorded via MediaRecorder. Fix: fall back to `previewDuration` (captured from the recording timer) when the browser can't determine duration from the blob metadata. Apply the same fallback in seek logic. **Ref reads don't trigger re-renders** — timer display read `audioElRef.current.currentTime` during playback, but ref mutations don't cause React re-renders. Fix: use `playProgress` state (updated via rAF) as single source of truth for both timer text and bar coloring. **Audio element reset on toggle** — setting `audio.src = previewUrl` on every play toggle restarted the audio from 0. Fix: create the `Audio` element once, reuse it across play/pause cycles. **Pulsing ring off-center** — `absolute inset-0` ring on the recording button sat inside `btn-primary`'s thick box-shadow, creating a visual offset. Scaling animation made it worse. Fix: replaced ring with a blurred lime blob (`blur-xl`, soft scale+opacity animation) behind the button — no border, just ambient glow. |
