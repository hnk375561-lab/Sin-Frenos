-- ============================================================================
-- LEGAL COMPLIANCE FOUNDATION — additive migration (2026-09)
--
-- WHY: The marketplace needs durable evidence of legal consent and a
-- reversible account-deletion marker. UI-only checkboxes are not evidence;
-- deleted profiles must also disappear from public projections immediately.
-- This migration is additive and preserves existing RLS protections.
-- ============================================================================

CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('terms', 'privacy', 'content')),
  policy_version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_consent_records_user_type ON consent_records(user_id, consent_type, accepted_at DESC);
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert their own consent records" ON consent_records;
CREATE POLICY "Users can insert their own consent records" ON consent_records FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can read their own consent records" ON consent_records;
CREATE POLICY "Users can read their own consent records" ON consent_records FOR SELECT TO authenticated USING (user_id = auth.uid());

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS retention_review_at TIMESTAMPTZ;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_listings_retention_review_at ON listings(retention_review_at);

-- Public projections intentionally exclude soft-deleted accounts.
DROP VIEW IF EXISTS public_profiles;
CREATE VIEW public_profiles AS
SELECT id, display_name, avatar_url, seller_type, is_verified, total_listings, total_sales, avg_rating
FROM profiles WHERE deleted_at IS NULL;
GRANT SELECT ON public_profiles TO anon, authenticated;

DROP VIEW IF EXISTS public_seller_profiles;
CREATE VIEW public_seller_profiles AS
SELECT sp.user_id, sp.business_name, sp.verified
FROM seller_profiles sp JOIN profiles p ON p.id = sp.user_id
WHERE p.deleted_at IS NULL;
GRANT SELECT ON public_seller_profiles TO anon, authenticated;

COMMENT ON TABLE consent_records IS 'Durable, versioned evidence of affirmative legal consent. Retained while the account exists.';
COMMENT ON COLUMN profiles.deleted_at IS 'Soft deletion marker. Public views exclude the profile immediately; scheduled operational cleanup may remove PII after the configured window.';
COMMENT ON COLUMN listings.retention_review_at IS 'Operational marker for listings inactive for the configured retention review window.';
COMMENT ON COLUMN listings.deleted_at IS 'Soft deletion marker retained for moderation/reporting history before hard deletion.';
