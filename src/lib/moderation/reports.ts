import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import {
  CreateListingReportInput,
  CreateListingReportSchema,
  ListingReport,
  ListingReportSchema,
  ListingReportsSummary,
  ListingReportsSummarySchema,
  UpdateListingReportInput,
  UpdateListingReportSchema,
} from '@/types/listing-report'

/**
 * Crea un reporte de un listing
 * @param supabase Cliente autenticado o anónimo de Supabase
 * @param input Datos del reporte (listing_id, reason, details)
 * @returns El reporte creado
 */
export async function createListingReport(
  supabase: ReturnType<typeof createClient<Database>>,
  input: CreateListingReportInput
): Promise<ListingReport> {
  const parsed = CreateListingReportSchema.parse(input)

  const { data, error } = await supabase
    .from('listing_reports')
    .insert({
      listing_id: parsed.listing_id,
      reason: parsed.reason,
      details: parsed.details || null,
      reporter_id: (await supabase.auth.getUser())?.data?.user?.id || null,
      status: 'open',
    })
    .select()
    .single()

  if (error) throw error
  return ListingReportSchema.parse(data)
}

/**
 * Obtiene todos los reportes de un listing (solo para admins)
 */
export async function getListingReports(
  supabase: ReturnType<typeof createClient<Database>>,
  listingId: string,
  options?: {
    status?: 'open' | 'reviewed' | 'dismissed'
    limit?: number
    offset?: number
  }
): Promise<ListingReport[]> {
  let query = supabase
    .from('listing_reports')
    .select()
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error } = await query

  if (error) throw error
  return data.map(item => ListingReportSchema.parse(item))
}

/**
 * Obtiene reportes abiertos (open status) para un listing
 */
export async function getOpenReports(
  supabase: ReturnType<typeof createClient<Database>>,
  listingId: string
): Promise<ListingReport[]> {
  return getListingReports(supabase, listingId, { status: 'open' })
}

/**
 * Obtiene resumen agregado de reportes para un listing
 * (visible para sellers, no expone detalles)
 */
export async function getListingReportsSummary(
  supabase: ReturnType<typeof createClient<Database>>,
  listingId: string
): Promise<ListingReportsSummary | null> {
  const { data, error } = await supabase
    .from('listing_reports_summary')
    .select()
    .eq('listing_id', listingId)
    .single()

  if (error) {
    // Si no hay reportes, la vista podría no devolver una fila
    if (error.code === 'PGRST116') {
      return null
    }
    throw error
  }

  return ListingReportsSummarySchema.parse(data)
}

/**
 * Actualiza el estado de un reporte (solo admin)
 */
export async function updateReportStatus(
  supabase: ReturnType<typeof createClient<Database>>,
  reportId: string,
  input: UpdateListingReportInput
): Promise<ListingReport> {
  const parsed = UpdateListingReportSchema.parse(input)
  const userId = (await supabase.auth.getUser())?.data?.user?.id

  const { data, error } = await supabase
    .from('listing_reports')
    .update({
      status: parsed.status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: parsed.reviewed_by || userId,
    })
    .eq('id', reportId)
    .select()
    .single()

  if (error) throw error
  return ListingReportSchema.parse(data)
}

/**
 * Obtiene todos los reportes abiertos del sistema (para dashboard de moderación)
 * Paginado y filtrable
 */
export async function getOpenReportsForModeration(
  supabase: ReturnType<typeof createClient<Database>>,
  options?: {
    limit?: number
    offset?: number
    orderBy?: 'created_at' | 'total_reports'
  }
): Promise<{
  reports: Array<ListingReport & { listing?: { title: string; seller_id: string } }>
  total: number
}> {
  const limit = options?.limit || 20
  const offset = options?.offset || 0

  // Obtener reportes abiertos
  let query = supabase
    .from('listing_reports')
    .select(`
      *,
      listings(title, seller_id)
    `)
    .eq('status', 'open')
    .order(options?.orderBy === 'total_reports' ? 'created_at' : 'created_at', 
      { ascending: false })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) throw error

  return {
    // FIX (corroboración de Fase 7, 13/09/2026): mismo bug que en
    // `src/lib/moderation/actions.ts` — `listing_reports.listing_id` es
    // una FK "N reportes -> 1 listing", Supabase devuelve `listings` como
    // objeto único, no array. `item.listings[0]` indexaba un objeto y
    // devolvía `undefined` en silencio en cada fila; el dashboard de
    // reportes nunca mostraba título ni seller_id del listing reportado.
    reports: data.map(item => ({
      ...ListingReportSchema.parse(item),
      listing: item.listings ?? undefined,
    })),
    total: count || 0,
  }
}

/**
 * Verifica si un usuario ya reportó un listing (evitar duplicados)
 */
export async function hasUserReportedListing(
  supabase: ReturnType<typeof createClient<Database>>,
  listingId: string
): Promise<boolean> {
  const { data: user } = await supabase.auth.getUser()
  if (!user?.user) return false // No logueado = puede reportar

  const { data, error } = await supabase
    .from('listing_reports')
    .select('id')
    .eq('listing_id', listingId)
    .eq('reporter_id', user.user.id)
    .single()

  if (error?.code === 'PGRST116') return false // No existe
  if (error) throw error
  return !!data
}
