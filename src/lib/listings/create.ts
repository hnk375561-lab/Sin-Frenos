/**
 * Creación de un listing a partir del `ListingDraft` completado en
 * `/publicar` (sección 6, paso 8 del documento maestro: "Preview +
 * publicar").
 *
 * Todo corre client-side contra Supabase (sección 3: sin servidor
 * propio). El orden de operaciones es deliberado:
 *
 *   1. Validar el draft completo (nada de validar paso a paso acá — cada
 *      paso del wizard ya valida lo suyo en su propio componente; esto es
 *      la última barrera antes de tocar la base).
 *   2. Decidir el status inicial ANTES de insertar (sección 6, paso 8).
 *   3. Insertar la fila de `listings` (necesitamos el `id` real para
 *      armar el path de Storage de sus fotos — sección 006,
 *      `listing-media/{uid}/{listing_id}/...`).
 *   4. Subir las fotos (y registrar el video externo si lo hay) a
 *      `listing_media`.
 *   5. Si algo del paso 4 falla, se borra la fila de `listings` recién
 *      creada (permitido por RLS: el dueño puede borrar su propio
 *      listing) para no dejar un draft fantasma sin fotos — el vendedor
 *      reintenta desde cero. Los archivos que sí llegaron a subirse a
 *      Storage antes del fallo quedan huérfanos en su propia carpeta
 *      (nunca en la de otro usuario, por la policy de 006); no se
 *      implementa limpieza automática de esos objetos sueltos en este
 *      MVP — es un costo de Storage despreciable a este volumen, no un
 *      problema de seguridad.
 */

import { supabase } from '@/lib/supabase/client'
import type { ListingDraft, PendingPhoto } from '@/lib/listings/types'

const STORAGE_BUCKET = 'listing-media'

/** Debe coincidir con `allowed_mime_types` del bucket en 006 — repetido acá
 * a propósito para poder rechazar en el cliente ANTES de gastar una subida,
 * no porque el cliente sea la barrera real (esa es la policy de Storage). */
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

/** Debe coincidir con `file_size_limit` del bucket en 006 (15 MB). */
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024

const MIN_PHOTOS = 1

export interface CreateListingResult {
  success: boolean
  listingId?: string
  /** Errores de validación, en lenguaje para mostrar directo en la UI. */
  errors?: string[]
}

/**
 * Valida el draft completo. Devuelve la lista de errores (vacía si está
 * todo bien) en vez de tirar excepciones, para que el paso 8 (preview)
 * pueda mostrarlos todos juntos en vez de uno a la vez.
 */
export function validateListingDraft(draft: ListingDraft): string[] {
  const errors: string[] = []

  if (!draft.categoryId) errors.push('Falta elegir la categoría del vehículo.')
  if (!draft.conditionId) errors.push('Falta elegir la condición del vehículo.')
  if (!draft.title.trim()) errors.push('Falta el título de la publicación.')
  if (!draft.locationId) errors.push('Falta elegir la ubicación.')

  // Precio: sección 6 paso 4. 'on_request' cubre "a convenir" — ahí no
  // hace falta monto. 'fixed'/'negotiable' sí necesitan un monto positivo.
  if (draft.priceType !== 'on_request') {
    if (draft.priceAmount == null || draft.priceAmount <= 0) {
      errors.push('Falta el precio (o elegí "Precio a convenir" si no aplica).')
    }
  }

  if (draft.photos.length < MIN_PHOTOS) {
    errors.push(`Subí al menos ${MIN_PHOTOS} foto del vehículo.`)
  }

  for (const photo of draft.photos) {
    if (!ALLOWED_MIME_TYPES.has(photo.file.type)) {
      errors.push(`"${photo.file.name}" no es un formato de imagen soportado (jpg, png o webp).`)
    }
    if (photo.file.size > MAX_FILE_SIZE_BYTES) {
      errors.push(`"${photo.file.name}" pesa más de 15 MB.`)
    }
  }

  // Video: sección 6 paso 6 — solo link externo, nunca upload propio en
  // el MVP. Validación laxa a propósito (no todos los links de
  // YouTube/Drive comparten un único formato de URL), solo se descarta
  // texto que ni siquiera parece una URL.
  if (draft.videoUrl.trim() && !isLikelyUrl(draft.videoUrl.trim())) {
    errors.push('El link de video no parece una URL válida.')
  }

  return errors
}

function isLikelyUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Sección 6, paso 8: "'pending_review' si es la primera publicación de
 * esa cuenta (fricción mínima de confianza), 'published' directo si la
 * cuenta ya tiene historial limpio."
 *
 * MVP: "historial limpio" se aproxima como "ya tiene al menos un listing
 * previo que no está en `removed`" — no hay todavía (Fase 7) un sistema
 * de reputación/flags más fino que esto. Cuando exista, este es el único
 * lugar que hay que tocar.
 */
async function computeInitialStatus(sellerId: string): Promise<'draft' | 'pending_review' | 'published'> {
  const { count, error } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('seller_id', sellerId)
    .neq('status', 'removed')

  if (error) {
    console.error('[create] computeInitialStatus:', error.message)
    // Ante la duda (no se pudo consultar el historial), fricción mínima:
    // mejor mandar a revisión de más que publicar de más sin poder
    // confirmar que la cuenta ya tiene historial limpio.
    return 'pending_review'
  }

  return (count ?? 0) > 0 ? 'published' : 'pending_review'
}

function extensionFromMimeType(mimeType: string): string {
  switch (mimeType) {
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    default:
      return 'jpg'
  }
}

/**
 * Sube una foto a `listing-media/{sellerId}/{listingId}/{...}` (convención
 * fijada en 006_storage_and_moderation_fase4.sql — el primer segmento del
 * path TIENE que ser el uid de quien sube, o la policy de Storage
 * rechaza el INSERT). Devuelve la URL pública, lista para guardar en
 * `listing_media.url`.
 */
async function uploadPhoto(
  photo: PendingPhoto,
  sellerId: string,
  listingId: string
): Promise<string> {
  const ext = extensionFromMimeType(photo.file.type)
  const path = `${sellerId}/${listingId}/${photo.id}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, photo.file, {
      contentType: photo.file.type,
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`No se pudo subir "${photo.file.name}": ${uploadError.message}`)
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Punto de entrada único del wizard (paso 8, "Publicar"). `userId` se pide
 * explícito en vez de leerlo de `useAuth()` acá adentro para que esta
 * función siga siendo un módulo de lógica pura, testeable sin renderizar
 * ningún componente — el caller (`/publicar/page.tsx`) es quien ya hizo
 * el auth-gate y tiene la sesión resuelta.
 */
export async function createListing(
  draft: ListingDraft,
  userId: string
): Promise<CreateListingResult> {
  const errors = validateListingDraft(draft)
  if (errors.length > 0) {
    return { success: false, errors }
  }

  const status = await computeInitialStatus(userId)

  const { data: listingRow, error: insertError } = await supabase
    .from('listings')
    .insert({
      seller_id: userId,
      vehicle_model_slug: draft.vehicleModelSlug,
      category_id: draft.categoryId,
      condition_id: draft.conditionId,
      title: draft.title.trim(),
      brand: draft.brand.trim() || null,
      model: draft.model.trim() || null,
      version: draft.version.trim() || null,
      year: draft.year,
      mileage_km: draft.mileageKm,
      price_amount: draft.priceType === 'on_request' ? null : draft.priceAmount,
      price_currency: draft.priceCurrency,
      price_type: draft.priceType,
      accepts_trade: draft.acceptsTrade,
      accepts_financing: draft.acceptsFinancing,
      location_id: draft.locationId,
      description: draft.description.trim() || null,
      condition_details: draft.conditionDetails,
      has_title: draft.hasTitle,
      title_status: draft.titleStatus.trim() || null,
      status,
      published_at: status === 'published' ? new Date().toISOString() : null,
    })
    .select('id')
    .single()

  if (insertError || !listingRow) {
    return {
      success: false,
      errors: [`No se pudo crear la publicación: ${insertError?.message ?? 'error desconocido'}`],
    }
  }

  const listingId = listingRow.id as string

  try {
    // Fotos, en orden — la portada (`isCover`) puede no ser la primera
    // del array si el vendedor reordenó en el paso 6, así que se sube
    // cada una en su posición declarada, no por índice de array.
    const mediaRows = await Promise.all(
      draft.photos.map(async (photo) => {
        const url = await uploadPhoto(photo, userId, listingId)
        return {
          listing_id: listingId,
          url,
          position: photo.position,
          is_cover: photo.isCover,
          media_type: 'image' as const,
        }
      })
    )

    if (draft.videoUrl.trim()) {
      mediaRows.push({
        listing_id: listingId,
        url: draft.videoUrl.trim(),
        position: draft.photos.length,
        is_cover: false,
        media_type: 'video' as const,
      })
    }

    const { error: mediaError } = await supabase.from('listing_media').insert(mediaRows)
    if (mediaError) {
      throw new Error(mediaError.message)
    }
  } catch (err) {
    // Ver comentario del encabezado: se limpia la fila de `listings` para
    // no dejar un draft fantasma sin fotos; los objetos de Storage que sí
    // llegaron a subirse quedan huérfanos en la carpeta propia del
    // vendedor (no representan un riesgo de RLS/seguridad, solo espacio).
    await supabase.from('listings').delete().eq('id', listingId)
    return {
      success: false,
      errors: [err instanceof Error ? err.message : 'No se pudieron subir las fotos.'],
    }
  }

  return { success: true, listingId }
}
