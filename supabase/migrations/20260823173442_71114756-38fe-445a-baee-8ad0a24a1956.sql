CREATE TABLE public.live_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  display_name TEXT NOT NULL,
  username TEXT NOT NULL,
  drip_score NUMERIC(3,1) NOT NULL CHECK (drip_score >= 1 AND drip_score <= 10),
  style_label TEXT NOT NULL,
  verdict TEXT,
  breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  device_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX live_scores_created_at_idx ON public.live_scores (created_at DESC);
CREATE INDEX live_scores_device_key_idx ON public.live_scores (device_key, created_at DESC);

GRANT SELECT ON public.live_scores TO anon;
GRANT SELECT ON public.live_scores TO authenticated;
GRANT ALL ON public.live_scores TO service_role;

ALTER TABLE public.live_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaderboard is publicly readable"
ON public.live_scores FOR SELECT
TO anon, authenticated
USING (true);