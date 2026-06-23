-- UgcOrder table
CREATE TABLE IF NOT EXISTS public."UgcOrder" (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_ref             TEXT,
  user_id               UUID REFERENCES auth.users(id),
  user_name             TEXT,
  user_email            TEXT,

  package               TEXT CHECK (package IN ('starter','growth','brand_campaign')),
  num_videos            INTEGER,
  amount                NUMERIC,
  currency              TEXT,
  amount_usd            NUMERIC,

  status                TEXT NOT NULL DEFAULT 'pending_payment'
                          CHECK (status IN ('pending_payment','awaiting_brief','in_production','review','revision_requested','completed','cancelled')),
  payment_status        TEXT NOT NULL DEFAULT 'unpaid'
                          CHECK (payment_status IN ('unpaid','pending_verification','paid','refunded')),
  payment_method        TEXT,
  payment_reference     TEXT,
  payment_proof_url     TEXT,
  paychangu_tx_ref      TEXT,

  brand_name            TEXT,
  product_service       TEXT,
  target_audience       TEXT,
  campaign_goal         TEXT CHECK (campaign_goal IN ('brand_awareness','product_launch','sales_conversion','engagement','testimonial','other')),
  key_messages          TEXT,
  tone_style            TEXT,
  reference_links       TEXT,
  special_requirements  TEXT,
  brand_assets_url      TEXT,
  script_provided       BOOLEAN DEFAULT FALSE,
  script_content        TEXT,

  assigned_creator_id   UUID,
  assigned_creator_name TEXT,
  admin_notes           TEXT,
  deliverables_url      TEXT,
  revision_notes        TEXT,
  revision_count        INTEGER DEFAULT 0,

  brief_submitted_at    TIMESTAMPTZ,
  production_started_at TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  created_date          TIMESTAMPTZ DEFAULT NOW(),
  updated_date          TIMESTAMPTZ DEFAULT NOW(),
  created_by            UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS ugcorder_user_id_idx ON public."UgcOrder" (user_id);
CREATE INDEX IF NOT EXISTS ugcorder_status_idx  ON public."UgcOrder" (status);

-- RLS
ALTER TABLE public."UgcOrder" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own UGC orders"
  ON public."UgcOrder" FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own UGC orders"
  ON public."UgcOrder" FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own UGC orders"
  ON public."UgcOrder" FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all UGC orders"
  ON public."UgcOrder" FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM public."User"
      WHERE role IN ('admin','super_admin','ads_manager','campaign_manager')
    )
  );

-- Auto-update updated_date trigger
CREATE OR REPLACE FUNCTION public.update_ugcorder_updated_date()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_ugcorder_updated_date ON public."UgcOrder";
CREATE TRIGGER set_ugcorder_updated_date
  BEFORE UPDATE ON public."UgcOrder"
  FOR EACH ROW EXECUTE FUNCTION public.update_ugcorder_updated_date();
