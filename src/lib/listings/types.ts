/**
 * Tipos compartidos del wizard de publicación (`/publicar`, Fase 4,
 * sección 6 del documento maestro).
 *
 * Reflejan las columnas REALES de `listings` tal como quedaron después de
 * 001 + 002_align_schema_to_master_doc.sql + 005_listings_vehicle_model_fields.sql
 * — no las columnas deprecated (`condition_state`, `location_province`,
 * `location_city`, `price_display`, `year_manufacture`). Si algo de acá
 * queda desalineado con una migración futura, se corrige este archivo
 * primero: es la fuente de verdad de tipos para todo el módulo
 * `src/lib/listings/*` y `src/components/listings/publicar/*`.
 *
 * Este archivo solo define tipos (sin lógica de runtime), mismo criterio
 * que `src/types/entity.ts`.
 */

/**
 * `vehicle_categories.id` (002_align_schema_to_master_doc.sql). Se
 * mantienen acá TODOS los valores, incluidos los `enabled = false` —
 * el flag de habilitado se lee de la base (reference-data.ts), no se
 * hardcodea en el tipo, así una categoría nueva habilitada en el futuro
 * no exige tocar este archivo.
 */
export type VehicleCategoryId =
  | 'autos'
  | 'motos'
  | 'camionetas'
  | 'camiones'
  | 'utilitarios'
  | 'maquinaria-agricola'
  | 'maquinaria-vial'
  | 'motorhomes'
  | 'nautica'
  | 'otros'

/** `vehicle_conditions.id` (002_align_schema_to_master_doc.sql). */
export type VehicleConditionId =
  | 'nuevo'
  | 'usado'
  | 'proyecto'
  | 'restauracion'
  | 'motor_roto'
  | 'caja_rota'
  | 'no_arranca'
  | 'chocado'
  | 'siniestrado'
  | 'inundado'
  | 'incendiado'
  | 'desarmado'
  | 'para_repuestos'
  | 'clasico'
  | 'competicion'
  | 'otro'

/** `vehicle_conditions.severity` — controla el color del badge en la UI. */
export type ConditionSeverity = 'normal' | 'atencion' | 'grave'

export type PriceCurrency = 'ARS' | 'USD'

export type PriceType = 'fixed' | 'negotiable' | 'on_request'

export type ListingStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'paused'
  | 'sold'
  | 'removed'

/** `condition_question_sets.questions` (jsonb) — una pregunta dinámica. */
export interface ConditionQuestion {
  key: string
  label: string
  /**
   * Hoy `002_align_schema_to_master_doc.sql` solo sembró 'text' y
   * 'boolean' en el seed real. Se deja el tipo abierto a 'number' porque
   * es un tipo de pregunta razonable para un question_set futuro
   * (ej. "¿hace cuánto no arranca?", en meses) sin que haga falta migrar
   * este archivo cuando se agregue — el componente de UI (ConditionForm)
   * decide qué <input> renderizar según este valor.
   */
  type: 'text' | 'boolean' | 'number'
}

/** Respuestas del formulario dinámico — se guardan tal cual en `listings.condition_details`. */
export type ConditionDetails = Record<string, string | boolean | number>

/**
 * `locations` (002_align_schema_to_master_doc.sql) — catálogo cerrado y
 * curado, nunca texto libre desde el front (sección 4.3).
 */
export interface LocationOption {
  id: string
  provincia: string
  ciudad: string
}

/**
 * Espejo liviano de `vehicle_models` (005) — solo los campos que el
 * autocomplete del paso 2 necesita para mostrar y para resolver el slug.
 */
export interface VehicleModelOption {
  slug: string
  manufacturer: string
  title: string
  class: string | null
}

/**
 * Un archivo de foto en el paso 6, ANTES de subirse — vive solo en memoria
 * del navegador mientras dura el wizard (sección 6, paso 6: "drag to
 * reorder = position, marcar portada"). `create.ts` (próxima entrega) es
 * quien sube esto a Storage y recién ahí produce filas de `listing_media`.
 */
export interface PendingPhoto {
  /** id local (crypto.randomUUID()), NO el id final de listing_media. */
  id: string
  file: File
  /** object URL para preview — se revoca (`URL.revokeObjectURL`) al desmontar el paso. */
  previewUrl: string
  position: number
  isCover: boolean
}

/**
 * Estado acumulado del wizard, sección 6 del documento maestro (8 pasos).
 * Todo opcional salvo lo que ya quedó fijado por un paso anterior — un
 * draft a mitad de completar es un estado válido, no un error; recién
 * `create.ts` valida qué es obligatorio para poder publicar (paso 8).
 */
export interface ListingDraft {
  // Paso 1 — categoría + condición
  categoryId: VehicleCategoryId | null
  conditionId: VehicleConditionId | null

  // Paso 2 — identificación
  /** Slug real si hubo match en el catálogo; null si el vendedor tipeó libre (sección 4.7). */
  vehicleModelSlug: string | null
  brand: string
  model: string
  version: string
  year: number | null
  /** Opcional a propósito: irrelevante/desconocido en 'no_arranca'/'para_repuestos' (sección 6, paso 2). */
  mileageKm: number | null

  // Paso 3 — preguntas dinámicas de la condición (se saltea si el
  // condition_question_sets de la condición elegida es 'qs_ninguna')
  conditionDetails: ConditionDetails

  // Paso 4 — precio y forma de pago
  priceAmount: number | null
  priceCurrency: PriceCurrency
  priceType: PriceType
  acceptsTrade: boolean
  acceptsFinancing: boolean

  // Paso 5 — ubicación (selects encadenados provincia -> ciudad)
  locationId: string | null

  // Paso 6 — fotos + video
  photos: PendingPhoto[]
  /** Solo link externo (YouTube/Drive) — sección 6, paso 6. Nunca upload de video propio en el MVP. */
  videoUrl: string

  // Paso 7 — descripción libre
  title: string
  description: string

  // Paso 8 — documentación (se pregunta junto al preview, no tiene paso propio)
  hasTitle: boolean | null
  titleStatus: string
}

/** Draft vacío — punto de partida del wizard y valor de reset. */
export function createEmptyListingDraft(): ListingDraft {
  return {
    categoryId: null,
    conditionId: null,
    vehicleModelSlug: null,
    brand: '',
    model: '',
    version: '',
    year: null,
    mileageKm: null,
    conditionDetails: {},
    priceAmount: null,
    priceCurrency: 'ARS',
    priceType: 'fixed',
    acceptsTrade: false,
    acceptsFinancing: false,
    locationId: null,
    photos: [],
    videoUrl: '',
    title: '',
    description: '',
    hasTitle: null,
    titleStatus: '',
  }
}

/**
 * Fila de `listings` tal como la devuelve Supabase, para las partes del
 * módulo que necesitan leer un listing ya creado (ej. la vista de
 * moderación). Deliberadamente separado de `ListingDraft`: el draft vive
 * en memoria mientras se completa el wizard, esto es el contrato de la
 * fila persistida.
 */
export interface ListingRow {
  id: string
  seller_id: string
  vehicle_model_slug: string | null
  category_id: VehicleCategoryId
  condition_id: VehicleConditionId
  title: string
  brand: string | null
  model: string | null
  version: string | null
  year: number | null
  mileage_km: number | null
  price_amount: number | null
  price_currency: PriceCurrency | null
  price_type: PriceType | null
  accepts_trade: boolean
  accepts_financing: boolean
  location_id: string | null
  description: string | null
  condition_details: ConditionDetails
  has_title: boolean | null
  title_status: string | null
  status: ListingStatus
  published_at: string | null
  created_at: string
  updated_at: string
}
