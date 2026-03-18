import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface CatScore {
  name: string;
  karma: number;
  medal: string;
}

export default function Leaderboard() {
  const [scores, setScores] = useState<CatScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/scores")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch scores");
        return r.json() as Promise<CatScore[]>;
      })
      .then(setScores)
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
          <h1 className="text-2xl font-bold">Leaderboard</h1>
        </div>

        {loading && <p className="text-gray-400">Loading…</p>}
        {error && <p className="text-red-400">{error}</p>}
        {!loading && !error && scores.length === 0 && (
          <p className="text-gray-400">No karma recorded yet.</p>
        )}

        <ol className="flex flex-col gap-2">
          {scores.map((cat, i) => (
            <li
              key={cat.name}
              className="flex items-center justify-between rounded-xl bg-gray-900 border border-gray-800 px-5 py-4"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-center">
                  {cat.medal || (
                    <span className="text-gray-500 text-sm">#{i + 1}</span>
                  )}
                </span>
                <span className="font-medium">{cat.name}</span>
              </div>
              <span
                className={[
                  "font-mono font-semibold tabular-nums",
                  cat.karma > 0
                    ? "text-green-400"
                    : cat.karma < 0
                      ? "text-red-400"
                      : "text-gray-400",
                ].join(" ")}
              >
                {cat.karma > 0 ? "+" : ""}
                {cat.karma}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
