/**
 * Lightweight in-memory rate limiting for the scan booth and photo check.
 * Keeps a single device from spamming analyses. Leaderboard entries are capped
 * separately, in the database, by rating-game.server.ts.
 */

type Bucket = { last: number; hits: number[] };

const analysisBuckets = new Map<string, Bucket>();

const ANALYSIS_COOLDOWN_MS = 4_000;
const ANALYSIS_PER_MINUTE = 8;

function prune(hits: number[], windowMs: number) {
  const cutoff = Date.now() - windowMs;
  return hits.filter((t) => t > cutoff);
}

function gate(
  store: Map<string, Bucket>,
  key: string,
  cooldownMs: number,
  windowMs: number,
  max: number,
  cooldownMessage: string,
  limitMessage: string,
): { ok: true } | { ok: false; message: string } {
  const now = Date.now();
  const bucket = store.get(key) ?? { last: 0, hits: [] };
  bucket.hits = prune(bucket.hits, windowMs);

  if (now - bucket.last < cooldownMs) {
    store.set(key, bucket);
    return { ok: false, message: cooldownMessage };
  }
  if (bucket.hits.length >= max) {
    store.set(key, bucket);
    return { ok: false, message: limitMessage };
  }

  bucket.last = now;
  bucket.hits.push(now);
  store.set(key, bucket);

  if (store.size > 5000) store.clear();
  return { ok: true };
}

export function checkAnalysisRate(deviceKey: string) {
  return gate(
    analysisBuckets,
    deviceKey,
    ANALYSIS_COOLDOWN_MS,
    60_000,
    ANALYSIS_PER_MINUTE,
    "Hold on a few seconds before the next check.",
    "That's a lot of checks — wait a minute and try again.",
  );
}

const framingBuckets = new Map<string, Bucket>();

export function checkFramingRate(deviceKey: string) {
  return gate(
    framingBuckets,
    deviceKey,
    2_500,
    60_000,
    12,
    "Checking your framing — one sec.",
    "Too many framing checks. Wait a minute.",
  );
}
