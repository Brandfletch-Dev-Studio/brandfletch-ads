-- BlogPost table for Brandfletch Ads public website
CREATE TABLE IF NOT EXISTS public."BlogPost" (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  excerpt       TEXT,
  content       TEXT,
  content_html  TEXT,
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

ALTER TABLE public."BlogPost" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published posts"
  ON public."BlogPost" FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins can manage all posts"
  ON public."BlogPost" FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM public."User" WHERE role IN ('admin','super_admin')
    )
  );

-- Sample post
INSERT INTO public."BlogPost" (title, slug, excerpt, content, category, status, published_at, emoji)
VALUES (
  '5 Facebook Ad Strategies That Work for African Businesses',
  '5-facebook-ad-strategies-africa',
  'Learn how businesses across Malawi, Kenya, Zambia and beyond are using Facebook ads to grow sales with tight budgets.',
  '## 5 Facebook Ad Strategies That Work for African Businesses

Facebook advertising is one of the most powerful tools for reaching customers across Africa. Here are five strategies that consistently deliver results.

**1. Use local language in your creatives**
Copy written in the local dialect or familiar slang consistently outperforms generic English copy.

**2. Target by mobile device**
Over 90% of Facebook users in Africa access it via mobile. Optimise your creatives for vertical viewing.

**3. Start with a small test budget**
Run three different creatives at MK 5,000 each for 3 days, then scale only the winner.

**4. Retarget your page visitors**
Custom audiences from your Facebook Page engagements are often your warmest leads.

**5. Use video for awareness, static for conversion**
Short 15-second videos work well for reach campaigns; single-image ads with a clear CTA drive clicks.',
  'Strategy',
  'published',
  NOW(),
  '🚀'
);
