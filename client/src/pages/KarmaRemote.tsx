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
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);

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

  async function handleReset() {
    setResetting(true);
    try {
      const res = await fetch("/reset", { method: "POST" });
      if (!res.ok) throw new Error("Reset failed");
      await fetchScores();
    } finally {
      setResetting(false);
      setConfirmReset(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-gray-400 hover:text-white transition-colors text-sm">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold">Karma Remote</h1>
          </div>
          <button
            onClick={() => setConfirmReset(true)}
            className="text-sm text-gray-500 hover:text-red-400 transition-colors"
          >
            Reset day
          </button>
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

      {confirmReset && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-2">Reset the day?</h2>
            <p className="text-gray-400 text-sm mb-6">
              This will snapshot current scores and reset all karma to zero.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmReset(false)}
                disabled={resetting}
                className="flex-1 py-2.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-40 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="flex-1 py-2.5 rounded-lg bg-red-900 border border-red-700 text-red-300 font-semibold hover:bg-red-800 disabled:opacity-40 transition-colors"
              >
                {resetting ? "Resetting…" : "Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
