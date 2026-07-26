-- Update MetaOnboarding flow: add 'page_selection' as the new first post-payment step
-- Flow is now: page_selection → connect_facebook (optional) → verify_access → campaign_creation → live
--
-- page_selection lets the user pick from existing FacebookPage records
-- (connected via /pages) or connect a new page via Facebook OAuth.

-- Update the default step for new onboarding records
ALTER TABLE "MetaOnboarding" ALTER COLUMN step SET DEFAULT 'page_selection';

COMMENT ON COLUMN "MetaOnboarding".step IS
  'page_selection → connect_facebook → verify_access → campaign_creation → live';

-- Backfill any in-flight records still at the old default so they resume
-- correctly on the new flow. Records that already progressed past
-- connect_facebook are left untouched.
UPDATE "MetaOnboarding"
SET step = 'page_selection', updated_at = now()
WHERE step = 'connect_facebook'
  AND status = 'pending';
