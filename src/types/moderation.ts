import { z } from 'zod'

/**
 * Acciones de moderación disponibles
 */
export const ModerationActionType = {
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PAUSED: 'paused',
  REMOVED: 'removed',
  FLAGGED_DUPLICATE: 'flagged_duplicate',
  FLAGGED_SUSPICIOUS: 'flagged_suspicious',
} as const

export type ModerationActionTypeValue = typeof ModerationActionType[keyof typeof ModerationActionType]

export const ModerationActionLabels: Record<ModerationActionTypeValue, string> = {
  approved: 'Aprobado',
  rejected: 'Rechazado',
  paused: 'En pausa',
  removed: 'Removido',
  flagged_duplicate: 'Marcado como duplicado',
  flagged_suspicious: 'Marcado como sospechoso',
}

/**
 * Schemas Zod para moderation_actions
 *
 * FIX (corroboración de Fase 7, 13/09/2026): las dos líneas `z.enum(...)`
 * de abajo casteaban `Object.values(ModerationActionType)` a
 * `[string, ...string[]]`. Ese cast ensancha cada literal ('approved',
 * 'rejected', etc.) a `string` genérico ANTES de que Zod lo vea, así que
 * `z.enum` termina infiriendo su tipo de salida como `string` en vez de
 * la unión literal real — el `.action` de todo lo que pasa por
 * `ModerationActionSchema.parse(...)` quedaba tipado `string`, no
 * `ModerationActionTypeValue`. Recién se notó al conectar `@/types/
 * supabase.ts` (que si tipa `action` como la unión estricta): indexar
 * `ModerationActionLabels[action.action]` y asignar `parsed.action` a un
 * campo de `Database['public']['Tables']['moderation_actions']['Insert']`
 * fallaban en `tsc`. Se castea al tipo de unión real en vez de a
 * `string` — mismo array en runtime, tipo correcto en compile time.
 */
export const ModerationActionSchema = z.object({
  id: z.string().uuid(),
  listing_id: z.string().uuid(),
  moderator_id: z.string().uuid().nullable(),
  action: z.enum(Object.values(ModerationActionType) as [ModerationActionTypeValue, ...ModerationActionTypeValue[]]),
  reason: z.string().max(500).nullable(),
  created_at: z.string().datetime(),
})

export type ModerationAction = z.infer<typeof ModerationActionSchema>

/**
 * Input para crear una acción de moderación (admin)
 */
export const CreateModerationActionSchema = z.object({
  listing_id: z.string().uuid('ID de listing inválido'),
  action: z.enum(Object.values(ModerationActionType) as [ModerationActionTypeValue, ...ModerationActionTypeValue[]],
    { message: 'Acción de moderación inválida' }),
  reason: z.string().max(500, 'Máximo 500 caracteres').optional(),
})

export type CreateModerationActionInput = z.infer<typeof CreateModerationActionSchema>

/**
 * Resultado de validación de auto-aprobación
 */
export const AutoApprovalCheckSchema = z.object({
  should_auto_approve: z.boolean(),
  reason: z.string(),
})

export type AutoApprovalCheck = z.infer<typeof AutoApprovalCheckSchema>

/**
 * Resultado de detección de duplicado
 */
export const DuplicateDetectionSchema = z.object({
  is_potential_duplicate: z.boolean(),
  duplicate_listing_id: z.string().uuid().nullable(),
  reason: z.string(),
})

export type DuplicateDetection = z.infer<typeof DuplicateDetectionSchema>

/**
 * Resultado de validación de rate limit
 */
export const RateLimitCheckSchema = z.object({
  is_within_limit: z.boolean(),
  current_count: z.number().int().min(0),
  limit: z.number().int().min(0),
})

export type RateLimitCheck = z.infer<typeof RateLimitCheckSchema>

/**
 * Regla de auto-aprobación
 */
export const VendorAutoApprovalRuleSchema = z.object({
  id: z.string(),
  min_trust_score: z.number().int().min(0).max(100),
  min_successful_sales: z.number().int().min(0),
  days_since_account_creation: z.number().int().min(0),
  max_rejections_lifetime: z.number().int().min(0),
  description: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type VendorAutoApprovalRule = z.infer<typeof VendorAutoApprovalRuleSchema>
