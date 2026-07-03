-- UgcOrder.package was constrained to only the 3 original UGC Ads package
-- tiers ('starter','growth','brand_campaign'). Now that UgcOrder is the
-- general Studios order table (service_type also covers content_creation,
-- podcast, videography, photography — each with its own ServiceRate-driven
-- plan/service name), that CHECK is too narrow and would reject every new
-- non-UGC order. Drop it — package becomes free text (still populated
-- sensibly by the app, just no longer DB-enforced to the old 3 values).
ALTER TABLE public."UgcOrder" DROP CONSTRAINT IF EXISTS "UgcOrder_package_check";
