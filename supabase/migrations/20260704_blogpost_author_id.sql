-- Add author_id so blog posts can be properly attributed to a registered
-- staff member (not just a free-text name). author_name stays as the
-- denormalized display value the public blog already reads from — kept in
-- sync whenever author_id is set, so no changes needed on the public side.
ALTER TABLE public."BlogPost"
  ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS blogpost_author_id_idx ON public."BlogPost"(author_id);
