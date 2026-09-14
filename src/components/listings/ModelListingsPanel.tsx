'use client'

/**
 * CTA "Publicaciones de este modelo" — sección 8 del documento maestro:
 * "carga manual de publicaciones semilla + activación del CTA en fichas
 * técnicas". Vive en `/vehiculos/[slug]` (vía `[entityType]/[slug]/page.tsx`)
 * y es, a la fecha, el ÚNICO link real entre el catálogo técnico (con SEO
 * y tráfico propio) y el marketplace (`listings`) — sin esto, nadie que
 * entra a una ficha ve que existen publicaciones reales en venta de ese
 * modelo, y el marketplace no tiene ninguna fuente de tráfico propia
 * (riesgo #1 de arranque en frío, sección 8/17).
 *
 * Cliente 100% — la página que lo monta es un Server Component estático
 * (`output: 'export'`), así que esto hace su propio fetch a Supabase en
 * el navegador, mismo patrón que `/listings` y `useListingFavorites`.
 * Si Supabase falla o no hay publicaciones, el bloque completo no
 * renderiza nada (`null`) — no rompe ni ensucia la ficha técnica
 * (sección 3: "si Supabase se cae, el sitio sigue sirviendo").
 *
 * Reusa `ListingCard` tal cual (con su `prefetch={false}` ya resuelto,
 * ver advertencia en ese archivo sobre el Error 1027) — no se reimplementa
 * el render de una card acá.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  getListingsForVehicleModel,
  getCoversForListings,
} from '@/lib/listings/search'
import { getVehicleConditions, type VehicleConditionOption } from '@/lib/listings/reference-data'
import type { ListingRow, VehicleConditionId } from '@/lib/listings/types'
import { ListingCard, type ListingCardData } from '@/components/listings/ListingCard'
import { Card, CardBody } from '@/components/ui/Card'
import { EntitySectionHeading } from '@/components/entities/EntitySectionHeading'
import { formStyles } from '@/components/listings/publicar/formStyles'

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
    // Ya estamos en la ficha del modelo — repetir ubicación acá no aporta
    // nada que el usuario no sepa ya (a diferencia de la grilla de
    // `/listings`, donde sí es un dato relevante para filtrar de un
    // vistazo).
    locationLabel: null,
  }
}

interface ModelListingsPanelProps {
  /** `entity.slug` del catálogo técnico — mismo valor que
   *  `listings.vehicle_model_slug`. */
  vehicleModelSlug: string
  /** `entity.title` — usado solo para el texto del CTA, no para la query
   *  (el filtro real es por `vehicleModelSlug`, exacto). */
  vehicleName: string
}

export function ModelListingsPanel({
  vehicleModelSlug,
  vehicleName,
}: ModelListingsPanelProps) {
  const [cards, setCards] = useState<ListingCardData[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      const [result, conditions] = await Promise.all([
        getListingsForVehicleModel(vehicleModelSlug, 3),
        getVehicleConditions(),
      ])
      if (!active) return

      const conditionsById = new Map(conditions.map((c) => [c.id, c]))
      const coverByListing = await getCoversForListings(result.rows.map((r) => r.id))
      if (!active) return

      setCards(result.rows.map((row) => toCardData(row, coverByListing, conditionsById)))
      setTotal(result.total)
      setLoading(false)
    }

    load()
    return () => {
      active = false
    }
  }, [vehicleModelSlug])

  // Nada que mostrar todavía (sigue cargando, o no hay publicaciones para
  // este modelo): no renderiza el bloque. Evita un "0 publicaciones" frío
  // en las 250 fichas del catálogo mientras la carga real (sección 8)
  // recién empieza — cuando haya semilla real cargada, esto empieza a
  // aparecer solo, sin tocar código de nuevo.
  if (loading || cards.length === 0) return null

  return (
    <Card className="shadow-sm">
      <CardBody>
        {/* Sin `index` numérico a propósito: la numeración editorial de
            `[entityType]/[slug]/page.tsx` (`sectionCounter`) se calcula en
            el server component antes del render, para nunca mostrar un
            salto (ver comentario ahí). Este panel decide si existe recién
            en el cliente, después de un fetch async — no hay forma de
            saberlo a tiempo para ese cálculo sin romper esa garantía. */}
        <EntitySectionHeading label={`Publicaciones de ${vehicleName} en venta`} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {cards.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
        {total > cards.length && (
          <Link
            href={`/listings?q=${encodeURIComponent(vehicleName)}`}
            prefetch={false}
            className={`${formStyles.secondaryButton} mt-3 block w-full text-center`}
          >
            Ver las {total} publicaciones de este modelo
          </Link>
        )}
      </CardBody>
    </Card>
  )
}
