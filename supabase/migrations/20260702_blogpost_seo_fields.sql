-- Blog SEO fields: meta title/description overrides for search & social,
-- so editors can optimize how a post appears in Google/Facebook/Twitter
-- without it having to match the on-page title/excerpt exactly.

ALTER TABLE public."BlogPost"
  ADD COLUMN IF NOT EXISTS meta_title       TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT;

COMMENT ON COLUMN public."BlogPost".meta_title       IS 'SEO <title> / og:title override. Falls back to title if empty.';
COMMENT ON COLUMN public."BlogPost".meta_description IS 'SEO meta description / og:description override. Falls back to excerpt if empty.';
