-- Studios department: generalize UgcOrder to cover all Studios creative
-- production services (UGC Ads, Content Creation/Reels, Podcast Feature,
-- Videography, Photography) via a service_type discriminator, instead of
-- 4 new near-duplicate tables. Existing rows are all 'ugc_ads'.
ALTER TABLE public."UgcOrder"
  ADD COLUMN IF NOT EXISTS service_type TEXT NOT NULL DEFAULT 'ugc_ads'
    CHECK (service_type IN ('ugc_ads', 'content_creation', 'podcast', 'videography', 'photography'));

CREATE INDEX IF NOT EXISTS idx_ugcorder_service_type ON public."UgcOrder"(service_type);

COMMENT ON COLUMN public."UgcOrder".service_type IS
  'Which Studios service this order is for. Table name kept as UgcOrder to avoid touching the live Paychangu integration; this is now the general Studios order table.';

-- Fix a pre-existing bug: the admin RLS policy granted access to Ads dept
-- roles (ads_manager/campaign_manager) instead of the Studios dept roles
-- that actually own this work, because Studios didn't exist as a formal
-- department when this table was first created.
DROP POLICY IF EXISTS "Admins can manage all UGC orders" ON public."UgcOrder";
CREATE POLICY "Studios team and platform team can manage all Studio orders"
  ON public."UgcOrder" FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM public."User"
      WHERE role IN (
        'admin', 'super_admin',
        'platform_sales', 'platform_finance', 'platform_director_ops',
        'studios_manager', 'studios_sales', 'studios_finance', 'content_creator'
      )
    )
  );
