# binglebot-ts

TypeScript recreation of [binglebot](../py/), a personal Discord bot with a companion web UI for tracking cat karma.

## Project structure

```
ts/
├── src/
│   ├── index.ts               # Entry point: init DB, start web server, login bot
│   ├── data/
│   │   └── karma.ts           # SQLite data layer (no Discord/HTTP deps)
│   ├── bot/
│   │   ├── client.ts          # Discord client setup and command dispatch
│   │   └── commands/
│   │       └── karma.ts       # /karma give|take|scores|history
│   └── web/
│       └── server.ts          # Express: GET /scores, GET /snapshots, POST /karma
├── package.json
└── tsconfig.json
```

## Setup

```sh
cp .env.example .env
# add your DISCORD_TOKEN to .env
npm install
```

## Running

```sh
npm run dev      # start with hot reload (tsx watch)
npm run build    # compile to dist/
npm start        # run compiled output
```

The web server starts on `http://localhost:8080`. The Discord bot registers
slash commands globally on startup — they appear in Discord within ~1 hour.
For instant registration during development, pass a `guildId` to
`registerCommands` in `src/bot/client.ts`.

## Testing

```sh
npm test            # run once
npm run test:watch  # re-run on file changes
```

Tests use [vitest](https://vitest.dev/). Each test gets a fresh in-memory
SQLite database via `initDb(":memory:")` in `beforeEach`, so tests are
fully isolated with no shared state.

## Web API

| Method | Path          | Description                          |
|--------|---------------|--------------------------------------|
| GET    | `/scores`     | Current karma leaderboard (JSON)     |
| GET    | `/snapshots`  | Daily snapshot history (JSON)        |
| POST   | `/karma`      | Apply a delta `{ cat, delta }`       |

`delta` must be one of `±1`, `±5`, `±10`.

## Discord commands

| Command                             | Description                         |
|-------------------------------------|-------------------------------------|
| `/karma give <cat> <amount>`        | Add karma to a cat                  |
| `/karma take <cat> <amount>`        | Remove karma from a cat             |
| `/karma scores`                     | Show the leaderboard                |
| `/karma history <cat>`              | Show last 20 changes for a cat      |

Cat name fields have autocomplete.

## Stack

| Purpose       | Library           | Python equivalent  |
|---------------|-------------------|--------------------|
| Discord bot   | discord.js        | discord.py         |
| Web server    | express           | FastAPI            |
| Database      | better-sqlite3    | sqlite3 (stdlib)   |
| Dev runner    | tsx               | python / uvicorn   |
| Tests         | vitest            | pytest             |
