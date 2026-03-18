import { describe, it, expect, beforeEach } from "vitest";
import {
  initDb,
  applyDelta,
  getScores,
  getCatNames,
  getHistory,
  takeSnapshotAndReset,
  getSnapshots,
  VALID_DELTAS,
} from "./karma.js";

// Each test gets a fresh in-memory DB so there's no shared state.
beforeEach(() => {
  initDb(":memory:");
});

describe("VALID_DELTAS", () => {
  it("contains expected values", () => {
    expect([...VALID_DELTAS].sort((a, b) => a - b)).toEqual([
      -10, -5, -1, 1, 5, 10,
    ]);
  });
});

describe("initDb", () => {
  it("is idempotent — calling twice does not throw", () => {
    expect(() => initDb(":memory:")).not.toThrow();
  });
});

describe("applyDelta", () => {
  it("creates a new cat on the first delta", () => {
    applyDelta("Luna", 1);
    const scores = getScores();
    expect(scores).toHaveLength(1);
    expect(scores[0].name).toBe("Luna");
    expect(scores[0].karma).toBe(1);
  });

  it("returns the new total", () => {
    expect(applyDelta("Mochi", 5)).toBe(5);
    expect(applyDelta("Mochi", 5)).toBe(10);
  });

  it("accumulates karma correctly across multiple deltas", () => {
    applyDelta("Biscuit", 10);
    applyDelta("Biscuit", -1);
    applyDelta("Biscuit", 5);
    expect(applyDelta("Biscuit", -5)).toBe(9);
  });

  it("allows negative karma", () => {
    expect(applyDelta("Gremlin", -10)).toBe(-10);
  });

  it("throws on an invalid delta", () => {
    expect(() => applyDelta("Luna", 2)).toThrow("Invalid delta");
    expect(() => applyDelta("Luna", 0)).toThrow("Invalid delta");
    expect(() => applyDelta("Luna", 100)).toThrow("Invalid delta");
  });

  it("stores the reason in history", () => {
    applyDelta("Luna", 5, "knocked over a plant");
    const { entries } = getHistory("Luna");
    expect(entries[0].reason).toBe("knocked over a plant");
  });

  it("stores null reason when omitted", () => {
    applyDelta("Luna", 1);
    const { entries } = getHistory("Luna");
    expect(entries[0].reason).toBeNull();
  });
});

describe("getScores", () => {
  it("returns cats sorted by karma descending", () => {
    applyDelta("C", 1);
    applyDelta("A", 10);
    applyDelta("B", 5);

    const scores = getScores();
    expect(scores.map((s) => s.name)).toEqual(["A", "B", "C"]);
    expect(scores.map((s) => s.karma)).toEqual([10, 5, 1]);
  });

  it("assigns medals to the top 3 and empty string beyond", () => {
    applyDelta("Gold", 10);
    applyDelta("Silver", 5);
    applyDelta("Bronze", 1);
    applyDelta("None", -1);

    const scores = getScores();
    expect(scores[0].medal).toBe("🥇");
    expect(scores[1].medal).toBe("🥈");
    expect(scores[2].medal).toBe("🥉");
    expect(scores[3].medal).toBe("");
  });

  it("returns an empty array when no cats exist", () => {
    expect(getScores()).toEqual([]);
  });
});

describe("getCatNames", () => {
  it("returns all names with an empty prefix", () => {
    applyDelta("Luna", 1);
    applyDelta("Mochi", 1);
    const names = getCatNames("");
    expect(names).toContain("Luna");
    expect(names).toContain("Mochi");
  });

  it("filters by prefix case-sensitively", () => {
    applyDelta("Luna", 1);
    applyDelta("Loki", 1);
    applyDelta("Mochi", 1);
    expect(getCatNames("L")).toEqual(["Loki", "Luna"]);
    expect(getCatNames("Mo")).toEqual(["Mochi"]);
    expect(getCatNames("Z")).toEqual([]);
  });
});

describe("getHistory", () => {
  it("returns entries in reverse chronological order", () => {
    applyDelta("Luna", 1, "first");
    applyDelta("Luna", 5, "second");
    applyDelta("Luna", 10, "third");

    const { entries } = getHistory("Luna");
    expect(entries.map((e) => e.reason)).toEqual(["third", "second", "first"]);
  });

  it("returns currentKarma for the cat", () => {
    applyDelta("Mochi", 10);
    applyDelta("Mochi", -1);
    expect(getHistory("Mochi").currentKarma).toBe(9);
  });

  it("returns empty entries and 0 karma for an unknown cat", () => {
    const { entries, currentKarma } = getHistory("Ghost");
    expect(entries).toEqual([]);
    expect(currentKarma).toBe(0);
  });

  it("respects the limit parameter", () => {
    for (let i = 0; i < 25; i++) applyDelta("Luna", 1);
    expect(getHistory("Luna", 10).entries).toHaveLength(10);
  });
});

describe("takeSnapshotAndReset", () => {
  it("zeroes all karma after saving a snapshot", () => {
    applyDelta("Luna", 10);
    applyDelta("Mochi", 5);

    takeSnapshotAndReset();

    expect(getScores().every((s) => s.karma === 0)).toBe(true);
  });

  it("persists the pre-reset standings in snapshots", () => {
    applyDelta("Luna", 10);
    applyDelta("Mochi", 5);

    takeSnapshotAndReset();

    const snapshots = getSnapshots();
    expect(snapshots).toHaveLength(1);
    const names = snapshots[0].entries.map((e) => e.cat_name);
    expect(names).toContain("Luna");
    expect(names).toContain("Mochi");
  });

  it("records correct ranks", () => {
    applyDelta("A", 10);
    applyDelta("B", 5);
    applyDelta("C", 1);

    takeSnapshotAndReset();

    const entries = getSnapshots()[0].entries;
    expect(entries.find((e) => e.cat_name === "A")!.rank).toBe(1);
    expect(entries.find((e) => e.cat_name === "B")!.rank).toBe(2);
    expect(entries.find((e) => e.cat_name === "C")!.rank).toBe(3);
  });
});
