-- Individual per-item graphic design rate card (replaces the old monthly-retainer
-- DesignPricing model). Each row is one purchasable design service at a flat price.
CREATE TABLE IF NOT EXISTS public."DesignServiceRate" (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name   TEXT NOT NULL,
  design_type    TEXT NOT NULL,
  price          NUMERIC NOT NULL DEFAULT 0,
  currency       TEXT NOT NULL DEFAULT 'MWK',
  symbol         TEXT NOT NULL DEFAULT 'MK',
  country        TEXT NOT NULL DEFAULT 'Malawi',
  max_revisions  INTEGER NOT NULL DEFAULT 2,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_date   TIMESTAMPTZ DEFAULT NOW(),
  updated_date   TIMESTAMPTZ DEFAULT NOW(),
  created_by     UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_design_service_rate_active  ON public."DesignServiceRate"(is_active);
CREATE INDEX IF NOT EXISTS idx_design_service_rate_country ON public."DesignServiceRate"(country);

CREATE OR REPLACE FUNCTION public.update_design_service_rate_updated_date()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_date = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_design_service_rate_updated ON public."DesignServiceRate";
CREATE TRIGGER trg_design_service_rate_updated
  BEFORE UPDATE ON public."DesignServiceRate"
  FOR EACH ROW EXECUTE FUNCTION public.update_design_service_rate_updated_date();

ALTER TABLE public."DesignServiceRate" ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public."DesignServiceRate" TO anon;
GRANT SELECT ON public."DesignServiceRate" TO authenticated;
GRANT ALL    ON public."DesignServiceRate" TO service_role;

DROP POLICY IF EXISTS "design_service_rate_public_select" ON public."DesignServiceRate";
CREATE POLICY "design_service_rate_public_select"
  ON public."DesignServiceRate" FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "design_service_rate_admin_select" ON public."DesignServiceRate";
CREATE POLICY "design_service_rate_admin_select"
  ON public."DesignServiceRate" FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public."User" pu WHERE pu.id = auth.uid() AND pu.role IN ('admin','super_admin'))
  );

DROP POLICY IF EXISTS "design_service_rate_admin_insert" ON public."DesignServiceRate";
CREATE POLICY "design_service_rate_admin_insert"
  ON public."DesignServiceRate" FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public."User" pu WHERE pu.id = auth.uid() AND pu.role IN ('admin','super_admin'))
  );

DROP POLICY IF EXISTS "design_service_rate_admin_update" ON public."DesignServiceRate";
CREATE POLICY "design_service_rate_admin_update"
  ON public."DesignServiceRate" FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public."User" pu WHERE pu.id = auth.uid() AND pu.role IN ('admin','super_admin'))
  );

DROP POLICY IF EXISTS "design_service_rate_admin_delete" ON public."DesignServiceRate";
CREATE POLICY "design_service_rate_admin_delete"
  ON public."DesignServiceRate" FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public."User" pu WHERE pu.id = auth.uid() AND pu.role IN ('admin','super_admin'))
  );

INSERT INTO public."DesignServiceRate" (service_name, design_type, price, currency, symbol, country, sort_order) VALUES
  ('Video Ad Creative',     'video_ad_creative',  50000,  'MWK', 'MK', 'Malawi', 1),
  ('Logo',                  'logo',               50000,  'MWK', 'MK', 'Malawi', 2),
  ('Flyer/Poster',          'flyer_poster',       20000,  'MWK', 'MK', 'Malawi', 3),
  ('Banner',                'banner',             25000,  'MWK', 'MK', 'Malawi', 4),
  ('Product Label/Sticker', 'product_label',      50000,  'MWK', 'MK', 'Malawi', 5),
  ('Menu Design',           'menu_design',        30000,  'MWK', 'MK', 'Malawi', 6),
  ('Book Cover',            'book_cover',         30000,  'MWK', 'MK', 'Malawi', 7),
  ('Music Cover',           'music_cover',        30000,  'MWK', 'MK', 'Malawi', 8),
  ('Business Card',         'business_card',      25000,  'MWK', 'MK', 'Malawi', 9),
  ('Invoice/Letterhead',    'invoice_letterhead', 25000,  'MWK', 'MK', 'Malawi', 10),
  ('Calendar',              'calendar',           50000,  'MWK', 'MK', 'Malawi', 11),
  ('Magazine',              'magazine',           150000, 'MWK', 'MK', 'Malawi', 12),
  ('Business Profile',      'business_profile',   100000, 'MWK', 'MK', 'Malawi', 13)
ON CONFLICT DO NOTHING;
