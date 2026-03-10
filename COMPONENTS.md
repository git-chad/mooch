# Component Inventory

> Derived from PLAN.md (Phases 2–9) and the Lime Aero Design System.
> Organized by layer: shared primitives → feature modules.
>
> **Legend:** 🔊 audio feedback · 📳 haptic feedback · ✦ TextMorph label transition

---

## Skills & Libraries

### Skills

| Skill | Status | Purpose |
|---|---|---|
| `emilkowal-animations` | ✅ installed | 43 animation rules: easing, timing, transforms, gesture interactions, accessibility |
| `web-haptics` | ✅ installed | Vibration API patterns, zero deps, silent no-op on desktop |
| `frontend-design` | ✅ built-in | Production-grade UI design quality guidance |
| `web-design-guidelines` | ✅ built-in | Accessibility, UX, and design best practices auditor |
| `design-engineer-mindset` | ⚠️ manual install | Clone `sanky369/vibe-building-skills`, upload `design-engineer-mindset/SKILL.md` via Claude Settings → Capabilities → Skills |

### Packages (`apps/app`)

| Package | Version | Purpose |
|---|---|---|
| `torph` | `0.0.5` | `<TextMorph>` — animated text morphing for label/state transitions |
| `web-haptics` | `0.0.6` | Haptic feedback on mobile interactions |
| `howler` | TBD | Audio playback engine — used by `audioEngine` singleton (adapted from existing game project, stripped down to UI notification use only) |

---

## Stores (`packages/stores`)

Zustand stores that need to be built alongside components.

- [x] **`useAuthStore`** — `user`, `profile`, `setUser`, `setProfile`, `reset` — already exists
- [x] **`useGroupStore`** — `groups`, `activeGroupId`, `setGroups`, `setActiveGroup` — already exists
- [x] **`useExpenseStore`** — `tabs`/`setTabs`/`upsertTab`/`removeTab`, `expenses`/`setExpenses`/`upsertExpense`/`removeExpense`/`appendExpenses`, `balances`/`setBalances` (per-tab), `globalBalances`/`setGlobalBalances` (cross-tab), `clear`; `BalanceWithProfiles` type
- [x] **`audioEngine`** — (`packages/stores/src/audio-manager.ts`) Simplified singleton `AudioManager` over howler. `play(key)`, `preload()`, `mute()`, `unmute()`, `toggleMute()`, `setVolume(n)`. SSR-safe. Sound keys in `packages/stores/src/sfx.ts`.
- [x] **`useAudioStore`** — (`packages/stores/src/audio-store.ts`) Zustand store with `persist`. State: `ready`, `muted`, `volume`. `init()` triggers preload on first user interaction. Persists `muted` + `volume` to localStorage.
  - **SFX event keys:** `EXPENSE_ADDED` · `VOTE_CAST` · `BALANCE_SETTLED` · `GROUP_JOINED` · `REACTION_ADDED` · `NOTIFICATION` · `ERROR`
  - **Sound files:** drop `.mp3` files into `apps/app/public/sounds/` and `apps/web/public/sounds/`

---

## Required Components

### Primitives / UI Kit (`packages/ui`)

- [x] **`Container`** — `site` variant: `max-w-[1280px]`, `mx-auto`, 12-col grid, `gap-2`, `px-8`. `app` variant: same grid, no max-width. Accepts `as` prop. Uses `cn`.
- [x] **`Button`** — Primary / Secondary / Ghost variants; tactile press scale + shadow (design system 3D style); ✦ TextMorph for label transitions (e.g. "Save" → "Saving…" → "Saved"); 📳 haptic on primary press
- [x] **`Modal`** — Base overlay; no backdrop blur; close-on-Escape and backdrop tap; slide-up on mobile, fade-scale on desktop
- [x] **`Sheet`** — Bottom-sheet; swipe-to-dismiss with velocity detection; `default` + `receipt` variant (scalloped edges, Geist Pixel header, Geist Mono body, dashed perforations); 📳 haptic on open and on dismiss snap
- [x] **`ConfirmDialog`** — Destructive-action modal; shakes on dismiss attempt; 📳 heavy haptic on destructive confirm
- [ ] **`Toast`** — Success / error / info; lime aero style; auto-dismiss with progress bar; 🔊 notification sound on show; 📳 light haptic
- [x] **`Avatar`** — Circular user photo with fallback initials; size variants (`sm`, `md`, `lg`); gradient border + gloss inner shadow; name tooltip
- [x] **`Tooltip`** — Warm white glass surface; Base UI Tooltip; `TooltipProvider` in root layout; 120ms fade
- [x] **`Badge`** — Role (admin/member), status (settled, closed, past), role-color per design system; fully custom `color` prop (tinted bg + border derived from hex); `emoji?` prefix; `sm`/`md` sizes
- [ ] **`Chip`** — Pill label: tags, categories, emoji+name group chips; press state
- [ ] **`EmptyState`** — SVG illustration + heading + body + CTA button; every section has its own copy/illustration
- [ ] **`Skeleton`** — Shimmer placeholder; block and list variants; matches exact layout of the content it replaces
- [ ] **`ErrorBoundary`** — Full-section error with retry button; not a generic crash screen
- [ ] **`NavTabs`** — Horizontal tab bar; animated lime pill indicator slides between tabs (layout animation, not opacity swap)
- [x] **`Input`** — Text input; label, helper text, error state; lime focus ring + subtle lift (`-translate-y-px`); `forwardRef` + `useId` for accessible label association; `aria-invalid` + `aria-describedby`
- [x] **`Select`** — Base UI Select; `single` + `multi` mode; flat options or grouped; options support `icon` (emoji) + `description`; multi shows chips in trigger; error/disabled states; matches Input styling exactly
- [ ] **`Textarea`** — Multi-line; live char counter; smooth height expansion
- [ ] **`Toggle`** — Binary switch; spring thumb animation; 📳 light haptic on flip
- [ ] **`ProgressBar`** — Track + lime gradient fill; pill-shaped; animated fill width
- [ ] **`Spinner`** — Minimal inline loader; used inside Button during async actions
- [ ] **`OfflineBanner`** — Fixed top bar on `navigator.onLine === false`; slides in/out with Motion

---

### Auth

- [x] **`AuthProvider`** — `app/src/components/AuthProvider.tsx` — hydrates Zustand auth store on mount

---

### Groups (`app/src/components/groups/`)

- [x] **`CreateGroupModal`** — Name input, emoji picker grid, currency selector, locale selector, optional cover photo upload; submit: 🔊 `group-joined` sound + 📳 haptic
- [x] **`JoinGroupModal`** — `InviteCodeInput` + QR scanner (`jsqr`); on join success: 🔊 `group-joined` + 📳 haptic
- [x] **`InviteSheet`** — Monospace invite code, copy button (📳 haptic on copy), `QRCodeDisplay`, share via `navigator.share()`
- [x] **`GroupSwitcher`** — Horizontal scrollable chip row in top nav; active chip uses lime gradient; switching: 📳 light haptic; "+" chip opens CreateGroupModal
- [x] **`GroupCard`** — Emoji, name, member count, currency badge; press scale
- [x] **`MemberList`** — Scrollable member list; staggered fade-up entrance
- [x] **`MemberRow`** — Avatar, display name, role badge; admin actions (remove, promote) behind long-press or swipe

---

### Expenses (`app/src/components/expenses/`)

- [x] **`TabCard`** — Tab emoji + name, status badge (open/closed), expense count, total amount; links to tab detail; glass gradient for open, muted flat bg for closed
- [x] **`TabListClient`** — Expenses landing page client: global balance card, open/closed tab sections, empty state, "New tab" button
- [x] **`TabDetailClient`** — Tab detail page client: back link, tab header (icon + name + badge), Activity/Balances view switcher, reuses ExpenseList + BalanceCard + BalanceMatrix + AddExpenseModal; hides "Add expense" when tab is closed
- [x] **`CreateTabModal`** — Name input + `IconPicker`; creates tab via server action and upserts into store
- [x] **`ExpenseList`** — Cursor-based "Load more" pagination (20/page); empty state; reads from `useExpenseStore`; now scoped by `tabId`
- [x] **`ExpenseCard`** — Category emoji or custom Lucide icon (for "other"), description, amount color-coded by payer; "Paid by {name}" / "You paid"
- [x] **`AddExpenseModal`** — 3-step flow with AnimatePresence transitions: (1) amount + currency selector + description + notes + receipt photo attach, (2) category grid + `IconPicker` for custom category, (3) paid-by + split type (Equal/Percentage/Exact) with per-member rows and live validation; on submit: receipt upload then `addExpense(groupId, tabId, ...)`; now receives `tabId` prop
- [ ] **`SplitTypeSelector`** — Animated toggle between Equal / Percentage / Exact; per-member input rows; live validation feedback _(inline in AddExpenseModal, not extracted yet)_
- [x] **`BalanceMatrix`** — Simplified debt list with "Settle Up" button for current-user rows; `ConfirmDialog` confirm flow; "Everyone settled" empty state; now receives `tabId` for per-tab settle-up
- [x] **`BalanceCard`** — Net balance for current user; color-coded green/red/neutral; "Everyone settled" empty state; new `global` prop reads from `globalBalances` store
- [x] **`CategoryGrid`** — 4-col emoji grid inline in AddExpenseModal step 2; selected item highlighted; `IconPicker` opens when "other" selected

---

### Polls (`app/src/components/polls/`)

- [ ] **`PollCard`** — Question, creator, status badge, option tiles, live results; staggered option entrance
- [ ] **`PollOptionTile`** — Radio (single) or checkbox (multi) behavior; optimistic update; 📳 haptic + 🔊 `vote-cast` on tap; disabled + grayed when closed
- [ ] **`LiveResultsBar`** — Motion `animate width` on vote change; spring easing; re-animates on Realtime updates
- [ ] **`CreatePollModal`** — Template chips with pre-filled options; question + options list (add/remove/drag-reorder); anonymous + multi-choice toggles; optional auto-close datetime
- [ ] **`VoterAvatars`** — Stacked avatars (max 3 + overflow count); shown on non-anonymous polls; entrance stagger

---

### Plans / Kanban (`app/src/components/plans/`)

- [ ] **`KanbanBoard`** — 4-column horizontal layout; `@hello-pangea/dnd` DnD context; horizontal scroll on mobile
- [ ] **`KanbanColumn`** — Drop zone with visual highlight on hover; scrollable card list; "+" add button; column header with count badge
- [ ] **`PlanCard`** — Draggable with `DragHandle`; Motion `whileDrag` scale + shadow lift; title, description preview (2 lines), date badge, organizer avatar, attachment count indicators; 📳 haptic on drag start and on drop
- [ ] **`CreatePlanSheet`** — Title (required), description, `DateTimePicker`, organizer selector, column selector, photo attach via `ImageUploader`, voice attach via `VoiceRecorder`
- [ ] **`PlanDetailPanel`** — Full details; status dropdown (✦ TextMorph on status label); `AttachmentViewer`; edit / delete; "Create Event from Plan" CTA
- [ ] **`VoiceRecorder`** — `MediaRecorder` start/stop; `AudioLevelBar`; max 60s with countdown; post-record playback preview; shared between Plans and Feed
- [ ] **`AttachmentViewer`** — Photo lightbox or audio player depending on attachment type

---

### Feed (`app/src/components/feed/`)

- [ ] **`FeedItemCard`** — Avatar + name + `RelativeTime` header; photo / voice / text body; context badge (linked expense/event/poll); `ReactionBar`; own items show delete (swipe or long-press)
- [ ] **`ReactionBar`** — Emoji chips with counts; toggle reaction: 📳 haptic + 🔊 `reaction-added`; "+" opens 6-emoji preset picker; scale bounce on tap (Motion)
- [ ] **`PostPhotoSheet`** — File input (camera on mobile); `ImagePreview` + Canvas compression; caption textarea; optional link to expense/event/poll
- [ ] **`RecordVoiceSheet`** — `VoiceRecorder` + caption + post button; 📳 haptic on start and stop recording
- [ ] **`ImageLightbox`** — Full-screen overlay; close on Escape or backdrop tap; arrow navigation between feed photos; pinch-to-zoom on mobile
- [ ] **`AudioPlayer`** — Play/pause; animated waveform bars; duration display; ✦ TextMorph on play/pause label

---

### Events (`app/src/components/events/`)

- [ ] **`EventCard`** — Title, formatted date + time, location, organizer avatar, RSVP summary ("5 Yes · 2 Maybe"), your RSVP badge; press scale
- [ ] **`RSVPButtons`** — Yes / Maybe / No; animated selected state (lime for Yes); +1 guest counter appears after Yes; 📳 haptic on selection; ✦ TextMorph on count changes; mini `AvatarStack` per category
- [ ] **`AttendanceConfirmation`** — Checklist of "Yes" RSVPs; confirm button (organizer only); 🔊 sound + 📳 haptic on confirm
- [ ] **`CreateEventModal`** — Title, description, `DateTimePicker`, location, organizer; pre-fill from closed poll or plan (dropdown selectors)

---

### Insights (`app/src/components/insights/`)

- [ ] **`WeeklySummaryCard`** — Total spent (`CountUpNumber`), top category emoji, top poll result; "Week of {date}" subtitle
- [ ] **`LeaderboardCard`** — Three tiles: Most Reliable 🏆, The Organizer 📋, Most Generous 💰; winner avatar + name + stat; crown on #1; staggered entrance
- [ ] **`MediaHighlights`** — Horizontal scrollable row of top feed item thumbnails; tap → `ImageLightbox`
- [ ] **`FunFactCard`** — Gradient background callout; emoji accent; fun fact text

---

### Shell / Layout (`app/src/components/shell/`)

- [x] **`TopNav`** — Houses `GroupSwitcher` and user avatar; glass surface per design system
- [ ] **`SideNav`** — Desktop sidebar; section links with active indicator; collapses to icon-only at narrow widths
- [ ] **`BottomNav`** — Mobile tab bar; 5 tabs with active lime indicator; 📳 haptic on tab switch
- [x] **`GroupsProvider`** — Client component; hydrates Zustand group store from server-fetched data; sets initial `activeGroupId` from localStorage

---

## Components We Might Want

### Generic UI

- [ ] **`DateTimePicker`** — Shared between CreatePlanSheet and CreateEventModal; native `<input type="datetime-local">` styled to match design system
- [ ] **`EmojiPicker`** — Inline scrollable grid; used in CreateGroupModal and ReactionBar preset picker
- [ ] **`NumberInput`** — Large display-size amount input; `Intl.NumberFormat` live formatting; used in AddExpenseModal step 1
- [ ] **`AvatarStack`** — Overlapping avatars with overflow count chip; used in RSVPButtons, VoterAvatars
- [ ] **`CurrencyDisplay`** — Formatted amount + currency code; respects group locale via `Intl.NumberFormat`
- [ ] **`RelativeTime`** — "2 hours ago" / "Hace 2 horas"; locale-aware; auto-refreshes every minute
- [ ] **`SectionHeader`** — Section title (Geist Pixel) + optional action button; consistent across all pages
- [ ] **`PageContainer`** — Max-width wrapper with standard padding; used by every page
- [ ] **`SearchInput`** — Pill search field matching design system; used in member selection and expense search
- [ ] **`Divider`** — Subtle horizontal rule for list and section separation

### Feedback / States

- [ ] **`SkeletonList`** — N skeleton rows matching list item height; used in ExpenseList, MemberList, EventCard list
- [ ] **`SkeletonCard`** — Card-shaped shimmer; used in KanbanBoard, FeedItemCard loading
- [ ] **`ToastProvider`** — Context + imperative `toast.success()` / `toast.error()` / `toast.info()` API
- [ ] **`InlineError`** — Small error message with icon below form fields; animated entrance
- [ ] **`CountUpNumber`** — Animated number increment using Motion; used in WeeklySummaryCard and BalanceCard

### Media / Upload

- [ ] **`ImageUploader`** — File input → Canvas compress to ≤1080px → upload to Supabase Storage; reused in profile avatar, group cover, feed photo, plan attachment
- [ ] **`AudioLevelBar`** — Real-time mic level bars (animated with `requestAnimationFrame`); shared between VoiceRecorder and RecordVoiceSheet
- [ ] **`ImagePreview`** — Thumbnail + remove button before upload confirmation; shown in PostPhotoSheet and ImageUploader

### QR / Invite

- [x] **`QRCodeDisplay`** — `qrcode` package renders to canvas; dark `#1A1714` / paper `#F8F6F1` colors; invite code + copy link; demo'd in both default and receipt Sheet variants
- [x] **`QRScanner`** — `getUserMedia` (back camera preferred) + `jsqr` at ~12fps; corner-bracket viewfinder; animated scan line; success flash + checkmark; denied/error/loading states; 📳 triple-pulse haptic on decode
- [x] **`InviteCodeInput`** — 6-cell split input; auto-uppercase; auto-advance on char entry; backspace navigates back; paste distributes across cells; cells turn lime green on complete; 📳 haptic on complete

### Kanban Specific

- [ ] **`DragHandle`** — Visible grip dots; grab cursor; activates `@hello-pangea/dnd` drag
- [ ] **`ColumnHeader`** — Column emoji + title + count badge + "+" button

### Notifications / Push

- [ ] **`PushPermissionPrompt`** — Contextual card shown once after login; 🔊 `notification` preview sound on "Enable" tap; 📳 haptic

---

## Notes

### Architecture
- **`packages/ui`** — app-agnostic primitives only (Button, Avatar, Badge, Chip, Input, etc.). Feature components stay in `apps/app/src/components/`.
- All modals and sheets share the base `Modal` / `Sheet` wrappers for consistent animation and accessibility.
- `VoiceRecorder` is shared between Plans and Feed — lives in `app/src/components/shared/`.
- `ImageUploader` Canvas compression logic is needed in 3+ places — extract to `app/src/lib/image.ts` early.
- `audioEngine` + `useAudioStore` are built once and imported wherever 🔊 is needed.

### Interaction Philosophy
- Every interactive element must feel **physically present**: real press states, spring physics, tactile shadow changes. No flat opacity fades.
- Animations are **short and purposeful** — 120–200ms for micro-interactions. Nothing decorative.
- ✦ **TextMorph** (`torph`) on any label that changes state: button labels, status text, counters, balance amounts.
- 📳 **Haptics** (`web-haptics`) on all meaningful mobile interactions: primary button presses, confirmations, drag start/drop, tab switches, successful submissions, destructive actions.
- 🔊 **Audio** (`audioEngine`) on key success events only — never on passive actions. Always gated by `useAudioStore.muted`.
- Spring-based transforms for drag, hover lift, modal entrances. Duration-based tweens only for simple opacity transitions.
- Empty states, skeletons, and error states are **designed moments** with their own motion — not afterthoughts.


# mooch.me - to mooch or be mooched