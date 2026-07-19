-- Meta Onboarding Table
-- Stores Facebook/Meta onboarding state for each campaign
-- Extensible via `assets` JSONB for future Instagram, Pixel, Catalog, etc.

CREATE TABLE IF NOT EXISTS "MetaOnboarding" (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     TEXT NOT NULL,
  user_id         TEXT NOT NULL,

  -- Flow state
  step            TEXT DEFAULT 'connect_facebook',
    -- connect_facebook → page_selected → verify_access → campaign_creation → live
  status          TEXT DEFAULT 'pending',
    -- pending → awaiting_page_selection → access_granted | access_pending → campaign_created → live
  permissions_granted BOOLEAN DEFAULT false,
  missing_permissions JSONB DEFAULT '[]'::jsonb,

  -- Facebook Page details
  fb_page_id      TEXT,
  fb_page_name    TEXT,
  fb_business_id  TEXT,
  fb_business_name TEXT,

  -- Meta tokens (stored server-side only, never exposed to browser)
  fb_user_access_token  TEXT,
  fb_long_lived_token   TEXT,

  -- Campaign creation results
  ad_campaign_id    TEXT,
  ad_campaign_status TEXT,
  ad_set_id         TEXT,
  ad_id             TEXT,

  -- Polling
  polling_started_at  TIMESTAMPTZ,
  last_checked_at     TIMESTAMPTZ,

  -- Extensible assets (Instagram, Pixel, Catalog, etc.)
  -- Structure: { page: { id, name, connected }, instagram: { id, username }, pixel: { id }, catalog: { id, name } }
  assets              JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_meta_onboarding_campaign_id ON "MetaOnboarding" (campaign_id);
CREATE INDEX IF NOT EXISTS idx_meta_onboarding_user_id ON "MetaOnboarding" (user_id);
CREATE INDEX IF NOT EXISTS idx_meta_onboarding_status ON "MetaOnboarding" (status);

-- RLS: Users can only see their own onboarding records
ALTER TABLE "MetaOnboarding" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding" ON "MetaOnboarding"
  FOR SELECT USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert own onboarding" ON "MetaOnboarding"
  FOR INSERT WITH CHECK (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can update own onboarding" ON "MetaOnboarding"
  FOR UPDATE USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

-- Service role (serverless functions) can do everything
CREATE POLICY "Service role full access" ON "MetaOnboarding"
  FOR ALL USING (auth.role() = 'service_role');

-- Add onboarding columns to Campaign table if they don't exist
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS onboarding_step TEXT;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS onboarding_status TEXT;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS fb_page_id TEXT;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS fb_business_id TEXT;
