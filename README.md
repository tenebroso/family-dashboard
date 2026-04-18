# Family Dashboard

A full-screen family dashboard running on a Raspberry Pi 5, accessible from any device on the home network. Shows chores, calendar events, weather, word of the day, a music player, and custom messages.

**Stack:** React + TypeScript + Vite · Node.js + Express + Apollo GraphQL · Prisma + SQLite · Playwright

## Dev setup

```bash
npm ci                # install all workspace dependencies

# Terminal 1
cd server && npm run dev   # GraphQL API at http://localhost:4000

# Terminal 2
cd client && npm run dev   # UI at http://localhost:5173
```

## See CLAUDE.md for architecture details and all commands.
