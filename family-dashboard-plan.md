# Family Dashboard - Claude Code Agent Project Plan

> **Target:** Raspberry Pi 5 (4GB RAM), served on local WiFi, accessible from phone, tablet, or desktop browser.
> **Stack:** React + TypeScript + Vite (client), Node.js + Express + Apollo Server + GraphQL (server), Prisma + SQLite (data), Playwright (tests), PM2 (process management).
> **Design:** Dark background, gold accents, minimal and editorial. Hip but legible for kids.

---

## Demoability Principle

**Every phase must end in a state where you can open a browser and interact with real UI.**

Rules that apply throughout all phases:

1. **Stub resolvers return realistic hardcoded data** — never `null` or `[]`. If the real data source isn't wired yet, the resolver returns plausible fake data so the UI renders. Stubs are replaced with real implementations as each feature phase completes.
2. **The Dashboard page exists from Phase 0** with the final 3-column layout. Widget slots start as named placeholder cards and are replaced with real components as phases complete. This means the overall layout can be reviewed and adjusted early.
3. **Each phase ends with a Demo Checkpoint** — a list of browser actions that verify the phase is working correctly before moving on.

---

## Repository Structure

```
family-dashboard/
  client/                  # React + TypeScript + Vite
  server/                  # Node.js + Express + Apollo + Prisma
  e2e/                     # Playwright tests
  .github/workflows/       # CI
  docker-compose.yml       # Optional local dev
  README.md
```

---

## Phase 0 - Foundations ✅ Complete

### Step 0.1 - Initialize the monorepo ✅

```
Initialize a new Git repository called family-dashboard.

Create the following directory structure:
- client/
- server/
- e2e/
- .github/workflows/

At the root, create:
- .gitignore (node_modules, dist, .env, *.db, server/assets/music)
- README.md with a brief project description
- A root package.json with workspaces: ["client", "server", "e2e"]
```

---

### Step 0.2 - Bootstrap the client ✅

**Implementation notes (affects all subsequent client work):**

- **Tailwind v4** — no `tailwind.config.ts`. Theme is defined in `client/src/index.css` using the `@theme {}` block with CSS custom properties (`--color-gold`, `--color-surface`, etc.) and `@import "tailwindcss"`. The `@tailwindcss/vite` plugin is added to `vite.config.ts` instead of a postcss setup. Tailwind utility classes like `bg-surface`, `text-gold`, `border-gold/20` work as expected.

- **Apollo Client v4** — import paths changed from v3. Future client code must use:
  ```ts
  import { ApolloClient, InMemoryCache, gql } from '@apollo/client'
  import { ApolloProvider, useQuery, useMutation } from '@apollo/client/react'
  import { HttpLink } from '@apollo/client/link/http'
  // NOTE: useQuery/useMutation are in '@apollo/client/react', not '@apollo/client'
  ```
  `ApolloClient` requires an explicit `link` property — the `uri` shorthand no longer works:
  ```ts
  new ApolloClient({ link: new HttpLink({ uri: '...' }), cache: new InMemoryCache() })
  ```

- **DashboardPage** renders the final 3-column grid with six `PlaceholderCard` components (Weather, Upcoming Events, Word of the Day, Music, Message, Chores Summary). Grid is `md:grid-cols-3`, stacks to single column on mobile.

- **NavBar** is fixed at top with hamburger menu on mobile (full-width dropdown, 52px-tall items). Nav links use React Router `NavLink` with active gold styling.

---

### Step 0.3 - Bootstrap the server ✅

**Implementation notes (affects all subsequent server work):**

- **`@types/express` must be pinned to v4** — `@types/express@^4.17.25` is in devDependencies. Do not upgrade to v5 types; they break `expressMiddleware` from `@apollo/server/express4` because the type signatures diverge from Express 4 runtime.

- All files created: `src/index.ts`, `src/schema/index.ts` (ping stub), `prisma/schema.prisma` (datasource only), `.env.example`, `tsconfig.json` (strict, ES2022, commonjs).

- `server/assets/music/` directory exists and is gitignored.

---

### Step 0.4 - Playwright setup ✅

```
Inside e2e/, initialize a Node.js TypeScript project.

Install:
- @playwright/test
- playwright

Create playwright.config.ts with:
- baseURL: "http://localhost:5173"
- testDir: "./tests"
- reporter: "html"
- Two projects: chromium (desktop) and Mobile Chrome with viewport 390x844

Create e2e/tests/smoke.spec.ts with:
- Test: "dashboard loads" - navigates to "/" and asserts the text "HOME" is visible
- Test: "navigation links present" - asserts links for Dashboard, Chores, Calendar exist
- Test: "server ping" - fetches http://localhost:4000/graphql with a { ping } query
  and asserts the response contains "pong"
```

---

### Step 0.5 - GitHub Actions CI ✅

```
Create .github/workflows/ci.yml that:
- Triggers on push and pull_request to main
- Installs Node 20
- Runs npm ci at root
- Runs tsc --noEmit in both client/ and server/
- Starts the server in background (ts-node src/index.ts &)
- Starts the client dev server in background (vite &)
- Waits for both ports (4000 and 5173) to be ready
- Runs Playwright tests
- Uploads the Playwright HTML report as an artifact
```

---

### Demo Checkpoint — Phase 0 ✅ Verified

All items confirmed. 3 Playwright smoke tests pass (dashboard loads, navigation links present, server ping).

---

## Phase 1 - Database Schema and GraphQL Foundation ✅ Complete

### Step 1.1 - Prisma schema ✅

```
server/prisma/schema.prisma already exists with the datasource block configured.
Add the following models to it:

model Person {
  id        String   @id @default(cuid())
  name      String
  color     String   // hex color for avatar/accent
  chores    Chore[]
  createdAt DateTime @default(now())
}

model Chore {
  id          String            @id @default(cuid())
  title       String
  personId    String
  person      Person            @relation(fields: [personId], references: [id])
  dayOfWeek   Int[]             // 0=Sun, 1=Mon ... 6=Sat. Empty array means every day.
  isActive    Boolean           @default(true)
  completions ChoreCompletion[]
  createdAt   DateTime          @default(now())
}

model ChoreCompletion {
  id          String   @id @default(cuid())
  choreId     String
  chore       Chore    @relation(fields: [choreId], references: [id])
  completedAt DateTime @default(now())
  dateKey     String   // "YYYY-MM-DD" - which day this completion is for
  @@unique([choreId, dateKey])
}

model Message {
  id          String    @id @default(cuid())
  author      String
  body        String
  displayUntil DateTime?
  createdAt   DateTime  @default(now())
  isActive    Boolean   @default(true)
}

model WordOfDay {
  id         String   @id @default(cuid())
  word       String
  definition String
  partOfSpeech String
  dateKey    String   @unique // "YYYY-MM-DD"
}

model Track {
  id       String  @id @default(cuid())
  title    String
  artist   String
  filename String  @unique // e.g. "song-title.mp3"
  dateKey  String? // set to "YYYY-MM-DD" when this track is the daily pick
}

Run: npx prisma migrate dev --name init
Run: npx prisma generate

Create server/src/seed.ts that inserts:
- Four Person records: Harry (#4A90D9 blue), Ruby (#E8607A pink), Krysten (#7BC67E green), Jon (#C9A84C gold)
- A handful of example Chores for each person (2-3 each, with varied dayOfWeek arrays)
- No completions

Add a seed script in package.json: "ts-node src/seed.ts"
Run the seed.
```

---

### Step 1.2 - GraphQL schema and resolvers scaffold ✅

```
server/src/schema/index.ts already exists with a ping stub. Replace its contents
entirely. Create a server/src/schema/types/ subdirectory with the following files
and wire them into the schema index:

types/person.graphql.ts - exports typeDefs:
  type Person {
    id: ID!
    name: String!
    color: String!
    chores(dayOfWeek: Int): [Chore!]!
    completionRate(dateKey: String!): Float!
  }

types/chore.graphql.ts - exports typeDefs:
  type Chore {
    id: ID!
    title: String!
    person: Person!
    dayOfWeek: [Int!]!
    isActive: Boolean!
    isCompletedOn(dateKey: String!): Boolean!
  }

  input CreateChoreInput {
    title: String!
    personId: String!
    dayOfWeek: [Int!]!
  }

  input UpdateChoreInput {
    id: ID!
    title: String
    dayOfWeek: [Int!]
    isActive: Boolean
  }

types/calendar.graphql.ts:
  type CalendarEvent {
    id: ID!
    title: String!
    start: String!
    end: String!
    allDay: Boolean!
    description: String
    color: String
  }

types/weather.graphql.ts:
  type WeatherDay {
    date: String!
    tempHigh: Float!
    tempLow: Float!
    conditionCode: Int!
    conditionLabel: String!
    precipitation: Float!
  }

  type CurrentWeather {
    temp: Float!
    feelsLike: Float!
    conditionCode: Int!
    conditionLabel: String!
    humidity: Int!
  }

  type WeatherData {
    current: CurrentWeather!
    forecast: [WeatherDay!]!
  }

types/message.graphql.ts:
  type Message {
    id: ID!
    author: String!
    body: String!
    displayUntil: String
    createdAt: String!
  }

types/track.graphql.ts:
  type Track {
    id: ID!
    title: String!
    artist: String!
    url: String!
  }

types/word.graphql.ts:
  type WordOfDay {
    word: String!
    definition: String!
    partOfSpeech: String!
  }

Root Query and Mutation:
  type Query {
    people: [Person!]!
    person(id: ID!): Person
    calendarEvents(start: String!, end: String!): [CalendarEvent!]!
    weather: WeatherData!
    activeMessage: Message
    dailyTrack: Track!
    wordOfDay: WordOfDay!
  }

  # ChoreCompletion is needed as a GraphQL type since completeChore returns it.
  # Add this to types/chore.graphql.ts alongside Chore:
  type ChoreCompletion {
    id: ID!
    choreId: String!
    dateKey: String!
    completedAt: String!
  }

  type Mutation {
    completeChore(choreId: ID!, dateKey: String!): ChoreCompletion!
    uncompleteChore(choreId: ID!, dateKey: String!): Boolean!
    createChore(input: CreateChoreInput!): Chore!
    updateChore(input: UpdateChoreInput!): Chore!
    deleteChore(id: ID!): Boolean!
    createMessage(author: String!, body: String!, displayUntil: String): Message!
  }

Implement stub resolvers for every query and mutation. **Stubs must return realistic hardcoded sample data** so the Dashboard placeholder cards can immediately be replaced with real-looking widgets in Phase 2+. Specific stub return values:

- `people`: 4 Person objects — Harry (#4A90D9), Ruby (#E8607A), Krysten (#7BC67E), Jon (#C9A84C). Each with 2–3 example chores (isCompletedOn returns false, completionRate returns 0.0).
- `calendarEvents`: 5 hardcoded events spread across the next 14 days with realistic titles ("Soccer practice", "Dentist - Ruby", "Family dinner", "Grocery run", "Harry's birthday").
- `weather`: current temp 68°F, feelsLike 65°F, condition "Partly Cloudy", humidity 55%; 7-day forecast with plausible highs/lows and mixed conditions.
- `activeMessage`: a Message object with author "Mom", body "Don't forget: soccer practice at 4pm today!", createdAt now.
- `dailyTrack`: a Track with title "Golden Hour", artist "JVKE", url "/music/golden-hour.mp3".
- `wordOfDay`: word "ephemeral", partOfSpeech "adjective", definition "Lasting for a very short time."
- Mutations (`completeChore`, `uncompleteChore`, etc.): return success values without touching the DB.

Confirm the server starts and GraphQL sandbox is accessible at localhost:4000/graphql.
```

---

### Step 1.3 - Wire stub data into Dashboard shell components ✅

```
Replace each named placeholder card in DashboardPage with a real React component
shell that queries the GraphQL stubs and renders the data. Each shell should be a
thin wrapper — enough to display the returned stub data in a styled card, but without
the full widget logic that comes in later phases. This gives you something to react to
visually before any feature is production-ready.

Apollo Client v4 hook imports (use these in every shell component going forward):
  import { useQuery, useMutation, gql } from '@apollo/client'

Create the following thin shell components (these will be fleshed out in later phases):

WeatherShell: renders current temp and condition label from the weather query.
CalendarShell: renders a list of the next 5 event titles from calendarEvents.
WordShell: renders the word and definition from wordOfDay.
MusicShell: renders track title and artist from dailyTrack (no audio yet).
MessageShell: renders the message body and author from activeMessage.
ChoresSummaryShell: renders 4 avatar initials with each person's name from people query.

DashboardPage imports and positions all six shells in the 3-column grid layout.
Each shell card uses the standard dark card style (surface-raised bg, gold border,
12px radius, 20px padding).
```

---

### Demo Checkpoint — Phase 1 ✅ Verified

All items confirmed. Dashboard shows all six widget areas populated with stub data. Weather shows "68°F · Partly Cloudy · Milwaukee". Calendar lists 5 upcoming events with relative dates (Tomorrow, Tuesday, etc.). Word of the Day shows "ephemeral". Music card shows atmospheric gradient with ghost play button + "Golden Hour — JVKE". Message shows Mom's soccer practice message. Chores shows 4 colored avatar initials (H, R, K, J) evenly spaced.

**Implementation notes:**
- `dayOfWeek` stored as JSON string in SQLite (not `Int[]` — SQLite doesn't support arrays). Parse with `JSON.parse()` in resolvers.
- Apollo Client v4: `useQuery`/`useMutation` are in `@apollo/client/react`, NOT `@apollo/client`. See updated import paths in CLAUDE.md.
- Calendar query variables must be memoized (`useMemo`) — creating `new Date()` inside the component body causes infinite re-fetches because variable references change on every render.

---

### Step 1.4 - UI/UX Review: Dashboard first impression ✅

**Completed.** Screenshots taken at 1280×800, 768×1024, 390×844. Improvements applied:
- WeatherShell: giant temperature (4.5rem), Milwaukee label, humidity row, 7-day forecast placeholder strip
- CalendarShell: "Next 14 days" subtitle, relative event dates (Tomorrow/Tuesday/Apr 26), "View full calendar →" footer
- MusicShell: atmospheric dark gradient fills the card, diagonal stripe texture, ghost play button circle
- ChoresSummaryShell: `justify-between` keeps 4 avatars on one row at all viewports
- All card labels now use `text-gold` consistently
- DashboardPage wrapper divs have `min-h-0` to prevent flex overflow

This is the most important design review in the project. Every widget built in later phases inherits proportions and visual language from what's established here. Take time to get it right.

**Tools:** Use the playwright plugin (`browser_take_screenshot`, `browser_resize`, `browser_snapshot`) to capture the current state. Use the `frontend-design` skill to evaluate and generate improvements.

```
1. Take screenshots at three viewports using browser_resize + browser_take_screenshot:
   - 1280×800 (desktop)
   - 768×1024 (iPad portrait)
   - 390×844 (iPhone)

2. Evaluate each screenshot against these criteria:
   - Card proportions: do the six cards feel balanced in the grid? Are any too tall/short?
   - Typography: is Syne rendering with visible weight contrast against DM Sans?
   - Gold color: does it read as an accent, not a dominant color? Are borders visible but subtle?
   - Whitespace: does the dashboard feel "deliberate" or cramped?
   - Dark theme: is the surface/surface-raised distinction visible between page bg and cards?
   - Data legibility: can you read the stub data at a glance, or is it too small/muted?

3. Use the frontend-design skill to improve any shell component that fails the above criteria.
   Focus on: card padding, font sizes and weights, the ink/ink-muted contrast for body text,
   and whether the gold accent reads correctly at the border opacity used (15-20%).

4. Re-screenshot after changes and confirm improvements before moving to Phase 2.
```

---

## Phase 2 - Chores Feature ✅ Complete

### Step 2.1 - Chores resolvers ✅

```
Implement the following resolvers in server/src/resolvers/chores.ts:

Query.people:
  - Return all Person records from Prisma, ordered by name.

Query.person(id):
  - Return a single Person by id.

Person.chores(dayOfWeek):
  - Return all Chores for the person where isActive = true.
  - If dayOfWeek argument is provided, filter to chores where dayOfWeek array
    contains that value OR dayOfWeek array is empty (meaning every day).

Person.completionRate(dateKey):
  - Count chores scheduled for that day of week for this person.
  - Count ChoreCompletions for that person on dateKey.
  - Return completions / total as a float (0.0 to 1.0). Return 0 if no chores.

Chore.isCompletedOn(dateKey):
  - Return true if a ChoreCompletion exists for this choreId and dateKey.

Mutation.completeChore(choreId, dateKey):
  - Upsert a ChoreCompletion record. Return it.

Mutation.uncompleteChore(choreId, dateKey):
  - Delete the ChoreCompletion for choreId + dateKey if it exists. Return true.

Mutation.createChore(input):
  - Create and return a new Chore.

Mutation.updateChore(input):
  - Update and return an existing Chore by id.

Mutation.deleteChore(id):
  - Set isActive = false on the Chore (soft delete). Return true.
```

---

### Step 2.2 - Chores admin page (server-side, desktop) ✅

```
Create client/src/pages/ChoresAdminPage.tsx.

Add route "/chores-admin" in App.tsx.

This page is for Jon and Krysten to manage chores. It does not need to be mobile-optimized
but should be usable on desktop or tablet.

Features:
- Display all four people in tabs or columns.
- For each person, list their active chores with the days of week they apply to.
- Each chore has an Edit button (inline edit: change title or days) and a Delete button.
- An "Add Chore" button opens a form: title input, day-of-week checkboxes (Sun-Sat),
  and a person selector.
- Use Apollo mutations: createChore, updateChore, deleteChore.
- Optimistic UI updates for delete and toggle.
- Style consistently with the dark/gold theme but this page can be slightly denser.
```

---

### Step 2.3 - Chores dashboard page (touch-optimized) ✅

```
Create client/src/pages/ChoresPage.tsx.

This is the primary family-facing chores view.

Layout:
- Four person cards displayed in a 2x2 grid on tablet/desktop, 1-column stack on mobile.
- Each card shows: person's name in Syne font, their accent color as a left border or
  top highlight, and a list of today's chores.
- Each chore row: checkbox on the left (minimum 44x44px touch target), chore title,
  subtle strikethrough animation when completed.
- At the bottom of each card: a small progress indicator (e.g. "3 / 5 done") and a
  thin progress bar in the person's accent color.

Behavior:
- On mount, query people with today's chores (pass today's dayOfWeek index as argument)
  and isCompletedOn set to today's dateKey (YYYY-MM-DD).
- Tapping a checkbox fires completeChore or uncompleteChore mutation.
- Use optimistic UI so the checkbox responds instantly.
- Use dayjs to compute today's dateKey and dayOfWeek index.

At the top of the page, show a summary row:
- Four small avatar circles (first letter of name, person's color background)
- Under each: their completion percentage for today as a number with a thin arc or bar.

Animation:
- Use framer-motion to animate the checkbox check with a small scale + opacity transition.
- Animate the progress bar width change smoothly.
```

---

### Step 2.4 - Playwright tests for chores ✅

```
Create e2e/tests/chores.spec.ts with the following tests:

Test: "chores page loads with all four people"
  - Navigate to /chores
  - Assert text "Harry", "Ruby", "Krysten", "Jon" all visible

Test: "completing a chore updates the UI"
  - Navigate to /chores
  - Find the first unchecked chore checkbox visible on screen
  - Click it
  - Assert it becomes checked (aria-label changes to "completed")
  - Assert the progress indicator increments

Test: "unchecking a completed chore reverts it"
  - Navigate to /chores
  - Find a checked chore, click it
  - Assert it is no longer checked

Test: "chores admin - add a chore"
  - Navigate to /chores-admin
  - Click "Add Chore"
  - Fill in title "Test Chore Playwright"
  - Select person "Harry"
  - Select day "Monday"
  - Submit
  - Assert "Test Chore Playwright" appears in Harry's list

Test: "chores admin - delete a chore"
  - Navigate to /chores-admin
  - Find "Test Chore Playwright" in Harry's list
  - Click Delete
  - Assert it is no longer visible
```

---

### Demo Checkpoint — Phase 2 ✅ Verified

All items confirmed. `/chores` shows all four people with today's seeded chores (correctly filtered by day of week — e.g. Saturday shows only Saturday-eligible chores). Checkbox tap marks complete instantly (optimistic UI via local Set state) and reverts on error. Progress bar animates. `/chores-admin` shows 2-column grid of person cards with all chores and day labels; Add Chore form works; Edit/Delete work with refetchQueries. Dashboard Chores Summary card now shows real DB completion percentages (0% at start of day) and navigates to `/chores` on tap.

**Implementation notes:**
- Resolver structure split: `server/src/schema/index.ts` now only exports `typeDefs`. All resolvers live in `server/src/resolvers/index.ts` (merges domain resolvers with stubs) and `server/src/resolvers/chores.ts` (real Prisma). **Future phases must add domain resolvers to `server/src/resolvers/` and import them in `resolvers/index.ts`, not in schema/index.ts.**
- **Critical `dayOfWeek` parsing rule**: `Person.chores` returns raw Prisma records (with `dayOfWeek` as JSON string). The `Chore.dayOfWeek` field resolver calls `parseDayOfWeek()`. Do NOT pre-parse `dayOfWeek` to `number[]` in `Person.chores` — it causes a double-parse failure in the field resolver (`JSON.parse([1,3])` → `"1,3"` → invalid JSON → returns `[]`).
- **Optimistic UI pattern**: Apollo's `optimisticResponse` is complex when field resolvers take arguments (e.g. `isCompletedOn(dateKey:)`). Instead, use a local `Set<string>` for completed chore IDs, toggle it immediately, fire the mutation, and revert the Set on error. Admin mutations use `refetchQueries: ['QueryName']` for simplicity.
- `ChoreCompletion` upsert uses Prisma's `@@unique([choreId, dateKey])` constraint via `prisma.choreCompletion.upsert({ where: { choreId_dateKey: { choreId, dateKey } } })`.

---

### Step 2.5 - UI/UX Review: Chores pages

The chores page is the highest-frequency interaction in the app — kids will tap it daily. It needs to feel fast, clear, and satisfying to use.

**Tools:** playwright plugin for screenshots and interaction inspection; `frontend-design` skill for visual improvements.

```
1. Navigate to /chores. Take screenshots at mobile (390×844) and tablet (768×1024).
   The mobile view is the primary target — this is how kids will use it.

2. Evaluate the person cards:
   - Do the four cards feel distinct from each other (color accents working)?
   - Is the person's name immediately readable without scanning?
   - Can you tell at a glance who has completed their chores vs. who hasn't?
   - Does the progress bar read as meaningful, or is it too thin/subtle?

3. Evaluate the checkbox interaction:
   - Use browser_snapshot to inspect the checkbox area. Is the 44×44px touch target
     visually obvious, or does the tappable area feel uncertain?
   - Does the strikethrough animation on completion feel satisfying?

4. Evaluate the top summary row (avatar circles + completion percentages):
   - Are the avatar initials large enough and readable?
   - Is the completion percentage formatted clearly (e.g., "60%" not "0.6")?

5. Navigate to /chores-admin. This page is for adults on desktop.
   - Does the dense layout still feel organized, not chaotic?
   - Are the Edit/Delete buttons clearly distinguished?

6. Use the frontend-design skill to improve any element that feels visually weak.
   Typical fixes at this stage: progress bar height, card header weight,
   avatar size, and whether person accent colors need more saturation to pop
   against the dark background.

7. Re-screenshot and confirm before moving to Phase 3.
```

---

## Phase 3 - Calendar Feature ✅ Complete

### Step 3.1 - Google Calendar OAuth setup ✅

```
Create server/src/services/googleCalendar.ts.

This file handles all Google Calendar API interaction.

Install: googleapis

Implementation:
- Create an OAuth2 client using GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET from env.
- Set the refresh token from GOOGLE_REFRESH_TOKEN env var.
- Export a function fetchCalendarEvents(start: Date, end: Date): Promise<CalendarEvent[]>
  that calls the Google Calendar API events.list endpoint for GOOGLE_CALENDAR_ID,
  maps the results to the CalendarEvent GraphQL type, and returns them.
- Map Google event colors to a hex value. Use a default gold (#C9A84C) if no color set.
- Handle all-day events (date vs dateTime in Google's response).

Add a helper script server/src/scripts/getGoogleToken.ts that:
- Prints the Google OAuth authorization URL to the console (with calendar.readonly scope)
- Reads the authorization code from stdin
- Exchanges it for tokens
- Prints the refresh token

Document in README.md how to run this script once to obtain the refresh token and
store it in .env.
```

---

### Step 3.2 - Calendar resolver ✅

```
Create server/src/resolvers/calendar.ts.
Import it in server/src/resolvers/index.ts and spread its Query into the Query resolver map,
replacing the STUB_CALENDAR_EVENTS stub. (Follow the same pattern as chores.ts.)

Implement the Query.calendarEvents resolver:
- Accept start and end as ISO string arguments.
- Call fetchCalendarEvents from the Google Calendar service.
- Cache results in memory for 15 minutes using a simple Map keyed by "start::end".
  Clear the cache entry after 15 minutes using setTimeout.
- Return the mapped CalendarEvent array.
- If the Google API throws (missing credentials, network error), catch and return
  the hardcoded STUB_CALENDAR_EVENTS from resolvers/index.ts so the UI never breaks.
```

---

### Step 3.3 - Calendar UI ✅

```
Create client/src/pages/CalendarPage.tsx.

This page has three views toggled by a segmented control at the top: Month, Week, Day.
Default view is Month.

Month View:
- A 7-column grid showing all days of the current month.
- Days from the previous and next month shown in muted style to fill the grid.
- Each day cell shows up to 3 event titles truncated to one line. A "+N more" indicator
  if there are more.
- Today's date cell has a gold ring or filled gold background.
- Tapping any day that has events opens a slide-up drawer (bottom sheet on mobile,
  side panel on desktop) showing full event details for that day.
- Month navigation: left/right chevron buttons to go to previous/next month.

Week View:
- 7-column grid showing Mon-Sun of the current week.
- Each column shows events as stacked cards.
- Tapping an event card opens a detail modal.
- Week navigation: previous/next buttons.

Day View:
- Single day, hour-by-hour timeline from 6am to 10pm.
- Events rendered as positioned blocks spanning their duration.
- All-day events shown at the top.
- Tapping an event opens a detail modal.

Event Detail (used by all views):
- Shows title, date, time range (or "All day"), description if present.
- Rendered in a bottom sheet (mobile) or centered modal (desktop/tablet).
- Close button and tap-outside-to-dismiss.

Data fetching:
- When the view changes or navigation occurs, fire the calendarEvents query with
  the appropriate start/end range for the current view window.
- Show a subtle loading skeleton while fetching.

Style notes:
- Use the Syne font for day numbers and month/week headers.
- Event chips: small, rounded, use the event's color property with 20% opacity background
  and full opacity text/left-border.
- The overall grid should feel editorial and precise, not bubbly.
```

---

### Step 3.4 - Playwright tests for calendar ✅

```
Create e2e/tests/calendar.spec.ts with the following tests:

Test: "calendar page loads in month view"
  - Navigate to /calendar
  - Assert the month/week/day segmented control is visible
  - Assert today's date is visible and has a distinct style (aria-label or test id)

Test: "switching to week view"
  - Navigate to /calendar
  - Click "Week" in the segmented control
  - Assert a 7-column week grid is visible

Test: "switching to day view"
  - Navigate to /calendar
  - Click "Day"
  - Assert an hourly timeline is visible

Test: "tapping a day with events opens detail panel"
  - Navigate to /calendar
  - Find the first day cell that contains an event chip
  - Click it
  - Assert a detail panel or modal is visible with event content
  - Click outside or the close button
  - Assert the panel is dismissed
```

---

### Demo Checkpoint — Phase 3 ✅ Verified

All items confirmed. `/calendar` loads in Month view with today's date highlighted. Clicking a day with events opens the detail panel; clicking outside closes it. Switching to Week and Day views works. Navigation arrows change the visible period. Dashboard Calendar shell shows real upcoming events from Google Calendar.

**Implementation notes:**
- **Google OAuth OOB flow is deprecated.** The original `getGoogleToken.ts` used `urn:ietf:wg:oauth:2.0:oob` as the redirect URI — Google killed this in 2022. The script was rewritten to spin up a local HTTP server at `http://localhost:3000/callback` and capture the code automatically. **Future phases: if Google auth is needed for any new service (e.g. Google Photos, Gmail), use the same local-server pattern — never OOB.**
- **Refresh tokens expire for apps in "Testing" mode.** Google OAuth apps not promoted to "Production" in Cloud Console issue refresh tokens that expire after 7 days. If the calendar stops returning data (`unauthorized_client` error), re-run `npx ts-node src/scripts/getGoogleToken.ts` from `server/` and update `GOOGLE_REFRESH_TOKEN` in `.env`. Ensure `http://localhost:3000/callback` is listed as an authorized redirect URI in Google Cloud Console.
- **`prompt: 'consent'` required for new refresh token.** When re-running the token script, the `prompt: 'consent'` flag forces Google to issue a fresh `refresh_token`. Without it, Google may return only an access token if the user has already authorized the app.
- The calendar resolver has automatic stub fallback — if Google throws for any reason, `STUB_CALENDAR_EVENTS` are returned so the UI never breaks.
- `dayjs/plugin/isoWeek` is required for `startOf('isoWeek')` in the Week view (Mon-start). Import and extend before use.
- Month view query range: grid starts on the Sunday before the 1st of the month and covers 42 days (6 full weeks). Query uses `gridStart` to `gridStart + 41 days` — not just the calendar month boundaries — so events in the leading/trailing cells are fetched correctly.

---

### Step 3.5 - UI/UX Review: Calendar ✅

The calendar is the most visually complex page. It must read as editorial — precise grid, confident typography, no noise.

**Tools:** playwright plugin (`browser_take_screenshot`, `browser_resize`, `browser_navigate`, `browser_click`, `browser_snapshot`); `frontend-design` skill.

```
1. Navigate to /calendar. Take a screenshot of Month view at 1280×800.
   Evaluate:
   - Does the month grid feel structured and readable, or cluttered?
   - Is today's date highlight (gold ring/fill) immediately obvious?
   - Are event chips readable at a glance, or do they need more contrast/padding?
   - Do previous/next month day cells feel properly muted vs. current month cells?

2. Click a day with events. Screenshot the detail panel/bottom sheet.
   - Does the event detail panel feel polished (not like a plain browser dialog)?
   - Is the close button obvious and large enough?

3. Use browser_click to switch to Week view. Screenshot at 1280×800 and 768×1024.
   - Do event cards in the week view have enough vertical space to read the title?
   - Is the current day column visually distinct?

4. Switch to Day view. Screenshot.
   - Does the hour-by-hour timeline feel proportional?
   - Are all-day events clearly separated from timed events at the top?

5. Resize to mobile (390×844) and screenshot Month view.
   - Are day cells large enough to tap comfortably (min 40px)?
   - Does the grid still read as a calendar, or does it collapse into illegibility?

6. Use frontend-design to improve any view that doesn't meet the "editorial and precise"
   bar. Focus on: day number font size, event chip padding, grid line subtlety,
   and the segmented control (Month/Week/Day) styling.

7. Re-screenshot all three views after changes. Confirm before moving to Phase 4.
```

---

## Phase 4 - Weather Feature ✅ Complete

### Step 4.1 - Weather resolver ✅

```
Create server/src/services/weather.ts.

Using the Open-Meteo API (no API key required):
Base URL: https://api.open-meteo.com/v1/forecast

Parameters to use:
- latitude: from OPEN_METEO_LAT env (43.0389)
- longitude: from OPEN_METEO_LNG env (-87.9065)
- current: temperature_2m, apparent_temperature, weathercode, relativehumidity_2m
- daily: temperature_2m_max, temperature_2m_min, weathercode, precipitation_sum
- temperature_unit: fahrenheit
- wind_speed_unit: mph
- forecast_days: 7
- timezone: America/Chicago

Create a function interpretWeatherCode(code: number): string that maps WMO weather
codes to human-readable labels:
- 0: "Clear"
- 1,2,3: "Partly Cloudy"
- 45,48: "Foggy"
- 51,53,55: "Drizzle"
- 61,63,65: "Rain"
- 71,73,75: "Snow"
- 80,81,82: "Showers"
- 95: "Thunderstorm"
- Default: "Cloudy"

Cache the weather response for 30 minutes.

Create server/src/resolvers/weather.ts with the Query.weather resolver using this service.
Import it in server/src/resolvers/index.ts and replace the STUB_WEATHER entry.
If the API throws, fall back to STUB_WEATHER so the UI never breaks.
```

---

### Step 4.2 - Weather UI widget ✅

```
Create client/src/components/WeatherWidget.tsx.

This is a card used on the Dashboard page (not a full page).

Layout:
- Top section: large current temperature in Syne 800 weight, condition label, feels-like.
  Location label "Milwaukee" in small muted text.
- Bottom section: horizontal scroll strip of 7 day forecast cards.
  Each day: abbreviated day name (Mon, Tue...), a weather icon (use lucide-react icons
  mapped from condition labels), high/low temps.
- Today's forecast card is slightly highlighted with a gold border.

Weather icon mapping using lucide-react:
- "Clear" -> Sun
- "Partly Cloudy" -> CloudSun
- "Cloudy", "Foggy" -> Cloud
- "Rain", "Drizzle", "Showers" -> CloudRain
- "Snow" -> CloudSnow
- "Thunderstorm" -> CloudLightning

Style: The widget should look refined, almost like an editorial weather card. Numbers
are the heroes - large, clear, Syne font.
```

---

### Demo Checkpoint — Phase 4 ✅ Verified

All items confirmed. `/` Dashboard Weather card replaced: shows real current temp (41°F), Partly Cloudy, feels like 31°, Humidity 63% — live from Open-Meteo. 7-day forecast strip renders with lucide-react condition icons and high/low temps. Today's card (SAT) has a gold border highlight. Stub fallback in `weather.ts` activates if API is unreachable.

**Implementation notes:**
- `server/src/services/weather.ts` — Open-Meteo API, no API key required. 30-min in-memory cache (`{ data, expiresAt }` pattern, same as calendar).
- `server/src/resolvers/weather.ts` — wraps the service with stub fallback, imported into `resolvers/index.ts` replacing the old `STUB_WEATHER` inline object.
- `client/src/components/WeatherWidget.tsx` — replaces WeatherShell. Queries full `forecast` array. `dayAbbr()` parses date strings as noon local time to avoid UTC-offset off-by-one on day names. `isToday()` compares ISO date slices.
- **Google Calendar falls back to stubs in dev** when network is unavailable (`ENOTFOUND oauth2.googleapis.com`). This is expected and working as designed — calendar stub fallback is healthy.

---

## Phase 5 - Word of the Day ✅ Complete

### Step 5.1 - Word of the Day resolver ✅

```
Create server/src/services/wordOfDay.ts.

Use the Free Dictionary API: https://api.dictionaryapi.dev/api/v2/entries/en/{word}

Maintain a hardcoded list of 100 interesting, age-appropriate words in the service file
(mix of words suitable for kids and adults - nothing obscure or inappropriate).

Logic:
- Compute today's dateKey (YYYY-MM-DD).
- Check WordOfDay table for a record with today's dateKey. If found, return it.
- If not found, pick a word from the list deterministically using:
  hash(dateKey) % wordList.length
- Fetch the definition from the Free Dictionary API.
- Store the result in WordOfDay table.
- Return the word, its first definition, and part of speech.

Handle API failures gracefully: if the API is down, return a hardcoded fallback
definition for the chosen word (store fallbacks inline with the word list).

Create server/src/resolvers/wordOfDay.ts with the Query.wordOfDay resolver.
Import it in server/src/resolvers/index.ts and replace the STUB_WORD entry.
```

---

### Step 5.2 - Word of the Day widget ✅

```
Create client/src/components/WordWidget.tsx.

A compact card for the Dashboard page.

Layout:
- Label "WORD OF THE DAY" in small uppercase tracked gold text.
- The word itself in Syne 700, large, cream/ink color.
- Part of speech in small italic muted text.
- Definition in DM Sans, regular weight, slightly muted.

Animation: on mount, the word fades and slides up with framer-motion (subtle, 300ms).
```

---

### Demo Checkpoint — Phase 5 ✅ Verified

- `/` Dashboard Word of the Day card replaced: shows the real word, part of speech, and definition fetched from the Free Dictionary API. The word fades/slides in on mount via framer-motion.
- Word is cached in the `WordOfDay` DB table by `dateKey` — first request of the day hits the API, subsequent requests return the cached record instantly.
- Reload on a new day (or manually clear the DB entry) and confirm a different word appears.

**Implementation notes:**
- **Word list stored inline with fallbacks**: Each entry in `WORD_LIST` carries its own `fallbackDefinition` and `fallbackPartOfSpeech`. If the Free Dictionary API is down, the service returns the inline fallback — no second API call, no null values.
- **Deterministic daily selection**: `hash(dateKey) % WORD_LIST.length` uses a simple polynomial hash over the date string characters. Same date always picks the same word, even after a server restart.
- **TypeScript `res.json()` typing**: `fetch().json()` returns `Promise<unknown>` in strict mode. Cast with `await res.json() as T` — not `const data: T = await res.json()` (the latter fails strict type-checking).
- **`framer-motion` is already installed** in `client/package.json` from a prior phase. No reinstall needed.

---

## Phase 6 - Music Player ← Next

### Step 6.1 - Track management

```
Create server/assets/music/ directory.

Place 30 MP3 files here. The filenames should be URL-safe (no spaces, use hyphens).

Create server/src/scripts/importTracks.ts that:
- Reads all .mp3 files from server/assets/music/
- For each file, inserts a Track record into the database if one does not already exist
  with that filename. Title and artist should be parsed from the filename using the
  convention "artist - title.mp3". If the filename does not match this convention,
  use the filename (without extension) as the title and "Unknown" as the artist.
- Prints a summary of how many tracks were imported.

Add script in package.json: "ts-node src/scripts/importTracks.ts"

Run this script after placing MP3 files in the directory.
```

---

### Step 6.2 - Daily track resolver

```
Create server/src/resolvers/tracks.ts with the Query.dailyTrack resolver.
Import it in server/src/resolvers/index.ts and replace the STUB_TRACK entry.
If no tracks exist in the DB (importTracks not yet run), fall back to STUB_TRACK.

Logic:
- Get today's dateKey.
- Check if any Track already has dateKey = today. If so, return it with
  url: "/music/{filename}".
- If not, get all tracks that have never been picked (dateKey is null).
  If all tracks have been picked, reset all dateKeys to null and start over.
- Pick one at random from the unpicked pool.
- Set that track's dateKey to today.
- Return it.

This ensures each song plays for one full day before cycling, and the full library
is exhausted before repeating.
```

---

### Step 6.3 - Music player widget

```
Create client/src/components/MusicWidget.tsx.

Layout:
- A rectangular card with a generated visual background: use the track title to
  deterministically pick one of 5 gradient combinations (dark, rich colors with
  gold accents).
- Track title in Syne 700, artist name below in DM Sans muted.
- A single centered play/pause button (large, circular, gold fill).
- A subtle progress bar along the bottom of the card that advances as the song plays.

Behavior:
- Uses an HTML5 <audio> element (ref-controlled, not rendered to DOM).
- On pressing play, fetches the dailyTrack query if not already loaded, then plays.
- Play/pause toggle.
- Shows "Today's Song" label above the track title.
- Do not autoplay on page load.
- The song does not change if the user navigates away and returns during the same day.
  Apollo cache handles this.
```

---

### Demo Checkpoint — Phase 6

> For this checkpoint, at least one MP3 must be in `server/assets/music/` and `importTracks` must have been run.

- `/` Dashboard Music card replaced: shows track title, artist, and gradient background. The play button is visible.
- Pressing play starts audio. The button changes to pause.
- Pressing pause stops audio.
- Reloading the page within the same day shows the same track (Apollo cache / DB persistence).

---

## Phase 7 - Custom Message

### Step 7.1 - Message resolver

```
Create server/src/resolvers/messages.ts.
Import it in server/src/resolvers/index.ts: spread its Query into the Query map and
its Mutation into the Mutation map, replacing the STUB_MESSAGE and createMessage stub entries.

Also add Mutation.deactivateMessage(id: ID!): Boolean! to both the GraphQL schema
(server/src/schema/index.ts Mutation type) and the messages resolver.

Query.activeMessage logic:
- Return the most recent Message where isActive = true AND
  (displayUntil is null OR displayUntil > now()).
- If none exists, return null.

Mutation.createMessage(author, body, displayUntil):
- Set all existing active messages to isActive = false first.
- Insert and return the new Message.

Mutation.deactivateMessage(id):
- Set isActive = false on the Message with that id. Return true.
```

---

### Step 7.2 - Message admin page

```
Create client/src/pages/MessageAdminPage.tsx.

Route: /message-admin (not linked from the main nav - accessed by direct URL).

Layout:
- Simple, clean form.
- "Post a Message to the Dashboard" heading.
- Author field (text input, e.g. "Mom", "Dad").
- Message body (textarea, max 280 characters with live character counter).
- Display Until (optional date picker - if empty, message shows indefinitely).
- Submit button.

On submit:
- Fire createMessage mutation.
- Show a success confirmation: "Your message is now live on the dashboard."
- Clear the form.

Also show below the form: the currently active message (if any) displayed as a preview
card with the option to deactivate it (set isActive = false via a new
Mutation.deactivateMessage(id: ID!): Boolean! mutation and resolver).
```

---

### Step 7.3 - Message widget

```
Create client/src/components/MessageWidget.tsx.

If activeMessage query returns null, render nothing (return null).

If a message exists:
- A card with a subtle left gold border.
- Small label "MESSAGE" in uppercase gold.
- Message body in DM Sans, readable size.
- Author and timestamp in small muted text below.
- A gentle entrance animation (framer-motion fade + slide from bottom).
```

---

### Demo Checkpoint — Phase 7

- `/message-admin` renders the form. Fill in author and body and submit.
- Navigate to `/` — the Message card replaced: shows the new message with author and timestamp.
- Return to `/message-admin` — the active message preview is shown with a Deactivate button. Click it.
- Navigate to `/` — the Message card is gone (returns null, renders nothing).

---

## Phase 8 - Dashboard Page

### Step 8.1 - Dashboard layout

```
Create client/src/pages/DashboardPage.tsx.

This is the home screen - the view that stays open on the iPad all day.

Layout (responsive):
- Desktop/Tablet landscape (>= 768px): 3-column CSS Grid
  - Column 1 (wide): Calendar mini-view (this week's events as a simple list) + Message widget
  - Column 2 (wide): WeatherWidget (top) + WordWidget (below)
  - Column 3 (narrow): MusicWidget (top) + Chores summary (bottom - compact version
    showing just each person's completion percentage for today, tappable to go to /chores)
- Mobile (< 768px): single column stack in this order:
  WeatherWidget, MessageWidget, ChoresWidget (compact), MusicWidget, WordWidget

Design requirements:
- Background: #111111 (surface)
- Page has no visible scroll on tablet landscape - everything fits in viewport height.
  On mobile, natural scroll is fine.
- Each widget card: background #1A1A1A, border 1px solid rgba(201,168,76,0.15),
  border-radius 12px, padding 20px.
- Cards have a very subtle box-shadow using gold at 5% opacity.
- The layout should feel like a well-designed control panel or editorial spread.
  Not a generic dashboard. Deliberate whitespace.

Dashboard mini calendar (not the full CalendarPage):
- Show a compact "Upcoming" list: next 5 events from today forward.
- Each event: dot in event color, event title, date/time.
- "View Calendar" link that navigates to /calendar.

Chores summary widget (compact, for Dashboard only):
- Four avatar circles (letter + person color).
- Under each: their name and today's completion percentage.
- Tapping navigates to /chores.

Data queries on Dashboard:
- weather (no args)
- calendarEvents for next 14 days
- activeMessage
- dailyTrack
- wordOfDay
- people (with today's completionRate)

Use Apollo useQuery for each. Show skeleton loaders for each card while loading.
Skeleton style: dark base (#222) with a subtle shimmer animation (CSS keyframe).
```

---

### Step 8.2 - Skeleton loaders

```
Create client/src/components/SkeletonCard.tsx.

A reusable component that accepts width, height, and borderRadius props.
Renders a dark rectangle with a left-to-right shimmer animation:
- Background: linear-gradient(90deg, #1A1A1A 25%, #252525 50%, #1A1A1A 75%)
- Background-size: 200% 100%
- CSS keyframe animation: shimmer, 1.5s ease-in-out infinite
  - 0%: background-position 200% 0
  - 100%: background-position -200% 0

Use this in each widget for loading states.
```

---

### Demo Checkpoint — Phase 8

- `/` on a 1280×800 desktop: 3-column layout visible, no scroll required to see all widgets.
- `/` on a 768×1024 iPad viewport (use browser DevTools): same 3-column layout, all cards visible.
- `/` on a 390×844 mobile viewport: single-column stack — Weather, Message, Chores Summary, Music, Word of the Day.
- Each widget card has the correct dark background, gold border, and shadow.
- Skeleton shimmer loaders are visible for 1–2 seconds on a hard reload before data arrives.
- Tapping the Chores Summary navigates to `/chores`.
- "View Calendar" link on the mini-calendar navigates to `/calendar`.

---

### Step 8.3 - UI/UX Review: Full dashboard composition

This is the most comprehensive design review in the project. For the first time all widgets are live simultaneously. The goal is to ensure the dashboard reads as a cohesive, deliberate design — not a grid of unrelated cards. Fix anything that breaks the composition before Phase 9 adds touch polish on top.

**Tools:** playwright plugin for screenshots at all viewports; `frontend-design` skill for targeted improvements; `browser_evaluate` to throttle the network and inspect skeleton states.

```
1. DESKTOP (1280×800) — Hard reload and screenshot immediately to capture skeleton state.
   Then wait for data and screenshot the fully-loaded state.
   Evaluate loaded state:
   - Overall composition: do the three columns feel visually balanced?
     The weather widget (numbers-first) and the calendar list are very different
     information densities — does the grid still feel intentional, not accidental?
   - Column heights: does any card feel disproportionately tall or short?
     Adjust min-heights or flex ratios in DashboardPage if needed.
   - Is there a clear visual hierarchy? (What does the eye land on first?)
   - Does the gold accent color appear consistently across all cards?
   - Is the inter-card spacing (gap) right — breathing room without wasted space?

2. IPAD PORTRAIT (768×1024) — Screenshot. This is the "hero" viewport; the app will
   likely live on an iPad in portrait mode all day.
   - Does the full dashboard fit without vertical scroll?
   - Are all six cards visible above the fold?
   - Do card proportions work at this viewport, or do some cards feel too compressed?

3. IPAD LANDSCAPE (1024×768) — Screenshot.
   - Same checks as portrait but wider. Does 3-column layout still work?

4. MOBILE (390×844) — Screenshot. Scroll through the full single-column stack.
   - Does the mobile stack feel like a natural reading order
     (most important info first)?
   - Do cards have enough internal padding at mobile widths?

5. SKELETON STATE — Use browser_evaluate to add `network: 'slow-3g'` throttling,
   hard reload, and screenshot the skeleton state.
   - Does the shimmer animation look polished?
   - Are skeleton card heights appropriate (do they approximate the real content size)?

6. CROSS-WIDGET CONSISTENCY — Use browser_snapshot to inspect the DOM and verify:
   - All cards use the same border opacity (gold/15 or gold/20 — pick one, be consistent).
   - All card headings use the same font/weight/case pattern.
   - All "label" text (e.g. "WORD OF THE DAY", "MESSAGE", "TODAY'S SONG") uses the
     same typographic treatment (uppercase, tracked, ink-muted).

7. Use frontend-design to address any layout, proportion, or consistency issues found.
   This is the time to make the dashboard genuinely beautiful — Phase 9 only handles
   responsiveness mechanics, not visual refinement.

8. Final screenshot at all four viewports. Sign off before moving to Phase 9.
```

---

## Phase 9 - Responsiveness and Touch Polish

### Step 9.1 - Touch and responsive audit

**Tools:** Use the playwright plugin throughout this step — `browser_resize` to switch viewports, `browser_take_screenshot` to capture each state, `browser_snapshot` to inspect element bounding boxes, and `browser_click`/`browser_tap` to verify interactions feel responsive. Use `frontend-design` for any interaction patterns that need redesigning (e.g., if the bottom sheet animation needs rework).

```
Audit every interactive element across all pages and verify:

1. All tap targets are at minimum 44x44px. Use a utility class touch-target that adds
   min-width and min-height of 44px, and sufficient padding.

2. The NavBar hamburger menu on mobile:
   - Opens a full-width dropdown (not sidebar) below the nav bar.
   - Each nav item is at least 52px tall.
   - Tap anywhere outside closes it.

3. Calendar day cells on mobile are large enough to tap comfortably (min 40px height).

4. Chore checkboxes: the entire row (not just the checkbox icon) should be tappable.

5. The music player play button: minimum 56x56px.

6. All modals and bottom sheets:
   - Have a visible close button (44x44px minimum).
   - Close on backdrop tap.
   - On mobile they slide up from bottom (transform: translateY animation).
   - On desktop they are centered modals with backdrop blur.

7. Verify the dashboard page on a 390x844 (iPhone 14) viewport using Playwright
   mobile project and assert no horizontal scroll occurs.

8. Verify on a 768x1024 (iPad) viewport.

9. Verify on a 1280x800 (desktop) viewport.
```

---

### Step 9.2 - Playwright responsive tests

```
Add to e2e/tests/responsive.spec.ts:

Test: "dashboard - no horizontal scroll on mobile"
  - Use Mobile Chrome project (390x844)
  - Navigate to "/"
  - Assert document.body.scrollWidth <= window.innerWidth

Test: "dashboard renders on iPad viewport"
  - Set viewport to 768x1024
  - Navigate to "/"
  - Assert all four widget sections are visible

Test: "chores - tap target size"
  - Navigate to /chores on Mobile Chrome
  - Find each chore row, assert bounding box height >= 44
```

---

### Demo Checkpoint — Phase 9

- Open browser DevTools to iPhone 14 (390×844) and navigate to `/chores`. Tap each chore row — the full row responds (not just the icon). No horizontal scroll.
- Open to iPad (768×1024) and confirm the same. All tap targets are at least 44px tall.
- Open the NavBar hamburger on mobile — the dropdown covers the full width with tall items. Tapping outside closes it.
- Open a Calendar event detail on mobile — it slides up from the bottom. Tapping outside closes it.
- Run the Playwright responsive tests: `npx playwright test tests/responsive.spec.ts`.

---

## Phase 10 - Raspberry Pi Deployment

### Step 10.1 - Production build

```
In client/package.json, add a build script: "vite build"
Output goes to client/dist/.

In server/src/index.ts, add logic to serve client/dist/ as static files when
NODE_ENV=production. The Express app should serve index.html for all non-API routes
(SPA fallback).

In server/package.json, add:
- "build": "tsc -p tsconfig.json"
- "start": "node dist/index.js"

Create a root-level build script in the root package.json:
"build": "npm run build --workspace=client && npm run build --workspace=server"

Create a root-level start script:
"start": "NODE_ENV=production node server/dist/index.js"

After building, the entire app is served from a single Node process on port 4000.
```

---

### Step 10.2 - PM2 configuration

```
Create ecosystem.config.js at the root:

module.exports = {
  apps: [{
    name: "family-dashboard",
    script: "./server/dist/index.js",
    env: {
      NODE_ENV: "production",
      PORT: 4000
    },
    watch: false,
    autorestart: true,
    max_memory_restart: "400M"
  }]
}

Document in README.md the following Pi setup steps:
1. Install Node 20 via nvm on the Pi
2. Install PM2 globally: npm install -g pm2
3. Clone the repo to ~/family-dashboard
4. Copy .env to server/.env
5. Run: npm ci (from root)
6. Run: npm run build (from root)
7. Run: npx prisma migrate deploy (from server/)
8. Run: npm run seed (from server/) if first install
9. Run: npm run importTracks (from server/) after placing MP3s in assets/music/
10. Start: pm2 start ecosystem.config.js
11. Persist: pm2 save && pm2 startup (run the output command as sudo)

Access the app from any device on the home network at: http://<pi-ip>:4000
Optionally set a static IP on the Pi and create a local DNS entry so it's accessible
at http://dashboard.local or similar.
```

---

### Step 10.3 - Final Playwright E2E suite

```
Create e2e/tests/full-e2e.spec.ts:

This test suite simulates a real family usage session.

Test: "full dashboard flow"
  - Navigate to "/"
  - Assert weather widget is visible with a temperature value
  - Assert word of day card is visible with a word
  - Assert music widget is visible with a play button
  - Click the play button, assert it becomes a pause button

Test: "complete a chore and see dashboard update"
  - Navigate to /chores
  - Note Harry's current completion percentage
  - Find Harry's first unchecked chore and tap it
  - Assert it is now checked
  - Assert Harry's completion percentage has increased

Test: "post a message and see it on dashboard"
  - Navigate to /message-admin
  - Fill author: "Test"
  - Fill body: "Playwright test message"
  - Submit
  - Navigate to "/"
  - Assert "Playwright test message" is visible

Test: "calendar navigation"
  - Navigate to /calendar
  - Assert current month name is visible
  - Click next month arrow
  - Assert a different month name is visible
  - Click "Week" toggle
  - Assert week view is rendered
```

---

### Demo Checkpoint — Phase 10

- From another device on the home network (phone or tablet), navigate to `http://<pi-ip>:4000`.
- The full Dashboard renders. All widgets show live data.
- Navigate to `/chores`, complete a chore on the phone, reload on desktop — the completion persists.
- Run `pm2 status` on the Pi and confirm the process is online.
- Reboot the Pi (`sudo reboot`), wait for it to come back, and verify the app is still running without manual intervention.

---

## Phase 11 - Cron Jobs and Maintenance

### Step 11.1 - Server-side scheduled tasks

```
Create server/src/cron.ts.

Using node-cron, schedule the following jobs and call this file from src/index.ts:

1. Daily word refresh - runs at 00:01 every day:
   - Calls the wordOfDay service to pre-fetch and cache tomorrow's word.
   - This avoids the first user of the day experiencing a slow load.

2. Daily track assignment - runs at 00:01 every day:
   - Calls the dailyTrack resolver logic to pre-assign tomorrow's track.

3. Weather cache clear - runs every 30 minutes:
   - Clears the in-memory weather cache so the next request fetches fresh data.

4. Weekly chore reminder log - runs every Sunday at 20:00:
   - Logs a summary to the console of each person's chore completion rate for the week.
   - This is for visibility only in v1. In a future version this could send a notification.

Document each cron job with a comment explaining its schedule and purpose.
```

---

### Demo Checkpoint — Phase 11

- Check server logs the morning after deployment — confirm the 00:01 cron jobs ran and a new word/track was pre-assigned.
- Reload `/` after midnight — the Word of the Day and Music track have changed without any manual intervention.
- Wait (or temporarily trigger) the Sunday 20:00 cron and confirm the completion rate summary appears in `pm2 logs`.
- Reload the weather card twice within 30 minutes; the second load should hit the cache (no new API call visible in logs). Wait 31 minutes and reload — a fresh fetch should occur.

---

## Summary of All Playwright Tests

| File | Tests |
|---|---|
| smoke.spec.ts | App loads, nav present, server ping |
| chores.spec.ts | Load, complete, uncomplete, admin add, admin delete |
| calendar.spec.ts | Month load, week view, day view, event detail |
| responsive.spec.ts | Mobile no-scroll, iPad render, tap target sizes |
| full-e2e.spec.ts | Weather, word, music, chore flow, message post, calendar nav |

---

## UI/UX Review Milestones

| Step | Scope | Primary focus |
|---|---|---|
| 1.4 | Dashboard shells | First impression, card proportions, typography hierarchy, gold accent balance |
| 2.5 | Chores pages | Touch target clarity, progress readability, person color differentiation |
| 3.5 | Calendar | Grid legibility, event chip density, view-switch consistency, mobile tap areas |
| 8.3 | Full dashboard | Compositional balance across all 6 widgets, cross-widget consistency, skeleton quality |
| 9.1 | All pages | Responsive mechanics, touch target sizes, bottom sheet/modal interactions |

**Tools used in all reviews:**
- playwright plugin — `browser_take_screenshot`, `browser_resize`, `browser_snapshot`, `browser_click`, `browser_evaluate`
- `frontend-design` skill — visual evaluation and component improvement

---

## Environment Variables Reference

```
# server/.env

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GOOGLE_CALENDAR_ID=       # e.g. yourfamily@gmail.com

OPEN_METEO_LAT=43.0389
OPEN_METEO_LNG=-87.9065

PORT=4000
NODE_ENV=development
```

---

## Stretch Goals (Post-Launch)

| Feature | Notes |
|---|---|
| Second Google Calendar | Add a second GOOGLE_CALENDAR_ID_2 env var and merge results |
| Temporal workflow for chore resets | Replace node-cron with a Temporal workflow - good learning project |
| Kiosk mode on iPad | Guided Access + Safari full-screen + auto-wake Shortcut |
| Strava widget | You have Client ID 166016 - add a "Jon's last run" card |
| SMS message input | Twilio webhook -> createMessage mutation |
| Dark/light mode toggle | Probably not needed given fixed display context |
