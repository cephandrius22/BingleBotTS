import Database from "better-sqlite3";

const DB_PATH = "karma.db";
const TZ = "America/New_York";
const MEDALS = ["🥇", "🥈", "🥉"] as const;
export const KARMA_STEPS = [1, 5, 10] as const;
export const VALID_DELTAS = new Set([-10, -5, -1, 1, 5, 10]);

export interface CatScore {
  name: string;
  karma: number;
  medal: string;
}

export interface HistoryEntry {
  delta: number;
  reason: string | null;
  timestamp: string;
}

export interface DailySnapshot {
  date: string;
  entries: Array<{ cat_name: string; karma: number; rank: number }>;
}

// Module-level connection. Set by initDb() so tests can inject ":memory:".
let db: Database.Database;

export function initDb(path = DB_PATH): void {
  db = new Database(path);
  db.exec(`
    CREATE TABLE IF NOT EXISTS cats (
      id      INTEGER PRIMARY KEY,
      name    TEXT    UNIQUE NOT NULL,
      karma   INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS history (
      id        INTEGER PRIMARY KEY,
      cat_id    INTEGER NOT NULL REFERENCES cats(id),
      delta     INTEGER NOT NULL,
      reason    TEXT,
      timestamp TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS daily_snapshots (
      id       INTEGER PRIMARY KEY,
      date     TEXT    NOT NULL,
      cat_name TEXT    NOT NULL,
      karma    INTEGER NOT NULL,
      rank     INTEGER NOT NULL
    );
  `);
}

function nowEastern(): string {
  return new Date().toLocaleString("sv-SE", { timeZone: TZ }).replace(" ", "T");
}

export function applyDelta(
  cat: string,
  delta: number,
  reason?: string
): number {
  if (!VALID_DELTAS.has(delta)) {
    throw new Error(`Invalid delta: ${delta}`);
  }

  const upsert = db.prepare(`
    INSERT INTO cats (name, karma) VALUES (?, ?)
    ON CONFLICT(name) DO UPDATE SET karma = karma + excluded.karma
  `);

  const insertHistory = db.prepare(`
    INSERT INTO history (cat_id, delta, reason, timestamp)
    VALUES ((SELECT id FROM cats WHERE name = ?), ?, ?, ?)
  `);

  const getKarma = db.prepare<[string], { karma: number }>(
    `SELECT karma FROM cats WHERE name = ?`
  );

  const run = db.transaction(() => {
    upsert.run(cat, delta);
    insertHistory.run(cat, delta, reason ?? null, nowEastern());
    return getKarma.get(cat)!.karma;
  });

  return run();
}

export function getScores(): CatScore[] {
  const rows = db
    .prepare<[], { name: string; karma: number }>(
      `SELECT name, karma FROM cats ORDER BY karma DESC`
    )
    .all();

  return rows.map((row, i) => ({
    ...row,
    medal: MEDALS[i] ?? "",
  }));
}

export function getCatNames(prefix: string = ""): string[] {
  return db
    .prepare<[string], { name: string }>(
      `SELECT name FROM cats WHERE name LIKE ? ORDER BY name`
    )
    .all(`${prefix}%`)
    .map((r) => r.name);
}

export function getHistory(
  cat: string,
  limit = 20
): { entries: HistoryEntry[]; currentKarma: number } {
  const entries = db
    .prepare<[string, number], HistoryEntry>(
      `SELECT h.delta, h.reason, h.timestamp
       FROM history h
       JOIN cats c ON c.id = h.cat_id
       WHERE c.name = ?
       ORDER BY h.id DESC
       LIMIT ?`
    )
    .all(cat, limit);

  const row = db
    .prepare<[string], { karma: number }>(
      `SELECT karma FROM cats WHERE name = ?`
    )
    .get(cat);

  return { entries, currentKarma: row?.karma ?? 0 };
}

export function takeSnapshotAndReset(): void {
  const scores = getScores();
  const date = new Date().toLocaleDateString("sv-SE", { timeZone: TZ });

  const insertSnapshot = db.prepare(
    `INSERT INTO daily_snapshots (date, cat_name, karma, rank) VALUES (?, ?, ?, ?)`
  );
  const resetAll = db.prepare(`UPDATE cats SET karma = 0`);

  db.transaction(() => {
    for (const [i, cat] of scores.entries()) {
      insertSnapshot.run(date, cat.name, cat.karma, i + 1);
    }
    resetAll.run();
  })();
}

export function getSnapshots(): DailySnapshot[] {
  const rows = db
    .prepare<
      [],
      { date: string; cat_name: string; karma: number; rank: number }
    >(
      `SELECT date, cat_name, karma, rank FROM daily_snapshots ORDER BY date DESC, rank ASC`
    )
    .all();

  const grouped = new Map<string, DailySnapshot["entries"]>();
  for (const row of rows) {
    if (!grouped.has(row.date)) grouped.set(row.date, []);
    grouped.get(row.date)!.push({
      cat_name: row.cat_name,
      karma: row.karma,
      rank: row.rank,
    });
  }

  return Array.from(grouped.entries()).map(([date, entries]) => ({
    date,
    entries,
  }));
}
