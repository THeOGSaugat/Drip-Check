import { test } from "node:test";
import assert from "node:assert/strict";
import {
  deriveCoverage,
  dropUnseenAdvice,
  dropUnseenItems,
  normalizeCategory,
  visibleAverage,
} from "./fit-scoring.ts";
import { startOfLocalDay } from "./leaderboard-day.ts";

test("a not-visible category has a null score, never 0", () => {
  assert.deepEqual(normalizeCategory({ visible: false, score: 0 }), {
    visible: false,
    score: null,
  });
  assert.deepEqual(normalizeCategory({ visible: false, score: 8 }), {
    visible: false,
    score: null,
  });
  assert.deepEqual(normalizeCategory(undefined), { visible: false, score: null });
});

test("'visible' without a usable score is treated as not visible, not invented", () => {
  assert.deepEqual(normalizeCategory({ visible: true, score: 0 }), { visible: false, score: null });
  assert.deepEqual(normalizeCategory({ visible: true, score: "abc" }), {
    visible: false,
    score: null,
  });
  assert.deepEqual(normalizeCategory({ visible: "true", score: 8 }), {
    visible: false,
    score: null,
  });
});

test("visible scores are clamped to 1.0–10.0 and rounded to one decimal", () => {
  assert.deepEqual(normalizeCategory({ visible: true, score: 8.46 }), {
    visible: true,
    score: 8.5,
  });
  assert.deepEqual(normalizeCategory({ visible: true, score: 14 }), { visible: true, score: 10 });
  assert.deepEqual(normalizeCategory({ visible: true, score: 0.4 }), { visible: true, score: 1 });
});

test("overall score averages visible categories only — unseen ones cannot lower it", () => {
  const topOnly = [
    { visible: true, score: 9 },
    { visible: true, score: 8 },
    { visible: false, score: null }, // bottom
    { visible: false, score: null }, // shoes
    { visible: false, score: null }, // accessories
  ];
  assert.equal(visibleAverage(topOnly), 8.5);
  // Same visible categories plus unseen ones = same score.
  assert.equal(visibleAverage(topOnly.slice(0, 2)), 8.5);
  // Regression: the old code capped any top-only fit at 6.0.
  assert.ok(visibleAverage(topOnly)! > 6);
});

test("overall score is null when nothing is visible", () => {
  assert.equal(visibleAverage([{ visible: false, score: null }]), null);
  assert.equal(visibleAverage([]), null);
});

test("items naming an unseen category are dropped as invented", () => {
  const seen = { shoes: false, bottom: false, accessories: false };
  assert.deepEqual(
    dropUnseenItems(
      ["Black tee", "White sneakers", "Blue jeans", "Gold chain", "Denim jacket"],
      seen,
    ),
    ["Black tee", "Denim jacket"],
  );
  // Seen categories keep their items.
  assert.deepEqual(
    dropUnseenItems(["White sneakers", "Gold chain"], { shoes: true, accessories: true }),
    ["White sneakers", "Gold chain"],
  );
  // "Cap-sleeve" is a top, not an accessory.
  assert.deepEqual(dropUnseenItems(["Cap-sleeve top", "Baseball cap"], seen), ["Cap-sleeve top"]);
});

test("advice about unseen shoes/bottoms is dropped; adding an accessory is allowed", () => {
  const seen = { shoes: false, bottom: false, accessories: false };
  const tips = [
    { title: "Try this", text: "Swap the sneakers for loafers." },
    { title: "Fit", text: "Go for wider trousers." },
    { title: "Polish", text: "Add a watch to elevate the fit." },
    { title: "Shape", text: "Tuck in the tee for a cleaner line." },
  ];
  assert.deepEqual(
    dropUnseenAdvice(tips, seen).map((t) => t.text),
    ["Add a watch to elevate the fit.", "Tuck in the tee for a cleaner line."],
  );
});

test("Photo Check (no bottom category) never filters bottoms", () => {
  assert.deepEqual(dropUnseenItems(["Blue jeans"], { shoes: false, accessories: true }), [
    "Blue jeans",
  ]);
});

test("coverage is derived from what was actually scored", () => {
  const base = { top: false, layering: false, bottom: false, shoes: false, anything: false };
  assert.equal(
    deriveCoverage({ ...base, top: true, bottom: true, shoes: true, anything: true }),
    "full",
  );
  assert.equal(deriveCoverage({ ...base, top: true, anything: true }), "upper");
  assert.equal(deriveCoverage({ ...base, top: true, bottom: true, anything: true }), "upper");
  assert.equal(deriveCoverage({ ...base, shoes: true, anything: true }), "lower");
  assert.equal(deriveCoverage(base), "none");
});

test("'today' starts at local midnight in the viewer's time zone", () => {
  // 2026-09-30 20:00 UTC is 2026-10-01 01:45 in Nepal (UTC+5:45, offset -345).
  const now = Date.UTC(2026, 8, 30, 20, 0);
  assert.equal(startOfLocalDay(-345, now).toISOString(), "2026-09-30T18:15:00.000Z");
  assert.equal(startOfLocalDay(0, now).toISOString(), "2026-09-30T00:00:00.000Z");
  // New York in September (UTC-4, offset 240): local 16:00 on the 30th.
  assert.equal(startOfLocalDay(240, now).toISOString(), "2026-09-30T04:00:00.000Z");
});
