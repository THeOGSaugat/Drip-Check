/**
 * Rating Game — the only competitive feature, and the only code path in the
 * app that writes to live_scores.
 *
 * The score is computed and saved here, server-side, in the same request that
 * analyses the frames. The browser never sends a score, so a leaderboard entry
 * can't be forged, and a personal check (Live / Photo) can't reach the board:
 * neither has any write path at all.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { AnalysisError, analyzeOutfitFrames } from "./fit-analysis.server";
import { startOfLocalDay } from "./leaderboard-day";
import { checkAnalysisRate } from "./live-rate-limit.server";
import type { FitAnalysis } from "./live-types";

export const RATING_GAME_CHECK_TYPE = "rating_game";

export type LeaderboardEntry = {
  id: string;
  rank: number;
  displayName: string;
  username: string;
  dripScore: number;
  styleLabel: string;
};

export type RatingGameResult =
  | { ok: true; analysis: FitAnalysis; saved: true; rank: number | null }
  | { ok: true; analysis: FitAnalysis; saved: false; saveError: string }
  | { ok: false; error: string };

/** Postgres/PostgREST errors meaning the check_type migration hasn't run. */
function isMissingColumn(error: { code?: string; message?: string }) {
  return (
    error.code === "42703" || error.code === "PGRST204" || /check_type/.test(error.message ?? "")
  );
}

/**
 * Today's Rating Game results for the viewer's time zone, best first.
 * Tie-breaker: the earlier submission ranks higher, then id, so the order is
 * total and stable across every page that shows it.
 */
export async function readDailyLeaderboard(
  tzOffset: number,
  limit = 50,
): Promise<LeaderboardEntry[]> {
  const since = startOfLocalDay(tzOffset).toISOString();

  const { data, error } = await supabaseAdmin
    .from("live_scores")
    .select("id, display_name, username, drip_score, style_label")
    .eq("check_type", RATING_GAME_CHECK_TYPE)
    .gte("created_at", since)
    .order("drip_score", { ascending: false })
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(limit);

  if (error) {
    console.error(
      isMissingColumn(error)
        ? "[rating-game] live_scores.check_type is missing — apply migration 20260930120000_live_scores_check_type.sql"
        : "[rating-game] leaderboard read failed",
      error,
    );
    return [];
  }

  return (data ?? []).map((row, i) => ({
    id: row.id,
    rank: i + 1,
    displayName: row.display_name,
    username: row.username,
    dripScore: Number(row.drip_score),
    styleLabel: row.style_label,
  }));
}

export async function playRatingGame(input: {
  frames: string[];
  displayName: string;
  username: string;
  deviceKey: string;
  tzOffset: number;
}): Promise<RatingGameResult> {
  // No cap on how many players a device can enter: the Rating Game runs on a
  // shared booth, so one device legitimately serves a whole queue. The only
  // limit left is the short anti-spam gate below, which a real game (a ~7s
  // scan plus analysis) can never reach.
  const gate = checkAnalysisRate(input.deviceKey);
  if (!gate.ok) return { ok: false, error: gate.message };

  let analysis: FitAnalysis;
  try {
    analysis = await analyzeOutfitFrames(input.frames);
  } catch (error) {
    console.error("[rating-game] analysis failed", error);
    return {
      ok: false,
      error:
        error instanceof AnalysisError
          ? error.message
          : "Analysis failed. Check the lighting and try again.",
    };
  }

  const breakdown = Object.fromEntries(
    Object.entries(analysis.breakdown)
      .filter(([, c]) => c.visible && c.score !== null)
      .map(([k, c]) => [k, c.score as number]),
  );

  const { data: row, error: insertError } = await supabaseAdmin
    .from("live_scores")
    .insert({
      check_type: RATING_GAME_CHECK_TYPE,
      device_key: input.deviceKey,
      display_name: input.displayName,
      username: input.username,
      drip_score: analysis.dripScore,
      style_label: analysis.styleLabel,
      verdict: analysis.verdict,
      breakdown,
    })
    .select("id, created_at")
    .single();

  if (insertError || !row) {
    console.error("[rating-game] save failed", insertError);
    return {
      ok: true,
      analysis,
      saved: false,
      saveError:
        insertError && isMissingColumn(insertError)
          ? "The leaderboard isn't set up yet, so this score couldn't be saved."
          : "Your score couldn't be saved to the leaderboard. Try again.",
    };
  }

  // Rank with the same ordering as readDailyLeaderboard: everyone scoring
  // higher today, plus everyone tied who submitted earlier.
  const since = startOfLocalDay(input.tzOffset).toISOString();
  const [higher, tiedEarlier] = await Promise.all([
    supabaseAdmin
      .from("live_scores")
      .select("id", { count: "exact", head: true })
      .eq("check_type", RATING_GAME_CHECK_TYPE)
      .gte("created_at", since)
      .gt("drip_score", analysis.dripScore),
    supabaseAdmin
      .from("live_scores")
      .select("id", { count: "exact", head: true })
      .eq("check_type", RATING_GAME_CHECK_TYPE)
      .gte("created_at", since)
      .eq("drip_score", analysis.dripScore)
      .lt("created_at", row.created_at),
  ]);

  const rank =
    higher.error || tiedEarlier.error ? null : (higher.count ?? 0) + (tiedEarlier.count ?? 0) + 1;

  return { ok: true, analysis, saved: true, rank };
}
