'use client'

/**
 * `/mis-publicaciones` — lo único que quedaba pendiente de la Fase 4
 * (sección 19 del documento maestro: "Publicación (wizard completo con
 * subida real de fotos)"). El wizard de `/publicar` y la subida real a
 * Storage ya estaban completos (`PublishWizard.tsx`, `create.ts`,
 * `006_storage_and_moderation_fase4.sql`); lo que faltaba, y quedó
 * anotado explícitamente como pendiente en
 * `docs/fase2-fase3-verificacion.md`, era una pantalla donde el vendedor
 * pueda ver y gestionar SUS PROPIAS publicaciones (en cualquier status,
 * no solo `published`).
 *
 * Todo corre client-side contra Supabase, mismo criterio que el resto del
 * módulo (sección 3 del documento maestro: sin servidor propio). La
 * policy "Sellers can view own listings" de `003_rls_policies.sql`
 * (`USING (auth.uid() = seller_id)`, sin filtro de status) es lo que
 * permite traer acá listings en cualquier estado — a diferencia de
 * `/listings/ver`, que solo puede leer las que ya están `published` para
 * un visitante anónimo.
 *
 * Acciones que la policy de UPDATE/DELETE de esa misma migración ya
 * habilita para el dueño, sin necesitar nada nuevo del lado de la base:
 *   - Pausar una publicación `published` (status -> 'paused').
 *   - Reactivar una `paused` (status -> 'published'). Una publicación
 *     `pending_review` NO se puede "reactivar" a mano — su primera
 *     aprobación depende de moderación (Fase 7), así que ese botón no se
 *     ofrece para ese status.
 *   - Marcarla como vendida (status -> 'sold'), estado terminal desde el
 *     que no se ofrece ninguna acción más (semántica de "ya se resolvió
 *     la operación", sección 2 del documento maestro:
 *     PUBLICAR → ... → CERRAR).
 *   - Borrarla (`DELETE`, con confirmación) — el `ON DELETE CASCADE` de
 *     `listing_media`/`favorites` (sección 4.8/4.9) se lleva sus fotos y
 *     favoritos con ella; los objetos ya subidos a Storage quedan
 *     huérfanos, mismo trade-off ya documentado y aceptado en
 *     `create.ts` para el caso de fallo a mitad de publicación.
 *
 * No incluye "editar" un listing existente: el wizard de `/publicar` no
 * tiene modo edición todavía (crea, no actualiza) — agregarlo acá sería
 * inventar una segunda ruta de escritura sobre `listings` a medio probar.
 * Queda fuera de alcance de este cierre de Fase 4, igual que quedó fuera
 * en el documento maestro (sección 16, "MODIFICAR" no lo menciona).
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import type { ListingRow } from '@/lib/listings/types'

type MyListingRow = ListingRow & {
  cover_url: string | null
}

const STATUS_LABEL: Record<ListingRow['status'], string> = {
  draft: 'Borrador',
  pending_review: 'En revisión',
  published: 'Publicado',
  paused: 'Pausado',
  sold: 'Vendido',
  removed: 'Eliminado',
}

/** Mismos tres niveles de severidad visual que `severityBadgeClasses`
 * (formStyles.ts), pero mapeados a status de listing en vez de condición
 * — son dos taxonomías distintas (sección 4.6 vs 4.7), no se reusa el
 * mismo objeto para no acoplar ambas por casualidad de que hoy comparten
 * tres colores. */
const STATUS_BADGE_CLASS: Record<ListingRow['status'], string> = {
  draft: 'border border-edge bg-surface-alt text-neutral-600',
  pending_review: 'border border-amber-200 bg-amber-50 text-amber-700',
  published: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  paused: 'border border-edge bg-surface-alt text-neutral-600',
  sold: 'border border-blue-200 bg-blue-50 text-blue-700',
  removed: 'border border-red-200 bg-red-50 text-red-700',
}

const cardClass = 'rounded-lg border border-edge bg-surface-card p-4 sm:p-5'
const primaryButtonClass =
  'rounded-md bg-auto-accent px-3 py-1.5 text-xs font-semibold text-white transition duration-200 hover:bg-auto-accent-strong active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50'
const secondaryButtonClass =
  'rounded-md border border-edge bg-transparent px-3 py-1.5 text-xs font-semibold text-neutral-700 transition duration-200 hover:bg-surface-card-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50'
const dangerButtonClass =
  'rounded-md border border-red-300 bg-transparent px-3 py-1.5 text-xs font-semibold text-red-600 transition duration-200 hover:bg-red-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50'

export default function MisPublicacionesPage() {
  const { user, loading: authLoading } = useAuth()
  const [listings, setListings] = useState<MyListingRow[]>([])
  const [listingsLoading, setListingsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** id del listing con una acción en curso — deshabilita SOLO sus
   * botones mientras dura, no la lista entera. */
  const [pendingActionId, setPendingActionId] = useState<string | null>(null)

  // Derivado, no estado propio: solo hay algo que cargar una vez que
  // `useAuth` confirmó que hay sesión — evita el `setState` síncrono
  // dentro del efecto que exigiría "arrancar en loading=true y bajarlo a
  // mano" para el caso `!user`.
  const loading = authLoading || (Boolean(user) && listingsLoading)

  useEffect(() => {
    if (authLoading || !user) return

    let active = true

    async function loadListings() {
      setListingsLoading(true)
      setError(null)

      const { data, error: listingsError } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', user!.id)
        .order('created_at', { ascending: false })

      if (!active) return

      if (listingsError) {
        setError(listingsError.message)
        setListingsLoading(false)
        return
      }

      const rows = (data ?? []) as ListingRow[]

      if (rows.length === 0) {
        setListings([])
        setListingsLoading(false)
        return
      }

      // Portada de cada listing en un solo query (evita 1 request por
      // card) — mismo criterio de "no leer fila por fila" que sección
      // 4.14 aplica a listing_views.
      const { data: mediaData } = await supabase
        .from('listing_media')
        .select('listing_id, url, is_cover, position')
        .in(
          'listing_id',
          rows.map((row) => row.id)
        )
        .order('position', { ascending: true })

      const coverByListing = new Map<string, string>()
      for (const media of mediaData ?? []) {
        const existing = coverByListing.get(media.listing_id)
        // Preferir la marcada is_cover; si ninguna lo está todavía,
        // quedarse con la primera por `position` (orden ya viene del
        // query) — mismo fallback visual que usa `listings/ver`.
        if (!existing || media.is_cover) {
          coverByListing.set(media.listing_id, media.url)
        }
      }

      if (!active) return

      setListings(
        rows.map((row) => ({
          ...row,
          cover_url: coverByListing.get(row.id) ?? null,
        }))
      )
      setListingsLoading(false)
    }

    loadListings()

    return () => {
      active = false
    }
  }, [user, authLoading])

  async function updateStatus(listingId: string, nextStatus: ListingRow['status']) {
    setPendingActionId(listingId)
    const { error: updateError } = await supabase
      .from('listings')
      .update({ status: nextStatus })
      .eq('id', listingId)

    if (updateError) {
      setError(updateError.message)
      setPendingActionId(null)
      return
    }

    setListings((prev) =>
      prev.map((listing) => (listing.id === listingId ? { ...listing, status: nextStatus } : listing))
    )
    setPendingActionId(null)
  }

  async function deleteListing(listingId: string) {
    const confirmed = window.confirm(
      'Esto borra la publicación para siempre (fotos y favoritos incluidos). ¿Confirmás?'
    )
    if (!confirmed) return

    setPendingActionId(listingId)
    const { error: deleteError } = await supabase.from('listings').delete().eq('id', listingId)

    if (deleteError) {
      setError(deleteError.message)
      setPendingActionId(null)
      return
    }

    setListings((prev) => prev.filter((listing) => listing.id !== listingId))
    setPendingActionId(null)
  }

  if (authLoading || loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-neutral-500">Cargando tus publicaciones…</p>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-xl font-semibold text-neutral-900">Mis publicaciones</h1>
        <p className={`mt-2 text-sm text-neutral-600`}>
          Necesitás iniciar sesión para ver tus publicaciones.
        </p>
        <Link href="/ingresar" className={`mt-4 inline-block ${primaryButtonClass}`}>
          Ingresar
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-neutral-900">Mis publicaciones</h1>
        <Link href="/publicar" className={primaryButtonClass}>
          Publicar un vehículo
        </Link>
      </div>

      {error && <p className="mt-4 text-xs font-medium text-red-500">{error}</p>}

      {listings.length === 0 ? (
        <div className={`mt-6 ${cardClass}`}>
          <p className="text-sm text-neutral-600">
            Todavía no publicaste ningún vehículo. Cuando publiques uno, vas a poder verlo, pausarlo,
            marcarlo como vendido o borrarlo desde acá.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {listings.map((listing) => {
            const isPending = pendingActionId === listing.id

            return (
              <li key={listing.id} className={cardClass}>
                <div className="flex gap-4">
                  <div className="h-20 w-28 shrink-0 overflow-hidden rounded-md border border-edge bg-surface-alt">
                    {listing.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- URL dinámica de Supabase Storage, fuera de dominios conocidos por next/image
                      <img src={listing.cover_url} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_BADGE_CLASS[listing.status]}`}
                      >
                        {STATUS_LABEL[listing.status]}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {new Date(listing.created_at).toLocaleDateString('es-AR')}
                      </span>
                    </div>

                    <p className="mt-1 truncate text-sm font-semibold text-neutral-900">{listing.title}</p>

                    <p className="text-xs text-neutral-600">
                      {listing.price_type === 'on_request'
                        ? 'Precio a convenir'
                        : `${listing.price_currency ?? ''} ${listing.price_amount?.toLocaleString('es-AR') ?? '—'}`}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {listing.status === 'published' && (
                        <Link href={`/listings/${listing.id}`} className={secondaryButtonClass}>
                          Ver publicación
                        </Link>
                      )}

                      {listing.status === 'published' && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => updateStatus(listing.id, 'paused')}
                          className={secondaryButtonClass}
                        >
                          Pausar
                        </button>
                      )}

                      {listing.status === 'paused' && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => updateStatus(listing.id, 'published')}
                          className={primaryButtonClass}
                        >
                          Reactivar
                        </button>
                      )}

                      {(listing.status === 'published' || listing.status === 'paused') && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => updateStatus(listing.id, 'sold')}
                          className={secondaryButtonClass}
                        >
                          Marcar como vendido
                        </button>
                      )}

                      {listing.status !== 'removed' && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => deleteListing(listing.id)}
                          className={dangerButtonClass}
                        >
                          Borrar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
