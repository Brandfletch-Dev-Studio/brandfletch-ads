-- Fix: Campaign records were not showing in the user's campaign list
-- because `created_by` was never populated. The list filters by
-- created_by = auth.uid(), but the insert from the wizard didn't set it
-- and no trigger existed to auto-populate it.
--
-- This migration:
-- 1. Ensures the column exists
-- 2. Backfills it from user_id for existing campaigns
-- 3. Adds a trigger to auto-populate it on future inserts

-- 1. Ensure created_by column exists
ALTER TABLE public."Campaign" ADD COLUMN IF NOT EXISTS created_by TEXT;

-- 2. Backfill from user_id where created_by is NULL
UPDATE public."Campaign"
SET created_by = user_id
WHERE created_by IS NULL AND user_id IS NOT NULL;

-- 3. Trigger to auto-set created_by = auth.uid() on insert
-- (in case the app doesn't set it explicitly)
CREATE OR REPLACE FUNCTION public.set_campaign_created_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid()::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_campaign_set_created_by ON public."Campaign";
CREATE TRIGGER trg_campaign_set_created_by
  BEFORE INSERT ON public."Campaign"
  FOR EACH ROW EXECUTE FUNCTION public.set_campaign_created_by();
