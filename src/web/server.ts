import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as karmaData from "../data/karma.js";

const app = express();
app.use(express.json());

// JSON API routes
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

// Serve the React SPA in production. In dev, Vite runs its own server and
// proxies API calls to this Express server — no static serving needed.
if (process.env.NODE_ENV === "production") {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  // Compiled output: dist/web/server.js → dist/client/
  const clientDist = path.resolve(__dirname, "../client");

  app.use(express.static(clientDist));

  // SPA fallback — send index.html for any unmatched GET so client-side
  // routing works. Express 5 requires the {*splat} wildcard syntax.
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

export function startServer(port = 8080): void {
  app.listen(port, () => {
    console.log(`Web server listening on http://localhost:${port}`);
  });
}
