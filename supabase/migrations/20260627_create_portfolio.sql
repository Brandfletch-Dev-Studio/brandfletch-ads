-- Portfolio items table for Brandfletch Media
CREATE TABLE IF NOT EXISTS public."PortfolioItem" (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  category        TEXT NOT NULL DEFAULT 'graphic_design'
                    CHECK (category IN (
                      'graphic_design','meta_ads','ugc_ads',
                      'social_media','web_design','branding','other'
                    )),
  tags            TEXT[] DEFAULT '{}',
  cover_image     TEXT,
  images          TEXT[] DEFAULT '{}',
  client_name     TEXT,
  client_industry TEXT,
  results         TEXT,          -- e.g. "3x ROAS, +200% reach"
  featured        BOOLEAN NOT NULL DEFAULT false,
  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','published','archived')),
  display_order   INTEGER DEFAULT 0,
  designer_id     UUID REFERENCES auth.users(id),
  designer_name   TEXT,
  created_date    TIMESTAMPTZ DEFAULT NOW(),
  updated_date    TIMESTAMPTZ DEFAULT NOW(),
  created_by      UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_status   ON public."PortfolioItem"(status);
CREATE INDEX IF NOT EXISTS idx_portfolio_category ON public."PortfolioItem"(category);
CREATE INDEX IF NOT EXISTS idx_portfolio_featured ON public."PortfolioItem"(featured);
CREATE INDEX IF NOT EXISTS idx_portfolio_designer ON public."PortfolioItem"(designer_id);

-- Updated_date trigger
CREATE OR REPLACE FUNCTION public.update_portfolio_updated_date()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_date = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_portfolio_updated ON public."PortfolioItem";
CREATE TRIGGER trg_portfolio_updated
  BEFORE UPDATE ON public."PortfolioItem"
  FOR EACH ROW EXECUTE FUNCTION public.update_portfolio_updated_date();

-- RLS
ALTER TABLE public."PortfolioItem" ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public."PortfolioItem" TO anon;
GRANT SELECT ON public."PortfolioItem" TO authenticated;
GRANT ALL    ON public."PortfolioItem" TO service_role;

-- Public can read published items
DROP POLICY IF EXISTS "portfolio_public_select" ON public."PortfolioItem";
CREATE POLICY "portfolio_public_select"
  ON public."PortfolioItem" FOR SELECT
  USING (status = 'published');

-- Admins can do anything
DROP POLICY IF EXISTS "portfolio_admin_all" ON public."PortfolioItem";
CREATE POLICY "portfolio_admin_all"
  ON public."PortfolioItem" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      JOIN public."User" pu ON pu.id = u.id
      WHERE u.id = auth.uid()
        AND pu.role IN ('admin','super_admin')
    )
  );

-- Designers can manage their own items
DROP POLICY IF EXISTS "portfolio_designer_own_select" ON public."PortfolioItem";
CREATE POLICY "portfolio_designer_own_select"
  ON public."PortfolioItem" FOR SELECT
  USING (
    designer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public."User" pu
      WHERE pu.id = auth.uid()
        AND pu.role IN ('admin','super_admin','creative_ops_director')
    )
  );

DROP POLICY IF EXISTS "portfolio_designer_insert" ON public."PortfolioItem";
CREATE POLICY "portfolio_designer_insert"
  ON public."PortfolioItem" FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."User" pu
      WHERE pu.id = auth.uid()
        AND pu.role IN ('admin','super_admin','creative_ops_director','designer')
    )
  );

DROP POLICY IF EXISTS "portfolio_designer_update" ON public."PortfolioItem";
CREATE POLICY "portfolio_designer_update"
  ON public."PortfolioItem" FOR UPDATE
  USING (
    designer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public."User" pu
      WHERE pu.id = auth.uid()
        AND pu.role IN ('admin','super_admin','creative_ops_director')
    )
  );

DROP POLICY IF EXISTS "portfolio_designer_delete" ON public."PortfolioItem";
CREATE POLICY "portfolio_designer_delete"
  ON public."PortfolioItem" FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public."User" pu
      WHERE pu.id = auth.uid()
        AND pu.role IN ('admin','super_admin')
    )
  );
