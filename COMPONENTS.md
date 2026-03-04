# Component Inventory

> Derived from PLAN.md (Phases 2–9) and the Lime Aero Design System.
> Organized by layer: shared primitives → feature modules.

---

## Skills & Libraries

### Installed Skills

| Skill | Purpose |
|---|---|
| `emilkowal-animations` | 43 animation rules across easing, timing, transforms, interaction patterns, and accessibility — based on Emil Kowalski's work |
| `web-haptics` | Vibration API patterns for mobile tactile feedback, zero dependencies, silent no-op on desktop |
| `frontend-design` | Production-grade UI design quality guidance (built-in) |
| `web-design-guidelines` | Accessibility, UX, and design best practices auditor (built-in) |

> **`design-engineer-mindset`** (sanky369/vibe-building-skills) requires manual upload via Claude Settings → Capabilities → Skills. Install by cloning the repo and uploading `design-engineer-mindset/SKILL.md`.

### Installed Packages (apps/app)

| Package | Version | Purpose |
|---|---|---|
| `torph` | `0.0.5` | `<TextMorph>` — dependency-free animated text morphing for label transitions (Save → Saving → Saved) |
| `web-haptics` | `0.0.6` | Haptic feedback hooks for mobile interactions |

### Planned Custom Utilities (`packages/stores` / `apps/app/src/lib`)

| Utility | Purpose |
|---|---|
| `useAudioStore` | Zustand store for audio feedback — enabled/disabled toggle, volume, play by event type |
| `audioEngine` | Custom audio API (based on existing project, adapted) — plays short sounds on defined action events |

---

## Required Components

These are explicitly called out in the plan and must exist for features to work.

### Primitives / UI Kit (`packages/ui`)

- [ ] **`Button`** — Primary / Secondary / Ghost variants (tactile 3D style per design system)
- [ ] **`Modal`** — Base overlay with backdrop, close-on-Escape, slide-up on mobile / fade-scale on desktop
- [ ] **`Sheet`** — Bottom-sheet wrapper (mobile-first slide-up, used for create/detail panels)
- [ ] **`ConfirmDialog`** — Destructive-action confirmation with custom message + confirm input when required
- [ ] **`Toast`** — Success / error / info toasts (lime aero style, auto-dismiss)
- [ ] **`Avatar`** — Circular user photo with fallback initials, size variants
- [ ] **`Badge`** — Role badge (admin/member), status badge (settled, closed, past)
- [ ] **`Chip`** — Pill-shaped label for tags, categories, emoji+name group chips
- [ ] **`EmptyState`** — Illustration + heading + CTA button — generic wrapper used by all sections
- [ ] **`Skeleton`** — Shimmer loading placeholder — generic block + list variant
- [ ] **`ErrorBoundary`** — Retry boundary with error message
- [ ] **`NavTabs`** — Horizontal tab bar with animated active indicator (lime pill)
- [ ] **`Input`** — Text input with label, error state, border per design system
- [ ] **`Select`** — Dropdown selector (locale, currency, role)
- [ ] **`Textarea`** — Multi-line input with char counter
- [ ] **`Toggle`** — Binary on/off switch (anonymous, multi-choice, dark mode)
- [ ] **`ProgressBar`** — Track + lime fill, labeled, pill-shaped
- [ ] **`Spinner`** — Small inline loading indicator
- [ ] **`OfflineBanner`** — Fixed top bar shown when `navigator.onLine === false`

---

### Auth

- [x] **`AuthProvider`** — `app/src/components/AuthProvider.tsx` — already exists, hydrates Zustand auth store

---

### Groups (`app/src/components/groups/`)

- [ ] **`CreateGroupModal`** — Form: name, emoji picker, currency, locale, optional cover photo
- [ ] **`JoinGroupModal`** — 6-char code input (auto-uppercase) + QR scanner (`jsqr`)
- [ ] **`InviteSheet`** — Monospace code display, copy button, QR code, share link
- [ ] **`GroupSwitcher`** — Horizontal scrollable row of group chips in top nav, sets active group
- [ ] **`GroupCard`** — List item: emoji, name, member count, currency badge
- [ ] **`MemberList`** — Scrollable list of group members with avatar, name, role badge
- [ ] **`MemberRow`** — Single member: avatar, display name, role badge, optional remove/role-change actions

---

### Expenses (`app/src/components/expenses/`)

- [ ] **`ExpenseList`** — Infinite-scroll paginated list of `ExpenseCard`
- [ ] **`ExpenseCard`** — Category emoji, description, amount, "paid by", your share (red/green), settled badge
- [ ] **`AddExpenseModal`** — 3-step flow: amount+description → category → paid-by + split type
- [ ] **`SplitTypeSelector`** — Toggle: Equal / Percentage / Exact, with per-member input rows
- [ ] **`BalanceMatrix`** — Personal net summary + simplified debt list with "Settle Up" buttons
- [ ] **`BalanceCard`** — Net balance for current user, animated counter, color-coded
- [ ] **`CategoryGrid`** — Emoji grid for expense category selection

---

### Polls (`app/src/components/polls/`)

- [ ] **`PollCard`** — Question, creator, status badge, option tiles, live results bar
- [ ] **`PollOptionTile`** — Single/multi-choice interactive tile, your-vote indicator, optimistic update
- [ ] **`LiveResultsBar`** — Animated width bar per option using Motion
- [ ] **`CreatePollModal`** — Template chips, question input, options list (add/remove/reorder), toggles, auto-close picker
- [ ] **`VoterAvatars`** — Stacked avatar chips showing who voted (non-anonymous polls)

---

### Plans / Kanban (`app/src/components/plans/`)

- [ ] **`KanbanBoard`** — 4-column horizontal layout with `@hello-pangea/dnd` DnD context
- [ ] **`KanbanColumn`** — Drop zone, column header, `+` add button, scrollable card list
- [ ] **`PlanCard`** — Draggable: title, description preview, date badge, organizer avatar, attachment indicators
- [ ] **`CreatePlanSheet`** — Title, description, date picker, organizer selector, column selector, photo/voice attach
- [ ] **`PlanDetailPanel`** — Full plan details, status dropdown, attachment viewer/player, edit/delete, create-event CTA
- [ ] **`VoiceRecorder`** — `MediaRecorder` API wrapper: start/stop, live audio level bar, max 60s, playback preview
- [ ] **`AttachmentViewer`** — Photo or audio attachment display/player inside plan detail

---

### Feed (`app/src/components/feed/`)

- [ ] **`FeedItemCard`** — Header (avatar, name, timestamp), photo/voice/text body, context badge, reaction bar, delete
- [ ] **`ReactionBar`** — Emoji chips with counts, toggle your reaction, `+` opens preset picker, bounce animation
- [ ] **`PostPhotoSheet`** — File input, preview + compression, caption, optional link to expense/event/poll
- [ ] **`RecordVoiceSheet`** — `MediaRecorder` record/stop, level animation, playback, caption
- [ ] **`ImageLightbox`** — Full-screen photo overlay, arrow navigation between feed photos, pinch-to-zoom on mobile
- [ ] **`AudioPlayer`** — Waveform visual + play/pause + duration display

---

### Events (`app/src/components/events/`)

- [ ] **`EventCard`** — Title, date+time, location, organizer avatar, RSVP summary, your RSVP badge
- [ ] **`RSVPButtons`** — Yes / Maybe / No with selected state, +1 guest counter, mini avatars per category
- [ ] **`AttendanceConfirmation`** — Checklist of "Yes" RSVPs, confirm button (organizer only)
- [ ] **`CreateEventModal`** — Title, description, date+time picker, location, organizer, pre-fill from poll/plan

---

### Insights (`app/src/components/insights/`)

- [ ] **`WeeklySummaryCard`** — Total spent, top category emoji, top poll result, week label, count-up animation
- [ ] **`LeaderboardCard`** — Three tiles: Most Reliable, Organizer, Most Generous — with crown on #1
- [ ] **`MediaHighlights`** — Horizontal scrollable row of top feed item thumbnails
- [ ] **`FunFactCard`** — Styled callout with fun fact text, gradient background, emoji accent

---

### Shell / Layout (`app/src/components/shell/`)

- [ ] **`TopNav`** — App-level top navigation bar housing `GroupSwitcher` and user avatar
- [ ] **`SideNav`** — Desktop sidebar with section links (Expenses, Polls, Plans, Feed, Events, Insights)
- [ ] **`BottomNav`** — Mobile tab bar equivalent of SideNav
- [ ] **`GroupsProvider`** — Client component that hydrates Zustand group store from server-fetched data

---

## Components We Might Want

Nice-to-have helpers and patterns that aren't explicitly named in the plan but will likely be needed during implementation.

### Generic UI

- [ ] **`DateTimePicker`** — Used in CreatePlanSheet and CreateEventModal — consider a single shared component
- [ ] **`EmojiPicker`** — Inline emoji grid used in CreateGroupModal and potentially elsewhere
- [ ] **`NumberInput`** — Large amount input with formatted display (AddExpenseModal step 1)
- [ ] **`AvatarStack`** — Stacked overlapping avatars with overflow counter (RSVP summaries, voter lists)
- [ ] **`CurrencyDisplay`** — Formatted amount + currency code, respects group locale
- [ ] **`RelativeTime`** — `"2 hours ago"` / `"Hace 2 horas"` — locale-aware, auto-updates
- [ ] **`SectionHeader`** — Consistent section title + optional action button pattern
- [ ] **`PageContainer`** — Standard page wrapper with max-width and padding
- [ ] **`SearchInput`** — Pill search field per design system (used in member selection, expense search)
- [ ] **`Divider`** — Horizontal rule for list separation

### Feedback / States

- [ ] **`SkeletonList`** — Repeated skeleton rows for list loading states
- [ ] **`SkeletonCard`** — Card-shaped shimmer for kanban/feed loading
- [ ] **`ToastProvider`** — Context + imperative API (`toast.success()`, `toast.error()`)
- [ ] **`InlineError`** — Small error message below form fields
- [ ] **`CountUpNumber`** — Animated number increment (Insights page)

### Media / Upload

- [ ] **`ImageUploader`** — Reusable file input → Canvas compress → upload to Supabase Storage (used in profile, groups, feed, plans)
- [ ] **`AudioLevelBar`** — Animated real-time mic level indicator (reused in VoiceRecorder and RecordVoiceSheet)
- [ ] **`ImagePreview`** — Thumbnail with remove button (before upload confirmation)

### QR / Invite

- [ ] **`QRCodeDisplay`** — Wraps `qrcode` npm package into a styled display card
- [ ] **`QRScanner`** — Wraps `getUserMedia` + `jsqr` into a camera view with scan feedback
- [ ] **`InviteCodeInput`** — 6-char split input with auto-uppercase and auto-advance

### Kanban Specific

- [ ] **`DragHandle`** — Visual grip indicator on plan cards
- [ ] **`ColumnHeader`** — Column title + count badge + add button

### Notifications / Push

- [ ] **`PushPermissionPrompt`** — Contextual card asking user to enable notifications (shown once after login)

---

## Notes

### Architecture
- **`packages/ui`** should house only truly app-agnostic primitives (Button, Avatar, Badge, Chip, Input, etc.). Feature components stay in `apps/app/src/components/`.
- All modals and sheets should share the base `Modal` / `Sheet` wrappers for consistent animation and accessibility.
- The `VoiceRecorder` component is reused in both Plans (plan attachments) and Feed (voice posts) — build it once in a shared location.
- `ImageUploader` compress logic (Canvas API) is needed in at least 3 places (profile avatar, feed photo, plan attachment) — extract early.

### Interaction Philosophy (Rauno / Emil Kowalski standard)
- Every interactive element must feel **physically responsive**: press states, spring physics, not flat opacity fades.
- Animations should be **purposeful and short** — 150–250ms for micro-interactions, never decorative.
- `<TextMorph>` from `torph` should be used anywhere a label transitions (button states, counters, status text).
- Haptics via `web-haptics` on all primary actions on mobile: button presses, swipe-to-dismiss, successful submissions, destructive confirms.
- Audio feedback via `audioEngine` on key events: expense added, poll vote cast, balance settled, join group success — always respecting `useAudioStore` enabled state.
- Spring-based transforms preferred over duration-based tweens for drag, hover lift, and modal entrances.
- Every empty state, skeleton, and error state is a designed moment — not an afterthought.
