-- Simplified Facebook connection (agency-powered model)
-- Adds fb_page_name and fb_page_url to Campaign for the partner-access flow
-- Ensures FacebookPage table has the right columns

-- ── Campaign table: add new columns for simplified flow ──────────────
ALTER TABLE public."Campaign" ADD COLUMN IF NOT EXISTS fb_page_name TEXT;
ALTER TABLE public."Campaign" ADD COLUMN IF NOT EXISTS fb_page_url TEXT;

-- ── FacebookPage table: ensure it exists with correct schema ────────
-- (May already exist if created via Supabase dashboard — IF NOT EXISTS guards)
CREATE TABLE IF NOT EXISTS public."FacebookPage" (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_name         TEXT NOT NULL,
  page_url          TEXT,
  connection_status TEXT DEFAULT 'connected',
  created_by        UUID REFERENCES auth.users(id),
  created_date      TIMESTAMPTZ DEFAULT now(),
  updated_date      TIMESTAMPTZ DEFAULT now()
);

-- Add any missing columns if table already existed
ALTER TABLE public."FacebookPage" ADD COLUMN IF NOT EXISTS page_name         TEXT;
ALTER TABLE public."FacebookPage" ADD COLUMN IF NOT EXISTS page_url          TEXT;
ALTER TABLE public."FacebookPage" ADD COLUMN IF NOT EXISTS connection_status TEXT DEFAULT 'connected';
ALTER TABLE public."FacebookPage" ADD COLUMN IF NOT EXISTS created_by        UUID REFERENCES auth.users(id);
ALTER TABLE public."FacebookPage" ADD COLUMN IF NOT EXISTS created_date      TIMESTAMPTZ DEFAULT now();
ALTER TABLE public."FacebookPage" ADD COLUMN IF NOT EXISTS updated_date      TIMESTAMPTZ DEFAULT now();

-- RLS on FacebookPage
ALTER TABLE public."FacebookPage" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own pages" ON public."FacebookPage";
CREATE POLICY "Users can view own pages" ON public."FacebookPage"
  FOR SELECT USING (auth.uid() = created_by OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can insert own pages" ON public."FacebookPage";
CREATE POLICY "Users can insert own pages" ON public."FacebookPage"
  FOR INSERT WITH CHECK (auth.uid() = created_by OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can update own pages" ON public."FacebookPage";
CREATE POLICY "Users can update own pages" ON public."FacebookPage"
  FOR UPDATE USING (auth.uid() = created_by OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can delete own pages" ON public."FacebookPage";
CREATE POLICY "Users can delete own pages" ON public."FacebookPage"
  FOR DELETE USING (auth.uid() = created_by OR auth.role() = 'service_role');
