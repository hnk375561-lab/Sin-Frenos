import type { SupabaseClient } from '@supabase/supabase-js'

export const LEGAL_VERSIONS = {
  terms: 'terms_v2026-09',
  privacy: 'privacy_v2026-09',
  content: 'content_v2026-09',
} as const

export type LegalConsentType = keyof typeof LEGAL_VERSIONS

export async function recordLegalConsent(
  supabase: SupabaseClient,
  userId: string,
  consentType: LegalConsentType,
  metadata: Record<string, unknown> = {},
) {
  return supabase.from('consent_records').insert({
    user_id: userId,
    consent_type: consentType,
    policy_version: LEGAL_VERSIONS[consentType],
    accepted_at: new Date().toISOString(),
    metadata,
  })
}
