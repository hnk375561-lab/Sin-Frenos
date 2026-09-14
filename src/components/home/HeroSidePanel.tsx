'use client'

/**
 * Lado derecho del hero (`ArchiveHero.tsx`) — ajuste "todo rodea
 * compra/venta, catálogo poco vistoso" (sept. 2026, posterior al
 * traspaso "marketplace-first"). Versión anterior de este componente
 * caía a 2 fichas técnicas del catálogo (`CatalogDocumentCard`) cuando
 * no había listings reales todavía — eso contradice directamente el
 * pedido: mientras no hubiera contenido real del marketplace, la MITAD
 * del hero terminaba siendo catálogo de nuevo. Ahora el costado derecho
 * es 100% marketplace siempre, con o sin listings reales:
 *
 * - Con listings reales: hasta 2 `ListingCard` (sin cambios respecto a
 *   la versión anterior).
 * - Sin listings reales todavía (estado actual en producción, sept.
 *   2026): un panel de marketplace con CTA a `/publicar` — NO cae al
 *   catálogo. El catálogo técnico ya tiene su propio espacio, chico y
 *   apagado, en la columna izquierda de `ArchiveHero` (buscador +
 *   fichas + comparador) — no hace falta repetirlo acá también, y
 *   repetirlo aumentaría exactamente la presencia visual que se pidió
 *   bajar.
 *
 * Cliente 100% (mismo patrón que `ModelListingsPanel` /
 * `MarketplaceHeroStrip`) — el resto de `ArchiveHero` se mantiene
 * server-rendered por LCP (ver nota en ese archivo); este panel es
 * contenido secundario, no crítico para el primer paint.
 */

import Link from 'next/link'
import {
  getRecentListings,
  getCoversForListings,
} from '@/lib/listings/search'
import { getVehicleConditions, type VehicleConditionOption } from '@/lib/listings/reference-data'
import type { ListingRow, VehicleConditionId } from '@/lib/listings/types'
import { ListingCard, type ListingCardData } from '@/components/listings/ListingCard'
import { useEffect, useState } from 'react'

const PANEL_LIMIT = 2

function toCardData(
  row: ListingRow,
  coverByListing: Map<string, string>,
  conditionsById: Map<VehicleConditionId, VehicleConditionOption>
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
    locationLabel: null,
  }
}

/**
 * Panel de marketplace vacío — reemplaza al fallback de catálogo de la
 * versión anterior. Mismo criterio de "no simular un listing real" que
 * `MarketplaceHeroStrip`: esto es evidentemente un CTA, no una oferta.
 */
function EmptyMarketplacePanel() {
  return (
    <div className="relative flex h-full min-h-[22rem] flex-col items-center justify-center gap-4 border border-dashed border-oxide-red/40 bg-surface-alt/40 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-oxide-red/30">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-oxide-red"
          aria-hidden="true"
        >
          <path d="M3 7l1.5-3h15L21 7M3 7v11a1 1 0 001 1h16a1 1 0 001-1V7M3 7h18M8 11h8" />
        </svg>
      </div>
      <div className="space-y-1">
        <p className="font-serif text-xl font-semibold text-ink">
          Todavía no hay publicaciones
        </p>
        <p className="font-sans text-sm text-ink/60 max-w-xs">
          Sé el primero en publicar tu auto o moto y aparecé acá, en la
          portada del sitio.
        </p>
      </div>
      <Link
        href="/publicar"
        prefetch={false}
        className="cta-shine font-mono text-xs uppercase tracking-[0.15em] bg-oxide-red text-white px-6 py-3 hover:bg-ink transition-colors duration-200"
      >
        Publicar mi vehículo →
      </Link>
    </div>
  )
}

export function HeroSidePanel() {
  const [cards, setCards] = useState<ListingCardData[] | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      const [rows, conditions] = await Promise.all([
        getRecentListings(PANEL_LIMIT),
        getVehicleConditions(),
      ])
      if (!active) return

      const conditionsById = new Map(conditions.map((c) => [c.id, c]))
      const coverByListing = await getCoversForListings(rows.map((r) => r.id))
      if (!active) return

      setCards(rows.map((row) => toCardData(row, coverByListing, conditionsById)))
    }

    load()
    return () => {
      active = false
    }
  }, [])

  // `cards === null` (todavía cargando) y `cards.length === 0` (cargó,
  // no hay reales) comparten el mismo panel — a diferencia de la versión
  // anterior, acá NUNCA hay un fallback de catálogo, así que no importa
  // distinguir "cargando" de "vacío": el panel de marketplace vacío es
  // una respuesta válida en ambos casos, no un estado transitorio raro.
  const hasRealListings = cards !== null && cards.length > 0

  return (
    <div className="relative space-y-6 lg:mt-8">
      {hasRealListings ? (
        cards!.map((listing) => <ListingCard key={listing.id} listing={listing} />)
      ) : (
        <EmptyMarketplacePanel />
      )}
    </div>
  )
}
