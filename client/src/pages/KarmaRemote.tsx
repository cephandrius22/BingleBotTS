import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";

interface CatScore {
  name: string;
  karma: number;
  medal: string;
}

const STEPS = [1, 5, 10] as const;

export default function KarmaRemote() {
  const [scores, setScores] = useState<CatScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());

  const fetchScores = useCallback(() => {
    return fetch("/scores")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch scores");
        return r.json() as Promise<CatScore[]>;
      })
      .then(setScores);
  }, []);

  useEffect(() => {
    fetchScores()
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [fetchScores]);

  async function handleDelta(cat: string, delta: number) {
    if (pending.has(cat)) return;

    // Optimistic update
    setScores((prev) =>
      prev.map((s) => (s.name === cat ? { ...s, karma: s.karma + delta } : s))
    );
    setPending((p) => new Set(p).add(cat));

    try {
      const res = await fetch("/karma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cat, delta }),
      });
      if (!res.ok) throw new Error("Request failed");
      const { newTotal } = (await res.json()) as { newTotal: number };
      // Sync with authoritative server value
      setScores((prev) =>
        prev.map((s) => (s.name === cat ? { ...s, karma: newTotal } : s))
      );
    } catch {
      // Roll back optimistic update
      setScores((prev) =>
        prev.map((s) => (s.name === cat ? { ...s, karma: s.karma - delta } : s))
      );
    } finally {
      setPending((p) => {
        const next = new Set(p);
        next.delete(cat);
        return next;
      });
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="text-gray-400 hover:text-white transition-colors text-sm">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold">Karma Remote</h1>
        </div>

        {loading && <p className="text-gray-400">Loading…</p>}
        {error && <p className="text-red-400">{error}</p>}
        {!loading && !error && scores.length === 0 && (
          <p className="text-gray-400">No cats yet. Give some karma from Discord first.</p>
        )}

        <div className="flex flex-col gap-3">
          {scores.map((cat) => {
            const isPending = pending.has(cat.name);
            return (
              <div
                key={cat.name}
                className="rounded-2xl bg-gray-900 border border-gray-800 p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {cat.medal && <span className="text-xl">{cat.medal}</span>}
                    <span className="font-semibold text-lg">{cat.name}</span>
                  </div>
                  <span
                    className={[
                      "font-mono font-bold text-xl tabular-nums transition-opacity",
                      cat.karma > 0
                        ? "text-green-400"
                        : cat.karma < 0
                          ? "text-red-400"
                          : "text-gray-400",
                      isPending ? "opacity-50" : "",
                    ].join(" ")}
                  >
                    {cat.karma > 0 ? "+" : ""}
                    {cat.karma}
                  </span>
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {STEPS.map((step) => (
                    <button
                      key={`+${step}`}
                      onClick={() => handleDelta(cat.name, step)}
                      disabled={isPending}
                      className="py-2.5 rounded-lg bg-green-950 border border-green-800 text-green-400 font-semibold hover:bg-green-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      +{step}
                    </button>
                  ))}
                  {STEPS.map((step) => (
                    <button
                      key={`-${step}`}
                      onClick={() => handleDelta(cat.name, -step)}
                      disabled={isPending}
                      className="py-2.5 rounded-lg bg-red-950 border border-red-800 text-red-400 font-semibold hover:bg-red-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      -{step}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
