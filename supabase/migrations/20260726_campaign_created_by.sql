-- Fix: Campaign records were not showing in the user's campaign list
-- because `created_by` was never populated. The list filters by
-- created_by = auth.uid(), but the insert from the wizard didn't set it
-- and no trigger existed to auto-populate it.
--
-- Note: created_by already exists as UUID on the Campaign table (added by
-- Base44 during initial table creation). We just need to backfill and
-- add the trigger.

-- 1. Backfill from user_id (cast text -> uuid) for existing campaigns
UPDATE public."Campaign"
SET created_by = user_id::uuid
WHERE created_by IS NULL AND user_id IS NOT NULL;

-- 2. Trigger to auto-set created_by = auth.uid() on insert
CREATE OR REPLACE FUNCTION public.set_campaign_created_by()
RETURNS TRIGGER AS $func$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_campaign_set_created_by ON public."Campaign";
CREATE TRIGGER trg_campaign_set_created_by
  BEFORE INSERT ON public."Campaign"
  FOR EACH ROW EXECUTE FUNCTION public.set_campaign_created_by();
