import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import {
  CreateModerationActionInput,
  CreateModerationActionSchema,
  ModerationAction,
  ModerationActionSchema,
  AutoApprovalCheck,
  AutoApprovalCheckSchema,
  DuplicateDetection,
  DuplicateDetectionSchema,
  RateLimitCheck,
  RateLimitCheckSchema,
} from '@/types/moderation'

/**
 * Crea una acción de moderación (solo admin)
 */
export async function createModerationAction(
  supabase: ReturnType<typeof createClient<Database>>,
  input: CreateModerationActionInput
): Promise<ModerationAction> {
  const parsed = CreateModerationActionSchema.parse(input)
  const userId = (await supabase.auth.getUser())?.data?.user?.id

  if (!userId) {
    throw new Error('Usuario no autenticado')
  }

  const { data, error } = await supabase
    .from('moderation_actions')
    .insert({
      listing_id: parsed.listing_id,
      action: parsed.action,
      reason: parsed.reason || null,
      moderator_id: userId,
    })
    .select()
    .single()

  if (error) throw error
  return ModerationActionSchema.parse(data)
}

/**
 * Obtiene todas las acciones de un listing (solo admin o seller del listing)
 */
export async function getListingModerationActions(
  supabase: ReturnType<typeof createClient<Database>>,
  listingId: string
): Promise<ModerationAction[]> {
  const { data, error } = await supabase
    .from('moderation_actions')
    .select()
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data.map(item => ModerationActionSchema.parse(item))
}

/**
 * Obtiene la acción más reciente de un listing (para saber status actual)
 */
export async function getLatestModerationAction(
  supabase: ReturnType<typeof createClient<Database>>,
  listingId: string
): Promise<ModerationAction | null> {
  const { data, error } = await supabase
    .from('moderation_actions')
    .select()
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error?.code === 'PGRST116') return null // No existe
  if (error) throw error
  return ModerationActionSchema.parse(data)
}

/**
 * Obtiene acciones pendientes de revisión (para dashboard de moderación)
 */
export async function getPendingModerationActions(
  supabase: ReturnType<typeof createClient<Database>>,
  options?: {
    limit?: number
    offset?: number
  }
): Promise<{
  actions: Array<ModerationAction & { listing?: { title: string } }>
  total: number
}> {
  const limit = options?.limit || 20
  const offset = options?.offset || 0

  const { data, error, count } = await supabase
    .from('moderation_actions')
    .select(`
      *,
      listings(title)
    `)
    .in('action', ['flagged_duplicate', 'flagged_suspicious'])
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error

  return {
    actions: data.map(item => ({
      ...ModerationActionSchema.parse(item),
      listing: item.listings && item.listings[0],
    })),
    total: count || 0,
  }
}

/**
 * Ejecuta validación de auto-aprobación vía RPC
 */
export async function checkAutoApproval(
  supabase: ReturnType<typeof createClient<Database>>,
  sellerId: string,
  ruleId: string = 'standard'
): Promise<AutoApprovalCheck> {
  const { data, error } = await supabase
    .rpc('check_auto_approval', {
      p_seller_id: sellerId,
      p_rule_id: ruleId,
    })

  if (error) throw error
  if (!data) throw new Error('No data returned from check_auto_approval')

  // Supabase RPC devuelve array; tomamos el primer elemento
  const result = Array.isArray(data) ? data[0] : data
  return AutoApprovalCheckSchema.parse(result)
}

/**
 * Ejecuta detección de duplicados vía RPC
 */
export async function detectDuplicateListing(
  supabase: ReturnType<typeof createClient<Database>>,
  sellerId: string,
  brand: string,
  model: string,
  year: number,
  price: number,
  daysWindow: number = 7
): Promise<DuplicateDetection> {
  const { data, error } = await supabase
    .rpc('detect_duplicate_listing', {
      p_seller_id: sellerId,
      p_brand: brand,
      p_model: model,
      p_year: year,
      p_price: price,
      p_days_window: daysWindow,
    })

  if (error) throw error
  if (!data) throw new Error('No data returned from detect_duplicate_listing')

  const result = Array.isArray(data) ? data[0] : data
  return DuplicateDetectionSchema.parse(result)
}

/**
 * Valida rate limit de vendedor nuevo
 */
export async function checkRateLimitNewSeller(
  supabase: ReturnType<typeof createClient<Database>>,
  sellerId: string,
  maxListings: number = 3,
  hoursWindow: number = 48
): Promise<RateLimitCheck> {
  const { data, error } = await supabase
    .rpc('check_rate_limit_new_seller', {
      p_seller_id: sellerId,
      p_max_listings: maxListings,
      p_hours_window: hoursWindow,
    })

  if (error) throw error
  if (!data) throw new Error('No data returned from check_rate_limit_new_seller')

  const result = Array.isArray(data) ? data[0] : data
  return RateLimitCheckSchema.parse(result)
}

/**
 * Auto-aprueba un listing si el vendedor cumple criterios
 * Crea una moderation_action con moderator_id = null
 */
export async function autoApproveListing(
  supabase: ReturnType<typeof createClient<Database>>,
  listingId: string,
  reason: string = 'Auto-aprobado por historial de vendedor'
): Promise<ModerationAction> {
  const { data, error } = await supabase
    .from('moderation_actions')
    .insert({
      listing_id: listingId,
      action: 'approved',
      reason,
      moderator_id: null, // Indica que fue automático
    })
    .select()
    .single()

  if (error) throw error
  return ModerationActionSchema.parse(data)
}

/**
 * Flag automático por duplicado (crea action con moderator_id=null)
 */
export async function autoFlagDuplicate(
  supabase: ReturnType<typeof createClient<Database>>,
  listingId: string,
  duplicateListingId: string
): Promise<ModerationAction> {
  return createModerationAction(supabase, {
    listing_id: listingId,
    action: 'flagged_duplicate',
    reason: `Posible duplicado de ${duplicateListingId}. Revisar manualmente.`,
  })
}

/**
 * Flag automático por sospecha (crea action con moderator_id=null)
 */
export async function autoFlagSuspicious(
  supabase: ReturnType<typeof createClient<Database>>,
  listingId: string,
  reason: string
): Promise<ModerationAction> {
  return createModerationAction(supabase, {
    listing_id: listingId,
    action: 'flagged_suspicious',
    reason: `Sospecha: ${reason}`,
  })
}
