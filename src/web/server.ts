import express from "express";
import * as karmaData from "../data/karma.js";

const app = express();
app.use(express.json());

// JSON API routes (same contract as the Python version)

app.get("/scores", (_req, res) => {
  res.json(karmaData.getScores());
});

app.get("/snapshots", (_req, res) => {
  res.json(karmaData.getSnapshots());
});

app.post("/karma", (req, res) => {
  const { cat, delta } = req.body as { cat?: unknown; delta?: unknown };

  if (typeof cat !== "string" || !cat) {
    res.status(400).json({ error: "cat must be a non-empty string" });
    return;
  }
  if (!karmaData.VALID_DELTAS.has(delta as number)) {
    res.status(400).json({ error: "delta must be one of ±1, ±5, ±10" });
    return;
  }

  const newTotal = karmaData.applyDelta(cat, delta as number);
  res.json({ cat, delta, newTotal });
});

export function startServer(port = 8080): void {
  app.listen(port, () => {
    console.log(`Web server listening on http://localhost:${port}`);
  });
}
