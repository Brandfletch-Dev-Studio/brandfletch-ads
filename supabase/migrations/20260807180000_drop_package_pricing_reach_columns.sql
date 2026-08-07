-- Drop reach columns from PackagePricing table
-- Reach numbers are estimates, not configurable values. They are hardcoded
-- in src/lib/pricing.js as ESTIMATED_REACH and should never come from the DB.

ALTER TABLE "PackagePricing" DROP COLUMN IF EXISTS reach_low;
ALTER TABLE "PackagePricing" DROP COLUMN IF EXISTS reach_high;
