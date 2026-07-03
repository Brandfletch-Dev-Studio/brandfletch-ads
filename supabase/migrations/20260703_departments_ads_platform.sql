-- Ads department: add a platform discriminator to Campaign so Google Ads and
-- (later) TikTok Ads reuse the exact same battle-tested table/workflow
-- instead of new near-duplicate tables. Existing rows are all Meta Ads.
ALTER TABLE public."Campaign"
  ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT 'meta'
    CHECK (platform IN ('meta', 'google', 'tiktok'));

CREATE INDEX IF NOT EXISTS idx_campaign_platform ON public."Campaign"(platform);

COMMENT ON COLUMN public."Campaign".platform IS
  'Ad platform: meta (live), google (live), tiktok (coming soon, not yet orderable)';
