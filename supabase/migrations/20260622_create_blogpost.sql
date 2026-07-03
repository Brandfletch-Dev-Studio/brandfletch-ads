-- BlogPost table for Brandfletch Media public website
CREATE TABLE IF NOT EXISTS public."BlogPost" (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  excerpt       TEXT,
  content       TEXT,       -- HTML from RichTextEditor (Quill)
  content_html  TEXT,       -- alias kept for legacy compat; use content
  cover_image   TEXT,
  category      TEXT,
  emoji         TEXT DEFAULT '📣',
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  author_name   TEXT DEFAULT 'Brandfletch Team',
  published_at  TIMESTAMPTZ,
  created_date  TIMESTAMPTZ DEFAULT NOW(),
  updated_date  TIMESTAMPTZ DEFAULT NOW(),
  created_by    UUID REFERENCES auth.users(id)
);

-- Grant anon read access (required for public blog to work)
GRANT SELECT ON public."BlogPost" TO anon;
GRANT SELECT ON public."BlogPost" TO authenticated;
GRANT ALL    ON public."BlogPost" TO service_role;

ALTER TABLE public."BlogPost" ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist (idempotent re-run)
DROP POLICY IF EXISTS "Public can read published posts" ON public."BlogPost";
DROP POLICY IF EXISTS "Admins can manage all posts"    ON public."BlogPost";

-- Anyone can read published posts (anon + authenticated)
CREATE POLICY "Public can read published posts"
  ON public."BlogPost" FOR SELECT
  USING (status = 'published');

-- Admins can read ALL posts (including drafts) and write
CREATE POLICY "Admins can read all posts"
  ON public."BlogPost" FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public."User" WHERE role IN ('admin','super_admin')
    )
  );

CREATE POLICY "Admins can insert posts"
  ON public."BlogPost" FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public."User" WHERE role IN ('admin','super_admin')
    )
  );

CREATE POLICY "Admins can update posts"
  ON public."BlogPost" FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM public."User" WHERE role IN ('admin','super_admin')
    )
  );

CREATE POLICY "Admins can delete posts"
  ON public."BlogPost" FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM public."User" WHERE role IN ('admin','super_admin')
    )
  );

-- Sample post (skip if already exists)
INSERT INTO public."BlogPost" (title, slug, excerpt, content, category, status, published_at, emoji)
SELECT
  '5 Facebook Ad Strategies That Work for African Businesses',
  '5-facebook-ad-strategies-africa',
  'Learn how businesses across Malawi, Kenya, Zambia and beyond are using Facebook ads to grow sales with tight budgets.',
  '<h2>5 Facebook Ad Strategies That Work for African Businesses</h2>
<p>Facebook advertising is one of the most powerful tools for reaching customers across Africa. Here are five strategies that consistently deliver results.</p>
<h3>1. Use local language in your creatives</h3>
<p>Copy written in the local dialect or familiar slang consistently outperforms generic English copy.</p>
<h3>2. Target by mobile device</h3>
<p>Over 90% of Facebook users in Africa access it via mobile. Optimise your creatives for vertical viewing.</p>
<h3>3. Start with a small test budget</h3>
<p>Run three different creatives at MK 5,000 each for 3 days, then scale only the winner.</p>
<h3>4. Retarget your page visitors</h3>
<p>Custom audiences from your Facebook Page engagements are often your warmest leads.</p>
<h3>5. Use video for awareness, static for conversion</h3>
<p>Short 15-second videos work well for reach campaigns; single-image ads with a clear CTA drive clicks.</p>',
  'Strategy',
  'published',
  NOW(),
  '🚀'
WHERE NOT EXISTS (
  SELECT 1 FROM public."BlogPost" WHERE slug = '5-facebook-ad-strategies-africa'
);
