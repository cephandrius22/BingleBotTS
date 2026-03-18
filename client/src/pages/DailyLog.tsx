import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface DailySnapshot {
  date: string;
  entries: Array<{ cat_name: string; karma: number; rank: number }>;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function DailyLog() {
  const [snapshots, setSnapshots] = useState<DailySnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/snapshots")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch snapshots");
        return r.json() as Promise<DailySnapshot[]>;
      })
      .then(setSnapshots)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="text-gray-400 hover:text-white transition-colors text-sm">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold">Daily Log</h1>
        </div>

        {loading && <p className="text-gray-400">Loading…</p>}
        {error && <p className="text-red-400">{error}</p>}
        {!loading && !error && snapshots.length === 0 && (
          <p className="text-gray-400">No snapshots yet.</p>
        )}

        <div className="flex flex-col gap-6">
          {snapshots.map((snap) => (
            <div
              key={snap.date}
              className="rounded-2xl bg-gray-900 border border-gray-800 p-5"
            >
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                {snap.date}
              </h2>
              <ul className="flex flex-col gap-2">
                {snap.entries.map((entry) => (
                  <li
                    key={entry.cat_name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-center">
                        {MEDALS[entry.rank - 1] ?? (
                          <span className="text-gray-500 text-sm">
                            #{entry.rank}
                          </span>
                        )}
                      </span>
                      <span className="text-gray-200">{entry.cat_name}</span>
                    </div>
                    <span className="font-mono text-sm text-gray-300 tabular-nums">
                      {entry.karma}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
