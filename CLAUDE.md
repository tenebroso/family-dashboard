# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Demoability Requirement

Every phase must end demoable. Stub GraphQL resolvers return realistic hardcoded sample data (never `null`/`[]`) so the UI renders even before real services are wired. The Dashboard page exists from Phase 0 with the final grid layout — widget slots start as placeholder cards and are replaced phase by phase. See the "Demoability Principle" section in `family-dashboard-plan.md` for details.

## Project Overview

Family dashboard running on a Raspberry Pi 5 (local WiFi), accessible from any device. The full implementation plan is in `family-dashboard-plan.md`.

**Stack:** React + TypeScript + Vite (client) · Node.js + Express + Apollo Server + GraphQL (server) · Prisma + SQLite · Playwright (E2E) · PM2 (process management on Pi)

## Commands

### Root (after setup)
```bash
npm ci              # Install all workspace dependencies
npm run build       # Build client and server
npm start           # Production: NODE_ENV=production node server/dist/index.js
```

### Client (`cd client`)
```bash
npm run dev         # Vite dev server at http://0.0.0.0:5173
npm run build       # Build to dist/
npx tsc --noEmit    # Type-check only
```

### Server (`cd server`)
```bash
npm run dev         # nodemon --exec ts-node src/index.ts (port 4000)
npm run build       # tsc
npm run seed        # ts-node src/seed.ts
npm run importTracks  # ts-node src/scripts/importTracks.ts
npx prisma migrate dev --name <name>
npx prisma generate
npx prisma studio   # DB browser at localhost:5555
```

### E2E Tests (`cd e2e`)
```bash
npm test            # Playwright (requires both servers running)
npx playwright test --project=chromium  # Desktop only
npx playwright test tests/smoke.spec.ts  # Single file
```

## Architecture

### Monorepo structure
```
family-dashboard/
  client/           # React SPA (port 5173 in dev)
  server/           # Node.js + Apollo (port 4000)
  e2e/              # Playwright tests
  .github/workflows/ci.yml
  ecosystem.config.js   # PM2 config for Pi deployment
```

### Server (`server/src/`)
- `index.ts` — Express app, mounts Apollo at `/graphql`, serves `/music` static files
- `schema/` — GraphQL typeDefs split by domain (`person`, `chore`, `calendar`, `weather`, `message`, `track`, `word`)
- `resolvers/` — one file per domain (chores, calendar, weather, messages, tracks, wordOfDay)
- `services/` — external API clients: Google Calendar (OAuth2 + refresh token), Open-Meteo (no auth), Free Dictionary API
- `cron.ts` — scheduled tasks (daily track/word selection)
- `seed.ts` — initial data: Harry (blue), Ruby (pink), Krysten (green), Jon (gold)
- `scripts/` — `getGoogleToken.ts` (one-time OAuth), `importTracks.ts` (MP3 import)
- `prisma/schema.prisma` — SQLite models: Person, Chore, ChoreCompletion, Message, WordOfDay, Track

### Client (`client/src/`)
- `App.tsx` — React Router with ApolloProvider pointing at `http://localhost:4000/graphql`
- Routes: `/` (Dashboard), `/chores` (touch-optimized), `/calendar`, `/message-admin`, `/chores-admin`
- `components/NavBar.tsx` — fixed top nav, hamburger on mobile
- Widget components: WeatherWidget, MusicWidget, ChoreCard, CalendarWidget, MessageWidget, WordOfDayWidget

### GraphQL API
Single endpoint at `/graphql`. Key queries: `people`, `calendarEvents(start, end)`, `weather`, `activeMessage`, `dailyTrack`, `wordOfDay`. Key mutations: `completeChore`, `uncompleteChore`, `createChore`, `updateChore`, `deleteChore`, `createMessage`.

### Caching
- Calendar events: 15-min in-memory cache in `services/googleCalendar.ts`
- Weather: 30-min in-memory cache in `services/weather.ts`
- Daily word/track: cached in DB by `dateKey` ("YYYY-MM-DD")

### Chore scheduling logic
`dayOfWeek: Int[]` on Chore — empty array means every day; populated array means only those weekdays (0=Sun…6=Sat). `ChoreCompletion` uses a `@@unique([choreId, dateKey])` constraint.

## Design System

**Colors (Tailwind custom):**
- `gold: #C9A84C`, `gold-light: #E8C97A`, `gold-dim: #8A6F2E`
- `surface: #111111`, `surface-raised: #1A1A1A`, `surface-card: #222222`
- `ink: #F5F0E8`, `ink-muted: #9A9488`

**Fonts:** Syne (display, weights 400/700/800) · DM Sans (body, weights 300/400/500) — loaded via Google Fonts in `index.html`

**Cards:** dark bg, 1px gold border at 20% opacity, subtle gold shadow, 12px radius, 44×44px min touch targets

## Environment Variables (`server/.env`)

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GOOGLE_CALENDAR_ID=
OPEN_METEO_LAT=43.0389
OPEN_METEO_LNG=-87.9065
PORT=4000
```

## Deployment (Raspberry Pi)

`ecosystem.config.js` defines PM2 config. Production: single Node.js process on port 4000 serves both the GraphQL API and Vite-built static files from `client/dist/`.
