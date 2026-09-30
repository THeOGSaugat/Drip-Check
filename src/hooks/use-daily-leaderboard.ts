import { useQuery } from "@tanstack/react-query";
import { getDailyLeaderboard } from "@/lib/rating-game.functions";

/** One cache entry shared by the leaderboard page, the Rating Game and the home Top 3. */
export const DAILY_LEADERBOARD_KEY = ["daily-leaderboard"] as const;

/** Today's Rating Game leaderboard, in this browser's time zone. Polls every 30s. */
export function useDailyLeaderboard() {
  return useQuery({
    queryKey: DAILY_LEADERBOARD_KEY,
    queryFn: () => getDailyLeaderboard({ data: { tzOffset: new Date().getTimezoneOffset() } }),
    refetchInterval: 30_000,
  });
}
