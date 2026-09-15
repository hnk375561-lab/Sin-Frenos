'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getCoversForListings, getRecentListings } from '@/lib/listings/search'
import { getLocations, getVehicleConditions, type VehicleConditionOption } from '@/lib/listings/reference-data'
import type { ListingRow, LocationOption, VehicleConditionId } from '@/lib/listings/types'
import { ListingCard, type ListingCardData } from '@/components/listings/ListingCard'

const STRIP_LIMIT = 4

function toCardData(
  row: ListingRow,
  coverByListing: Map<string, string>,
  conditionsById: Map<VehicleConditionId, VehicleConditionOption>,
  locationsById: Map<string, LocationOption>
): ListingCardData {
  const condition = conditionsById.get(row.condition_id)
  const location = row.location_id ? locationsById.get(row.location_id) : null
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
    locationLabel: location ? `${location.ciudad}, ${location.provincia}` : null,
  }
}

function PlaceholderCard({ index }: { index: number }) {
  return (
    <div className="marketplace-placeholder-card" aria-label="Espacio reservado para una futura publicación">
      <div className="marketplace-placeholder-art" aria-hidden="true">
        <span>{String(index + 1).padStart(2, '0')}</span>
      </div>
      <div className="p-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C2410C]">Próxima publicación</p>
        <p className="mt-3 text-lg font-semibold tracking-[-0.03em] text-[#09090B]">Tu vehículo puede ocupar este lugar.</p>
        <p className="mt-2 text-sm leading-relaxed text-[#71717A]">Este espacio está reservado para una oferta real de la comunidad.</p>
        <Link href="/publicar" prefetch={false} className="mt-5 inline-flex text-sm font-bold text-[#C2410C] hover:text-[#991B1B]">Publicar ahora →</Link>
      </div>
    </div>
  )
}

export function MarketplaceHeroStrip() {
  const [cards, setCards] = useState<ListingCardData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      const [rows, conditions, locations] = await Promise.all([
        getRecentListings(STRIP_LIMIT),
        getVehicleConditions(),
        getLocations(),
      ])
      if (!active) return

      const conditionsById = new Map(conditions.map((condition) => [condition.id, condition]))
      const locationsById = new Map(locations.map((location) => [location.id, location]))
      const coverByListing = await getCoversForListings(rows.map((row) => row.id))
      if (!active) return

      setCards(rows.map((row) => toCardData(row, coverByListing, conditionsById, locationsById)))
      setLoading(false)
    }

    load()
    return () => {
      active = false
    }
  }, [])

  const missing = Math.max(0, STRIP_LIMIT - cards.length)
  const hasAnyReal = cards.length > 0

  return (
    <section className="marketplace-listings-hero" aria-labelledby="recent-listings-heading">
      <div className="marketplace-home-container">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="marketplace-eyebrow text-[#C2410C]">Marketplace Sin Frenos</p>
            <h2 id="recent-listings-heading" className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
              {hasAnyReal ? 'Publicaciones recientes' : 'El próximo vehículo puede ser el tuyo.'}
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/60">
              {hasAnyReal ? 'Ofertas reales, contacto directo y sin intermediarios entre vos y quien publica.' : 'Estamos abriendo el marketplace. Sé la primera persona en publicar y ayudá a ponerlo en marcha.'}
            </p>
          </div>
          <Link href="/publicar" prefetch={false} className="marketplace-home-primary-cta">Ser el primero en publicar <span aria-hidden="true">↗</span></Link>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: STRIP_LIMIT }).map((_, index) => <div key={index} className="marketplace-listing-skeleton" aria-hidden="true" />)
            : cards.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
          {!loading && Array.from({ length: missing }).map((_, index) => <PlaceholderCard key={`placeholder-${index}`} index={cards.length + index} />)}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
          <p className="text-sm text-white/50">{loading ? 'Cargando publicaciones…' : hasAnyReal ? 'Actualizado con las últimas publicaciones disponibles.' : 'No mostramos autos inventados. Cuando publiques, tu oferta aparece acá.'}</p>
          <Link href="/listings" className="text-sm font-bold text-[#C2410C] transition hover:text-white">Explorar marketplace →</Link>
        </div>
      </div>
    </section>
  )
}
