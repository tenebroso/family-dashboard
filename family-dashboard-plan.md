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

## Phase 0 - Foundations

### Step 0.1 - Initialize the monorepo

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

### Step 0.2 - Bootstrap the client

```
Inside client/, initialize a Vite project with the React TypeScript template.

Install the following dependencies:
- @apollo/client
- graphql
- react-router-dom
- dayjs
- framer-motion
- tailwindcss
- @tailwindcss/vite (or postcss setup)
- lucide-react

Configure tailwind.config.ts with the following custom theme additions:
- colors.gold: "#C9A84C"
- colors.gold-light: "#E8C97A"
- colors.gold-dim: "#8A6F2E"
- colors.surface: "#111111"
- colors.surface-raised: "#1A1A1A"
- colors.surface-card: "#222222"
- colors.ink: "#F5F0E8"
- colors.ink-muted: "#9A9488"

In vite.config.ts, set server.host to "0.0.0.0" and server.port to 5173 so the app
is reachable on the local network from any device.

Configure the Google Fonts import in index.html for:
- "Syne" (weights 400, 700, 800) - display font
- "DM Sans" (weights 300, 400, 500) - body font

Set the default font in tailwind to DM Sans, and create a utility class `.font-display`
mapped to Syne.

Create App.tsx with React Router configured for the following routes:
- "/" -> DashboardPage
- "/chores" -> ChoresPage (placeholder — renders "Chores coming soon")
- "/calendar" -> CalendarPage (placeholder — renders "Calendar coming soon")
- "/message-admin" -> MessageAdminPage (placeholder — renders "Message Admin coming soon")

**DashboardPage must render the final 3-column grid layout from day one**, even though no real widgets exist yet. Use named placeholder cards — dark cards with a centered label — for every widget slot. Placeholder card labels: "Weather", "Upcoming Events", "Word of the Day", "Music", "Message", "Chores Summary". This lets the overall layout be reviewed and adjusted before any real widgets are built. Apply the full Tailwind color theme and grid structure as specified in Phase 8 (3-column on tablet/desktop, stacked on mobile).

Create a persistent top navigation bar component (NavBar.tsx) with:
- App name "HOME" in Syne 800 weight, gold color, left-aligned
- Nav links: Dashboard, Chores, Calendar
- The nav should be fixed at top, dark background, subtle gold bottom border (1px, 20% opacity)
- On mobile, collapse nav links into a hamburger menu

Wrap App.tsx in ApolloProvider pointed at http://localhost:4000/graphql.
```

---

### Step 0.3 - Bootstrap the server

```
Inside server/, initialize a Node.js TypeScript project.

Install the following dependencies:
- express
- @apollo/server
- @apollo/server/express4
- graphql
- @prisma/client
- prisma (dev)
- typescript
- ts-node
- nodemon (dev)
- dotenv
- node-cron
- cors

Create tsconfig.json with strict mode enabled, targeting ES2022, module commonjs.

Create src/index.ts as the entry point that:
- Loads dotenv
- Creates an Express app
- Mounts Apollo Server at /graphql using expressMiddleware
- Serves static files from assets/music at /music
- Starts listening on port 4000, host 0.0.0.0

Create src/schema/ directory with an index.ts that exports a combined typeDefs
and resolvers. Start with a stub Query { ping: String } that returns "pong".

Create src/prisma/schema.prisma with the following models (detailed in Phase 2).
For now, just create the file with the datasource pointing to dev.db in the server root.

Create a .env.example file with placeholders for:
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_REFRESH_TOKEN
- GOOGLE_CALENDAR_ID
- OPEN_METEO_LAT=43.0389
- OPEN_METEO_LNG=-87.9065
- PORT=4000

Add a dev script in package.json: "nodemon --exec ts-node src/index.ts"
```

---

### Step 0.4 - Playwright setup

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

### Step 0.5 - GitHub Actions CI

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

### Demo Checkpoint — Phase 0

Start both dev servers (`npm run dev` in `client/` and `server/`), then verify in the browser:

- `http://localhost:5173` loads and shows the NavBar ("HOME" in gold, nav links).
- Navigating to `/` shows the 3-column Dashboard skeleton with all named placeholder cards visible (Weather, Upcoming Events, Word of the Day, Music, Message, Chores Summary).
- Navigating to `/chores`, `/calendar` shows placeholder text for each.
- `http://localhost:4000/graphql` responds to `{ ping }` with `"pong"`.
- The layout is responsive: resize the browser to mobile width and confirm the cards stack vertically.

---

## Phase 1 - Database Schema and GraphQL Foundation

### Step 1.1 - Prisma schema

```
In server/prisma/schema.prisma, define the following models:

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

### Step 1.2 - GraphQL schema and resolvers scaffold

```
In server/src/schema/, create the following type definition files and wire them
into the combined schema index:

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

### Step 1.3 - Wire stub data into Dashboard shell components

```
Replace each named placeholder card in DashboardPage with a real React component
shell that queries the GraphQL stubs and renders the data. Each shell should be a
thin wrapper — enough to display the returned stub data in a styled card, but without
the full widget logic that comes in later phases. This gives you something to react to
visually before any feature is production-ready.

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

### Demo Checkpoint — Phase 1

With both dev servers running:

- `http://localhost:5173` Dashboard now shows all six widget areas populated with stub data — no placeholder labels anymore.
- Weather card shows "68°F · Partly Cloudy".
- Calendar card lists 5 upcoming event titles.
- Word of the Day card shows "ephemeral".
- Music card shows "Golden Hour — JVKE".
- Message card shows Mom's soccer practice message.
- Chores Summary shows 4 avatar initials (H, R, K, J).
- GraphQL sandbox at `localhost:4000/graphql` can execute every query/mutation and return the stub data.

---

## Phase 2 - Chores Feature

### Step 2.1 - Chores resolvers

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

### Step 2.2 - Chores admin page (server-side, desktop)

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

### Step 2.3 - Chores dashboard page (touch-optimized)

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

### Step 2.4 - Playwright tests for chores

```
Create e2e/tests/chores.spec.ts with the following tests:

Test: "chores page loads with all four people"
  - Navigate to /chores
  - Assert text "Harry", "Ruby", "Krysten", "Jon" all visible

Test: "completing a chore updates the UI"
  - Navigate to /chores
  - Find the first unchecked chore checkbox visible on screen
  - Click it
  - Assert it becomes checked (aria-checked="true" or checked class)
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

### Demo Checkpoint — Phase 2

- `/chores` shows all four people with their seeded chores for today. Tapping a checkbox marks it complete and the progress bar updates instantly (optimistic UI).
- Tapping a completed checkbox unchecks it.
- `/chores-admin` lists all chores per person. Add a chore, confirm it appears. Delete it, confirm it disappears.
- `/` Dashboard Chores Summary shell now shows real completion percentages from the DB (not stub 0.0).

---

## Phase 3 - Calendar Feature

### Step 3.1 - Google Calendar OAuth setup

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

### Step 3.2 - Calendar resolver

```
Implement the Query.calendarEvents resolver in server/src/resolvers/calendar.ts.

- Accept start and end as ISO string arguments.
- Call fetchCalendarEvents from the Google Calendar service.
- Cache results in memory for 15 minutes using a simple Map keyed by "start::end".
  Clear the cache entry after 15 minutes using setTimeout.
- Return the mapped CalendarEvent array.
```

---

### Step 3.3 - Calendar UI

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

### Step 3.4 - Playwright tests for calendar

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

### Demo Checkpoint — Phase 3

> If Google credentials aren't configured yet, the `calendarEvents` resolver should fall back to the hardcoded stub data from Phase 1 rather than returning an error. Add a fallback in the resolver: catch any Google API error and return the stub events.

- `/calendar` loads in Month view. Today's date is visually highlighted.
- Clicking a day with events opens the detail panel. Clicking outside closes it.
- Switching to Week and Day views works. Navigation arrows change the visible period.
- `/` Dashboard Calendar shell shows real (or stub fallback) upcoming events.

---

## Phase 4 - Weather Feature

### Step 4.1 - Weather resolver

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

Implement the Query.weather resolver in server/src/resolvers/weather.ts using this service.
```

---

### Step 4.2 - Weather UI widget

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

### Demo Checkpoint — Phase 4

> If the Open-Meteo API is unavailable, the weather resolver should fall back to the Phase 1 stub data.

- `/` Dashboard Weather card replaced: shows real current temp, condition, feels-like, and the 7-day forecast strip. Today's forecast card has a gold border.
- Weather icons from lucide-react match the condition labels.
- Reload the page twice within 30 minutes — confirm the second load does not make a new API call (check server logs; only the first should fetch).

---

## Phase 5 - Word of the Day

### Step 5.1 - Word of the Day resolver

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

Implement Query.wordOfDay resolver in server/src/resolvers/wordOfDay.ts.
```

---

### Step 5.2 - Word of the Day widget

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

### Demo Checkpoint — Phase 5

- `/` Dashboard Word of the Day card replaced: shows the real word, part of speech, and definition. The word fades/slides in on mount.
- Reload on a new day (or manually clear the DB entry) and confirm a different word appears.

---

## Phase 6 - Music Player

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
Implement Query.dailyTrack in server/src/resolvers/tracks.ts.

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
Implement Query.activeMessage in server/src/resolvers/messages.ts.

Logic:
- Return the most recent Message where isActive = true AND
  (displayUntil is null OR displayUntil > now()).
- If none exists, return null.

Implement Mutation.createMessage(author, body, displayUntil):
- Set all existing active messages to isActive = false first.
- Insert and return the new Message.
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

## Phase 9 - Responsiveness and Touch Polish

### Step 9.1 - Touch and responsive audit

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
