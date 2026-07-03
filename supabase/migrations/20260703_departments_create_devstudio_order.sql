-- Dev Studio department: new order table (Websites, Apps, Automations, AI
-- Agents). Dev Studio previously had zero order flow (Web Design was a
-- "contact us" static plan only) — mirrors the proven UgcOrder lifecycle
-- pattern (package -> payment -> brief -> in production -> review -> done).
CREATE TABLE IF NOT EXISTS public."DevStudioOrder" (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_ref             TEXT,
  user_id               UUID REFERENCES auth.users(id),
  user_name             TEXT,
  user_email            TEXT,

  service_type          TEXT NOT NULL
                          CHECK (service_type IN ('website', 'app', 'automation', 'ai_agent')),
  package               TEXT,
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

  project_name          TEXT,
  project_goal          TEXT,
  target_audience       TEXT,
  key_features          TEXT,
  reference_links       TEXT,
  special_requirements  TEXT,
  brand_assets_url      TEXT,

  assigned_developer_id   UUID,
  assigned_developer_name TEXT,
  admin_notes             TEXT,
  deliverables_url         TEXT,
  revision_notes           TEXT,
  revision_count           INTEGER DEFAULT 0,

  brief_submitted_at    TIMESTAMPTZ,
  production_started_at TIMESTAMPTZ,
  completed_at           TIMESTAMPTZ,
  created_date           TIMESTAMPTZ DEFAULT NOW(),
  updated_date            TIMESTAMPTZ DEFAULT NOW(),
  created_by              UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_devstudioorder_user_id      ON public."DevStudioOrder"(user_id);
CREATE INDEX IF NOT EXISTS idx_devstudioorder_status       ON public."DevStudioOrder"(status);
CREATE INDEX IF NOT EXISTS idx_devstudioorder_service_type ON public."DevStudioOrder"(service_type);

ALTER TABLE public."DevStudioOrder" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Dev Studio orders"
  ON public."DevStudioOrder" FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own Dev Studio orders"
  ON public."DevStudioOrder" FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Dev Studio orders"
  ON public."DevStudioOrder" FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Dev Studio team and platform team can manage all Dev Studio orders"
  ON public."DevStudioOrder" FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM public."User"
      WHERE role IN (
        'admin', 'super_admin',
        'platform_sales', 'platform_finance', 'platform_director_ops',
        'devstudio_manager', 'devstudio_sales', 'devstudio_finance', 'developer'
      )
    )
  );

CREATE OR REPLACE FUNCTION public.update_devstudioorder_updated_date()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_devstudioorder_updated_date ON public."DevStudioOrder";
CREATE TRIGGER set_devstudioorder_updated_date
  BEFORE UPDATE ON public."DevStudioOrder"
  FOR EACH ROW EXECUTE FUNCTION public.update_devstudioorder_updated_date();
