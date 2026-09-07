-- ============================================================================
-- Real auth: profiles + saved fits
-- ============================================================================

-- ---------------------------------------------------------------------------
-- profiles: one row per auth.users row, auto-created on signup
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT username_format CHECK (username ~ '^[a-z0-9._]{2,24}$')
);

CREATE INDEX profiles_username_idx ON public.profiles (username);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are publicly readable"
ON public.profiles FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Auto-create a profile row whenever a new auth user signs up. The username
-- is derived from the email/id so it's always unique and never blocks signup;
-- the user can pick a real one afterwards from /profile.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  suffix INT := 0;
BEGIN
  base_username := lower(regexp_replace(split_part(COALESCE(NEW.email, 'user'), '@', 1), '[^a-z0-9._]', '', 'g'));
  IF base_username IS NULL OR length(base_username) < 2 THEN
    base_username := 'user' || substr(NEW.id::text, 1, 8);
  END IF;
  base_username := left(base_username, 20);
  final_username := base_username;

  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    suffix := suffix + 1;
    final_username := left(base_username, 20) || suffix::text;
  END LOOP;

  INSERT INTO public.profiles (id, username, display_name)
  VALUES (NEW.id, final_username, COALESCE(NULLIF(split_part(NEW.email, '@', 1), ''), 'New user'));

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Keep updated_at fresh on edits.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- saved_fits: a user's bookmarked Drip Score results
-- ---------------------------------------------------------------------------
CREATE TABLE public.saved_fits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  drip_score NUMERIC(3,1) NOT NULL CHECK (drip_score >= 1 AND drip_score <= 10),
  style_label TEXT NOT NULL,
  summary TEXT,
  breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  source TEXT NOT NULL DEFAULT 'photo' CHECK (source IN ('photo', 'live')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX saved_fits_user_id_idx ON public.saved_fits (user_id, created_at DESC);

ALTER TABLE public.saved_fits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved fits"
ON public.saved_fits FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved fits"
ON public.saved_fits FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved fits"
ON public.saved_fits FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

GRANT SELECT, INSERT, DELETE ON public.saved_fits TO authenticated;
GRANT ALL ON public.saved_fits TO service_role;

-- ---------------------------------------------------------------------------
-- Storage: bucket for saved-fit thumbnails, one folder per user (<uid>/<file>)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('saved-fits', 'saved-fits', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Saved fit images are publicly readable"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'saved-fits');

CREATE POLICY "Users can upload their own saved fit images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'saved-fits' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own saved fit images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'saved-fits' AND (storage.foldername(name))[1] = auth.uid()::text);
