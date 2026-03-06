# UX Playbook for mooch

Source inspiration:
- https://benji.org/family-values

This document translates the blog's core UX values into concrete rules for `mooch`, with a mobile-first bias and a flush interface model that will scale cleanly from web to native app shells.

## Product UX Values

We adopt three principles:

1. Simplicity
- Reduce visible choices at each moment.
- Keep one dominant action per screen.
- Prefer progressive disclosure over disabled clutter.

2. Fluidity
- Preserve continuity between states and screens.
- Use motion to explain change, not decorate it.
- Keep flows fast and reversible.

3. Delight
- Reserve delight for meaningful moments (first success, completion, milestones).
- Avoid constant motion/noise in high-frequency actions.
- Reinforce confidence in collaborative and money-related actions.

## Motion Strategy (`motion/react`)

Motion is a core UX layer in `mooch`, not decoration.

Goals:
- Make transitions clear (where the user came from, where they are now).
- Make interactions feel responsive and physical.
- Add delight at key moments without slowing frequent tasks.

Core rules:
- Prefer `ease-out` for most UI transitions.
- Keep frequent UI motion fast (`150ms` to `250ms`).
- Keep most UI transitions under `300ms`.
- Use the iOS-like sheet curve for drawer/sheet movement: `cubic-bezier(0.32, 0.72, 0, 1)`.
- Make animations interruptible (users can reverse action mid-transition).
- Animate transform and opacity first; avoid layout-thrashing properties.
- Respect `prefers-reduced-motion` with gentler alternatives, not zero feedback.

## Layout Animation Patterns

Use `motion/react` layout tools to preserve object continuity:

1. Shared Element Transitions (`layoutId`)
- Tab indicator movement in nav and segmented controls.
- Card-to-detail continuity (group card -> group header, expense row -> expense detail).
- Confirmation surfaces that morph from action button into success state.

2. Auto Layout Transitions (`layout`)
- List reordering, insertions, and removals in Expenses, Poll options, Plans cards.
- Dynamic content expansion/collapse without hard jumps.

3. Presence Transitions (`AnimatePresence`)
- Sheet/modal content steps.
- Contextual panels that appear/disappear on state changes.
- Empty state <-> populated state transitions.

4. Gesture-Aware Motion
- Bottom sheets and swipe interactions should be velocity-aware and snap predictably.
- Drag interactions (Plans/Kanban) should include lift while dragging and smooth settle on drop.
- Avoid fighting native scroll; resolve drag/scroll conflicts intentionally.

## App Transition Wrapper (Recommended)

Yes, this is a strong direction, especially with repeated components and shared list/detail patterns.

Use one transition layer for the whole app instead of ad-hoc animations per screen.

Proposed architecture:

1. `AppTransitionProvider`
- Global wrapper at shell layout level.
- Owns motion tokens, reduced-motion policy, and transition mode.
- Chooses transition engine:
  - Browser View Transitions API when available.
  - `motion/react` fallback when not available.

2. `TransitionLink`
- Shared navigation primitive for route changes.
- Starts named transitions for known patterns (list -> detail, detail -> list, tab -> tab).
- Prevents each page from reinventing route animation behavior.

3. `TransitionSlot`
- Page/section wrapper with consistent enter/exit/layout behavior.
- Supports transition variants: `none`, `subtle`, `context`, `delight`.

4. Shared element IDs map
- Central mapping for repeated elements:
  - group avatar/title
  - expense row amount/title
  - tab indicators
  - sheet headers
- Ensures continuity across routes/components with stable IDs.

Why this helps:
- Consistency: same movement language everywhere.
- Maintainability: change timing/easing in one place.
- Scalability: future modules (Polls/Plans/Feed/Events) inherit motion standards automatically.
- Native readiness: easier parity when porting transitions to mobile app frameworks.

Guardrails:
- Transition wrapper is for context-preserving navigation, not every click.
- Frequent actions remain near-instant.
- Delight variants are opt-in and only for milestone moments.
- Reduced-motion users get fade/opacity alternatives with full clarity.

## Motion by Frequency

- Constantly used actions: almost no visible animation, only immediate feedback.
- Hourly/daily repeated actions: subtle micro-motion only.
- Low-frequency milestones: richer animation allowed.

This keeps the app feeling premium over time instead of fatiguing.

## Mobile-First Flush Direction

`Flush` means content feels like one coherent surface, not stacked floating cards.

Rules:
- Favor edge-to-edge content sections on mobile.
- Use cards only when they communicate grouping or affordance, not as default wrappers.
- Avoid card-inside-card unless semantically necessary (for example: a list item inside a sheet).
- Keep top bar and bottom nav visually connected to the page surface.
- Minimize decorative borders; emphasize hierarchy with spacing, typography, and subtle tonal shifts.

Practical defaults:
- Target touch area: minimum `44x44`.
- Primary actions in thumb zone (lower half on mobile).
- Keep critical actions visible without scroll in common tasks.
- Reduce density spikes: no more than 2 competing accent treatments in one viewport.

## Current Component Improvements

### 1) Group Navigation (`GroupDetailClient`)
Current:
- Horizontal tab rail includes many disabled items, which adds cognitive load.

Improve:
- Show only enabled destinations (`Overview`, `Expenses`) in primary rail.
- Move future sections to `More` with "Coming soon" grouping.
- Keep Settings in the same nav model as other destinations (avoid separate mental model).
- Keep `layoutId` tab indicator transitions consistent with bottom nav for shared movement language.
- Consider clip-path style active-state transitions for seamless text/highlight sync.

Why:
- Simplicity improves scanning and user confidence.

Priority:
- High

---

### 2) Bottom Navigation (`BottomTabBar`)
Current:
- Primary tabs + "More" pattern exists, but information architecture differs from top group nav.

Improve:
- Align labels/order with group nav structure to remove context switching.
- Keep one clear active destination indicator style across top and bottom nav.
- Ensure the tab bar feels attached to page content (flush transition, not floating island).
- Add quick, interruptible active-state transitions (`~200ms`) on tab switch.
- Reserve stronger transitions for route changes only when context needs explanation.

Why:
- Cross-surface consistency supports fluidity.

Priority:
- High

---

### 3) Group Entry (`DashboardPage`, `GroupsPageClient`)
Current:
- Empty states are clear, but first-run flow can still branch early (`Create` vs `Join`) with equal weight.

Improve:
- Keep one primary CTA based on most likely intent, secondary as supporting action.
- Add explicit "what happens next" microcopy under CTA (build trust before commitment).
- Reduce visual competition around first action.
- Add soft stagger for group list entrance on first load only, not on every revisit.

Why:
- First-run clarity is the highest leverage simplicity win.

Priority:
- High

---

### 4) Expense Detail (`TabDetailClient`)
Current:
- View switcher (`Activity` / `Balances`) is good, but should better preserve spatial continuity when changing views.

Improve:
- Use consistent container height behavior to avoid jumpiness.
- Keep header actions and context fixed while switching subviews.
- Emphasize one primary action (`Add expense`) unless tab is closed.
- Use layout-preserving transitions for Activity <-> Balances, avoiding full panel remount feel.

Why:
- Fluidity prevents disorientation in frequent task loops.

Priority:
- Medium

---

### 5) Add Expense Flow (`AddExpenseModal`)
Current:
- Strong 3-step flow with validation and transitions.

Improve:
- Add persistent "step intent" copy ("What we need now") to reduce form anxiety.
- Show live split integrity status as positive confirmation, not only errors.
- Keep back/next controls fixed and predictable in location.
- Keep step transitions short and directional; allow immediate interruption when user goes back.
- On success, add a brief confirm state before closing to reinforce trust.

Why:
- Money entry flows benefit from reassurance and low-friction correction.

Priority:
- High

---

### 6) Group Creation and Join (`CreateGroupModal`, `JoinGroupModal`)
Current:
- Functional and clear; mode switching in Join is explicit.

Improve:
- Reduce optional fields on first pass; defer secondary customization until after creation.
- In Join, optimize for fastest path (auto-submit when code complete/QR valid).
- Add completion feedback moment (brief success state before redirect).
- Use small positive completion animation (badge/check morph) as delight anchor.

Why:
- Faster "time to first value" with controlled delight.

Priority:
- High

## Flow Standards for New Features

Apply these to all upcoming sections: Polls, Plans, Feed, Events, Insights.

### Polls
- Single obvious vote action per option state.
- Results transition should communicate change magnitude without heavy animation.
- Anonymous vs non-anonymous state must be explicit before vote confirmation.
- Vote feedback should be immediate, then settle quickly (no long celebratory sequence).

### Plans (Kanban)
- Drag/drop must maintain item identity during movement (no abrupt re-render jumps).
- Keep action density low inside each card; details belong in sheet/panel.
- Provide immediate post-move confirmation signal (visual + optional haptic in native).
- Use layout animation for column/card reflow after drop.

### Feed
- Prioritize readability over decoration; content first, chrome second.
- Media actions (react/comment/open) should remain stable across item types.
- Keep reaction feedback short and tactile; avoid long chained animations.
- Use enter animations sparingly; avoid replaying for already-seen items.

### Events
- RSVP should be a one-step commitment with clear current status.
- Date/time clarity over stylistic treatment.
- Attendance confirmation flow must be reversible and transparent.
- Animate RSVP state change as a compact state morph, not a modal-level transition.

### Insights
- One primary takeaway per card.
- Use progressive disclosure for detail drill-down.
- Celebrate milestones sparingly (weekly summary, streak, settled-all state).
- Use richer motion here than in operational screens, but stay within performance limits.

## Cross-Flow Interaction Rules

1. One screen, one primary action.
2. Never hide critical status (who owes, what changed, what's next).
3. Prefer inline correction over blocking error states.
4. Keep navigation location and behavior predictable.
5. Motion duration should stay short and purposeful.
6. Use delight only at value moments, not routine taps.
7. Prefer shared-element and layout animations over opaque cross-fades.
8. Route and screen transitions should go through the shared transition wrapper.

## UX Acceptance Checklist (Before Shipping Any New Flow)

- Is the primary action obvious within 2 seconds?
- Can a new user complete the happy path without tooltips?
- Is there any disabled clutter we can hide until relevant?
- Does motion explain transition and preserve context?
- Are layout animations used where continuity matters (tabs, lists, card/detail)?
- Are error states actionable and specific?
- Is the screen usable one-handed on a phone?
- Is success clearly acknowledged?

## Mobile App Readiness Notes

To prepare for native/mobile shell migration:
- Treat bottom navigation as the primary wayfinding anchor.
- Design sheets/modals as mobile-first, then scale up for desktop.
- Keep spacing/tap targets consistent with touch ergonomics.
- Separate interaction feedback layers:
  - visual (always)
  - haptic (native/mobile web where available)
  - audio (rare, user-controlled)
- Keep a shared motion token set across web and mobile app:
  - fast interaction
  - standard transition
  - sheet transition
  - success/delight transition

## Delight Moments Map

Use richer delight only for these milestones:
- First squad created/joined.
- First expense added in a tab.
- Full settle-up state reached ("everyone settled").
- Poll participation completion.
- Plan moved to done.
- Weekly insight reveal.

Everything else should prioritize clarity and speed.

## Suggested Execution Order

1. Navigation simplification pass (`GroupDetailClient`, `BottomTabBar`).
2. Introduce app-level transition wrapper design (`AppTransitionProvider`, `TransitionLink`, `TransitionSlot`).
3. First-run funnel polish (`DashboardPage`, `GroupsPageClient`, Join/Create flows).
4. Expense flow reassurance improvements (`AddExpenseModal`, `TabDetailClient`).
5. Apply the same UX rules to new modules as they ship (Polls, Plans, Feed, Events, Insights).
