# Mistakes & Sessions

## Protocol

When a problem is encountered and fixed, log it here immediately:
- **Problem:** what went wrong and why
- **Fix:** what solved it
- **Avoid:** what not to do next time

---

## Mistakes Log

### Silently edited plan checklist
- **Problem:** Marked 0.4.3 done while quietly removing "Install tailwindcss, motion" from the item text — a valid decision (keep shared deps at root) but made without flagging it.
- **Fix:** Called out when user noticed.
- **Avoid:** Never alter plan wording when marking items done. Add a note instead.

### `@mooch/db` barrel export pulled `next/headers` into client bundle
- **Problem:** `packages/db/src/index.ts` re-exported all three clients (`browser`, `server`, `middleware`). Client components importing `createBrowserClient` from `@mooch/db` caused the bundler to follow the barrel into `server.ts`, which imports `next/headers` — a server-only module.
- **Fix:** Stripped `index.ts` down to browser-only export. Added `exports` subpaths in `package.json` (`"./server"` and `"./middleware"`) for server-side callers. Updated middleware and route handlers to import from `@mooch/db/server` / `@mooch/db/middleware`.
- **Avoid:** Never barrel-export server-only modules (anything that imports `next/headers`, `next/server` internals, etc.) alongside browser modules. Use subpath exports to enforce the boundary.

---

## Sessions

| Date | Summary | Problems |
|------|---------|----------|
| 2026-03-04 | Phase 0 complete — bun workspaces, turbo, both Next.js apps, shared packages (db/types/ui/stores), Supabase local dev, Biome lint clean. Renamed project from squad-sync → mooch throughout. | Docker not running initially (started mid-session). Turbo missing `packageManager` field. Lockfile stale after rename — deleted and regenerated. |
