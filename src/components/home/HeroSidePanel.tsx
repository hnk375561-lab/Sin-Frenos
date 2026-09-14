'use client'

/**
 * Lado derecho del hero (`ArchiveHero.tsx`) — decisión de layout "C
 * moderada" de la sesión de traspaso: acá van 2 listings reales del
 * marketplace en vez de las 2 fichas técnicas del catálogo, cuando ya
 * existan. Mientras no haya listings reales, cae al mismo bloque de
 * fichas técnicas de siempre (`CatalogDocumentCard`) — el espacio nunca
 * queda vacío, y el catálogo no pierde su lugar hasta que el marketplace
 * tenga contenido propio para reemplazarlo acá.
 *
 * Cliente 100% (mismo patrón que `ModelListingsPanel` /
 * `MarketplaceHeroStrip`) — el resto de `ArchiveHero` se mantiene
 * server-rendered por LCP (ver nota en ese archivo); este panel es
 * contenido secundario, no crítico para el primer paint.
 */

import {
  getRecentListings,
  getCoversForListings,
} from '@/lib/listings/search'
import { getVehicleConditions, type VehicleConditionOption } from '@/lib/listings/reference-data'
import type { ListingRow, VehicleConditionId } from '@/lib/listings/types'
import { ListingCard, type ListingCardData } from '@/components/listings/ListingCard'
import { CatalogDocumentCard } from '@/components/home/CatalogDocumentCard'
import { type Vehicle } from '@/types'
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

interface HeroSidePanelProps {
  featuredVehicles: Vehicle[]
}

export function HeroSidePanel({ featuredVehicles }: HeroSidePanelProps) {
  const [cards, setCards] = useState<ListingCardData[] | null>(null)
  const sampleVehicles = featuredVehicles.slice(0, PANEL_LIMIT)

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

  // `cards === null` = todavía no resolvió el fetch (o Supabase falló).
  // En ambos casos el fallback al catálogo es el comportamiento correcto
  // — nunca dejar el costado del hero vacío mientras carga.
  const hasRealListings = cards !== null && cards.length > 0

  return (
    <div className="relative space-y-6 lg:mt-8">
      {hasRealListings
        ? cards!.map((listing) => <ListingCard key={listing.id} listing={listing} />)
        : sampleVehicles.map((vehicle, index) => (
            <CatalogDocumentCard key={vehicle.slug} vehicle={vehicle} index={index} />
          ))}
    </div>
  )
}
