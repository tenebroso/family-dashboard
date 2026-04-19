# Family Dashboard Redesign Plan

## Source Material

The design prototype lives in `family-dashboard/project/Family Dashboard.html` (exported from claude.ai/design). Key design files:
- `family-dashboard/project/styles.css` — full CSS design system
- `family-dashboard/project/tiles.jsx` — HeroTile, WeatherTile, MessageTile, WeekTile
- `family-dashboard/project/components.jsx` — Avatar, PeopleRail, WeatherIcon, shared hooks
- `family-dashboard/project/app.jsx` — App shell, theme/TOD logic
- `family-dashboard/project/data.jsx` — mock data shapes and helpers

Read those files in full before implementing. The HTML prototype is the visual target — match it pixel-for-pixel in the React codebase.

---

## Decisions Made

| Question | Answer |
|---|---|
| Landing page | Person lobby at `/` — "Who are you?" screen routing to `/:personSlug` |
| Person context persistence | localStorage — persists across sessions; "Switch" button returns to lobby |
| Message attribution | Claude infers person from text; falls back to active person |
| Chores on dashboard | Yes — add a chores tile to the dashboard grid |
| Google Calendars | Not yet set up — design for per-person IDs in `.env`, document wiring |
| Grocery list | Google Docs API — create doc via API, show live checklist on dashboard |
| Message thread | Replace old single-message system entirely with multi-message thread |
| Mylo | Add as full family member (route, calendar, chores, thread) |

---

## Design System Reference

### Fonts
Load via Google Fonts in `client/index.html`:
- **Fraunces** — display/serif, weights 300/500/700, optical size axis (`opsz`), `SOFT` axis. Used for: hero date, "Up next" title, large time display.
- **Inter** — UI/body, weights 300/400/500/600. Used for: everything else.

### Color Tokens (CSS custom properties)
```css
:root {
  /* surfaces */
  --canvas: oklch(0.985 0.006 80);
  --surface: oklch(1 0 0);
  --surface-2: oklch(0.975 0.008 80);
  --surface-sunk: oklch(0.955 0.012 80);
  --hairline: oklch(0.89 0.012 80);
  --hairline-soft: oklch(0.94 0.008 80);

  /* ink */
  --ink: oklch(0.22 0.015 60);
  --ink-2: oklch(0.38 0.012 60);
  --ink-3: oklch(0.55 0.012 60);
  --ink-4: oklch(0.72 0.012 60);

  /* accent — JS-driven, shifts by time of day */
  --accent: oklch(0.70 0.14 55);        /* morning default */
  --accent-ink: oklch(0.35 0.13 55);
  --accent-wash: oklch(0.95 0.04 55);
  --accent-wash-2: oklch(0.90 0.07 55);

  /* person colors */
  --p-jon:     oklch(0.62 0.10 250);   /* cobalt */
  --p-krysten: oklch(0.60 0.12 20);    /* terracotta */
  --p-harry:   oklch(0.65 0.12 150);   /* sage */
  --p-ruby:    oklch(0.62 0.13 350);   /* rose */
  --p-mylo:    oklch(0.58 0.12 290);   /* violet */

  /* elevation */
  --shadow-sm: 0 1px 2px oklch(0.2 0.02 60 / 0.04), 0 1px 1px oklch(0.2 0.02 60 / 0.03);
  --shadow-md: 0 2px 4px oklch(0.2 0.02 60 / 0.04), 0 8px 24px oklch(0.2 0.02 60 / 0.06);
  --shadow-lg: 0 4px 12px oklch(0.2 0.02 60 / 0.06), 0 24px 48px oklch(0.2 0.02 60 / 0.08);

  /* radius */
  --r-sm: 10px; --r-md: 16px; --r-lg: 22px; --r-xl: 28px;

  /* type */
  --serif: "Fraunces", ui-serif, Georgia, serif;
  --sans:  "Inter", ui-sans-serif, system-ui, sans-serif;
}
```

Warm and dark theme overrides live on `[data-theme="warm"]` and `[data-theme="dark"]` — see `styles.css` for full values.

### Time-of-Day Accent Shifts
JS sets CSS vars on `documentElement` based on current hour:
- **Morning** (before 12): hue 60, chroma 0.14 — warm apricot
- **Afternoon** (12–18): hue 145, chroma 0.10 — sage green
- **Evening** (after 18): hue 320, chroma 0.11 — plum

### Dashboard Layout
```
┌─────────────────────────────┬──────────────────┐
│                             │   Weather tile   │
│        Hero tile            ├──────────────────┤
│   (left, ~55% width)        │  Family thread   │
├──────────────┬──────────────┴──────────────────┤
│ Chores tile  │     Week calendar (spans)        │
└──────────────┴─────────────────────────────────┘
```
- Desktop: no scroll. Grid fills viewport height.
- iPad/mobile: scrolling permitted.
- Grid: `grid-template-columns: minmax(0, 1.55fr) minmax(320px, 1fr)` top row; full-width bottom row.

---

## Phase 1 — Visual Redesign ✅ COMPLETE

**Goal:** Replace the dark gold/surface design with the new light editorial aesthetic. No logic changes — widgets still pull from existing GraphQL. Dashboard must fit on desktop without scrolling.

### Tasks

1. **`client/index.html`** — Add Google Fonts: Fraunces (opsz, SOFT axes) + Inter.

2. **`client/src/index.css`** — Full rewrite:
   - Replace existing Tailwind `@layer base` tokens with the CSS custom property system above.
   - Add `[data-theme="warm"]` and `[data-theme="dark"]` overrides.
   - Add `.app` shell styles (no-scroll on desktop via `height: 100vh; overflow: hidden`).
   - Add `.tile` base card styles (surface bg, hairline border, shadow-md, r-lg).
   - Keep Tailwind utilities for layout helpers; use CSS vars for all design tokens.

3. **`client/src/hooks/useTimeOfDay.ts`** (new) — Returns `{ tod: "morning"|"afternoon"|"evening", accent }` based on current time. Sets CSS vars on `document.documentElement`. Updates on a 1-min interval.

4. **`client/src/pages/DashboardPage.tsx`** — New grid layout matching the design. Compose tiles:
   - `HeroTile` (left column, full height)
   - `WeatherWidget` (top-right)
   - `MessageWidget` (mid-right, family thread — placeholder thread UI for now, wired in Phase 3)
   - `WeekCalendarTile` (bottom-left, spans into right — see Phase 4 for live data)
   - `ChoresTile` (bottom-left alongside week calendar)

5. **`client/src/components/PersonRail.tsx`** (new) — Avatar chips in a pill container. `aria-pressed` on selected person. Dims unselected when filter active. "Show all" clear button.

6. **Topbar** — Replace `NavBar` with a slim topbar: `Home` wordmark in Fraunces serif, person rail on the right.

7. **`WeatherWidget`** — Rebuild with line-drawn SVG weather icons (sun/cloud/rain as in `components.jsx`), temp in large serif, 4-day forecast strip.

8. **Theme toggle** — Small segmented control (light/warm/dark) in topbar or accessible via a settings button. Persists to localStorage via key `fd-theme`.

### Demoability
Full new visual renders with existing data. All existing GraphQL queries still work.

---

## Phase 2 — Person Lobby & Routes

**Goal:** Anyone visiting the dashboard first identifies themselves. Their selection persists and tags all their actions.

### Tasks

1. **`client/src/contexts/PersonContext.tsx`** (new):
   ```ts
   interface PersonContextValue {
     activePerson: PersonSlug | null   // "harry" | "ruby" | "krysten" | "jon" | "mylo" | null
     setActivePerson: (slug: PersonSlug | null) => void
   }
   ```
   - Reads/writes `localStorage` key `fd-person`.
   - Provide via `<PersonProvider>` wrapping the app.

2. **`client/src/pages/LobbyPage.tsx`** (new):
   - Full-viewport selection screen.
   - Five large touch-friendly cards, one per family member, using person colors.
   - Tapping navigates to `/:personSlug` and calls `setActivePerson`.
   - Editorial heading: "Good [morning/afternoon/evening], who's here?"

3. **Route changes in `App.tsx`**:
   ```tsx
   <Route path="/" element={<LobbyPage />} />
   <Route path="/:personSlug" element={<DashboardPage />} />
   ```
   - `DashboardPage` reads `personSlug` from `useParams()` and syncs with `PersonContext`.
   - Existing sub-routes (`/chores`, `/calendar`, etc.) stay intact.

4. **"Switch" button** in the dashboard topbar — navigates back to `/`.

5. **`server/src/seed.ts`** — Add Mylo:
   ```ts
   { name: "Mylo", color: "#7C5CBF" }  // violet, matches --p-mylo
   ```
   Run `npm run seed` after migrating.

6. **PersonSlug type** — `"harry" | "ruby" | "krysten" | "jon" | "mylo"`. Derive from Person name (lowercase). Store as `slug` field on Person if needed, or compute from name.

### Demoability
Visitor sees lobby → picks Harry → dashboard loads at `/harry` pre-filtered to Harry. Refresh stays on Harry.

---

## Phase 3 — Family Thread (Replace Single Message)

**Goal:** Replace the single "active message" board with a persistent multi-message thread.

### Database Migration

```prisma
model Message {
  id          String   @id @default(cuid())
  personSlug  String                        // who sent it
  body        String
  parsedType  String?                       // "message" | "grocery" | "reminder"
  parsedDone  Boolean  @default(false)      // Claude processing complete
  createdAt   DateTime @default(now())
  // REMOVED: author, displayUntil, isActive
}
```

Run: `npx prisma migrate dev --name family-thread`

### GraphQL Changes (`server/src/schema/messages.ts`, `server/src/resolvers/messages.ts`)

**Remove:**
- `activeMessage` query
- `createMessage(author, body, displayUntil)` mutation
- `updateMessage`, `deleteMessage` mutations

**Add:**
```graphql
type Message {
  id: ID!
  personSlug: String!
  body: String!
  parsedType: String
  parsedDone: Boolean!
  createdAt: String!
}

type Query {
  messages(limit: Int): [Message!]!
}

type Mutation {
  sendMessage(body: String!, personSlug: String!): Message!
}
```

### Client Changes

- **`MessageWidget.tsx`** — Rebuild as scrollable chat thread:
  - Avatar bubble per message (color from `--p-{personSlug}`)
  - Person name + relative time
  - Compose input at bottom; submits `sendMessage` mutation with `activePerson` from `PersonContext`
  - Auto-scroll to bottom on new message
- **Retire:** `MessageAdminPage.tsx`, `MessageShell.tsx`, old `createMessage` usages.

### Demoability
Thread shows seed messages; new messages post and appear immediately with correct person avatar.

---

## Phase 4 — Per-Person Google Calendars

**Goal:** Each person has their own Google Calendar. Events are fetched from all calendars and color-coded.

### Environment Variables

Add to `server/.env`:
```
GOOGLE_CALENDAR_ID_JON=
GOOGLE_CALENDAR_ID_KRYSTEN=
GOOGLE_CALENDAR_ID_HARRY=
GOOGLE_CALENDAR_ID_RUBY=
GOOGLE_CALENDAR_ID_MYLO=
```

**Setup steps (for the user — not automatable):**
1. In Google Calendar, create 5 new calendars named "Jon", "Krysten", "Harry", "Ruby", "Mylo".
2. For each, go to Settings → Share with specific people → add the Google service account email.
3. Copy each calendar's ID (Settings → Integrate calendar → Calendar ID).
4. Paste into `server/.env`.

### Server Changes

**`server/src/services/googleCalendar.ts`:**
- Change from single `GOOGLE_CALENDAR_ID` to an array:
  ```ts
  const CALENDARS = [
    { calendarId: process.env.GOOGLE_CALENDAR_ID_JON,     personSlug: "jon"     },
    { calendarId: process.env.GOOGLE_CALENDAR_ID_KRYSTEN, personSlug: "krysten" },
    { calendarId: process.env.GOOGLE_CALENDAR_ID_HARRY,   personSlug: "harry"   },
    { calendarId: process.env.GOOGLE_CALENDAR_ID_RUBY,    personSlug: "ruby"    },
    { calendarId: process.env.GOOGLE_CALENDAR_ID_MYLO,    personSlug: "mylo"    },
  ].filter(c => c.calendarId)
  ```
- Fetch all active calendars in parallel (Promise.all).
- Tag each event with `personSlug` from its source calendar.
- Cache per-calendar with 15-min TTL (keyed by `calendarId + dateRange`).
- If a calendar ID is missing from `.env`, skip it gracefully.

**GraphQL — `server/src/schema/calendar.ts`:**
```graphql
type CalendarEvent {
  id: ID!
  title: String!
  start: String!
  end: String!
  allDay: Boolean!
  personSlug: String    # which person's calendar this came from
}
```

### Client Changes

- `HeroTile` — filter `todaysEvents` by `personSlug` when person filter active.
- `WeekCalendarTile` — dim events where `personSlug` not in active filter.
- Person rail filter now drives both tiles simultaneously.

### Demoability
While calendar IDs are empty in `.env`, the widget shows "No calendars configured yet" gracefully. Once IDs are added, events appear color-coded per person.

---

## Phase 5 — Claude Message Parsing + Google Docs Grocery List

**Goal:** When a message is sent, Claude classifies it and routes it automatically — grocery items go to a Google Doc, reminders become calendar events, general messages stay in the thread.

### Prerequisites

Add to `server/.env`:
```
ANTHROPIC_API_KEY=
GOOGLE_GROCERY_DOC_ID=    # filled after first run creates the doc
```

Re-run the OAuth token script with expanded scopes (update `server/src/scripts/getGoogleToken.ts`):
```
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/documents
https://www.googleapis.com/auth/drive
```

### Server — Message Parsing

**`server/src/services/messageParser.ts`** (new):

```ts
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic()

interface ParsedMessage {
  type: "grocery" | "reminder" | "message"
  // grocery
  item?: string
  quantity?: string
  // reminder
  eventTitle?: string
  dateText?: string       // natural language: "next Friday", "tomorrow at 3pm"
  personSlug?: string     // inferred from message text; caller provides fallback
}

export async function parseMessage(body: string, senderSlug: string): Promise<ParsedMessage>
```

- System prompt: classify the message, infer person from text if named, fall back to `senderSlug`.
- Use `claude-haiku-4-5-20251001` for cost efficiency (fast classification, not reasoning-heavy).
- Return structured JSON via tool use (not free-text parsing).
- Enable prompt caching on the system prompt (it's static).

**Hook into `sendMessage` resolver:**
```ts
// after saving message to DB
const parsed = await parseMessage(body, personSlug)
await db.message.update({ where: { id }, data: { parsedType: parsed.type } })

if (parsed.type === "grocery") {
  await appendGroceryItem(parsed.item!, parsed.quantity, personSlug)
}
if (parsed.type === "reminder") {
  await createCalendarEvent(parsed.personSlug ?? personSlug, parsed.eventTitle!, parsed.dateText!)
}
```

### Google Docs — Grocery List

**`server/src/services/groceryDoc.ts`** (new):

- `ensureDoc()` — if `GOOGLE_GROCERY_DOC_ID` is empty, create a new Doc titled "Family Grocery List", write the ID back to `.env`, set `process.env.GOOGLE_GROCERY_DOC_ID`.
- `appendGroceryItem(name, quantity?, addedBy)` — appends a line: `☐ {qty} {name} (added by {addedBy})`.
- `getGroceryItems()` — reads the doc body, parses each `☐`/`☑` line into `{ text, checked, addedBy }`.
- `toggleGroceryItem(lineIndex, checked)` — replaces `☐` with `☑` or vice versa at that line.

**GraphQL additions:**
```graphql
type GroceryItem {
  index: Int!
  text: String!
  checked: Boolean!
  addedBy: String!
}
type Query {
  groceryItems: [GroceryItem!]!
}
type Mutation {
  toggleGroceryItem(index: Int!, checked: Boolean!): Boolean!
}
```

**Dashboard grocery tile (`client/src/components/GroceryTile.tsx`):**
- Checklist of items with person avatar of who added them.
- Tap to toggle checked (strikethrough).
- Polls every 60s or refetches after `sendMessage`.

### Google Calendar — Event Creation from Messages

**`server/src/services/calendarWriter.ts`** (new):
- Uses `chrono-node` (`npm install chrono-node`) to parse `dateText` → `Date`.
- Inserts event via Google Calendar API: `POST /calendars/{calendarId}/events`.
- Uses the per-person `GOOGLE_CALENDAR_ID_*` from Phase 4.
- Returns the created event ID.

**Thread confirmation chip:**
- After a `reminder` message is processed, update `parsedDone: true` on the Message.
- `MessageWidget` shows a small chip on that bubble: "📅 Added to [Person]'s calendar" or "🛒 Added to grocery list".

### Demoability
Send "Add oat milk to the grocery list" → appears in grocery tile and Google Doc within ~2 seconds. Send "Remind Harry about soccer practice Friday at 4pm" → event created on Harry's Google Calendar; thread bubble shows confirmation chip.

---

---

## Status & Next Steps

### Completed

- **Phase 1** — Visual redesign shipped. Light editorial aesthetic, Fraunces/Inter fonts, new CSS token system, HeroTile, TopBar with person rail + theme toggle, restyled WeatherWidget/MessageWidget/CalendarWeekWidget/ChoresSummaryShell, no-scroll desktop grid layout.

- **Phase 2** — Person Lobby & Routes complete. `PersonContext` (localStorage-backed), `LobbyPage` "who's here?" picker, `/:personSlug` routes, `DashboardPage` syncs person from URL params, "Switch" button in TopBar, Mylo added to seed.

- **Phase 3** — Family Thread complete. Message model migrated (added `personSlug`, removed `author`/`displayUntil`/`isActive`). `messages(limit)` query and `sendMessage(body, personSlug)` mutation live. `MessageWidget` rebuilt as scrollable chat thread with avatar bubbles, compose input, auto-scroll. `MessageAdminPage` and `MessageShell` deleted.

- **Phase 4** — Per-person Google Calendars complete. `googleCalendar.ts` fetches all 5 per-person calendar IDs in parallel, tags each event with `personSlug`, 15-min per-calendar cache. `CalendarEvent` type has `personSlug`. CalendarWeekWidget dims events for inactive persons. Apple CalDAV integrated (skips gracefully if `APPLE_ID`/`APPLE_APP_PASSWORD` not set).

### Bug fixes applied (post-Phase 4)

- **Chore routes color fix** — `/:person/chores` now uses `var(--p-{name})` CSS variables for all avatar circles, progress bars, and borders instead of raw DB hex values.
- **Calendar Sunday logic** — `CalendarWeekWidget` defaults to next week when today is Sunday (planning day).
- **Calendar "Full view" link** — now navigates to `/:person/calendar` (person-scoped URL).
- **Sub-route `.app` styling** — `/:person/chores`, `/:person/calendar`, etc. now get the ambient gradient background and TopBar (same as `/:person` dashboard).
- **CORS / server crash** — moved `cors()` to `/graphql` route per Apollo Server v4 docs; Apple CalDAV early-returns `[]` when credentials absent (prevents tsdav crash on large date ranges).
- **Calendar stub fallback** — fixed condition that caused an empty array to be cached when Google Calendar fails but Apple returns `[]` (no credentials). Now correctly falls through to stub events when Google is down.

- **Phase 5** — Claude Message Parsing complete. `messageParser.ts` (Claude Haiku tool-use, prompt caching), `calendarWriter.ts` (chrono-node + GCal insert), `sendMessage` resolver hooks async parse → dispatches grocery items to DB or calendar events to GCal. `MessageWidget` shows confirmation chips (`parsedDone`). `GroceryWidget` supports tap-to-toggle with polling. Grocery list backed by SQLite (already implemented in Phase 4 work).

### Up next — Phase 6

No Phase 6 defined in this plan yet.

---

## Phase Sequencing

```
Phase 1 (visual redesign)        ──────────────────────────────┐
Phase 2 (lobby + routes)         ──────────────────────────────┤  can run in parallel
Phase 3 (family thread)          ──────────────────────────────┘
Phase 4 (per-person calendars)   ── requires Phase 2 (personSlug)
Phase 5 (Claude + Docs + Events) ── requires Phase 3 (sendMessage) + Phase 4 (calendar IDs)
```

Each phase must end **demoable** per `CLAUDE.md` requirements. Stub any unimplemented dependencies with realistic hardcoded data — never `null` or `[]`.

---

## Files to Create (net new)

| File | Phase |
|---|---|
| `client/src/hooks/useTimeOfDay.ts` | 1 |
| `client/src/components/PersonRail.tsx` | 1 |
| `client/src/contexts/PersonContext.tsx` | 2 |
| `client/src/pages/LobbyPage.tsx` | 2 |
| `server/src/services/messageParser.ts` | 5 |
| `server/src/services/groceryDoc.ts` | 5 |
| `server/src/services/calendarWriter.ts` | 5 |
| `client/src/components/GroceryTile.tsx` | 5 |

## Files to Significantly Modify

| File | Phase | Change |
|---|---|---|
| `client/index.html` | 1 | New fonts |
| `client/src/index.css` | 1 | Full rewrite — new design tokens |
| `client/src/App.tsx` | 2 | New routes, PersonProvider wrapper |
| `client/src/pages/DashboardPage.tsx` | 1+2 | New grid layout, person context |
| `client/src/components/MessageWidget.tsx` | 3 | Thread UI replacing single message |
| `server/src/seed.ts` | 2 | Add Mylo |
| `server/prisma/schema.prisma` | 3 | Message model changes |
| `server/src/schema/messages.ts` | 3 | New queries/mutations |
| `server/src/resolvers/messages.ts` | 3+5 | New resolver + parser hook |
| `server/src/services/googleCalendar.ts` | 4 | Multi-calendar support |
| `server/src/schema/calendar.ts` | 4 | Add personSlug to CalendarEvent |
| `server/src/scripts/getGoogleToken.ts` | 5 | Expanded OAuth scopes |

## Files to Delete

| File | Reason |
|---|---|
| `client/src/pages/MessageAdminPage.tsx` | Retired by Phase 3 |
| `client/src/components/MessageShell.tsx` | Retired by Phase 3 |
| `client/src/components/RemindersWidget.tsx` | Reminders handled by Claude parsing in Phase 5 |
| `client/src/pages/RemindersPage.tsx` | Same |

---

## Environment Variables (complete set after all phases)

```bash
# Existing
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
OPEN_METEO_LAT=43.0389
OPEN_METEO_LNG=-87.9065
PORT=4000

# Phase 4 — per-person calendar IDs
GOOGLE_CALENDAR_ID_JON=
GOOGLE_CALENDAR_ID_KRYSTEN=
GOOGLE_CALENDAR_ID_HARRY=
GOOGLE_CALENDAR_ID_RUBY=
GOOGLE_CALENDAR_ID_MYLO=

# Phase 5
ANTHROPIC_API_KEY=
GOOGLE_GROCERY_DOC_ID=    # auto-populated on first run if empty
```
