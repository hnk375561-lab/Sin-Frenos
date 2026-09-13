/**
 * Buscador de `/listings` (Fase 5, sección 7 del documento maestro:
 * "BÚSQUEDA / DESCUBRIMIENTO").
 *
 * Dos motores separados A PROPÓSITO (sección 7):
 * - Catálogo técnico (`/vehiculos`): sigue con Fuse.js client-side sobre
 *   el índice estático. Este archivo NO lo toca.
 * - Listings (acá): contra Postgres/Supabase, vía supabase-js desde el
 *   cliente. NO Fuse.js — los listings cambian con alta frecuencia y
 *   pueden crecer a decenas de miles; un fuzzy search en memoria del
 *   navegador no escala ahí. Full-text real de Postgres
 *   (`listings.search_vector`, ver `007_search_vector_brand_model.sql`)
 *   + filtros SQL de precio/ubicación/condición/categoría.
 *
 * Mismo criterio de manejo de errores que `reference-data.ts`: nunca
 * `throw`, siempre devolver un resultado vacío y loguear — "si Supabase
 * se cae, el sitio sigue sirviendo" (sección 3).
 */

import { supabase } from '@/lib/supabase/client'
import type {
  ListingRow,
  PriceCurrency,
  VehicleCategoryId,
  VehicleConditionId,
} from '@/lib/listings/types'

/** Resultados por página — grilla de `/listings` pagina con "Cargar más". */
export const LISTINGS_PAGE_SIZE = 24

export interface ListingSearchFilters {
  /** Texto libre del buscador, YA sin la parte de precio (ver `parsePriceFromQuery`). */
  query?: string
  categoryId?: VehicleCategoryId | null
  conditionId?: VehicleConditionId | null
  /** `locations.id` (sección 4.3) — catálogo cerrado, nunca texto libre. */
  locationId?: string | null
  priceCurrency?: PriceCurrency | null
  priceMin?: number | null
  priceMax?: number | null
}

export interface ListingSearchResult {
  rows: ListingRow[]
  /** true si hay más resultados después de esta página (para "Cargar más"). */
  hasMore: boolean
  /** Total de resultados que matchean los filtros, si Supabase lo devolvió. */
  total: number | null
}

const emptyResult: ListingSearchResult = { rows: [], hasMore: false, total: null }

/**
 * Busca listings publicados contra Postgres, combinando full-text
 * (`search_vector`, sección 4.7) con los filtros estructurados de la
 * sección 7. Solo `status = 'published'` — coincide con la policy RLS
 * "Published listings are public" de `003_rls_policies.sql`, así que este
 * filtro es más una intención explícita en la query que una medida de
 * seguridad (RLS ya lo garantiza aunque se omitiera acá).
 *
 * `page` es 0-based. Se pagina con `.range()` de PostgREST, no con
 * cursor — a la escala del MVP (sección 3: "cero tráfico, MVP temprano")
 * un OFFSET/LIMIT simple alcanza; si el volumen real lo justifica,
 * revisar en Fase 10 (Escalabilidad, sección 14).
 */
export async function searchListings(
  filters: ListingSearchFilters,
  page = 0
): Promise<ListingSearchResult> {
  let builder = supabase
    .from('listings')
    .select('*', { count: 'exact' })
    .eq('status', 'published')

  if (filters.categoryId) {
    builder = builder.eq('category_id', filters.categoryId)
  }
  if (filters.conditionId) {
    builder = builder.eq('condition_id', filters.conditionId)
  }
  if (filters.locationId) {
    builder = builder.eq('location_id', filters.locationId)
  }
  if (filters.priceCurrency) {
    builder = builder.eq('price_currency', filters.priceCurrency)
  }
  if (filters.priceMin != null) {
    builder = builder.gte('price_amount', filters.priceMin)
  }
  if (filters.priceMax != null) {
    builder = builder.lte('price_amount', filters.priceMax)
  }

  const trimmedQuery = filters.query?.trim()
  if (trimmedQuery) {
    // `websearch` interpreta el texto como escribiría un usuario común
    // (soporta "frase entre comillas", -exclusión, OR) sin que el
    // llamador tenga que armar sintaxis de tsquery a mano — es el modo
    // pensado justo para un input de búsqueda libre.
    builder = builder.textSearch('search_vector', trimmedQuery, {
      type: 'websearch',
      config: 'spanish',
    })
  }

  const from = page * LISTINGS_PAGE_SIZE
  const to = from + LISTINGS_PAGE_SIZE - 1

  const { data, error, count } = await builder
    // Publicados más recientes primero; `published_at` puede ser null
    // en teoría (columna nullable, sección 4.7) así que se cae a
    // `created_at` como segundo criterio — nunca deja de ordenar.
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error || !data) {
    console.error('[search] searchListings:', error?.message)
    return emptyResult
  }

  const rows = data as ListingRow[]
  const hasMore = count != null ? from + rows.length < count : rows.length === LISTINGS_PAGE_SIZE

  return { rows, hasMore, total: count ?? null }
}

/**
 * Foto de portada de cada listing en un solo query (evita 1 request por
 * card) — mismo criterio de "no leer fila por fila" que ya usa
 * `mis-publicaciones/page.tsx` para su propia lista. Devuelve un mapa
 * `listing_id -> url` con la que quedó marcada `is_cover`, o si ninguna
 * lo está todavía, la primera por `position` (mismo fallback visual que
 * `listings/ver`).
 */
export async function getCoversForListings(
  listingIds: string[]
): Promise<Map<string, string>> {
  const coverByListing = new Map<string, string>()
  if (listingIds.length === 0) return coverByListing

  const { data, error } = await supabase
    .from('listing_media')
    .select('listing_id, url, is_cover, position')
    .in('listing_id', listingIds)
    .order('position', { ascending: true })

  if (error || !data) {
    console.error('[search] getCoversForListings:', error?.message)
    return coverByListing
  }

  for (const media of data) {
    const existing = coverByListing.get(media.listing_id)
    if (!existing || media.is_cover) {
      coverByListing.set(media.listing_id, media.url)
    }
  }

  return coverByListing
}

export interface ParsedPriceQuery {
  /** Texto de búsqueda sin la parte de precio, listo para `filters.query`. */
  cleanedQuery: string
  priceMax: number | null
  currency: PriceCurrency | null
}

/**
 * Parser simple de precio en texto libre (sección 7: 'queries tipo
 * "camioneta 4x4 hasta 20 mil dólares" se resuelven combinando texto
 * libre (tsquery) + un parser simple de precio/moneda en la query (regex
 * para "hasta X", "menos de X", detectar USD/ARS). No hace falta IA/NLP
 * para el MVP.'). A propósito solo cubre techo de precio (no rangos
 * "entre X y Y" ni piso solo) — es el caso de uso real más común en un
 * buscador de vehículos ("hasta cuánto tengo para gastar"); un parser más
 * rico es un upgrade incremental sobre este mismo archivo, no un
 * rediseño, si en el uso real aparece la necesidad.
 */
const PRICE_PATTERN =
  /\b(?:hasta|menos de|máximo|maximo)\s+(?:usd|u\$s|ars)?\s*\$?\s*(\d[\d.,]*)\s*(mil|k)?\s*(dólares|dolares|usd|u\$s|pesos|ars)?\b/i

export function parsePriceFromQuery(rawQuery: string): ParsedPriceQuery {
  const match = rawQuery.match(PRICE_PATTERN)

  if (!match) {
    return { cleanedQuery: rawQuery.trim(), priceMax: null, currency: null }
  }

  const [fullMatch, numberPart, scaleWord, currencyWord] = match

  // Formato AR: "." separador de miles, "," decimal — se normaliza a un
  // number de JS antes de multiplicar por la escala ("mil"/"k").
  const normalized = numberPart.replace(/\./g, '').replace(',', '.')
  let amount = Number.parseFloat(normalized)

  if (Number.isNaN(amount)) {
    return { cleanedQuery: rawQuery.trim(), priceMax: null, currency: null }
  }

  if (scaleWord) {
    amount *= 1000
  }

  let currency: PriceCurrency | null = null
  if (currencyWord) {
    currency = /d[oó]lares|usd|u\$s/i.test(currencyWord) ? 'USD' : 'ARS'
  }

  const cleanedQuery = rawQuery.replace(fullMatch, ' ').replace(/\s+/g, ' ').trim()

  return { cleanedQuery, priceMax: amount, currency }
}
