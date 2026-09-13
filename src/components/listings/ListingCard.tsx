'use client'

/**
 * Card de un listing en la grilla de `/listings` (Fase 5, sección 7 del
 * documento maestro). Componente NUEVO — deliberadamente NO reusa
 * `EntityCard` (sección 1 de la auditoría / sección 16, "CONSERVAR":
 * "`EntityCard` está pensado para fichas técnicas — no destruirlo; para
 * listings del marketplace se crea un componente nuevo (`ListingCard`),
 * separado"): un listing no tiene `evidence`, tiene `status`/precio/
 * condición con severidad — forzarlo al contrato de `Entity` sería más
 * trabajo que un componente propio, y acoplaría dos taxonomías que el
 * documento pide mantener separadas (sección 2).
 *
 * ADVERTENCIA — LEER ANTES DE TOCAR ESTE ARCHIVO (ver README, sección
 * "Cloudflare: qué NO hacer"): este componente se renderiza dentro de un
 * `.map()` en `/listings`. El incidente real de Error 1027 fue,
 * exactamente, un `<Link>` sin `prefetch={false}` dentro de una card
 * repetida en grilla. El test de regresión de este archivo
 * (`ListingCard.test.tsx`) falla en rojo si esta prop se pierde en un
 * refactor futuro — correr `npm run test` antes de dar por terminado
 * cualquier cambio acá.
 */

import Link from 'next/link'
import type { ConditionSeverity } from '@/lib/listings/types'
import { severityBadgeBaseClass, severityBadgeClasses } from '@/components/listings/publicar/formStyles'
import { FavoriteButton } from '@/components/listings/FavoriteButton'

export interface ListingCardData {
  id: string
  title: string
  brand: string | null
  model: string | null
  year: number | null
  mileageKm: number | null
  priceAmount: number | null
  priceCurrency: 'ARS' | 'USD' | null
  priceType: 'fixed' | 'negotiable' | 'on_request' | null
  coverUrl: string | null
  conditionLabel: string
  conditionSeverity: ConditionSeverity
  locationLabel: string | null
}

function formatPrice(
  amount: number | null,
  currency: 'ARS' | 'USD' | null,
  priceType: 'fixed' | 'negotiable' | 'on_request' | null
): string {
  if (priceType === 'on_request' || !amount) {
    return 'Precio a convenir'
  }
  const formatted = `${currency ?? 'ARS'} ${amount.toLocaleString('es-AR')}`
  return priceType === 'negotiable' ? `${formatted} (negociable)` : formatted
}

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const subtitle = [listing.brand, listing.model].filter(Boolean).join(' ')
  const meta = [
    listing.year ? String(listing.year) : null,
    listing.mileageKm != null ? `${listing.mileageKm.toLocaleString('es-AR')} km` : null,
    listing.locationLabel,
  ].filter(Boolean)

  return (
    <Link
      href={`/listings/ver?id=${listing.id}`}
      prefetch={false}
      className="flex h-full flex-col overflow-hidden rounded-lg border border-edge bg-surface-card transition duration-200 hover:bg-surface-card-hover"
    >
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-surface-alt">
        {listing.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL dinámica de Supabase Storage, fuera de dominios conocidos por next/image (mismo criterio que mis-publicaciones/page.tsx)
          <img
            src={listing.coverUrl}
            alt={listing.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
            Sin foto
          </div>
        )}
        {/* Fase 6: favorito real por listing (useListingFavorites), separado
            de la wishlist del catálogo técnico — ver FavoriteButton.tsx.
            preventDefault/stopPropagation adentro del componente evitan que
            el click navegue: esta card entera es un <Link>. */}
        <FavoriteButton listingId={listing.id} className="absolute right-2 top-2" />
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
        <span
          className={`${severityBadgeBaseClass} ${severityBadgeClasses[listing.conditionSeverity]} w-fit`}
        >
          {listing.conditionLabel}
        </span>

        <p className="mt-1 line-clamp-2 text-sm font-semibold text-neutral-900">{listing.title}</p>

        {subtitle && <p className="truncate text-xs text-neutral-500">{subtitle}</p>}

        <p className="mt-auto pt-2 text-base font-bold text-neutral-900">
          {formatPrice(listing.priceAmount, listing.priceCurrency, listing.priceType)}
        </p>

        {meta.length > 0 && (
          <p className="truncate text-xs text-neutral-500">{meta.join(' · ')}</p>
        )}
      </div>
    </Link>
  )
}
