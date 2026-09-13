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

const primaryButtonClass = formStyles.primaryButton
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
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Vehículos publicados</h1>
          {!resultsLoading && total != null && (
            <p className="text-sm text-neutral-500">
              {total} {total === 1 ? 'publicación encontrada' : 'publicaciones encontradas'}
            </p>
          )}
        </div>
        <Link href="/publicar" className={primaryButtonClass}>
          Publicar un vehículo
        </Link>
      </div>

      <div className="mt-6">
        {referenceLoading ? (
          <p className="text-sm text-neutral-500">Cargando filtros…</p>
        ) : (
          <Filters
            categories={enabledCategories}
            conditions={conditions}
            locationsByProvincia={locationsByProvincia}
          />
        )}
      </div>

      {error && <p className="mt-4 text-xs font-medium text-red-500">{error}</p>}

      <div className="mt-6">
        {resultsLoading ? (
          <p className="text-sm text-neutral-500">Buscando publicaciones…</p>
        ) : cards.length === 0 ? (
          <div className={formStyles.stepCard}>
            <p className="text-sm text-neutral-600">
              No encontramos publicaciones con estos filtros. Probá ampliar la búsqueda o{' '}
              <Link href="/listings" className="font-semibold text-auto-accent">
                ver todas las publicaciones
              </Link>
              .
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((card) => (
                <ListingCard key={card.id} listing={card} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className={secondaryButtonClass}
                >
                  {loadingMore ? 'Cargando…' : 'Cargar más'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

export default function ListingsPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-5xl px-4 py-10">
          <p className="text-sm text-neutral-500">Cargando…</p>
        </main>
      }
    >
      <ListingsContent />
    </Suspense>
  )
}
