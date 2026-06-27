-- ── GuestOrder: captures orders placed by unauthenticated visitors ──────────

CREATE TABLE IF NOT EXISTS public."GuestOrder" (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_date   TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Contact info
  full_name      TEXT        NOT NULL,
  email          TEXT        NOT NULL,
  phone          TEXT,
  business_name  TEXT,
  country        TEXT,

  -- What they ordered
  service_type   TEXT        NOT NULL,  -- 'meta-ads' | 'ugc-ads' | 'designs' | 'web' | 'social'
  package_slug   TEXT,                  -- e.g. 'starter', 'growth', 'business', 'premium'
  plan_name      TEXT,                  -- human label
  currency       TEXT,
  price          NUMERIC,
  duration       TEXT,                  -- 'weekly' | 'monthly'

  -- Extra brief
  notes          TEXT,

  -- Admin tracking
  status         TEXT        NOT NULL DEFAULT 'new',  -- 'new' | 'contacted' | 'converted' | 'closed'
  admin_notes    TEXT
);

-- Timestamps trigger
CREATE OR REPLACE FUNCTION public.update_guestorder_updated_date()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_date = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_guestorder_updated ON public."GuestOrder";
CREATE TRIGGER trg_guestorder_updated
  BEFORE UPDATE ON public."GuestOrder"
  FOR EACH ROW EXECUTE FUNCTION public.update_guestorder_updated_date();

-- RLS
ALTER TABLE public."GuestOrder" ENABLE ROW LEVEL SECURITY;

-- Anyone (anon) can INSERT a guest order
CREATE POLICY "Anon can insert guest orders"
  ON public."GuestOrder" FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Only admins (service_role) can read/update/delete
CREATE POLICY "Admins can manage guest orders"
  ON public."GuestOrder" FOR ALL TO service_role
  USING (true) WITH CHECK (true);

GRANT INSERT ON public."GuestOrder" TO anon;
GRANT INSERT ON public."GuestOrder" TO authenticated;
GRANT ALL    ON public."GuestOrder" TO service_role;
