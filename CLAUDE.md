# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Express server (port 8080) with hot reload
npm run build        # Compile TypeScript + build React client
npm start            # Run compiled output
npm test             # Run tests once
npm run test:watch   # Run tests in watch mode
npm run client:dev   # Start Vite dev server (port 5173)
npm run client:build # Build React client to dist/client/
```

There is no lint script configured.

To run a single test file: `npx vitest run src/data/karma.test.ts`

**Dev workflow:** run `npm run dev` and `npm run client:dev` in separate terminals. Vite proxies `/scores`, `/snapshots`, and `/karma` to Express automatically. In production, Express serves the built React client from `dist/client/`.

## Environment

```
DISCORD_TOKEN=...       # Required
DISCORD_GUILD_ID=...    # Optional: set for instant slash command updates (vs. ~1hr global propagation)
```

## Architecture

Binglebot is a Discord bot with a React web UI and REST API for tracking karma scores for cats (Ramona, Midnight, Steris).

**Everything runs in a single Node.js process**, started by `src/index.ts`:
- The **Discord bot** opens a persistent WebSocket connection to Discord and listens for slash commands.
- The **Express server** listens on :8080 and serves the REST API.
- Both share the same in-memory SQLite database module — there is no separate API process.
- The **React app** is not a server. It's static files (HTML/JS/CSS) that Express sends to the browser on the first request; after that it runs in the browser and calls the Express API routes via `fetch()`. In production, Express serves these files directly. In dev, Vite runs its own server on :5173 and proxies API calls to Express on :8080.

**Three backend layers, all initialized in `src/index.ts`:**

- **`src/data/karma.ts`** — Pure synchronous SQLite data layer (better-sqlite3). No Discord/HTTP dependencies. Tests use `initDb(":memory:")` for isolated in-memory databases.
- **`src/bot/`** — Discord.js bot. `client.ts` handles command registration and routing; commands live in `bot/commands/` and are registered in the `commands` array in `client.ts`.
- **`src/web/server.ts`** — Express 5 REST API on port 8080 (`GET /scores`, `GET /snapshots`, `POST /karma`, `POST /reset`). Serves `dist/client/` as static files with SPA fallback when `NODE_ENV=production`.

**React frontend (`client/`):** Vite + React + Tailwind v4. Four pages: Home (index), Karma Remote (give/take karma with optimistic updates), Leaderboard, Daily Log. Has its own `package.json`, `tsconfig.json` (bundler module resolution, not NodeNext), and `vite.config.ts`.

**Key data concepts:**
- Valid karma deltas: `±1, ±5, ±10` (enforced in `applyDelta()` and Discord command choices)
- `takeSnapshotAndReset()` archives current scores to `daily_snapshots` then zeroes all karma
- `getScores()` returns cats with medal emoji (🥇🥈🥉) for top 3

**Discord commands:**
- `/scores` — leaderboard embed
- `/karma give <cat> <amount> [reason]` — add karma
- `/karma take <cat> <amount> [reason]` — remove karma
- `/karma scores` — leaderboard embed
- `/karma history <cat>` — last 20 transactions for a cat

**Adding a new Discord command:** create a file in `src/bot/commands/` exporting `data` (SlashCommandBuilder) and `execute()`, then add it to the `commands` array in `src/bot/client.ts`.

**Module system:** server uses ES modules with NodeNext resolution — imports require `.js` extensions even for `.ts` source files. The React client uses bundler resolution and does not require extensions.
