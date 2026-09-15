'use client'

/**
 * `/listings` — Discovery (Fase 5, sección 14 del documento maestro:
 * "buscador de listings", "`/listings` con filtros + búsqueda de texto
 * (sección 7), todo vía supabase-js desde el cliente contra Postgres").
 *
 * Mismo patrón de Suspense que `/listings/ver` (Fase 3): `useSearchParams`
 * exige un boundary de Suspense en `output: 'export'` (Next.js estático),
 * así que el componente real vive en `ListingsContent` y este archivo
 * solo lo envuelve.
 *
 * Criterio de aceptación de la sección 14 para esta fase: "búsquedas de
 * ejemplo de la sección 7 devuelven resultados correctos en tiempo
 * razonable" — ver `src/lib/listings/search.ts` para la query real
 * (full-text + filtros SQL) y `parsePriceFromQuery` para el caso
 * "camioneta 4x4 hasta 20 mil dólares".
 */

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  getVehicleCategories,
  getVehicleConditions,
  getLocations,
  groupLocationsByProvincia,
  type VehicleCategoryOption,
  type VehicleConditionOption,
} from '@/lib/listings/reference-data'
import {
  searchListings,
  getCoversForListings,
  parsePriceFromQuery,
  type ListingSearchFilters,
} from '@/lib/listings/search'
import type {
  ListingRow,
  LocationOption,
  PriceCurrency,
  VehicleCategoryId,
  VehicleConditionId,
} from '@/lib/listings/types'
import { Filters } from '@/components/listings/Filters'
import { ListingCard, type ListingCardData } from '@/components/listings/ListingCard'
import { formStyles } from '@/components/listings/publicar/formStyles'
const secondaryButtonClass = formStyles.secondaryButton

/** Deriva los filtros estructurados de `searchListings` a partir de los
 * parámetros de la URL, combinando el precio explícito de los selects
 * (moneda/precio_min/precio_max) con lo que `parsePriceFromQuery` pueda
 * extraer del texto libre. Los valores EXPLÍCITOS de los selects tienen
 * prioridad — si alguien elige "USD" en el dropdown, eso manda aunque el
 * texto libre no mencione moneda. */
function buildFiltersFromParams(searchParams: URLSearchParams): ListingSearchFilters {
  const rawQuery = searchParams.get('q') ?? ''
  const parsedPrice = parsePriceFromQuery(rawQuery)

  const explicitPriceMax = searchParams.get('precio_max')
  const explicitPriceMin = searchParams.get('precio_min')
  const explicitCurrency = searchParams.get('moneda') as PriceCurrency | null

  return {
    query: parsedPrice.cleanedQuery,
    categoryId: (searchParams.get('categoria') as VehicleCategoryId | null) || null,
    conditionId: (searchParams.get('condicion') as VehicleConditionId | null) || null,
    locationId: searchParams.get('ubicacion') || null,
    priceCurrency: explicitCurrency || parsedPrice.currency,
    priceMin: explicitPriceMin ? Number(explicitPriceMin) : null,
    priceMax: explicitPriceMax ? Number(explicitPriceMax) : parsedPrice.priceMax,
  }
}

function buildLocationLabels(locations: LocationOption[]): Map<string, string> {
  const labels = new Map<string, string>()
  for (const location of locations) {
    labels.set(location.id, `${location.ciudad}, ${location.provincia}`)
  }
  return labels
}

function toCardData(
  row: ListingRow,
  coverByListing: Map<string, string>,
  conditionsById: Map<VehicleConditionId, VehicleConditionOption>,
  locationLabels: Map<string, string>
): ListingCardData {
  const condition = conditionsById.get(row.condition_id)

  return {
    id: row.id,
    title: row.title,
    brand: row.brand,
    model: row.model,
    year: row.year,
    mileageKm: row.mileage_km,
    priceAmount: row.price_amount,
    priceCurrency: row.price_currency,
    priceType: row.price_type,
    coverUrl: coverByListing.get(row.id) ?? null,
    conditionLabel: condition?.label ?? row.condition_id,
    conditionSeverity: condition?.severity ?? 'normal',
    locationLabel: row.location_id ? locationLabels.get(row.location_id) ?? null : null,
  }
}

function ListingsContent() {
  const searchParams = useSearchParams()

  // Datos de referencia (sección 4.3/4.5/4.6) — se cargan una sola vez;
  // no dependen de los filtros elegidos, así que separarlos del efecto
  // de búsqueda evita un round-trip innecesario cada vez que cambia un
  // filtro.
  const [categories, setCategories] = useState<VehicleCategoryOption[]>([])
  const [conditions, setConditions] = useState<VehicleConditionOption[]>([])
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [referenceLoading, setReferenceLoading] = useState(true)

  const [cards, setCards] = useState<ListingCardData[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState<number | null>(null)
  const [resultsLoading, setResultsLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    Promise.all([getVehicleCategories(), getVehicleConditions(), getLocations()]).then(
      ([cats, conds, locs]) => {
        if (!active) return
        setCategories(cats)
        setConditions(conds)
        setLocations(locs)
        setReferenceLoading(false)
      }
    )

    return () => {
      active = false
    }
  }, [])

  // Búsqueda: corre de nuevo cada vez que cambian los parámetros de la
  // URL (Filters.tsx navega con `router.push` en vez de mutar estado
  // local, ver ese archivo) — `searchParams.toString()` como dependencia
  // captura cualquier combinación de filtros con una sola comparación.
  const searchParamsKey = searchParams.toString()

  useEffect(() => {
    // Depende de `conditions`/`locations` para poder armar las labels de
    // cada card sin un round-trip extra — espera a que la carga de
    // referencia termine antes de buscar. Es una sola espera inicial, no
    // un fetch en cascada por cada filtro.
    if (referenceLoading) return

    let active = true

    async function runSearch() {
      setResultsLoading(true)
      setError(null)
      setPage(0)

      const filters = buildFiltersFromParams(new URLSearchParams(searchParamsKey))
      const result = await searchListings(filters, 0)

      if (!active) return

      const coverByListing = await getCoversForListings(result.rows.map((row) => row.id))
      if (!active) return

      const conditionsById = new Map(conditions.map((condition) => [condition.id, condition]))
      const locationLabels = buildLocationLabels(locations)

      setCards(
        result.rows.map((row) => toCardData(row, coverByListing, conditionsById, locationLabels))
      )
      setHasMore(result.hasMore)
      setTotal(result.total)
      setResultsLoading(false)
    }

    runSearch().catch((err) => {
      if (!active) return
      setError(err instanceof Error ? err.message : 'No se pudo completar la búsqueda.')
      setResultsLoading(false)
    })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `conditions`/`locations` solo cambian una vez (carga de referencia); el trigger real de re-búsqueda es `searchParamsKey`.
  }, [searchParamsKey, referenceLoading])

  async function loadMore() {
    setLoadingMore(true)
    const nextPage = page + 1
    const filters = buildFiltersFromParams(new URLSearchParams(searchParamsKey))
    const result = await searchListings(filters, nextPage)

    const coverByListing = await getCoversForListings(result.rows.map((row) => row.id))
    const conditionsById = new Map(conditions.map((condition) => [condition.id, condition]))
    const locationLabels = buildLocationLabels(locations)

    setCards((prev) => [
      ...prev,
      ...result.rows.map((row) => toCardData(row, coverByListing, conditionsById, locationLabels)),
    ])
    setPage(nextPage)
    setHasMore(result.hasMore)
    setLoadingMore(false)
  }

  const enabledCategories = categories.filter((category) => category.enabled)
  const locationsByProvincia = groupLocationsByProvincia(locations)

  return (
    <main className="min-h-[70vh] bg-[#F6F3FF] pb-20">
      <section className="bg-[#171130] py-12 text-white sm:py-16">
        <div className="container-max">
          <p className="marketplace-eyebrow text-[#ff9b82]">Marketplace Sin Frenos</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="max-w-2xl text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">Encontrá el vehículo que estás buscando.</h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-white/60">Filtrá por categoría, condición, ubicación y presupuesto. Las búsquedas quedan en la URL para que puedas compartirlas.</p>
            </div>
            <Link href="/publicar" className="marketplace-button marketplace-button-primary">
              Publicar un vehículo <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>

      <div className="container-max -mt-5">
        <div className="rounded-3xl border border-[#dce5e9] bg-white p-4 shadow-[0_16px_40px_rgba(24,42,52,0.08)] sm:p-6">
          {referenceLoading ? (
            <p className="text-sm text-[#4E446C]">Preparando filtros…</p>
          ) : (
            <Filters
              categories={enabledCategories}
              conditions={conditions}
              locationsByProvincia={locationsByProvincia}
            />
          )}
        </div>

        {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">No pudimos actualizar la búsqueda: {error}</p>}

        <div className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="marketplace-eyebrow text-[#e35e3d]">Resultados</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#171130]">
                {resultsLoading ? 'Buscando publicaciones…' : total != null ? `${total.toLocaleString('es-AR')} ${total === 1 ? 'publicación' : 'publicaciones'}` : 'Publicaciones'}
              </h2>
            </div>
            <p className="text-sm text-[#6C618B]">Contacto directo con el vendedor</p>
          </div>

          {resultsLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => <div key={index} className="aspect-[4/5] animate-pulse rounded-2xl bg-[#e6ecef]" />)}
            </div>
          ) : cards.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#cbd7dc] bg-white px-6 py-16 text-center">
              <p className="text-lg font-semibold text-[#171130]">Todavía no encontramos publicaciones con esos filtros.</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#4E446C]">Probá ampliar la búsqueda o sé el primero en publicar un vehículo para empezar a mover el marketplace.</p>
              <Link href="/publicar" className="marketplace-button marketplace-button-primary mt-6">Publicar mi vehículo <span aria-hidden="true">↗</span></Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
                {cards.map((card) => <ListingCard key={card.id} listing={card} />)}
              </div>
              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <button type="button" onClick={loadMore} disabled={loadingMore} className={secondaryButtonClass}>
                    {loadingMore ? 'Cargando…' : 'Cargar más publicaciones'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}

export default function ListingsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[70vh] bg-[#F6F3FF] px-4 py-16">
          <div className="mx-auto max-w-5xl animate-pulse rounded-3xl bg-white p-8 text-sm text-[#6C618B]">Preparando el marketplace…</div>
        </main>
      }
    >
      <ListingsContent />
    </Suspense>
  )
}
