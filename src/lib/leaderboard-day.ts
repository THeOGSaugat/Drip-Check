/**
 * "Today" for the daily leaderboard, in the viewer's own time zone.
 *
 * `tzOffsetMinutes` is exactly what the browser's `Date#getTimezoneOffset()`
 * returns (UTC minus local, e.g. -345 for Nepal, 60 for UTC-1). The server runs
 * in UTC, so without this the board would "reset" at 05:45 in Kathmandu.
 */
export const MAX_TZ_OFFSET_MINUTES = 840;

export function startOfLocalDay(tzOffsetMinutes: number, now: number = Date.now()): Date {
  const offsetMs = tzOffsetMinutes * 60_000;
  const localNow = now - offsetMs;
  const localMidnight = Math.floor(localNow / 86_400_000) * 86_400_000;
  return new Date(localMidnight + offsetMs);
}
