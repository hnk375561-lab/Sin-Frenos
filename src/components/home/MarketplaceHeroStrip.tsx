'use client'

/**
 * Franja de marketplace montada ANTES del `<ArchiveHero />` en el home
 * (`src/app/page.tsx`) — decisión de layout "C moderada" (listings
 * rodeando el hero, catálogo baja de jerarquía visual pero no
 * desaparece; ver prompt de traspaso de la sesión anterior, sección 3).
 * Objetivo: que la primera impresión del sitio sea "acá se compra y se
 * vende", no solo "archivo técnico" — sin destruir el catálogo, que
 * sigue siendo la única fuente real de tráfico SEO (doc maestro, sección
 * 8: "catálogo y marketplace deben potenciarse mutuamente").
 *
 * Cliente 100% — mismo patrón que `ModelListingsPanel.tsx` y `/listings`:
 * la home es un Server Component estático (`output: 'export'`), así que
 * el fetch a Supabase pasa acá, en el navegador, después de montar. Si
 * Supabase falla, no rompe nada — cae al mismo estado vacío que "cero
 * listings todavía" (ver `renderCards` más abajo).
 *
 * DIFERENCIA CLAVE con `ModelListingsPanel` (que se auto-oculta con
 * `return null` si no hay resultados): acá NO hay fallback a "no mostrar
 * nada". Hoy (sept. 2026) no existe un solo listing real todavía — los
 * únicos datos en la tabla son semilla sintética de Fase 3
 * (`scripts/seed-listings-fase3.mjs`), que esta franja NO muestra porque
 * la query real filtra `status = 'published'` sobre datos reales de
 * usuarios, no sobre la semilla de prueba (ver nota en `getRecentListings`
 * si en algún momento se decide ocultar también la semilla explícitamente
 * por un flag propio). Si la home reaccionara desapareciendo esta sección
 * entera cuando no hay resultados, el sitio volvería a sentirse 100%
 * catálogo para cualquier visitante que entre antes del primer listing
 * real — exactamente el problema que se pidió resolver. Por eso, sin
 * listings, se muestra un estado vacío CON INTENCIÓN: tarjetas
 * "placeholder" claramente no-reales + CTA a `/publicar`.
 *
 * Las tarjetas placeholder NO reusan `ListingCard` con datos inventados
 * (eso sería simular una publicación real — línea que no se cruza, ver
 * doc maestro sección 5 / prompt de traspaso sección 5: "nunca simular
 * un listing real"). Son un componente visualmente distinto (opacidad
 * reducida, ícono, texto "Próximamente") que ningún usuario podría
 * confundir con una oferta de venta real.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  getRecentListings,
  getCoversForListings,
} from '@/lib/listings/search'
import { getVehicleConditions, type VehicleConditionOption } from '@/lib/listings/reference-data'
import type { ListingRow, VehicleConditionId } from '@/lib/listings/types'
import { ListingCard, type ListingCardData } from '@/components/listings/ListingCard'
import { formStyles } from '@/components/listings/publicar/formStyles'

const STRIP_LIMIT = 4

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
 * Tarjeta placeholder — deliberadamente distinta a `ListingCard` (ver
 * comentario de cabecera). Opacidad reducida + borde punteado + texto
 * explícito, para que sea imposible de confundir con una publicación
 * real por accidente, ni siquiera en un vistazo rápido.
 */
function PlaceholderCard() {
  return (
    <div
      className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-edge/70 bg-surface-alt/40 p-4 text-center opacity-70"
      aria-hidden="true"
    >
      <svg
        className="h-8 w-8 text-neutral-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 7l1.5-3h15L21 7M3 7v11a1 1 0 001 1h16a1 1 0 001-1V7M3 7h18M8 11h8"
        />
      </svg>
      <p className="text-xs font-medium text-neutral-500">Próximamente</p>
    </div>
  )
}

export function MarketplaceHeroStrip() {
  const [cards, setCards] = useState<ListingCardData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      const [rows, conditions] = await Promise.all([
        getRecentListings(STRIP_LIMIT),
        getVehicleConditions(),
      ])
      if (!active) return

      const conditionsById = new Map(conditions.map((c) => [c.id, c]))
      const coverByListing = await getCoversForListings(rows.map((r) => r.id))
      if (!active) return

      setCards(rows.map((row) => toCardData(row, coverByListing, conditionsById)))
      setLoading(false)
    }

    load()
    return () => {
      active = false
    }
  }, [])

  // Mientras carga, no mostrar nada todavía — evita un parpadeo de
  // placeholders que después se reemplazan por tarjetas reales medio
  // segundo después. A diferencia de `ModelListingsPanel`, acá SÍ hay
  // contenido garantizado después de cargar (reales o placeholder), así
  // que este es el único `return null` de todo el componente.
  if (loading) return null

  const missing = Math.max(0, STRIP_LIMIT - cards.length)
  const hasAnyReal = cards.length > 0

  return (
    <section className="border-b border-border bg-surface-alt/30 py-8 sm:py-10">
      <div className="container-max">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-auto-accent">
              Marketplace Sin Frenos
            </p>
            <h2 className="mt-1 text-xl font-bold text-neutral-900 sm:text-2xl">
              {hasAnyReal
                ? 'Recién publicado'
                : 'Sé el primero en publicar tu vehículo'}
            </h2>
          </div>
          <Link
            href="/publicar"
            prefetch={false}
            className={`${formStyles.primaryButton} whitespace-nowrap`}
          >
            Publicar un vehículo
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {cards.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
          {Array.from({ length: missing }).map((_, i) => (
            <PlaceholderCard key={`placeholder-${i}`} />
          ))}
        </div>

        {!hasAnyReal && (
          <p className="mt-4 text-sm text-neutral-500">
            Todavía no hay publicaciones reales — publicá la primera y
            aparecé acá.
          </p>
        )}
      </div>
    </section>
  )
}
