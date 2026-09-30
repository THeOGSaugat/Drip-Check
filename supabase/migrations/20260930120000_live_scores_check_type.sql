-- ============================================================================
-- Separate the competitive Rating Game from personal checks.
--
-- live_scores is the only score table, so rather than adding a second table we
-- tag every row with the kind of check that produced it. The daily leaderboard
-- and the home page Top 3 read ONLY check_type = 'rating_game'.
-- ============================================================================

ALTER TABLE public.live_scores ADD COLUMN check_type TEXT;

-- Backfill existing rows. Before this change both Live Check and Photo Check
-- could post to this table; neither is competitive any more, so none of these
-- rows may appear on the leaderboard. Photo Check breakdowns used the
-- "colors"/"coordination" keys; Live Check used "colorCoordination"/"top"/...
UPDATE public.live_scores
SET check_type = CASE
  WHEN breakdown ? 'colors' OR breakdown ? 'coordination' THEN 'photo'
  ELSE 'live'
END
WHERE check_type IS NULL;

-- Deliberately NO default: every insert must say what it is, so a future
-- write path can never land on the leaderboard by accident.
ALTER TABLE public.live_scores
  ALTER COLUMN check_type SET NOT NULL,
  ADD CONSTRAINT live_scores_check_type_check
    CHECK (check_type IN ('live', 'photo', 'rating_game'));

-- Serves the daily leaderboard: filter by type + today, order by score.
CREATE INDEX live_scores_type_created_idx
  ON public.live_scores (check_type, created_at DESC, drip_score DESC);
