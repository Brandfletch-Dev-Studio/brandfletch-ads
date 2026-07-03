-- Cross-department admin-editable pricing catalog for the newly added
-- services that don't have real prices yet (Arthur/dept managers set real
-- rates later in that department's settings). Mirrors the proven
-- DesignServiceRate pattern, generalized across all 4 departments.
-- price = 0 with billing_type='one_off' means "not yet priced, hidden from
-- customers until set"; billing_type='custom_quote' means always show
-- "Contact for a quote" regardless of price.
CREATE TABLE IF NOT EXISTS public."ServiceRate" (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department     TEXT NOT NULL CHECK (department IN ('ads', 'designs', 'studios', 'dev_studio')),
  service_key    TEXT NOT NULL,
  service_name   TEXT NOT NULL,
  plan_name      TEXT,
  billing_type   TEXT NOT NULL DEFAULT 'one_off' CHECK (billing_type IN ('one_off', 'custom_quote')),
  price          NUMERIC NOT NULL DEFAULT 0,
  currency       TEXT NOT NULL DEFAULT 'MWK',
  symbol         TEXT NOT NULL DEFAULT 'MK',
  country        TEXT NOT NULL DEFAULT 'Malawi',
  sort_order     INTEGER NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT false,
  created_date   TIMESTAMPTZ DEFAULT NOW(),
  updated_date   TIMESTAMPTZ DEFAULT NOW(),
  created_by     UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_service_rate_department ON public."ServiceRate"(department);
CREATE INDEX IF NOT EXISTS idx_service_rate_active     ON public."ServiceRate"(is_active);

CREATE OR REPLACE FUNCTION public.update_service_rate_updated_date()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_date = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_service_rate_updated ON public."ServiceRate";
CREATE TRIGGER trg_service_rate_updated
  BEFORE UPDATE ON public."ServiceRate"
  FOR EACH ROW EXECUTE FUNCTION public.update_service_rate_updated_date();

ALTER TABLE public."ServiceRate" ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public."ServiceRate" TO anon;
GRANT SELECT ON public."ServiceRate" TO authenticated;
GRANT ALL    ON public."ServiceRate" TO service_role;

DROP POLICY IF EXISTS "service_rate_public_select" ON public."ServiceRate";
CREATE POLICY "service_rate_public_select"
  ON public."ServiceRate" FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "service_rate_staff_select" ON public."ServiceRate";
CREATE POLICY "service_rate_staff_select"
  ON public."ServiceRate" FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public."User" pu WHERE pu.id = auth.uid() AND pu.role IN (
      'admin','super_admin','platform_sales','platform_finance','platform_director_ops',
      'ads_manager','ads_finance','creative_ops_director','designs_finance',
      'studios_manager','studios_finance','devstudio_manager','devstudio_finance'
    ))
  );

DROP POLICY IF EXISTS "service_rate_staff_write" ON public."ServiceRate";
CREATE POLICY "service_rate_staff_write"
  ON public."ServiceRate" FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public."User" pu WHERE pu.id = auth.uid() AND pu.role IN (
      'admin','super_admin','platform_finance',
      'ads_manager','ads_finance','creative_ops_director','designs_finance',
      'studios_manager','studios_finance','devstudio_manager','devstudio_finance'
    ))
  );

DROP POLICY IF EXISTS "service_rate_staff_update" ON public."ServiceRate";
CREATE POLICY "service_rate_staff_update"
  ON public."ServiceRate" FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public."User" pu WHERE pu.id = auth.uid() AND pu.role IN (
      'admin','super_admin','platform_finance',
      'ads_manager','ads_finance','creative_ops_director','designs_finance',
      'studios_manager','studios_finance','devstudio_manager','devstudio_finance'
    ))
  );

DROP POLICY IF EXISTS "service_rate_staff_delete" ON public."ServiceRate";
CREATE POLICY "service_rate_staff_delete"
  ON public."ServiceRate" FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public."User" pu WHERE pu.id = auth.uid() AND pu.role IN ('admin','super_admin','platform_finance'))
  );

-- Placeholder rows for every new service — inactive (is_active=false) until
-- a real price is set, so nothing half-priced ever shows to a customer.
INSERT INTO public."ServiceRate" (department, service_key, service_name, billing_type, price, is_active, sort_order) VALUES
  ('ads',        'google_ads',       'Google Ads',              'one_off',      0, false, 1),
  ('ads',        'tiktok_ads',       'TikTok Ads (Coming Soon)','one_off',      0, false, 2),
  ('studios',    'content_creation', 'Content Creation (Reels)','one_off',      0, false, 1),
  ('studios',    'podcast',          'Podcast Feature',         'one_off',      0, false, 2),
  ('studios',    'videography',      'Videography',             'one_off',      0, false, 3),
  ('studios',    'photography',      'Photography',             'one_off',      0, false, 4),
  ('dev_studio', 'website',          'Websites',                'one_off',      0, false, 1),
  ('dev_studio', 'app',              'Apps',                    'custom_quote', 0, false, 2),
  ('dev_studio', 'automation',       'Automations',             'custom_quote', 0, false, 3),
  ('dev_studio', 'ai_agent',         'AI Agents',                'custom_quote', 0, false, 4)
ON CONFLICT DO NOTHING;
