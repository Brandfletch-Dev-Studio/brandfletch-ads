-- ── v2: add analytics columns + fix RLS insert policy ──────────────────────

-- Add analytics columns (safe / idempotent)
ALTER TABLE public."BlogPost"
  ADD COLUMN IF NOT EXISTS view_count   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS read_count   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS share_count  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tags         TEXT[] DEFAULT '{}';

-- Grant anon SELECT (idempotent)
GRANT SELECT ON public."BlogPost" TO anon;
GRANT SELECT ON public."BlogPost" TO authenticated;
GRANT ALL    ON public."BlogPost" TO service_role;

-- Drop & recreate all policies cleanly
DROP POLICY IF EXISTS "Public can read published posts" ON public."BlogPost";
DROP POLICY IF EXISTS "Admins can read all posts"       ON public."BlogPost";
DROP POLICY IF EXISTS "Admins can insert posts"         ON public."BlogPost";
DROP POLICY IF EXISTS "Admins can update posts"         ON public."BlogPost";
DROP POLICY IF EXISTS "Admins can delete posts"         ON public."BlogPost";
DROP POLICY IF EXISTS "Public can increment views"      ON public."BlogPost";

-- Public: read published posts
CREATE POLICY "Public can read published posts"
  ON public."BlogPost" FOR SELECT
  USING (status = 'published');

-- Admins: read ALL posts (drafts too)
CREATE POLICY "Admins can read all posts"
  ON public."BlogPost" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE id = auth.uid()
      AND role IN ('admin','super_admin')
    )
  );

-- Admins: insert — use EXISTS not IN for reliability
CREATE POLICY "Admins can insert posts"
  ON public."BlogPost" FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE id = auth.uid()
      AND role IN ('admin','super_admin')
    )
  );

-- Admins: update
CREATE POLICY "Admins can update posts"
  ON public."BlogPost" FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE id = auth.uid()
      AND role IN ('admin','super_admin')
    )
  );

-- Admins: delete
CREATE POLICY "Admins can delete posts"
  ON public."BlogPost" FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public."User"
      WHERE id = auth.uid()
      AND role IN ('admin','super_admin')
    )
  );

-- Anyone can increment view/read/share counts (anon-safe update)
CREATE POLICY "Anyone can increment analytics"
  ON public."BlogPost" FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Helper function to safely increment a counter column
CREATE OR REPLACE FUNCTION public.increment_blog_counter(
  post_id UUID,
  col_name TEXT
) RETURNS void AS $$
BEGIN
  IF col_name = 'view_count' THEN
    UPDATE public."BlogPost" SET view_count  = view_count  + 1 WHERE id = post_id;
  ELSIF col_name = 'read_count' THEN
    UPDATE public."BlogPost" SET read_count  = read_count  + 1 WHERE id = post_id;
  ELSIF col_name = 'share_count' THEN
    UPDATE public."BlogPost" SET share_count = share_count + 1 WHERE id = post_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.increment_blog_counter TO anon, authenticated;
